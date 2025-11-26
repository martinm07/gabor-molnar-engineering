import type { IAddNode } from "./cursormodes/AddNode.svelte";
import type { IEditText } from "./cursormodes/EditText.svelte";
import type { IMultipleSelect } from "./cursormodes/MultipleSelect.svelte";
import { parseHTMLFragment } from "./helper";
import { selection, mode } from "./store.svelte";
import type { HistoryManager } from "./history";

interface EditorInterfaceKeyboard {
  multipleSelect?: IMultipleSelect;
  editText?: IEditText;
  addNode?: IAddNode;
  historyManager?: HistoryManager;
  htmlStr?: string;
  docEl?: HTMLElement;
}

export function onKeydown(e: KeyboardEvent, p: EditorInterfaceKeyboard) {
  const inTextField = Boolean(
    document.activeElement?.closest(
      "[contenteditable='true'],[contenteditable='plaintext-only'],input,textarea",
    ),
  );
  if (e.key === "s" && !inTextField) {
    // mode.cursor = "noselect";
    p.multipleSelect?.toggleToSelection();
  } else if (e.key === "t" && !inTextField) {
    p.editText?.startEdit(e);
  } else if (e.key === "a" && !inTextField) {
    p.addNode?.handleAddOperation();
  } else if (e.key === "u" && !inTextField && selection.main.length === 1) {
    const node = selection.main[0];
    const children = Array(...node.childNodes);
    children.forEach((child) => node.parentNode?.insertBefore(child, node));
    node.remove();

    p.multipleSelect?.removeSelection();
    p.multipleSelect?.toggleToSelection(children);
  } else if (e.key === "m" && !inTextField && selection.selected.length !== 0) {
    mode.cursor = "move";
  } else if (e.key === "Delete" && !inTextField) {
    if (selection.selected.length > 0) {
      selection.selected.forEach((el) => el.remove());
      p.historyManager?.suggestCreateNewHistoryItem();
      p.multipleSelect?.removeSelection();
    } else if (selection.hover) {
      selection.hover.remove();
      p.historyManager?.suggestCreateNewHistoryItem();
    }
  } else if (
    e.key === "Escape" &&
    !document.querySelector(".autocomplete-display button") &&
    !inTextField
  ) {
    if (mode.sidebar === "addcomponent")
      selection.selected.forEach((el) => el.remove());

    if (mode.cursor === "select") p.multipleSelect?.removeSelection();
    mode.cursor = "select";
  } else if (
    e.key === "Escape" &&
    !document.querySelector(".autocomplete-display button") &&
    inTextField &&
    e.target instanceof HTMLElement
  ) {
    e.target.blur();
  } else if (e.ctrlKey && e.key === "z") {
    try {
      p.historyManager?.undo();
      // preventDefault here stops the browser's native undo/redo in contenteditable elements
      e.preventDefault();
    } catch (e) {
      console.error(e);
      console.warn(
        "Caught error while undoing. Resetting html string to before undo was attempted.",
      );
      if (p.docEl && p.htmlStr) {
        const parsed = parseHTMLFragment(p.htmlStr, true, true);
        while (p.docEl.firstChild) p.docEl.removeChild(p.docEl.firstChild);
        parsed.forEach((node) => p.docEl?.appendChild(node));
      }
    }
  } else if (e.ctrlKey && e.key === "y") {
    try {
      p.historyManager?.redo();
      e.preventDefault();
    } catch (e) {
      console.error(e);
      console.warn(
        "Caught error while redoing. Resetting html string to before redo was attempted.",
      );
      if (p.docEl && p.htmlStr) {
        const parsed = parseHTMLFragment(p.htmlStr, true, true);
        while (p.docEl.firstChild) p.docEl.removeChild(p.docEl.firstChild);
        parsed.forEach((node) => p.docEl?.appendChild(node));
      }
    }
    // } else if (e.ctrlKey && e.key === "Q") {
    //   debugCreateNewHistoryItem = !debugCreateNewHistoryItem;
    //   console.log(
    //     "⚠ debugCreateNewHistoryItem IS NOW",
    //     debugCreateNewHistoryItem,
    //   );
  } else return;
  // if (mode.sidebar === "component") mode.sidebar = "edit";
}
