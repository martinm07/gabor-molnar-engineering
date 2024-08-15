<script lang="ts">
  import "/shared/tailwindinit.css";
  import starterPath from "./starter.txt";
  import NodeSelect, {
    type INodeSelect,
  } from "./cursormodes/NodeSelect.svelte";
  import EditText, { type IEditText } from "./cursormodes/EditText.svelte";
  import Sidebar from "./Sidebar.svelte";
  import firefoxStylesPath from "./editors/css/firefoxDefaultCSS.txt";
  import EditProps from "./cursormodes/EditProps.svelte";
  import { useMutationObserver } from "runed";
  import { onDestroy, setContext } from "svelte";
  import { nodeHoverTarget, cursorMode, nodesSelection } from "./store";
  import AddNode from "./cursormodes/AddNode.svelte";
  import MultipleSelect, {
    type IMultipleSelect,
  } from "./cursormodes/MultipleSelect.svelte";
  import MoveNodes from "./cursormodes/MoveNodes.svelte";
  import { type IAttributesEditor } from "./editors/attributes/AttributesEditor.svelte";
  import { lastChild } from "./helper";

  let document_: string = $state("");
  fetch(starterPath)
    .then((resp) => resp.text())
    .then((data) => (document_ = data));
  let docEl: HTMLElement | undefined = $state();
  // setContext("docEl", docEl);

  let shiftPressed = $state(false);

  // fetch_(
  //   "https://hg.mozilla.org/mozilla-central/raw-file/tip/layout/style/res/html.css",
  // )
  //   .then((resp) => resp.text())
  //   .then((data) => console.log(data));
  fetch(firefoxStylesPath)
    .then((resp) => resp.text())
    .then((data) => {
      const styleSheet = document.createElement("style");
      styleSheet.textContent = data;
      // Has to be prepended so that other stylesheets can override these defaults
      document.head.prepend(styleSheet);
    });

  let nodeSelect: INodeSelect | undefined = $state();
  let multipleSelect: IMultipleSelect | undefined = $state();

  setContext("resetHoverTarget", () => ($nodeHoverTarget = undefined));
  setContext("updateHighlight", () => {
    nodeSelect?.updateHighlight();
    multipleSelect?.updateHighlights();
  });

  let editText: IEditText | undefined = $state();
  const startEdit: IEditText["startEdit"] = (e) => editText?.startEdit(e);
  setContext("startEdit", startEdit);

  let attributesEditor: IAttributesEditor | undefined = $state();
  setContext(
    "startAttributeUsage",
    (name: string, value?: string | null, elements?: Element[]) =>
      attributesEditor?.startAttributeUsage(name, value, elements),
  );

  let selected = $derived(
    $nodesSelection.length === 0
      ? $nodeHoverTarget
        ? [$nodeHoverTarget]
        : []
      : $nodesSelection,
  );

  function onKeydown(e: KeyboardEvent) {
    const inTextField = Boolean(
      document.activeElement?.closest(
        "[contenteditable='true'],[contenteditable='plaintext-only'],input,textarea",
      ),
    );
    if (e.key === "s" && !inTextField) {
      // $cursorMode = "noselect";
      multipleSelect?.toggleToSelection();
    } else if (e.key === "t" && !inTextField) {
      editText?.startEdit(e);
    } else if (e.key === "a" && !inTextField) {
      const selection = getSelection();
      if (
        selection &&
        !selection.isCollapsed &&
        selection.anchorNode === selection.focusNode &&
        docEl?.contains(selection.anchorNode)
      ) {
        // Wrap selection in new node
        const fragment = document.createDocumentFragment();
        const range = selection.getRangeAt(0);
        const node = selection.anchorNode!;
        const startText = document.createTextNode(
          node.textContent?.slice(0, range.startOffset) ?? "",
        );
        fragment.appendChild(startText);
        const span = document.createElement("span");
        span.textContent =
          node.textContent?.slice(range.startOffset, range.endOffset) ?? "";
        fragment.appendChild(span);
        const endText = document.createTextNode(
          node.textContent?.slice(range.endOffset) ?? "",
        );
        fragment.appendChild(endText);
        node.parentNode?.replaceChild(fragment, node);

        multipleSelect?.removeSelection();
        $nodeHoverTarget = span;
        multipleSelect?.toggleToSelection();
      } else {
        multipleSelect?.removeSelection();
        $cursorMode = "add";
      }
    } else if (e.key === "u" && !inTextField && selected.length === 1) {
      const node = selected[0];
      const children = Array(...node.childNodes);
      children.forEach((child) => node.parentNode?.insertBefore(child, node));
      node.remove();

      multipleSelect?.removeSelection();
      multipleSelect?.toggleToSelection(children);
    } else if (e.key === "m" && !inTextField && $nodesSelection.length !== 0) {
      $cursorMode = "move";
    } else if (e.key === "Delete" && !inTextField) {
      if ($nodesSelection.length > 0) {
        $nodesSelection.forEach((el) => el.remove());
        multipleSelect?.removeSelection();
      } else if ($nodeHoverTarget) {
        $nodeHoverTarget.remove();
      }
    } else if (e.key === "Escape") {
      if ($cursorMode === "select") multipleSelect?.removeSelection();
      $cursorMode = "select";
    }
  }

  function getParentElement(node: Node): Element | null {
    if (node instanceof Element) return node;
    else if (node.parentNode) return getParentElement(node.parentNode);
    else return null;
  }

  function getAllTextNodes(node: Node): Node[] {
    return Array(...node.childNodes)
      .flatMap((child) => getAllTextNodes(child))
      .filter((node) => node.nodeType === Node.TEXT_NODE);
  }

  function removeTextContent(node: Node) {
    const oldText = getAllTextNodes(node).map((node) => {
      const text = node.textContent;
      node.textContent = "";
      queuedMutationIgnores.push({ node, type: "characterData" });
      return { node, text };
    });
    return () => {
      oldText.forEach(({ node, text }) => {
        node.textContent = text;
        queuedMutationIgnores.push({ node, type: "characterData" });
      });
    };
  }

  const queuedMutationIgnores: { node: Node; type: MutationRecord["type"] }[] =
    [];
  const { stop } = useMutationObserver(
    () => docEl,
    (mutations) => {
      for (const mutation of mutations) {
        const target = mutation.target;

        const ignoreI = queuedMutationIgnores.findIndex(
          ({ node, type }) => node === target && type === mutation.type,
        );
        if (ignoreI !== -1) {
          queuedMutationIgnores.splice(ignoreI, 1);
          return;
        }

        const el = getParentElement(target);
        if (!(el instanceof HTMLElement)) continue;

        if (
          el.innerText.trim() !== "" ||
          el.classList.contains("potential-location") ||
          el.parentElement?.classList.contains("potential-location")
        )
          continue;

        console.log(el, mutation.type);
        while (true) {
          const last = lastChild(el);
          if (last instanceof HTMLElement && last.tagName === "BR") {
            last.remove();
            queuedMutationIgnores.push({ node: el, type: "childList" });
          } else break;
        }

        if (el.innerText === "") {
          const rect = el.getBoundingClientRect();
          if (rect.height * rect.width >= 1) continue;

          if (mutation.type === "characterData") {
            target.textContent = "\u00A0";
            queuedMutationIgnores.push({ node: target, type: "characterData" });
            getSelection()?.setBaseAndExtent(target, 0, target, 1);
          } else if (mutation.type === "childList") {
            mutation.removedNodes.forEach((removed) => {
              if (removed.nodeType !== Node.TEXT_NODE) return;
              removed.textContent = "\u00A0";
              // NOTE: This might reverse the order of the removed?
              target.insertBefore(
                removed,
                mutation.previousSibling?.nextSibling ?? null,
              );
              queuedMutationIgnores.push({ node: target, type: "childList" });
              getSelection()?.setBaseAndExtent(removed, 0, removed, 1);
            });
          } else if (mutation.type === "attributes") {
            el.insertAdjacentText("afterbegin", "\u00A0");
            queuedMutationIgnores.push({ node: el, type: "childList" });
          }
        } else {
          // If the element's innerText is just a single nbsp character, that indicates
          //  the user would like this element to be empty, but we don't allow that
          //  unless the element has some non-zero area that could be hovered and selected.
          const undo = removeTextContent(el);
          const rect = el.getBoundingClientRect();
          if (rect.height * rect.width < 1) undo();
        }
      }
    },
    {
      subtree: true,
      attributes: true,
      characterData: true,
      childList: true,
    },
  );
  onDestroy(stop);
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Shift") shiftPressed = true;
    onKeydown(e);
  }}
  onkeyup={(e) => {
    if (e.key === "Shift") shiftPressed = false;
  }}
/>

<EditProps />

<div class="grid grid-cols-[30%_1fr] grid-rows-[48px_1fr] h-screen">
  <div
    style="scrollbar-color: #cdcdcd var(--background);"
    class="row-span-2 border-r-2 border-rock-300 bg-background p-2 overflow-y-scroll"
  >
    <Sidebar bind:attributesEditor />
  </div>
  <div class="border-b-2 border-rock-300 bg-rock-50 bg-opacity-85"></div>
  <div class="flex col-span-1 justify-center relative z-0 overflow-auto">
    {#if docEl}
      <EditText bind:this={editText} doc={docEl} />
      <NodeSelect {shiftPressed} doc={docEl} bind:this={nodeSelect} />
      <MultipleSelect bind:this={multipleSelect} />
      <AddNode doc={docEl} />
      <MoveNodes doc={docEl} />
    {/if}
    <div class="doc w-3/4 max-w-[600px]" bind:this={docEl}>
      {@html document_}
    </div>
  </div>
</div>
