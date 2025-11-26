<script lang="ts">
  import { fade } from "svelte/transition";
  import { editorState, allComponentTags } from "../store.svelte";
  import { updateCompEdit, comps, type CompParts } from "./component.svelte";
  import { useDebounce, watch } from "runed";
  import {
    calculateTotalOffset,
    findNodeFromOffset,
  } from "../editors/css/CSSEditor.svelte";
  import { onDestroy } from "svelte";

  // // Represents the component data saved in the database
  // let compInfo: Partial<CompParts> = $derived.by(() => {
  //   if (editorState.mode !== "component") return {};
  //   const comps = $state.snapshot(savedComponents);
  //   let compInfo = comps.find((comp) => comp.name === editorState.resourceName);
  //   return compInfo ?? {};
  // });

  // // Represents the component info that will be commited upon pressing "Save changes".
  // let info: Partial<CompParts> = $derived.by(() => {
  //   if (editorState.mode !== "component") return {};
  //   let compEdit = compLibEdits.current.find(
  //     (edit) =>
  //       edit.type !== "remove" && edit.identName === editorState.resourceName,
  //   );

  //   return assign(compInfo, compEdit ?? {});
  // });
  // const comps.savedCurrent = comps.savedCurrent();
  // const comps.current = comps.current();

  class InputState {
    keyName: keyof CompParts;
    keyVal: string;
    inputVal: string | null = $state(null);
    inputErr: string | null;
    lastValidInputVal: string | null = null;
    syncChange: ReturnType<typeof useDebounce>;

    constructor(
      keyName: keyof CompParts,
      validateVal: (val: string) => string | null,
    ) {
      this.keyName = keyName;
      this.keyVal = $derived(comps.current[this.keyName] ?? "");
      this.inputErr = $derived(
        this.inputVal !== null ? validateVal(this.inputVal) : null,
      );
      this.inputVal = comps.current[this.keyName] ?? "";

      watch([() => this.inputVal, () => this.inputErr], () => {
        if (!this.inputErr && this.inputVal !== null)
          this.lastValidInputVal = this.inputVal;
      });

      this.syncChange = useDebounce(
        () => {
          if (this.lastValidInputVal === null) return;
          updateCompEdit(editorState.resourceName, {
            [this.keyName]: this.lastValidInputVal,
          });
        },
        () => 1000,
      );
      watch(
        () => this.inputVal,
        () => {
          this.syncChange();
        },
      );
    }
  }

  const nameState = new InputState("name", (val) => {
    // Validate name
    if (val.length === 0) return "Name required";
    if (val.includes(" ")) return "Name can't have spaces";
    if (val.endsWith("-")) return 'Name can\'t end with "-"';
    if (/^[0-9]/.test(val)) return "Name can't start with a numeral";
    if (!/^[a-z0-9\-_]*$/i.test(val))
      return 'Name must only contain alphanumeric characters, "-" and "_"';
    if (
      comps.lib.some(
        (comp) =>
          comp.identName !== comps.current.identName && comp.name === val,
      )
    )
      return "Duplicate name";
    return null;
  });

  const descriptionState = new InputState("description", () => null);

  class TagsEditor {
    editorEl: HTMLElement | null = $state(null);
    savedVal: string;
    inputVal: string | null = $state(null);
    syncChange: ReturnType<typeof useDebounce>;

    constructor() {
      this.savedVal = $derived(comps.current.tags ?? "");
      watch([() => this.editorEl, () => this.savedVal], () => {
        if (!this.editorEl) return;
        // Don't override an existing value if there is one in the tags editor
        //  (which will be the case when syncing changes using updateCompEdit while the user is typing)
        //  as that causes the editor to remove invalid tags
        if (this.editorEl.textContent) return;

        this.onInput(this.savedVal, false);
      });

      this.syncChange = useDebounce(
        () => {
          if (!this.editorEl) return;
          const tags = TagsEditor.parseTagsStr(this.editorEl.textContent ?? "");
          updateCompEdit(editorState.resourceName, { tags });
        },
        () => 1000,
      );
    }

    onInput(overrideText?: string, doSync = true) {
      if (!this.editorEl) return;
      let text = overrideText ?? this.editorEl.textContent ?? "";
      this.inputVal = TagsEditor.parseTagsStr(text);
      // TODO: Remove all non alphanumeric, -, _ and spaces from the string.
      // console.log(text);
      // text = text.replace(/[^a-zA-Z0-9\-_ ]/g, "");
      // console.log(text);

      const caret = document.getSelection();
      const offset = calculateTotalOffset(
        this.editorEl,
        caret?.focusNode,
        caret?.focusOffset,
      );

      const html = TagsEditor.parseTagsStrAsHTML(text);
      this.editorEl.innerHTML = html;

      const [node, newOffset] = findNodeFromOffset(this.editorEl, offset);
      if (this.editorEl.contains(caret?.focusNode ?? null))
        caret?.setPosition(node, newOffset);

      if (doSync) this.syncChange();
    }

    static parseTagsStrAsHTML(text: string) {
      // console.log(`Parsing the string "${text}"`);
      const tags = text.split(/[\s,]/);
      // console.log("Found the following tags:", tags);
      const final = tags
        .map((tag) => {
          let errMsg: string | null;
          if (allComponentTags.includes(tag)) {
            return `<span class="existing">${tag}</span>`;
          } else if ((errMsg = this.generateErrMsg(tag)) !== null) {
            return `<span class="error new" style="--errormsg: &quot;${errMsg}&quot;;">${tag}</span>`;
          } else {
            return `<span class="new">${tag}</span>`;
          }
        })
        .join('<span class="space">&nbsp;</span>');

      return final;
    }

    static generateErrMsg(tag: string) {
      if (tag.length === 0) return "Missing tag";
      if (/^[0-9]/.test(tag)) return "Tag cannot start with numeral";
      if (/[\-_]$/.test(tag)) return "Tag cannot end with '-' or '_'";
      return null;
    }

    static parseTagsStr(text: string) {
      const tags = text.split(/[\s,]/);
      const final = tags.filter((tag) => {
        return this.generateErrMsg(tag) === null;
      });
      return final.join(",");
    }

    onSelectionChange() {
      const caret = getSelection();
      if (!caret || !this.editorEl) return;
      const focusEl =
        caret.focusNode instanceof Element
          ? caret.focusNode
          : caret.focusNode?.parentElement;
      if (!focusEl) return;

      const clearFocused = () =>
        this.editorEl &&
        Array.from(this.editorEl.children).forEach((child) =>
          child.classList.remove("focused"),
        );

      // If the focus changed and is within the tags editor, then change the
      //  element which is focused, and otherwise clear focus from the tags editor
      if (this.editorEl !== focusEl && this.editorEl.contains(focusEl)) {
        // If the element-to-focus is already focused, or is a .space, then ignore
        if (
          focusEl.classList.contains("focused") ||
          focusEl.classList.contains("space")
        )
          return;
        clearFocused();
        focusEl.classList.add("focused");
      } else clearFocused();
    }
  }

  const tagsEditor = new TagsEditor();

  onDestroy(() => {
    nameState.syncChange.runScheduledNow();
    descriptionState.syncChange.runScheduledNow();
    tagsEditor.syncChange.runScheduledNow();
  });
