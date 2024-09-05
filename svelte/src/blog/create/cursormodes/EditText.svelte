<script module lang="ts">
  export interface IEditText {
    startEdit(e?: KeyboardEvent): void;
    finishEdit(): void;
  }
</script>

<script lang="ts">
  import { onDestroy } from "svelte";
  import { on } from "svelte/events";
  import { cursorMode, nodeHoverTarget } from "../store";
  import { getAllTextNodes } from "../helper";

  interface Props {
    doc: HTMLElement;
  }
  let { doc }: Props = $props();

  $effect(() => {
    if ($cursorMode !== "edit" && editTarget) unfocus();
  });

  let editTarget: HTMLElement | undefined;

  export function startEdit(e?: KeyboardEvent) {
    if (!($nodeHoverTarget instanceof HTMLElement)) return;
    $cursorMode = "edit";
    editTarget = $nodeHoverTarget;
    $nodeHoverTarget.contentEditable = "true";
    $nodeHoverTarget.focus();
    if (e) e.preventDefault();

    // Set the cursor to the mouse position

    const selection = getSelection();
    if (!selection) return;

    if (editTarget.innerText.trim() === "") {
      selection.selectAllChildren(editTarget);
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
      selection.setBaseAndExtent(textNode, offset, textNode, offset);
    }
  }

  export function finishEdit() {
    if (!editTarget) return;
    editTarget.contentEditable = "false";
    editTarget = undefined;
    $cursorMode = "select";
  }

  let mouseX: number = 0;
  let mouseY: number = 0;

  function onFocusOut(e: FocusEvent) {
    if (
      editTarget &&
      e.target instanceof HTMLElement &&
      e.target.closest(".doc")
    ) {
      $cursorMode = "select";
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

  // UNUSED (but cool)
  let cursor: HTMLElement;
  function onClick() {
    const selection = getSelection();
    if (
      !selection ||
      !selection.focusNode ||
      !(
        selection.focusNode === selection.anchorNode &&
        selection.focusOffset === selection.anchorOffset
      )
    )
      return;
    const range = document.createRange();
    range.setStart(selection.focusNode, selection.focusOffset);
    range.setEnd(selection.focusNode, selection.focusOffset);
    const rect = range.getClientRects()[0];
    cursor.style.top = `${rect.y + window.scrollY}px`;
    cursor.style.left = `${rect.x + window.scrollX}px`;
    cursor.style.height = `${rect.height}px`;
  }
</script>

<svelte:window
  onmousemove={(e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }}
/>
<svelte:body onfocusout={onFocusOut} />
<!-- <div class="absolute w-[2px] h-5 bg-black" bind:this={cursor}></div> -->
