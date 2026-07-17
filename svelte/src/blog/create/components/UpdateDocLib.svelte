<script lang="ts">
  import WarningDiamond from "phosphor-svelte/lib/WarningDiamondIcon";
  import ArrowRight from "phosphor-svelte/lib/ArrowRightIcon";
  import { compLibVer, savedComponents } from "../store.svelte";
  import { changePage, editorState } from "../url.svelte";
  // import { type CompLibUpgradeInfo } from "../helper";
  import { getContext, onMount } from "svelte";
  import { comps, type GetCompLibFetchReturn } from "./component.svelte";
  import { fetch_ } from "/shared/helper";
  import { upgradeDoc, type CompLibUpgradeInfo } from "./libraryupgrade";

  let isExpanded = $state(false);

  function reduceVerString(fullVer: string, newLen: number = 8) {
    const newVerValChoices = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
    const fullVerVals = fullVer.replace(",", "");
    const spacing = Math.floor(fullVerVals.length / newLen);

    let final = "";
    for (let i = 0; i < newLen; i++) {
      const fullVerPart = fullVerVals.slice(i * spacing, (i + 1) * spacing);
      const num = fullVerPart
        .split("")
        .map((char) => char.charCodeAt(0))
        .reduce((p, c) => p + c, 0);
      const letterChoice = newVerValChoices[num % newVerValChoices.length];
      final += letterChoice;
    }

    return final;
  }

  let upgradeInfo: CompLibUpgradeInfo | null = $derived(compLibVer.upgradeInfo);

  let submitStatus: "error" | "idle" | "success" | "none" = $state("none");
  let submitMsg: string = $state("");

  const getDocEl: () => HTMLElement = getContext("getDocEl");
  async function upgradeLibrarySubmit() {
    if (!upgradeInfo) {
      submitStatus = "error";
      submitMsg = "No information about upgrade. Try reloading.";
      return;
    }

    submitStatus = "idle";
    submitMsg = "Fetching latest component library...";

    let resp = await fetch_("/documents/get_component_library");
    if (!resp.ok) {
      submitStatus = "error";
      submitMsg =
        "Unexpected error while fetching the latest component library. Try again later.";
      return;
    }
    const data: GetCompLibFetchReturn = await resp.json();

    if (data.version !== upgradeInfo.to_version) {
      submitStatus = "error";
      submitMsg =
        "Current upgrade information is stale. Please reload the page.";
      return;
    }

    submitMsg = "Updating document content...";

    try {
      upgradeDoc(getDocEl(), $state.snapshot(savedComponents), data.library, $state.snapshot(upgradeInfo));
    } catch (err) {
      submitStatus = "error";
      submitMsg =
        "INTERNAL ERROR" + (err instanceof Error ? ": " + err.message : "");
      throw err;
    }

    submitMsg = "Syncing new document library version identifier...";

    resp = await fetch_("/documents/update_document_complib", {
      method: "post",
      body: JSON.stringify({
        id: editorState.resourceName,
      }),
    });
    if (!resp.ok) {
      submitStatus = "error";
      submitMsg =
        "Unexpected error occured while syncing new library version identifier.";
      return;
    }

    submitStatus = "success";
  }
</script>

<div class="bg-yellow-50 rounded border-2 border-yellow-300">
  <button
    class="peer w-full flex items-center justify-around text-lg font-serif text-yellow-700 hover:cursor-pointer hover:bg-yellow-100 py-1 group"
    onclick={() => (isExpanded = !isExpanded)}
  >
    <WarningDiamond /><span class="underline group-hover:no-underline"
      >Library Outdated</span
    ><WarningDiamond />
  </button>
  {#if isExpanded}
    <div class="peer-hover:bg-yellow-100 p-1 text-yellow-900">
      <div class="italic text-sm text-balance text-center">
        <span class="not-italic inline-block mb-1"
          >This document does not have the latest version of the component
          library.</span
        ><br />
        Components in this document
        <strong>don't have their latest updates</strong>. Choose if you want to
        <strong>apply changes</strong> (described below).
      </div>
      <div class="flex items-center justify-center flex-col py-2">
        <button
          class="px-3 py-1.5 text-lg border-2 rounded-lg border-yellow-900 font-mono hover:bg-yellow-700 hover:border-yellow-700 hover:text-yellow-100 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          disabled={submitStatus === "idle" || submitStatus === "success"}
          onclick={upgradeLibrarySubmit}
        >
          Upgrade Library
        </button>
        {#if submitStatus === "idle"}
          <div class="italic text-rock-500 text-center">
            {submitMsg}
          </div>
        {:else if submitStatus === "error"}
          <div class="text-red-600 text-center">
            {submitMsg}
          </div>
        {:else if submitStatus === "success"}
          <div class="font-bold text-green-700">Upgrade successful!</div>
        {/if}
      </div>
      <div class="flex items-center justify-center font-mono italic">
        <div>{reduceVerString(compLibVer.currentVer ?? "")}</div>
        <ArrowRight class="mx-1" />
        <div>{reduceVerString(compLibVer.latestVer ?? "")}</div>
      </div>
      {#if upgradeInfo}
        <div class="mt-2">
          {#each upgradeInfo.diff_msgs as msg}
            <div class="mb-1">
              <div class="flex items-center px-2">
                <div class="font-mono italic">
                  {reduceVerString(msg.version)}
                </div>
                <div class="font-bold">:&nbsp;</div>
                <div class="text-sm">{msg.message}</div>
              </div>
              <div class="text-sm/tight italic pr-2 pl-4">
                {msg.description}
              </div>
            </div>
          {/each}
        </div>
        <div class="mx-6 my-2 h-px bg-yellow-300"></div>
        <div class="text-lg font-bold text-center text-yellow-800">
          Components that will be affected:
        </div>
        <div class="text-center mb-2 px-3">
          {#each upgradeInfo.remove_list as name}
            <div
              class="inline-flex items-center"
              title="Delete &quot;{name}&quot;"
            >
              <div class="text-lg text-red-700 font-bold font-mono mr-1">D</div>
              <div class="text-red-800 line-through">{name}</div>
            </div>
            <span class="inline-block mx-1 last-of-type:hidden">,&nbsp;</span>
          {/each}
          {#each upgradeInfo.content_list as name}
            <div
              class="inline-flex items-center"
              title="Modify content of &quot;{name}&quot;'"
            >
              <div class="text-lg text-yellow-700 font-bold font-mono mr-1">
                M
              </div>
              <div>{name}</div>
            </div>
            <span class="inline-block mx-1 last-of-type:hidden">,&nbsp;</span>
          {/each}
          {#each Object.entries(upgradeInfo.name_map) as [oldName, newName]}
            {#if oldName !== newName}
              <div
                class="inline-flex items-center text-green-800"
                title="Rename &quot;{oldName}&quot; to &quot;{newName}&quot;"
              >
                <div class="text-lg text-green-700 font-bold font-mono mr-1">
                  R
                </div>
                <div>{oldName}</div>
                <ArrowRight class="mx-0.5" />
                <div>{newName}</div>
              </div>
              <span class="inline-block mx-1 last-of-type:hidden">,&nbsp;</span>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
