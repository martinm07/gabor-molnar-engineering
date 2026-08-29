<script lang="ts">
  import {
    tags,
    ed,
    type DocTag,
    inputTags,
    savedTags,
    tagsSame,
  } from "./store.svelte";
  import FitContentWrapTextarea from "/shared/components/FitContentWrapTextarea.svelte";
  import TrashIcon from "phosphor-svelte/lib/TrashIcon";
  import ArrowCounterClockwiseIcon from "phosphor-svelte/lib/ArrowCounterClockwiseIcon";
  import PlusCircleIcon from "phosphor-svelte/lib/PlusCircleIcon";
  import type { Attachment } from "svelte/attachments";
  import { fetch_ } from "/shared/helper";

  function validateName(name: string) {
    // console.log("VALIDATING NAME", $state.snapshot(inputTags));
    if (name === "") return "Name required";
    else if (
      inputTags.filter(
        (inputTag, i) => (inputTag.name ?? tags[i]?.name) === name,
      ).length > 1
    )
      return "Name must be unique";
    return "";
  }

  // $inspect(tags);

  function validateField(
    value: string,
    validateFunc: (x: string) => string,
  ): Attachment {
    return (element) => {
      // console.log("RUNNING ATTACHMENT", value);
      if (!(
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement
      ))
        return;

      const msg = validateFunc(value);
      // On form submission, this lets the browser display our error message itself (and also focus the relevant input field)
      // Constrainty Validation API
      element.setCustomValidity(msg);
    };
  }

  const tagToAdd: DocTag = $state({
    name: "",
    description: "",
    accent: null,
    accentDisabled: true,
    documentTitles: [],
    removed: false,
  });

  function addTag(e: SubmitEvent) {
    e.preventDefault();
    console.log("ADDING TAG");
    if (validateName(inputTags[tags.length].name ?? "")) return;

    // Name (and hence all fields) valid, perform add tag
    const newI = tags.length;
    tags[newI] = $state.snapshot(tagToAdd);
    inputTags[newI] = {};

    ed.mode = "edit";

    tagToAdd.name = "";
    tagToAdd.description = "";
    tagToAdd.accent = null;
    tagToAdd.accentDisabled = true;
  }

  function removeTag() {
    // Check if we're removing an existing tag, or an added tag
    if (ed.activeI >= savedTags.length) {
      // Removing added tag, we can just remove it completely
      tags.splice(ed.activeI, 1);
      inputTags.splice(ed.activeI, 1);
      ed.activeI = -1;
    } else {
      tags[ed.activeI].removed = true;
    }
  }

  let saveChangesResp: Promise<Response> | null = $state(null);
  let disableSaveChangesBtn: boolean = $state(false);

  function saveChanges() {
    const added = tags.slice(savedTags.length).map((tag) => {
      return {
        name: tag.name,
        description: tag.description,
        accent: tag.accentDisabled ? null : tag.accent,
      };
    });

    const editI = tags
      .slice(0, savedTags.length)
      .map((tag, i) => [tag, i])
      .filter(([tag], i) => !tagsSame(tag as DocTag, savedTags[i]))
      .map(([_, i]) => i);

    const removed = tags
      .map((tag, i) => [tag, i])
      .filter(([tag]) => (tag as DocTag).removed)
      .map(([_, i]) => i);

    // Filter tags that were edited if they were also removed
    const editIFiltered = editI.filter((i) => !removed.includes(i));
    const edit = Object.fromEntries(
      editIFiltered.map((i) => {
        const tag = tags[i as number];
        return [
          i,
          {
            name: tag.name,
            description: tag.description,
            accent: tag.accentDisabled ? null : tag.accent,
          },
        ];
      }),
    );

    disableSaveChangesBtn = true;
    saveChangesResp = fetch_("/documents/api/save_doctag_changes", {
      method: "post",
      body: JSON.stringify({
        added,
        edit,
        removed,
      }),
    });
    saveChangesResp.then(() => {
      ed.changes = false;
      window.location.reload();
    });
    saveChangesResp.finally(() => (disableSaveChangesBtn = false));
  }
</script>

