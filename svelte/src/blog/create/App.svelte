<script lang="ts">
  import "/shared/tailwindinit.css";
  import NodeSelect, {
    type INodeSelect,
  } from "./cursormodes/NodeSelect.svelte";
  import EditText, { type IEditText } from "./cursormodes/EditText.svelte";
  import Sidebar from "./Sidebar.svelte";
  import { PersistedState, useMutationObserver, watch } from "runed";
  import { onDestroy, setContext } from "svelte";
  import {
    mode,
    selection,
    autocompleteMode,
    type SavedComponent,
  } from "./store.svelte";
  import { editorState, changePage } from "./url.svelte";
  import AddNode, { type IAddNode } from "./cursormodes/AddNode.svelte";
  import MultipleSelect, {
    type IMultipleSelect,
  } from "./cursormodes/MultipleSelect.svelte";
  import MoveNodes from "./cursormodes/MoveNodes.svelte";
  import { type IAttributesEditor } from "./editors/attributes/AttributesEditor.svelte";
  import { ClonedSelection } from "./helper";
  import {
    type DocNodeMap,
    type StringPosNodeMap,
    type TempMutationRecord,
    processMutations,
    patchMutations,
    type DocPatch,
  } from "./docsyncing";
  import Autocomplete from "./editors/Autocomplete.svelte";
  import Topbar from "./Topbar.svelte";
  import SaveChanges from "./components/SaveChanges.svelte";
  import ArrowArcLeft from "phosphor-svelte/lib/ArrowArcLeftIcon";
  import { HistoryManager } from "./history";
  import { type ICSSEditor } from "./editors/css/CSSEditor.svelte";
  import { onKeydown } from "./keyboard";
  import { handleCollapsePrevention } from "./collapseprevention";
  import { loadDocument, loadComponent } from "./docloading.svelte";
  import { SaveDoc } from "./docsaving.svelte";
  import { on } from "svelte/events";
  import DocMeta, { type IDocMeta } from "./DocMeta.svelte";

  let documentID = $derived(
    editorState.mode === "document"
      ? Number.parseInt(editorState.resourceName)
      : null,
  );
  let componentID = $derived(
    editorState.mode === "component" ? editorState.resourceName : null,
  );

  let patchSync: boolean | null = null;

  watch(
    () => documentID,
    () => {
      loadDocument({
        multipleSelect,
        docEl,
        historyManager,
      });
    },
  );

  watch(
    () => componentID,
    () => {
      loadComponent({
        multipleSelect,
        docEl,
        historyManager,
      });
    },
  );

  let docEl: HTMLElement | undefined = $state();
  setContext("getDocEl", () => docEl);

  let shiftPressed = $state(false);

  let nodeSelect: INodeSelect | undefined = $state();
  let multipleSelect: IMultipleSelect | undefined = $state();
  let addNode: IAddNode | undefined = $state();
  let docMeta: IDocMeta | undefined = $state();

  setContext("resetHoverTarget", () => (selection.hover = undefined));
  setContext("updateHighlight", () => {
    nodeSelect?.updateHighlight();
    multipleSelect?.updateHighlights();
  });
  setContext("setSelection", (nodes?: Node[] | Node) => {
    multipleSelect?.removeSelection();
    multipleSelect?.toggleToSelection(nodes);
  });
  setContext("removeFromSelection", (nodes?: Node[] | Node) => {
    let currentlySelected: Element[] = [];
    if (Array.isArray(nodes))
      currentlySelected = selection.selected.filter((el) => nodes.includes(el));
    else if (nodes && nodes instanceof Element)
      currentlySelected = selection.selected.includes(nodes) ? [nodes] : [];
    multipleSelect?.toggleToSelection(currentlySelected);
  });

  let editText: IEditText | undefined = $state();
  const startEdit: IEditText["startEdit"] = (e) => editText?.startEdit(e);
  setContext("startEdit", startEdit);

  let attributesEditor: IAttributesEditor | undefined = $state();
  // IMP: The attributesEditor.startAttributeUsage method should NEVER be used -
  //      only the function found in this "startAttributeUsage" context.
  //      (this is to ensure that document server syncing doesn't try sync the value underneath the mask)
  setContext(
    "startAttributeUsage",
    (name: string, value?: string | null, elements?: Element[]) => {
      return (
        attributesEditor?.startAttributeUsage(name, value, elements) ?? [
          () => undefined,
          () => undefined,
        ]
      );
    },
  );
  setContext("changeElementInMasks", (oldEl: Element, newEl: Element) =>
    attributesEditor?.changeElementInMasks(oldEl, newEl),
  );

  // This is used by AttributesEditor when it handles a call to update the user-facing value of an
  //  attribute (e.g. "draggable" while the element is in a moveable selection).
  setContext("syncFakeMutation", (mutation: TempMutationRecord) =>
    collectedMutations.push(mutation),
  );

  let cssEditor: ICSSEditor | undefined = $state();

  // const stopLogInterval = setInterval(() => {
  //   console.log("Focused element:", document.activeElement);
  // }, 1000);
  // onDestroy(() => clearInterval(stopLogInterval));

  const LOG_PATCH_SYNC = false;
  const LOG_DOC_HIST = true;
  const DO_SERVER_SYNC = false;

  const docNodes: DocNodeMap = new Map();
  const stringPosNodeMap: StringPosNodeMap = new Map();
  let htmlStr: string;
  let collectedMutations: TempMutationRecord[] = [];

  const historyManager = new HistoryManager(
    docNodes,
    stringPosNodeMap,
    () => docEl,
    {
      resetSelection: () => multipleSelect?.removeSelection(),
    },
    {
      debug: LOG_DOC_HIST,
    },
  );
  setContext("suggestCreateNewHistoryItem", () =>
    historyManager.suggestCreateNewHistoryItem(),
  );

  // --- References to these won't stay fresh; since they're constantly being reassigned by patchMutations()
  /** For mapping what used to be the most up-to-date node string position values, to the new up-to-date locations. */
  let stringPosBackwardUpdateMap: Map<number, number> = new Map();
  /** For mapping the up-to-date HTML string locations of nodes, to their locations when the document was in its previous state. */
  let stringPosForwardUpdateMap: Map<number, number> = new Map();

  // For testing purposes only
  let debugCreateNewHistoryItem: boolean = false;

  // This observer is to
  //  1- disallow non-element nodes as direct children of docEl.
  //      AND enforce at least one element in the document (done by handleCollapsePrevention)
  //  2- try enfore no "collapsed" elements- that is, elements with 0 height and/or width which can't be
  //      visually selected (done by handleCollapsePrevention).
  //  3- clean up the document, removing unnecessary whitespace from elements that don't rely on it
  //      to remain un-collapsed, and removing trailing <br> tags for elements (which also don't do anything
  //      for page flow) (done by handleCollapsePrevention).
  //  4- inform the CSS editor and Attribute editor about updates (especially those that don't originate
  //      from interacting with said editors).
  //  5- collect mutations, so that we can potentially make patches out of them later.
  const { stop } = useMutationObserver(
    () => docEl,
    (mutations) => {
      // console.log("mutation observer triggered", unfilteredMutations);

      // (1) and (2) and (3), essentially; prevent and clean up elements/nodes that can't be interacted with
      handleCollapsePrevention(mutations, docEl);

      // 4) inform the CSS editor and Attribute editor about updates
      const styleMutationTargets = mutations
        .filter(
          (mutation) =>
            mutation.type === "attributes" &&
            mutation.attributeName === "style",
        )
        .map((mutation) => mutation.target);
      const attributeMutationTargets = mutations
        .filter((mutation) => mutation.type === "attributes")
        .map((mutation) => mutation.target);

      cssEditor?.syncElementInlineStyles(styleMutationTargets);
      attributesEditor?.syncElementAttributes(attributeMutationTargets);

      setTimeout(() => {
        docMeta?.informMetaUpdate(mutations);
      });

      // 5) collect mutations for further processing at the end of the event cycle
      // This lets us have certain expectations when creating patches, such as
      //  "if we encounter an element not connected to the DOM, then some mutation in the provided set removes it"
      //   -> Theoretically, this should only be relevant when within this MutationObserver callback we remove the node.
      //      As otherwise, the mutations ARE grouped together.
      collectedMutations.push(...processMutations(mutations));
    },
    {
      subtree: true,
      attributes: true,
      characterData: true,
      childList: true,
    },
  );
  onDestroy(stop);

  // TODO: Replacement?
  // watch(
  //   () => comps.lib.find((comp) => comp.identName === componentID)?.name,
  //   (current, prev) => {
  //     if (current !== prev) updateCompEditContent();
  //   },
  // );

  function createPatches() {
    if (!docEl) throw new Error("docEl not defined.");
    return patchMutations(
      collectedMutations,
      {
        docNodes,
        stringPosNodeMap,
        stringPosForwardUpdateMap,
        stringPosBackwardUpdateMap,
        docContainer: docEl,
      },
      {
        updateHTMLStr: htmlStr,
        debug: LOG_PATCH_SYNC,
      },
    );
  }

  const docSaver = new SaveDoc({
    makePatches: createPatches,
    getDocEl: () => docEl,
    docNodes,
    stringPosNodeMap,
    doServerSync: DO_SERVER_SYNC,
  });

  const patchInterval = setInterval(() => {
    if (!docEl || collectedMutations.length === 0) return;

    if (LOG_PATCH_SYNC)
      console.group(
        `Patch syncing ${collectedMutations.length} mutations:`,
        collectedMutations,
      );

    let patches: DocPatch[];
    [patches, stringPosForwardUpdateMap, stringPosBackwardUpdateMap, htmlStr] =
      docSaver.save();

    if (LOG_PATCH_SYNC) {
      const docNodesTemp: DocNodeMap = new Map();
      docNodes.forEach((val, key) => docNodesTemp.set(key, { ...val }));
      console.log(docNodesTemp);

      console.log(htmlStr);
      console.groupEnd();
    }

    if (debugCreateNewHistoryItem) {
      historyManager.suggestCreateNewHistoryItem();
    }

    // Send DOM patches to the document history stack for undo/redo
    [stringPosForwardUpdateMap] = historyManager.addToHistoryStack(
      patches.map((patch) => patch.dom),
      stringPosForwardUpdateMap,
      stringPosBackwardUpdateMap,
    );
    historyManager.resetFlagsAndClaims();

    if (LOG_DOC_HIST) {
      console.log("🎈 docHistory: ", structuredClone(historyManager.hist));
      const posNodeMapCopy: typeof stringPosNodeMap = new Map();
      stringPosNodeMap.forEach((val, key) => posNodeMapCopy.set(key, val));
      console.log("🎈 posNodes: ", posNodeMapCopy);
      console.groupEnd();
    }

    if (debugCreateNewHistoryItem)
      console.log("⚠ debugCreateNewHistoryItem IS NOW", false);
    debugCreateNewHistoryItem = false;

    collectedMutations = [];
  });

  onDestroy(() => clearInterval(patchInterval));
  onDestroy(() => docSaver.flushServerChanges());
  on(document, "visibilitychange", () => {
    if (document.hidden) docSaver.flushServerChanges();
  });

  let currentSelection: ClonedSelection | null = null;
  let prevSelection: ClonedSelection | null = null;
  setContext("getPrevSelection", () => prevSelection);
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Shift") shiftPressed = true;
    onKeydown(e, {
      multipleSelect,
      editText,
      addNode,
      historyManager,
      htmlStr,
      docEl,
    });
  }}
  onkeyup={(e) => {
    if (e.key === "Shift") shiftPressed = false;
  }}
