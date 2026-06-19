<script module lang="ts">
  export class InputState {
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

  // export class TagsEditor2 {
  //   editorEl: HTMLElement | null = $state(null);
  // }

  // export class TagsEditor {
  //   getEl: () => HTMLElement | null = $state(() => null);
  //   getSavedVal: () => string | string[];
  //   inputVal: string | string[] | null = $state(null);
  //   syncChange: Function;

  //   constructor(
  //     editorEl: () => HTMLElement | null,
  //     syncChange: Function,
  //     getSavedVal: () => string | string[],

  //   ) {
  //     // this.savedVal = $derived(comps.current.tags ?? "");
  //     this.getEl = editorEl;

  //     this.getSavedVal = getSavedVal;

  //     watch([() => this.getEl(), () => this.getSavedVal()], () => {
  //       // Don't override an existing value if there is one in the tags editor
  //       //  (which will be the case when syncing changes using updateCompEdit while the user is typing)
  //       //  as that causes the editor to remove invalid tags
  //       if (this.getEl()?.textContent) return;

  //       this.onInput(this.getSavedVal(), false);
  //     });

  //     this.syncChange = syncChange;
  //   }

  //   onInput(overrideText?: string | string[], doSync = true) {
  //     const editorEl = this.getEl();
  //     if (!editorEl) return;
  //     let text = overrideText ?? editorEl.textContent ?? "";
  //     this.inputVal = this.parseTagsStr(text);
  //     // TODO: Remove all non alphanumeric, -, _ and spaces from the string.
  //     // console.log(text);
  //     // text = text.replace(/[^a-zA-Z0-9\-_ ]/g, "");
  //     // console.log(text);

  //     const caret = document.getSelection();
  //     const offset = calculateTotalOffset(
  //       editorEl,
  //       caret?.focusNode,
  //       caret?.focusOffset,
  //     );

  //     const html = TagsEditor.parseTagsStrAsHTML(text);
  //     editorEl.innerHTML = html;

  //     const [node, newOffset] = findNodeFromOffset(editorEl, offset);
  //     if (editorEl.contains(caret?.focusNode ?? null))
  //       caret?.setPosition(node, newOffset);

  //     if (doSync) this.syncChange();
  //   }

  //   static parseTagsStrAsHTML(text: string | string[]) {
  //     let tags: string[];
  //     if (Array.isArray(text)) tags = text;
  //     else tags = text.split(/[\s,]/);
  //     // console.log(`Parsing the string "${text}"`);
  //     // const tags = text.split(/[\s,]/);
  //     // console.log("Found the following tags:", tags);
  //     const final = tags
  //       .map((tag) => {
  //         let errMsg: string | null;
  //         if (allComponentTags.includes(tag)) {
  //           return `<span class="existing">${tag}</span>`;
  //         } else if ((errMsg = this.generateErrMsg(tag)) !== null) {
  //           return `<span class="error new" style="--errormsg: &quot;${errMsg}&quot;;">${tag}</span>`;
  //         } else {
  //           return `<span class="new">${tag}</span>`;
  //         }
  //       })
  //       .join('<span class="space">&nbsp;</span>');

  //     return final;
  //   }

  //   // static generateErrMsg(tag: string) {
  //   //   if (tag.length === 0) return "Missing tag";
  //   //   if (/^[0-9]/.test(tag)) return "Tag cannot start with numeral";
  //   //   if (/[\-_]$/.test(tag)) return "Tag cannot end with '-' or '_'";
  //   //   return null;
  //   // }

  //   // parseTagsStr<T extends string | string[]>(text: T): T {
  //   //   if (Array.isArray(text)) {
  //   //     return text.filter((tag) => {
  //   //       return this.generateErrMsg(tag) === null;
  //   //     })
  //   //   } else {

  //   //     const tags = text.split(/[\s,]/);
  //   //     const final = tags.filter((tag) => {
  //   //       return this.generateErrMsg(tag) === null;
  //   //     });
  //   //     return final.join(",");
  //   //   }
  //   // }
  //   parseTagsStr(text: string): string;
  //   parseTagsStr(text: string[]): string[];
  //   parseTagsStr(text: string | string[]): string | string[];
  //   parseTagsStr(text: string | string[]): string | string[] {
  //     if (Array.isArray(text)) {
  //       return text.filter((tag) => {
  //         return this.generateErrMsg(tag) === null;
  //       })
  //     } else {

  //       const tags = text.split(/[\s,]/);
  //       const final = tags.filter((tag) => {
  //         return this.generateErrMsg(tag) === null;
  //       });
  //       return final.join(",");
  //     }
  //   }

  //   onSelectionChange() {
  //     const editorEl = this.getEl();
  //     const caret = getSelection();
  //     if (!caret || !editorEl) return;
  //     const focusEl =
  //       caret.focusNode instanceof Element
  //         ? caret.focusNode
  //         : caret.focusNode?.parentElement;
  //     if (!focusEl) return;

  //     console.log("Focus element:", focusEl);

  //     const clearFocused = () =>
  //       Array.from(editorEl.children).forEach((child) =>
  //         child.classList.remove("focused"),
  //       );

  //     // If the focus changed and is within the tags editor, then change the
  //     //  element which is focused, and otherwise clear focus from the tags editor
  //     if (editorEl !== focusEl && editorEl.contains(focusEl)) {
  //       // If the element-to-focus is already focused, or is a .space, then ignore
  //       if (
  //         focusEl.classList.contains("focused") ||
  //         focusEl.classList.contains("space")
  //       )
  //         return;
  //       clearFocused();
  //       focusEl.classList.add("focused");
  //     } else clearFocused();
  //   }
  // }

  /* Structure of HTML:
```html
<div contenteditable class="tags-container">
  <span class="existing">tag 1</span>
  <span class="space">&nbsp;</span>
  <span class="new">tag 2</span>
  <span class="space">&nbsp;</span>
  <span class="error new" style="--errormsg: &quot;message here&quot;;">tag 3</span>
  <span class="space">&nbsp;</span>
  <span class="existing focused" style="--errormsg: &quot;message here&quot;;">tag 4</span>
</div>
``` */
  export class TagsEditor {
    validateTag: (
      tag: string,
    ) => [exists: boolean, error: boolean, msg: string];
    syncTags: (tags: string[]) => void;
    keysForNewTag: string[];
    // syncInnerHTML: (htmlStr: string) => void;

    parsedTags: string[] = $state([]);

    private splitStr: string = TagsEditor.generateSplitStr();

    static generateSplitStr() {
      return Math.random().toString(16).slice(2);
    }

    constructor(
      validateTag: (
        tag: string,
      ) => [exists: boolean, error: boolean, msg: string],
      syncTags: (tags: string[]) => void,
      keysForNewTag: string[],
    ) {
      //   syncInnerHTML: (htmlStr: string) => void,
      // ) {
      this.validateTag = validateTag;
      this.syncTags = syncTags;
      this.keysForNewTag = keysForNewTag;
      // this.syncInnerHTML = syncInnerHTML;
    }

    parseTagsIntoHTML(tags: string[]) {
      const final = tags
        .map((tag_) => {
          const tag = tag_ === "" ? tag_ : tag_;
          const [exists, err, msg] = this.validateTag(tag);

          if (exists) {
            return `<span class="existing">${tag}</span>`;
          } else if (err) {
            return `<span class="error new" style="--errormsg: &quot;${msg}&quot;;">${tag}</span>`;
          } else {
            return `<span class="new">${tag}</span>`;
          }
        })
        .join('<span class="space">&nbsp;</span>');

      return final;
    }

    parseHTMLIntoTags(tagsEditorEl: Element): string[] {
      console.log(tagsEditorEl.innerHTML);
      const elStrs: string[] = [];

      let tagStartedFromSpace = false;
      let combineNext = false;

      for (const child of tagsEditorEl.childNodes) {
        if (!(child instanceof Element)) {
          // This means a text node became a direct child of the tags editor container.
          // This mostly happens when pressing Backspace to remove the last character in the container, then trying to type something.
          elStrs.push(child.textContent ?? "");
          combineNext = true;
          continue;
        }
        if (child.classList.contains("space")) {
          if (child.innerHTML.endsWith("&nbsp;")) {
            // We assume this content is part of the previous tag, as it is "before" the actual space (the &nbsp;)
            elStrs[elStrs.length - 1] += child.textContent.slice(0, -1);
          } else if (child.innerHTML.startsWith("&nbsp;")) {
            // We assume this content is part of the next tag, as it is "after" the actual space (the &nbsp;)
            elStrs.push(child.textContent.slice(1));
            tagStartedFromSpace = true;
          } else {
            // The &nbsp; was removed, if the user removes the space between two tags
            //  we assume the intent is to combine those two tags.
            combineNext = true;
          }
        } else {
          if (tagStartedFromSpace || combineNext) {
            elStrs[elStrs.length - 1] += child.textContent;
            tagStartedFromSpace = false;
            combineNext = false;
          } else {
            elStrs.push(child.textContent);
          }
        }
      }

      const tags = elStrs.join(this.splitStr).split(this.splitStr);
      // .map((tag) => tag.trim());

      // console.log("🎈", tags);
      return tags;
    }

    onInput(tagsEditorEl: Element) {
      this.parsedTags = this.parseHTMLIntoTags(tagsEditorEl);

      const caret = document.getSelection();
      const offset = calculateTotalOffset(
        tagsEditorEl,
        caret?.focusNode,
        caret?.focusOffset,
      );

      // console.log(
      //   "Selection BEFORE:",
      //   tagsEditorEl.textContent.slice(offset - 4, offset) +
      //     "|" +
      //     tagsEditorEl.textContent.slice(offset, offset + 4),
      //   `offset: ${offset}`,
      // );

      const html = this.parseTagsIntoHTML(this.parsedTags);
      tagsEditorEl.innerHTML = html;

      const [node, offsetInNode] = findNodeFromOffset(tagsEditorEl, offset);
      if (tagsEditorEl.contains(caret?.focusNode ?? null))
        caret?.setPosition(node, offsetInNode);

      // console.log(
      //   "Selection AFTER:",
      //   node.textContent.slice(offsetInNode - 4, offsetInNode) +
      //     "|" +
      //     node.textContent.slice(offsetInNode, offsetInNode + 4),
      // );
      // console.log(
      //   node.textContent,
      //   offsetInNode,
      //   tagsEditorEl.textContent.length,
      // );

      const filteredTags = this.parsedTags.filter((tag) => {
        const [_, err] = this.validateTag(tag);
        return !err;
      });
      this.syncTags(filteredTags);
    }

    setTags(tags: string[], tagsEditorEl: Element) {
      this.parsedTags = tags;
      const html = this.parseTagsIntoHTML(this.parsedTags);
      tagsEditorEl.innerHTML = html;
      tagsEditorEl.dispatchEvent(new Event("input", { bubbles: true }));
    }

    onSelectionChange(tagsEditorEl: Element) {
      const caret = getSelection();
      if (!caret || !tagsEditorEl) return;
      const focusEl =
        caret.focusNode instanceof Element
          ? caret.focusNode
          : caret.focusNode?.parentElement;
      if (!focusEl) return;

      // console.log("Focus element:", focusEl);

      const clearFocused = () =>
        Array.from(tagsEditorEl.children).forEach((child) =>
          child.classList.remove("focused"),
        );

      // If the focus changed and is within the tags editor, then change the
      //  element which is focused, and otherwise clear focus from the tags editor
      if (tagsEditorEl !== focusEl && tagsEditorEl.contains(focusEl)) {
        // console.log("Selection change:", focusEl, caret.focusOffset);
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

    // static parseTagsStr(text: string): string;
    // static parseTagsStr(text: string[]): string[];
    // static parseTagsStr(text: string | string[]): string | string[] {
    //   return "";
    // }
    onKeydown(e: KeyboardEvent) {
      if (this.keysForNewTag.includes(e.key)) {
        this.splitStr = TagsEditor.generateSplitStr();
        e.preventDefault();
        console.log("PRESSED KEY FOR NEW TAG");

        const selection = document.getSelection();
        if (!selection) return;
        selection.deleteFromDocument(); // Deletes the selection contents

        if (selection.focusNode instanceof Text) {
          const text = selection.focusNode.textContent ?? "";
          const insertI = selection.focusOffset;
          // We're splitting the current tag into two tags
          selection.focusNode.textContent =
            text.slice(0, insertI) + this.splitStr + text.slice(insertI);
          selection.setPosition(selection.focusNode, insertI);
          // Move caret into the second tag (from the two tags that resulted from the split)
          selection.modify("move", "right", "character");

          console.log(selection.focusNode, text, insertI);
          console.log(selection.rangeCount);
          console.log(selection.getComposedRanges());

          e.target?.dispatchEvent(new Event("input", { bubbles: true }));
        } else if (selection.focusNode instanceof Element) {
          // When the selection focusNode/anchor node is of an Element type, the anchorOffset/focusOffset
          //  refer to boundaries between the children, not to boundaries betwee text characters in textContent
          // https://www.w3.org/TR/DOM-Level-2-Traversal-Range/ranges.html#Level-2-Range-Position

          // Note that after the deleteFromDocument() call, the selection is collapsed.

          console.log(
            selection.focusNode,
            selection.focusNode.textContent,
            selection.focusOffset,
          );
          console.log(selection.rangeCount);
          console.log(selection.getComposedRanges());

          if (selection.focusNode.childNodes.length === 0) {
            const newTextNode = document.createTextNode(this.splitStr);
            selection.focusNode.appendChild(newTextNode);
          } else if (
            selection.focusOffset === selection.focusNode.childNodes.length
          ) {
            // if we're focused on the "space" between the last child and the end of the container,
            //  then there's no node that exists that we can prepend the text content to, we must append it instead.
            const child =
              selection.focusNode.childNodes[selection.focusOffset - 1];
            child.textContent += this.splitStr;
          } else {
            // we should prepend the text content to this node
            const child = selection.focusNode.childNodes[selection.focusOffset];
            child.textContent = this.splitStr + child.textContent;
          }
          // Restore caret position after modifying textContent
          selection.setPosition(selection.focusNode, selection.focusOffset);

          e.target?.dispatchEvent(new Event("input", { bubbles: true }));

          setTimeout(() => {
            // Move caret into newly added (empty) tag
            selection.modify("move", "right", "character");
            selection.modify("move", "right", "character");
          });
        }
      }
    }
  }
</script>

<script lang="ts">
  import { fade } from "svelte/transition";
  import { allComponentTags } from "../store.svelte";
  import { editorState } from "../url.svelte";
  import { comps, updateCompEdit, type CompParts } from "./component.svelte";
  import { useDebounce, watch } from "runed";
  import {
    calculateTotalOffset,
    findNodeFromOffset,
  } from "../editors/css/CSSEditor.svelte";
  import { onDestroy, untrack } from "svelte";

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

  let tagsEditorEl: HTMLElement | null = $state(null);
  const syncTagsChange = useDebounce(
    (tags: string[]) => {
      // if (!tagsEditorEl) return;
      // const tags = TagsEditor.parseTagsStr(tagsEditorEl.textContent ?? "");
      updateCompEdit(editorState.resourceName, { tags: tags.join(",") });
    },
    () => 1000,
  );

  // function generateTagsErrMsg(tag: string) {
  //   if (tag.length === 0) return "Missing tag";
  //   if (/^[0-9]/.test(tag)) return "Tag cannot start with numeral";
  //   if (/[\-_]$/.test(tag)) return "Tag cannot end with '-' or '_'";
  //   return null;
  // }

  // const tagsSavedVal = $derived(comps.current.tags ?? "");

  // const tagsEditor = new TagsEditor(
  //   () => tagsEditorEl,
  //   syncTagsChange,
  //   () => tagsSavedVal,
  //   generateTagsErrMsg,
  // );

  const tagsEditor = new TagsEditor(
    (tag: string) => {
      let exists = false;
      if (allComponentTags.includes(tag)) exists = true;

      let msg = "";
      if (tag.length === 0) msg = "Missing tag";
      if (/^[0-9]/.test(tag)) msg = "Tag cannot start with numeral";
      if (/[\-_]$/.test(tag)) msg = "Tag cannot end with '-' or '_'";
      if (/[, ]/.test(tag)) msg = "Tag cannot contain ',' or ' '";

      return [exists, msg !== "", msg];
    },
    syncTagsChange,
    [",", " "],
  );

  $effect(() => {
    if (!tagsEditorEl) return;
    untrack(() => {
      console.log("SET TAGS");
      tagsEditor.setTags(comps.current.tags?.split(",") ?? [], tagsEditorEl!);
    });
  });

  onDestroy(() => {
    nameState.syncChange.runScheduledNow();
    descriptionState.syncChange.runScheduledNow();
    syncTagsChange.runScheduledNow();
  });
</script>

<svelte:document
  onselectionchange={() => {
    if (!tagsEditorEl) return;
    tagsEditor.onSelectionChange(tagsEditorEl);
  }}
/>

<div class="my-4 text-xl text-rock-700 italic text-center">
  Edit the current component metadata
</div>

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

<div class="flex px-4 mt-5 max-w-[32rem] mx-auto">
  <label for="edit-tags" class="text-rock-700 text-lg flex items-center"
    >Tags:</label
  >
  <div
    role="application"
    spellcheck="false"
    contenteditable="true"
    id="edit-tags-comp"
    bind:this={tagsEditorEl}
    oninput={(e) => tagsEditorEl && tagsEditor.onInput(tagsEditorEl)}
    onkeydown={(e) => tagsEditor.onKeydown(e)}
    class="mx-3 text-rock-600 font-mono outline-none flex flex-wrap"
  ></div>
  {#if comps.savedCurrent.tags !== undefined && tagsEditor.parsedTags.join(",") !== comps.savedCurrent.tags}
    <!-- The transition:fade is important so that the button click isn't
       registered as "not within the dropdown" hence causing it to close. -->
    <button
      transition:fade={{ duration: 100 }}
      class="p-1.5 aspect-square text-2xl text-rock-700 mr-3 rounded hover:bg-rock-100 flex items-center justify-center ml-auto"
      aria-label="Reset value"
      onclick={() => {
        if (!tagsEditorEl || comps.savedCurrent.tags === undefined) return;
        tagsEditor.setTags(comps.savedCurrent.tags.split(","), tagsEditorEl);
      }}><ion-icon name="refresh"></ion-icon></button
    >
  {/if}
</div>

<style>
  @reference "../../../shared/tailwindinit.css";

  :global {
    #edit-tags-comp span:not(.space) {
      @apply rounded border-2 border-rock-300 p-0.5 bg-white my-2 block;
    }
    #edit-tags-comp span.new {
      @apply border-dashed;
    }
    #edit-tags-comp span.error {
      @apply border-red-300;
    }
    #edit-tags-comp span.error::before {
      @apply absolute text-sm text-red-500 inline-block translate-y-[calc(100%+(--spacing(1)))] text-nowrap font-sans italic bg-background;
      content: var(--errormsg);
    }
    #edit-tags-comp:focus span.focused {
      @apply ring-4 ring-steel-200;
    }
  }
</style>
