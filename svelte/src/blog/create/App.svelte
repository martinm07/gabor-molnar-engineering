<script lang="ts">
  import "/shared/tailwindinit.css";
  import NodeSelect, {
    type INodeSelect,
  } from "./cursormodes/NodeSelect.svelte";
  import EditText, { type IEditText } from "./cursormodes/EditText.svelte";
  import Sidebar from "./Sidebar.svelte";
  import firefoxStylesPath from "./editors/css/firefoxDefaultCSS.txt";
  import EditProps from "./cursormodes/EditProps.svelte";
  import { useMutationObserver } from "runed";
  import { onDestroy, setContext } from "svelte";
  import {
    cursorMode,
    sidebarMode,
    nodeHoverTarget,
    nodesSelection,
    autocompleteMode,
  } from "./store";
  import AddNode, { type IAddNode } from "./cursormodes/AddNode.svelte";
  import MultipleSelect, {
    type IMultipleSelect,
  } from "./cursormodes/MultipleSelect.svelte";
  import MoveNodes from "./cursormodes/MoveNodes.svelte";
  import { type IAttributesEditor } from "./editors/attributes/AttributesEditor.svelte";
  import {
    ClonedSelection,
    getAllTextNodes,
    lastChild,
    nextElementSibling,
  } from "./helper";
  import {
    patchMutations,
    reconstructHTMLStr,
    type DocNodeMap,
  } from "./docsyncing";
  import Autocomplete from "./editors/Autocomplete.svelte";
  import { fetch_ } from "/shared/helper";
  import { decodeComponentStr } from "./components/component";

  let document_: string = $state("");

  let documentID: number;
  if (globalThis.jinjaParsed) documentID = globalThis.blogcreateDocumentID;
  else
    documentID = Number.parseInt(
      new URLSearchParams(location.search).get("id") ?? "",
    );
  let patchSync: boolean | null = null;
  // ID 114 is starter.txt
  fetch_(`/documents/get_document_edit?id=${documentID}`)
    .then((resp) => resp.json())
    .then((data) => {
      patchSync = false;
      document_ = data.body;
    });

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
  let addNode: IAddNode | undefined = $state();

  setContext("resetHoverTarget", () => ($nodeHoverTarget = undefined));
  setContext("updateHighlight", () => {
    nodeSelect?.updateHighlight();
    multipleSelect?.updateHighlights();
  });
  setContext("setSelection", (nodes?: Node[] | Node) => {
    multipleSelect?.removeSelection();
    multipleSelect?.toggleToSelection(nodes);
  });

  let editText: IEditText | undefined = $state();
  const startEdit: IEditText["startEdit"] = (e) => editText?.startEdit(e);
  setContext("startEdit", startEdit);

  let attributesEditor: IAttributesEditor | undefined = $state();
  setContext(
    "startAttributeUsage",
    (name: string, value?: string | null, elements?: Element[]) =>
      attributesEditor?.startAttributeUsage(name, value, elements) ?? [
        () => undefined,
        () => undefined,
      ],
  );
  setContext("changeElementInMasks", (oldEl: Element, newEl: Element) =>
    attributesEditor?.changeElementInMasks(oldEl, newEl),
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
      addNode?.handleAddOperation();
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
    } else if (
      e.key === "Escape" &&
      !document.querySelector(".autocomplete-display button") &&
      !inTextField
    ) {
      if ($cursorMode === "select") multipleSelect?.removeSelection();
      $cursorMode = "select";
    } else return;
    if ($sidebarMode === "component") $sidebarMode = "edit";
  }

  function removeTextContent(node: Node) {
    const oldText = getAllTextNodes(node).map((node_) => {
      const node = node_ as Text;
      const next = nextElementSibling(node);
      const parent = node.parentNode;
      if (parent) {
        ignoreDOMMutation(
          { node: parent, type: "childList", origin: "removeTextContent" },
          () => node.remove(),
        );
      }
      return { node, next, parent };
    });
    return () => {
      oldText.forEach(({ node, next, parent }) => {
        if (!parent) return;
        // For some reason, this insertBefore call is not consistent in triggering
        //  the MutationObserver; in block elements it does, and in inline elements
        //  it doesn't. Nothing changes, from 'parent', 'node' or 'next' or the return
        //  value of insertBefore() but this difference in behaviour still exists (at
        //  least in FireFox).
        // This is the reason that ignoreDOMMutation() sets a unique ID to each MutationIgnoreRecord,
        //  waits an animation frame for the observer to potentially trigger and removes
        //  this ID if it still exists in the array.
        // The above DOM mutation removing the text nodes also sometimes does the same thing, though less rarely.
        // Both of these might be due to both happening in the same frame, causing inconsistent behaviour.
        ignoreDOMMutation(
          { node: parent, type: "childList", origin: "Undo removeTextContent" },
          () => parent.insertBefore(node, next),
        );
      });
    };
  }

  // "strict = true" only returns true if the node's text content is an empty string
  // "strict = false" returns true as long as it's only whitespace
  function nodeWhitespaceRestricted(node: Node, strict = true) {
    if (node instanceof HTMLElement) {
      return (
        (strict ? node.innerText : node.innerText.trim()) === "" &&
        !node.classList.contains("potential-location") &&
        !node.parentElement?.classList.contains("potential-location")
      );
    } else if (node instanceof Text) {
      return (strict ? node.textContent : node.textContent?.trim()) === "";
    }
  }

  function addNBSP(el: Node) {
    if (!nodeWhitespaceRestricted(el)) return;
    if (el instanceof HTMLElement) {
      // While we could, instead of all this, just set el.textContet, but we should be
      //  sure what kind of DOM manipulation this produces; adding a new text node or editing an existing one?
      const allTextNodes = getAllTextNodes(el);
      if (allTextNodes.length > 0) {
        ignoreDOMMutation(
          { node: allTextNodes[0], type: "characterData", origin: "addNBSP1" },
          () => (allTextNodes[0].textContent = "\u00A0"),
        );
      } else {
        ignoreDOMMutation(
          { node: el, type: "childList", origin: "addNBSP2" },
          () =>
            el.insertBefore(document.createTextNode("\u00A0"), el.firstChild),
        );
      }
    } else if (el instanceof Text) {
      ignoreDOMMutation(
        { node: el, type: "characterData", origin: "addNBSP3" },
        () => (el.textContent = "\u00A0"),
      );
    }
  }

  type MutationIgnoreRecord = {
    node: Node;
    type: MutationRecord["type"];
    id?: number;
    origin?: string;
  };
  const queuedMutationIgnores: MutationIgnoreRecord[] = [];

  let uuid: number = 0;
  function ignoreDOMMutation(record: MutationIgnoreRecord, func: Function) {
    record.id ??= uuid++;
    queuedMutationIgnores.push(record);
    func();
    requestAnimationFrame(() => {
      const index = queuedMutationIgnores.findIndex(
        ({ id }) => id === record.id,
      );
      if (index !== -1) queuedMutationIgnores.splice(index, 1);
    });
  }

  // Also consider closing tags! They will change if the tag name of an element changes.
  //  However, there is no such mutation as "changing the tag name of an element"- that simply
  //  involves deleting and adding a new element.
  let docNodes: DocNodeMap = new Map();
  let htmlStr: string;

  // This observer is to
  //  1- disallow non-element nodes as direct children of docEl
  //  2- try enforce no "collapsed" elements (that is, elements with 0 height and/or width),
  //    by making those that WOULD, take a single non-breaking space (&nbsp;) character as textContent
  //  3- check elements with only whitespace as text content if that white space could be removed
  //    and not have the element collapse (e.g. some CSS sets the height and width already), in which
  //    case remove that whitespace
  //  4- remove any last island of <br> child elements from elements that have only whitespace as text
  //    content. These <br>s do nothing (typically) for page flow or otherwise, and are just artefacts
  //    from the contentEditable process (in which there is no way for the user to delete them manually)
  //  5- sync the document to the database through patches to the HTML string
  const { stop } = useMutationObserver(
    () => docEl,
    (mutations) => {
      console.log("mutation observer triggered", mutations);

      for (const mutation of mutations) {
        const target = mutation.target;

        const ignoreI = queuedMutationIgnores.findIndex(
          ({ node, type }) => node === target && type === mutation.type,
        );
        if (ignoreI !== -1) {
          // console.log([...queuedMutationIgnores], mutation);
          queuedMutationIgnores.splice(ignoreI, 1);
          break;
        }
        // console.log("not ignored", mutation);

        // 1)
        mutation.addedNodes.forEach((added) => {
          if (
            added.nodeType !== Node.ELEMENT_NODE &&
            added.parentElement === docEl
          )
            added.parentElement.removeChild(added);
        });

        // 2) Handle newly added nodes, making sure they aren't collapsed
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach(addNBSP);
        }

        const el =
          mutation.type === "characterData" ? target.parentElement : target;

        // Handling of 2/3 and 4 are only required if the element only contains whitespace
        if (
          !(el instanceof HTMLElement) ||
          !nodeWhitespaceRestricted(el, false)
        )
          continue;

        let removedBRs: boolean = false;
        // 4) Remove any list island of BRs
        while (true) {
          const last = lastChild(el);
          if (last instanceof HTMLElement && last.tagName === "BR") {
            ignoreDOMMutation(
              { node: el, type: "childList", origin: "removeBR" },
              () => last.remove(),
            );
            removedBRs = true;
          } else {
            // 2) If BRs were removed then there's a chance that the element has no collapsed
            //     which must be handled.
            if (removedBRs && el.innerText === "") addNBSP(el);
            break;
          }
        }

        // 2) Check if the modification of this element has collapsed it, and rectify if so
        if (el.innerText === "") {
          const rect = el.getBoundingClientRect();
          if (rect.height * rect.width >= 1) continue;

          addNBSP(el);
          if ($cursorMode === "edit")
            getSelection()?.setBaseAndExtent(target, 0, target, 1);
        }
        // 3) We know this element has only whitespace- because of the early termination above-
        //     and so we're checking if the nbsp (or other) could be safely removed.
        if (el.innerText !== "") {
          // If the element's innerText is just a single nbsp character, that indicates
          //  the user would like this element to be empty, but we don't allow that
          //  unless the element has some non-zero area that could be hovered and selected.
          const undo = removeTextContent(el);
          const rect = el.getBoundingClientRect();
          if (rect.height * rect.width < 1) undo();
        }
      }

      if (patchSync === false && docEl) {
        console.log("Document loaded!");

        [, htmlStr] = reconstructHTMLStr(docEl, false, 0, docNodes);
        console.log(docNodes);
        console.log(htmlStr);
        // docNodes.values().forEach((info) => {
        //   console.log(
        //     htmlStr.slice(info.stringPos, info.stringPos + info.stringLen),
        //   );
        // });

        // Sync this htmlStr to the database. It is of course functionally equivalent to whatever is
        //  already stored in the database, but doing this guarantees that specific HTML string matches
        //  what patches will try and modify.
        fetch_("/documents/sync_document_full", {
          method: "post",
          body: JSON.stringify({
            id: documentID,
            body: htmlStr,
          }),
        });
        patchSync = true;
      } else if (patchSync && docEl) {
        htmlStr = patchMutations(mutations, docNodes, docEl, documentID, {
          updateHTMLStr: htmlStr,
          debug: true,
          useIgnoreAddedNodeMutations: true,
        });
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
  let currentSelection: ClonedSelection | null = null;
  let prevSelection: ClonedSelection | null = null;
  setContext("getPrevSelection", () => prevSelection);
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
<svelte:document
  onselectionchange={(e) => {
    prevSelection = currentSelection;
    const selection = getSelection();
    currentSelection = selection ? new ClonedSelection(selection) : null;
  }}
/>

<EditProps />

<div
  class="grid grid-cols-[30%_1fr] grid-rows-[48px_3fr_1fr] [&.hide-bl]:grid-rows-[48px_3fr_0fr] h-screen"
  class:hide-bl={$sidebarMode !== "edit"}
>
  <div
    style="scrollbar-color: #cdcdcd var(--background);"
    class="row-span-2 border-r-2 border-rock-300 bg-background p-2 overflow-y-scroll relative"
  >
    <Sidebar bind:attributesEditor />
  </div>
  <div class="border-b-2 border-rock-300 bg-rock-50 bg-opacity-85"></div>
  <div
    class="flex row-span-2 col-span-1 justify-center relative z-0 overflow-auto"
  >
    {#if docEl}
      <EditText bind:this={editText} doc={docEl} />
      <NodeSelect {shiftPressed} doc={docEl} bind:this={nodeSelect} />
      <MultipleSelect bind:this={multipleSelect} />
      <AddNode doc={docEl} bind:this={addNode} />
      <MoveNodes doc={docEl} />
    {/if}
    <div class="doc w-3/4 max-w-[600px]" bind:this={docEl}>
      {@html document_}
    </div>
  </div>
  <div
    style="scrollbar-color: #cdcdcd var(--rock-50);"
    class="bg-rock-50 border-r-2 border-t-2 border-rock-300 overflow-y-scroll"
  >
    <div
      class="h-fit min-h-full flex items-center justify-center"
      class:hidden={!$autocompleteMode}
    >
      <Autocomplete />
    </div>
    <div
      class="h-fit min-h-full flex items-center justify-center"
      class:hidden={$autocompleteMode}
    >
      Keyboard shortcuts here :)
    </div>
  </div>
</div>
