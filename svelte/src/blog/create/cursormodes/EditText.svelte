<script module lang="ts">
  export interface IEditText {
    startEdit(e?: KeyboardEvent): void;
    finishEdit(): void;
  }
</script>

<script lang="ts">
  import { onDestroy, getContext } from "svelte";
  import { on } from "svelte/events";
  import { mode, selection } from "../store.svelte";
  import { closest, getAllTextNodes } from "../helper";

  const suggestCreateNewHistoryItem: () => void = getContext(
    "suggestCreateNewHistoryItem",
  );

  interface Props {
    docEl: HTMLElement;
  }
  let { docEl }: Props = $props();

  $effect(() => {
    if (mode.cursor !== "edit" && editTarget) unfocus();
  });

  let editTarget: HTMLElement | undefined;

  export function startEdit(e?: KeyboardEvent) {
    if (!(selection.hover instanceof HTMLElement)) return;
    mode.cursor = "edit";
    editTarget = selection.hover;
    selection.hover.contentEditable = "true";
    selection.hover.focus();
    if (e) e.preventDefault();

    // Set the cursor to the mouse position

    const caret = getSelection();
    if (!caret) return;

    if (editTarget.innerText.trim() === "") {
      caret.selectAllChildren(editTarget);
      return;
    }

    let textNode: Node | undefined;
    let offset: number | undefined;
    // NOTE: "caretPositionFromPoint" is standardized, but only has support on Firefox,
    // while "caretRangeFromPoint" is a WebKit-propietary method, unstandardized (and so
    //  can change whenever) but seemingly on all browsers not Firefox.
    if (document.caretPositionFromPoint) {
      const range = document.caretPositionFromPoint(mouseX, mouseY);
      textNode = range.offsetNode;
      offset = range.offset;
    } else if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(mouseX, mouseY);
      textNode = range?.startContainer;
      offset = range?.startOffset;
    } else {
      return;
    }

    if (textNode?.nodeType === Node.TEXT_NODE && offset) {
      caret.setBaseAndExtent(textNode, offset, textNode, offset);
    }
  }

  export function finishEdit() {
    if (!editTarget) return;
    editTarget.contentEditable = "false";
    editTarget = undefined;
    mode.cursor = "select";
  }

  let mouseX: number = 0;
  let mouseY: number = 0;

  function onFocusOut(e: FocusEvent) {
    if (
      editTarget &&
      e.target instanceof HTMLElement &&
      e.target.closest(".doc")
    ) {
      mode.cursor = "select";
      unfocus();
    }
  }
  function unfocus() {
    if (!editTarget) return;
    editTarget.removeAttribute("contenteditable");
    // This is probably Firefox-specific behaviour, but it acts strange when an element
    //  was being contentEdit-ed and is updated to have no text, and thus should collapse
    //  to e.g. a 0-height div, but it doesn't. The behaviour is fixed if it's set to be
    //  non-empty text content, and then back. So we set it nonempty here and let the
    //  MutationObserver in App.svelte do the rest.
    if (editTarget.innerText === "") {
      const allTextNodes = getAllTextNodes(editTarget);
      if (allTextNodes.length > 0) allTextNodes[0].textContent = "\u00A0";
      else editTarget.insertAdjacentText("afterbegin", "\u00A0");
    }
    editTarget = undefined;
  }

  //// UNUSED (but cool)
  // let cursor: HTMLElement;
  // function onClick() {
  //   const caret = getSelection();
  //   if (
  //     !caret ||
  //     !caret.focusNode ||
  //     !(
  //       caret.focusNode === caret.anchorNode &&
  //       caret.focusOffset === caret.anchorOffset
  //     )
  //   )
  //     return;
  //   const range = document.createRange();
  //   range.setStart(caret.focusNode, caret.focusOffset);
  //   range.setEnd(caret.focusNode, caret.focusOffset);
  //   const rect = range.getClientRects()[0];
  //   cursor.style.top = `${rect.y + window.scrollY}px`;
  //   cursor.style.left = `${rect.x + window.scrollX}px`;
  //   cursor.style.height = `${rect.height}px`;
  // }

  // HANDLING THE CREATION OF NEW HISTORY ITEMS

  let calledOnInput: boolean = false;

  let lastEditType: "back" | "forward" | "other" | null = null;
  function handleInputForHistory(e: Event) {
    if (!(e instanceof InputEvent)) return;

    let editType: typeof lastEditType;
    if (e.inputType.startsWith("insert")) editType = "forward";
    else if (e.inputType.startsWith("delete")) editType = "back";
    else editType = "other";

    if (lastEditType !== null && editType !== lastEditType) {
      suggestCreateNewHistoryItem();
    }
    lastEditType = editType;

    if (e.data === " ") suggestCreateNewHistoryItem();
  }
</script>

<svelte:document
  onselectionchange={() => {
    const caret = getSelection();
    if (!caret || !editTarget || !closest(caret.focusNode, editTarget)) return;

    // console.log("EditText selection update! 💙");
    // Suggest new history items if the selection changed without an input event being fired
    //  (i.e. the user is using the arrow keys, or clicking around, or making a range selection)
    if (!calledOnInput) suggestCreateNewHistoryItem();
    calledOnInput = false;
  }}
/>

<svelte:window
  onmousemove={(e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }}
/>
<svelte:body
  onfocusout={onFocusOut}
  oninput={(e) => {
    if (
      editTarget &&
      e.target instanceof Node &&
      closest(e.target, editTarget)
    ) {
      calledOnInput = true;
      handleInputForHistory(e);
    }
  }}
/>
<!-- <div class="absolute w-[2px] h-5 bg-black" bind:this={cursor}></div> -->