</script>

<svelte:document
  onselectionchange={() => {
    tagsEditor.onSelectionChange();
  }}
/>

<div class="my-4 text-xl text-rock-700 italic text-center">
  Edit the current component metadata
</div>

<!-- <div class="text-center"> -->
<div class="flex items-stretch text-lg px-4 max-w-[32rem] mx-auto">
  <label for="edit-name" class="text-rock-700 flex items-center">Name:</label>
  <div class="relative grow mx-3">
    <input
      class="px-3 py-1.5 border-2 border-rock-300 font-mono rounded bg-white w-full text-rock-600 inset-shadow-none inset-shadow-rock-200 outline-none focus:ring-4 ring-steel-200 [.error]:border-red-300 [.error]:focus:ring-red-200"
      class:error={nameState.inputErr}
      type="text"
      name="edit-name"
      id="edit-name"
      placeholder="component-name"
      bind:value={nameState.inputVal}
    />
    {#if nameState.inputErr !== null}
      <div
        class="absolute text-red-400 font-bold text-sm bottom-2 translate-y-full ml-3"
      >
        <span class="bg-background px-1">{nameState.inputErr}</span>
      </div>
    {/if}
  </div>
  {#if comps.current.name !== undefined && nameState.inputVal !== comps.savedCurrent.name}
    <div class="mr-3">
      <!-- The transition:fade is important so that the button click isn't
       registered as "not within the dropdown" hence causing it to close. -->
      <button
        transition:fade={{ duration: 100 }}
        class="h-full aspect-square text-2xl text-rock-700 mr-3 rounded hover:bg-rock-100 flex items-center justify-center"
        aria-label="Reset value"
        onclick={() => {
          if (comps.savedCurrent.name === undefined) return;
          nameState.inputVal = comps.savedCurrent.name ?? null;
        }}><ion-icon name="refresh"></ion-icon></button
      >
    </div>
  {/if}
</div>

<div class="flex items-center px-4 mt-5 max-w-[32rem] mx-auto">
  <label for="edit-description" class="text-rock-700 text-lg"
    >Description:</label
  >
  <div class="relative grow mx-3">
    <textarea
      class="px-3 py-1.5 border-2 border-rock-300 rounded bg-white w-full text-rock-600 inset-shadow-none inset-shadow-rock-200 outline-none focus:ring-4 ring-steel-200 [.error]:border-red-300 [.error]:focus:ring-red-200 text-base"
      class:error={descriptionState.inputErr}
      name="edit-description"
      id="edit-description"
      placeholder="Component description."
      bind:value={descriptionState.inputVal}
    ></textarea>
    {#if descriptionState.inputErr !== null}
      <div
        class="absolute text-red-400 font-bold text-sm bottom-2 translate-y-full ml-3"
      >
        <span class="bg-background px-1">{descriptionState.inputErr}</span>
      </div>
    {/if}
  </div>
  {#if comps.savedCurrent.description !== undefined && descriptionState.inputVal !== comps.savedCurrent.description}
    <!-- The transition:fade is important so that the button click isn't
       registered as "not within the dropdown" hence causing it to close. -->
    <button
      transition:fade={{ duration: 100 }}
      class="p-1.5 aspect-square text-2xl text-rock-700 mr-3 rounded hover:bg-rock-100 flex items-center justify-center"
      aria-label="Reset value"
      onclick={() => {
        if (comps.savedCurrent.description === undefined) return;
        descriptionState.inputVal = comps.savedCurrent.description ?? null;
      }}><ion-icon name="refresh"></ion-icon></button
    >
  {/if}
</div>

<div class="flex items-center px-4 mt-5 max-w-[32rem] mx-auto">
  <label for="edit-tags" class="text-rock-700 text-lg mb-4">Tags:</label>
  <div
    spellcheck="false"
    contenteditable="true"
    id="edit-tags"
    bind:this={tagsEditor.editorEl}
    oninput={(e) => tagsEditor.onInput()}
    class="mx-3 grow text-rock-600 font-mono outline-none flex flex-wrap"
  ></div>
  {#if comps.savedCurrent.tags !== undefined && tagsEditor.inputVal !== comps.savedCurrent.tags}
    <!-- The transition:fade is important so that the button click isn't
       registered as "not within the dropdown" hence causing it to close. -->
    <button
      transition:fade={{ duration: 100 }}
      class="p-1.5 aspect-square text-2xl text-rock-700 mr-3 rounded hover:bg-rock-100 flex items-center justify-center"
      aria-label="Reset value"
      onclick={() => {
        if (comps.savedCurrent.tags === undefined) return;
        tagsEditor.onInput(comps.savedCurrent.tags);
      }}><ion-icon name="refresh"></ion-icon></button
    >
  {/if}
</div>

<!-- </div> -->

<style>
  @reference "../../../shared/tailwindinit.css";

  :global {
    #edit-tags span:not(.space) {
      @apply rounded border-2 border-rock-300 p-0.5 bg-white mb-4 block;
    }
    #edit-tags span.new {
      @apply border-dashed;
    }
    #edit-tags span.error {
      @apply border-red-300;
    }
    #edit-tags span.error::before {
      @apply absolute text-sm text-red-500 inline-block translate-y-[calc(100%_+_--spacing(1))] text-nowrap font-sans italic bg-background;
      content: var(--errormsg);
    }
    #edit-tags span.focused {
      @apply ring-4 ring-steel-200;
    }
  }
</style>