{#snippet editor(inputTag: Partial<DocTag>, tag: DocTag)}
  <div class="flex flex-col md:flex-row">
    <label
      for="edit-tagname"
      class="text-xl md:text-2xl flex items-center text-rock-700 mr-2"
      >Name:</label
    >
    <div class="relative grow">
      <input
        id="edit-tagname"
        class="w-full border-2 rounded border-rock-300 px-3 py-1 text-lg text-rock-700 bg-background-50 focus:bg-white focus:ring-4 ring-rock-300/50 outline-none font-bold font-mono"
        type="text"
        bind:value={
          () => {
            return inputTag.name ?? tag.name;
          },
          (v) => {
            inputTag.name = v;
            if (!validateName(v)) tag.name = v;
          }
        }
        spellcheck="true"
        placeholder="Tag Name"
        required
        {@attach validateField(inputTag.name ?? "", validateName)}
      />
      {#if validateName(inputTag.name ?? tag.name)}
        <div
          class="absolute text-red-400 font-bold text-sm bottom-2 translate-y-full ml-3"
          aria-live="polite"
        >
          <span class="bg-background px-1"
            >{validateName(inputTag.name ?? tag.name)}</span
          >
        </div>
      {/if}
    </div>
  </div>
  <div class="flex flex-col md:flex-row mt-3">
    <label
      for="edit-tagdescription"
      class="text-xl md:text-2xl flex items-center text-rock-700 mr-2"
      >Description:</label
    >
    <FitContentWrapTextarea
      id="edit-tagdescription"
      class="box-content resize-none border-2 rounded border-rock-300 px-3 py-1 text-lg text-rock-700 grow bg-background-50 focus:bg-white focus:ring-4 ring-rock-300/50 outline-none"
      bind:value={
        () => {
          return tag.description.replace(/<br(?: +\/)?>/g, "\n");
        },
        (v) => {
          tag.description = v.replace("\n", "<br />");
        }
      }
      placeholder="Description of the tag."
      dontModifyWidth
    />
  </div>
  <div class="flex mt-3">
    <label
      for="edit-tagaccent"
      class="text-xl md:text-2xl flex items-center text-rock-700 mr-2"
      >Accent:</label
    >
    <input
      id="edit-toggle-tagaccent"
      class="w-5 aspect-square mr-2"
      type="checkbox"
      bind:checked={() => !tag.accentDisabled, (v) => (tag.accentDisabled = !v)}
    />
    <input
      id="edit-tagaccent"
      class="border-2 rounded border-rock-300 p-1 text-lg text-rock-700 bg-background-50 focus:bg-white disabled:pointer-events-none disabled:opacity-50"
      type="color"
      bind:value={tag.accent}
      disabled={tag.accentDisabled}
    />
  </div>
{/snippet}

{#if ed.mode === "edit" && ed.activeI >= 0 && ed.activeI < tags.length}
  <div class="max-w-7xl h-fit grow">
    {@render editor(inputTags[ed.activeI], tags[ed.activeI])}
    <div class="mt-6">
      {#if !tags[ed.activeI].removed}
        <button
          class="bg-red-100 py-2 px-3 text-red-800 rounded text-xl flex items-center border-2 border-red-200 hover:bg-red-200 ring-red-200 active:bg-red-300 active:border-red-300 active:translate-y-1"
          type="button"
          onclick={() => removeTag()}><TrashIcon class="mr-2" />Remove</button
        >
      {:else}
        <button
          class="bg-steel-100 py-2 px-3 text-steel-800 rounded text-xl flex items-center border-2 border-steel-200 hover:bg-steel-200 ring-steel-200 active:bg-steel-300 active:border-steel-300 active:translate-y-1"
          type="button"
          onclick={() => (tags[ed.activeI].removed = false)}
          ><ArrowCounterClockwiseIcon class="mr-2" />Restore</button
        >
      {/if}
      {const numDocuments = $derived(tags[ed.activeI].documentTitles.length)}
      {#if tags[ed.activeI].removed && numDocuments > 0}
        <div class="p-3 bg-yellow-100 text-yellow-800 mt-2 w-fit">
          <b>Note:</b> Removing this tag will automatically remove it from {numDocuments}
          document{numDocuments === 1 ? "" : "s"}. THIS ACTION IS IRREVERSIBLE.
        </div>
      {/if}
    </div>
  </div>
{:else if ed.mode === "edit"}
  <div
    class="text-rock-500 text-3xl my-auto w-full flex items-center justify-center pb-10"
  >
    Select a tag to edit it here
  </div>
{:else if ed.mode === "add"}
  <form class="max-w-7xl h-fit grow" onsubmit={(e) => addTag(e)}>
    {@render editor(inputTags[tags.length], tagToAdd)}
    <div class="mt-6">
      <button
        class="bg-steel-100 py-2 px-3 text-steel-800 rounded text-xl flex items-center border-2 border-steel-200 hover:bg-steel-200 ring-steel-200 active:bg-steel-300 active:border-steel-300 active:translate-y-1"
        type="submit"><PlusCircleIcon class="mr-2 text-2xl" />Add</button
      >
    </div>
  </form>
{:else if ed.mode === "save"}
  <div class="text-center">
    <div class="p-3 bg-yellow-100 text-yellow-800 mt-2 w-fit h-fit text-lg">
      <b>Note:</b> Saving your changes will affect public documents, and that<br
      />THIS ACTION CANNOT BE UNDONE.<br />
      Click "Save Changes" if you wish to proceed regardless.
    </div>
    <div class="mt-4">
      <button
        class="text-xl border-2 border-steel-300 text-steel-600 px-4 py-1 rounded bg-steel-50 hover:bg-white hover:ring-4 ring-steel-100 font-bold active:translate-y-1 active:bg-steel-100 disabled:opacity-50 disabled:pointer-events-none"
        type="button"
        onclick={() => saveChanges()}
        disabled={disableSaveChangesBtn}>Save Changes</button
      >
      {#if saveChangesResp}
        {#await saveChangesResp}
          <div class="italic text-rock-700">Processing...</div>
        {:then resp}
          {#if resp.ok}
            <div class="text-green-700 font-bold">Success!</div>
          {:else}
            {let respText = $state("")}
            {const _ = resp.text().then((text) => (respText = text))}
            <div class="text-red-700 font-bold">
              ({resp.status}) Something went wrong. Message:<br /><span
                class="font-normal">{respText}</span
              >
            </div>
          {/if}
        {:catch}
          <div class="text-red-700 font-bold">Something went wrong.</div>
        {/await}
      {/if}
    </div>
  </div>
{/if}