/>
<svelte:document
  onselectionchange={(e) => {
    prevSelection = currentSelection;
    const caret = getSelection();
    currentSelection = caret ? new ClonedSelection(caret) : null;
  }}
/>

<div
  class="grid grid-cols-[30%_1fr] grid-rows-[48px_3fr_1fr] [.hide-bl]:grid-rows-[48px_3fr_0fr] h-screen overflow-y-hidden"
  class:hide-bl={mode.sidebar !== "edit"}
>
  <div
    style="scrollbar-color: var(--rock-100) var(--background);"
    class="row-span-2 border-r-2 border-rock-300 bg-background p-2 overflow-y-scroll relative"
  >
    <Sidebar bind:attributesEditor bind:cssEditor />
  </div>
  <div
    class="topbar flex relative border-b-2 border-rock-300 bg-rock-50 bg-opacity-85"
  >
    <Topbar />
  </div>
  <div
    class="flex row-span-2 col-span-1 justify-center relative z-0 overflow-auto"
  >
    {#if docEl}
      <EditText bind:this={editText} {docEl} />
      <NodeSelect {shiftPressed} {docEl} bind:this={nodeSelect} />
      <MultipleSelect bind:this={multipleSelect} />
      <AddNode {docEl} bind:this={addNode} />
      <MoveNodes {docEl} />
    {/if}

    <div class="doc w-3/4 max-w-[600px]" bind:this={docEl}>
      <DocMeta {docEl} {docSaver} bind:this={docMeta} />
      Loading document...
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

{#if editorState.documentRedirect && mode.sidebar === "edit"}
  <button
    aria-label="Return to document"
    class="absolute aspect-square text-2xl p-2 top-2 left-2 rounded-lg border-2 border-rock-100 text-rock-600 hover:bg-rock-100 hover:active:bg-rock-200 hover:active:text-rock-700 hover:active:border-rock-200 hover:active:translate-y-1"
    onclick={() => {
      changePage(
        editorState.mode === "component" ? "document" : "component",
        editorState.documentRedirect!,
        null,
      );
    }}
  >
    <ArrowArcLeft weight="bold" />
  </button>
{/if}

<SaveChanges />
