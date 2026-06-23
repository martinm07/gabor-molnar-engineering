<script lang="ts">
  import { tags, ed, checkChanges, type IncomingData, type DocTag, savedTags, inputTags } from "./store.svelte";
  import { fetch_ } from "/shared/helper";
  import Color from "color";

  import "/shared/tailwindinit.css";
  import BottomTray from "./BottomTray.svelte";
  import { watch } from "runed";
  import FloppyDiskIcon from "phosphor-svelte/lib/FloppyDiskIcon";
  import { fly } from "svelte/transition";

  function loadData(data: IncomingData[]) {
    console.log("LOADED DATA", data);
    const final: DocTag[] = [];

    for (const {name, description, accent, documentTitles} of data) {
      final.push({
        name,
        description,
        accent,
        accentDisabled: accent === null,
        removed: false,
        documentTitles
      })
    }

    inputTags.splice(0, inputTags.length, ...Array.from(Array(final.length), () => new Object()));
    tags.splice(0, tags.length, ...final);
    savedTags.splice(0, savedTags.length, ...final)
  }

  // $inspect($state.snapshot(inputTags));

  if (globalThis.jinjaParsed) {
    loadData(globalThis.allDocTags);
  } else {
    fetch_("/documents/get_all_tags")
      .then((resp) => resp.json())
      .then((data: IncomingData[]) => {
        loadData(data)
      });
  }

  watch(
    () => $state.snapshot(tags),
    () => {
      checkChanges();
    },
  );

  let flagFocusActive: boolean = $state(false);

  function convertAccent(accent: string) {
    let color: string;
    if (/^\d+ \d+ \d/g.test(accent)) {
      color =
        "#" +
        accent
          .split(" ")
          .map((num) => Number.parseInt(num).toString(16))
          .join("");
    } else {
      color = accent;
    }

    return color;
  }
</script>

<svelte:document onkeydown={(e) => {
  const editingField = (e.target instanceof HTMLElement && e.target.closest("input,textarea"));

  if (e.key === "Escape") {
    if (editingField) flagFocusActive = true;
    else {
      ed.activeI = -1;
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      if (ed.mode !== "edit") ed.mode = "edit";
    }
    return;
  }

  if (e.key === "Enter" && ed.activeI !== -1 && document.activeElement?.closest(".tag-btn")) {
    const editNameField = document.getElementById("edit-tagname");
    if (editNameField) {
      editNameField.focus();
      return;
    }
  }

  if (ed.activeI === -1 || editingField) return;

  if (e.key === "ArrowDown") ed.activeI += 1;
  if (e.key === "ArrowUp") ed.activeI -= 1;

  if (ed.activeI < 0) ed.activeI = tags.length - 1;
  else if (ed.activeI >= tags.length) ed.activeI = 0;

  if (ed.activeI !== -1 && (e.key === "ArrowDown" || e.key === "ArrowUp")) e.preventDefault();

}} />

<div class="grid grid-rows-4 h-screen">
  <div class="flex flex-col items-end bg-background-50 row-span-3 overflow-y-scroll">
    <div class="sticky top-5" id="add-tag-container">
      <button
        class="text-steel-500 border-2 border-steel-500 rounded-xl bg-steel-50 w-full flex items-center justify-center li shadow-xl shadow-steel-100 hover:bg-steel-100 active:translate-y-1 active:ring-4 ring-green-600/50"
        type="button"
        onclick={() => {
          inputTags[tags.length] = {};
          ed.mode = "add";
          ed.activeI = -1;
        }}
      ><span class="text-green-600 text-6xl/12 mr-2 mb-0.5">+</span
        ><span class="font-bold text-lg">Add tag</span></button>
    </div>

    <div class="text-4xl font-serif text-center text-rock-700 mt-5 w-full">Manage Guidance Document Tags</div>
    <div class="max-w-3xl mx-auto h-fit my-5 px-4">
      {#each tags as tag, i}
        {const color = $derived(Color(convertAccent(tag.accent ?? "#e7e8e3")))}
        {const colorLightest = $derived(color.lightness(95))}
        {const colorLight = $derived(color.lightness(90))}

        {let focusedFromFocusin = false}
        <button
          style="--color-lightest: {colorLightest.hex()}; --color-light: {colorLight.hex()}"
          class="tag-btn bg-linear-to-br from-white to-(--color-lightest) hover:to-(--color-light) [.active]:from-(--color-light) [.active]:to-(--color-light) p-3 my-3 rounded border-2 border-rock-300 text-left w-full block [.active]:ring-4 ring-steel-200 scroll-m-3 outline-none [.removed]:opacity-70 [.removed]:line-through"
          class:removed={tag.removed}
          onfocusin={() => {
            ed.activeI = i;
            ed.mode = "edit";
            focusedFromFocusin = true;
            // console.log("FOCUSED IN");
          }}
          class:active={ed.activeI === i}
          {@attach (buttonEl) => {
            if (ed.activeI === i) {
              // buttonEl.scrollIntoView({
              //   block: "nearest"
              // });
              if (!focusedFromFocusin) buttonEl.focus();
              focusedFromFocusin = false;
            };
            if (flagFocusActive) flagFocusActive = false;
          }}
        >
          <div class="text-xl text-rock-700 font-mono font-bold">{tag.name}</div>
          <div class="text-rock-700 mb-1.5">{@html tag.description}</div>
          <div class="text-sm text-rock-600 italic">Used to tag {tag.documentTitles.length} document{tag.documentTitles.length === 1 ? "" : "s"}</div>
        </button>
      {/each}
    </div>

    {#if ed.changes}
      <div class="sticky bottom-5" id="save-changes-container" transition:fly={{ y: 24 }}>
        <button
          class="text-white border-2 border-steel-700 rounded-xl bg-steel-500 w-full flex items-center justify-center li shadow-xl shadow-steel-100 hover:bg-steel-600 active:translate-y-1 active:ring-4 ring-steel-300 transition-all"
          type="button"
          onclick={() => {
            ed.mode = "save";
            ed.activeI = -1;
          }}
        ><span class="text-green-100 text-4xl my-2 mr-2"><FloppyDiskIcon /></span
          ><span class="font-bold text-xl">Save changes</span></button>
      </div>
    {/if}
  </div>

  <div class="flex justify-center border-t-2 p-4 border-rock-300 bg-background h-fit min-h-full">
    <BottomTray />
  </div>
</div>

<style>
  #add-tag-container {
    --tags-max-container-width: 48rem;
    --btn-width: 8rem;
    --padding-x: 1rem;
  }

  #save-changes-container {
    --tags-max-container-width: 48rem;
    --btn-width: 12rem;
    --padding-x: 1rem;
  }

  #add-tag-container,
  #save-changes-container {
    right: max(0px, calc(
      50%
      - var(--tags-max-container-width) / 2
      - var(--btn-width)
      - var(--padding-x))
    );

    width: var(--btn-width);
    padding: 0 var(--padding-x);
    box-sizing: content-box;
  }
</style>
