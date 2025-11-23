<script lang="ts">
  import "/shared/tailwindinit.css";
  import NodeSelect, {
    type INodeSelect,
  } from "./cursormodes/NodeSelect.svelte";
  import EditText, { type IEditText } from "./cursormodes/EditText.svelte";
  import Sidebar from "./Sidebar.svelte";
  import { useDebounce, useMutationObserver, watch } from "runed";
  import { onDestroy, setContext } from "svelte";
  import {
    mode,
    nodeHoverTarget,
    nodesSelection,
    autocompleteMode,
    savedComponents,
    type SavedComponent,
    editorState,
    compLibVer,
    compLibEdits,
    allComponentTags,
    changePage,
  } from "./store.svelte";
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
    parseHTMLFragment,
  } from "./helper";
  import {
    type DocNodeMap,
    type StringPosNodeMap,
    type TempMutationRecord,
    reconstructHTMLString,
    processMutations,
    patchMutations,
    type DocPatch,
  } from "./docsyncing";
  import Autocomplete from "./editors/Autocomplete.svelte";
  import { fetch_, assign, request2AnimationFrames } from "/shared/helper";
  import {
    comps,
    decodeComponentStr,
    generateCompContentStr,
    updateCompEdit,
    type CompLibUpgradeInfo,
    type GetCompLibFetchReturn,
  } from "./components/component.svelte";
  import Topbar from "./Topbar.svelte";
  import SaveChanges from "./components/SaveChanges.svelte";
  import ArrowArcLeft from "phosphor-svelte/lib/ArrowArcLeft";
  import { HistoryManager } from "./history";
  import { type ICSSEditor } from "./editors/css/CSSEditor.svelte";

  // let compLibVer: string | null = $state(null);
  // let latestCompLibVer: string | null = $state(null);

  // const currentVerFetch = fetch_("/documents/savedcomponents_currentversion")
  //   .then((resp) => resp.text())
  //   .then((latestVer) => {
  //     compLibVer.latestVer = latestVer;
  //     // compLibVer.latestVer = "somethingotallydifferent";
  //     // If we are in the component editor, then we will be editing the latest version of the component library
  //     if (componentID !== null) {
  //       compLibVer.currentVer = latestVer;
  //       // compLibVer.currentVer = "somethingtotallydifferent";
  //       return getSavedComponentLibrary(latestVer);
  //     } else return Promise.resolve();
  //   });

  let documentID = $derived(
    editorState.mode === "document"
      ? Number.parseInt(editorState.resourceName)
      : null,
  );
  let componentID = $derived(
    editorState.mode === "component" ? editorState.resourceName : null,
  );

  let patchSync: boolean | null = null;

  let compLibUpgradeInfo: CompLibUpgradeInfo | null = null;
  setContext("getCompLibUpgradeInfo", () => compLibUpgradeInfo);

  async function getSavedComponentLibrary(ver?: string) {
    console.log("getting saved components library");

    const URL = `/documents/get_component_library${typeof ver === "string" ? "?ver=" + ver : ""}`;
    return fetch_(URL)
      .then((resp) => resp.json())
      .then((data: GetCompLibFetchReturn) => {
        console.log(data);
        // The response from the server has every field as a string, so we must
        //  do these conversions for 'tags' and 'parts'.
        // data.forEach((comp) => {
        //   comp["tags"] = (comp["tags"] as unknown as string).split(",");
        //   comp["parts"] = (comp["parts"] as unknown as string).split("|");
        // });
        // savedComponents.update(() => data);

        const components = data.library.map((comp) =>
          Object.assign(comp, { identName: comp.name }),
        );
        savedComponents.splice(0, savedComponents.length, ...components);
        return data;
      });
  }

  watch(() => documentID, loadDocument);
  function loadDocument() {
    if (documentID === null) return;
    fetch_(`/documents/get_document_edit?id=${documentID}`)
      .then((resp) => resp.json())
      .then((data) => {
        patchSync = false;

        const parsed = parseHTMLFragment(data.body, true, true);
        while (docEl?.firstChild) docEl.removeChild(docEl.firstChild);
        parsed.forEach((node) => docEl?.appendChild(node));

        // If we are coming back from editing components in the middle
        //  of adding a new node, then we need to recover the editor state
        //  to the point where the user was trying to add a new node
        request2AnimationFrames(() => {
          if (!docEl) return;
          const tempAdded = Array.from(docEl.querySelectorAll(".temp-added"));

          // There is in fact no attempt at adding a new node, thus we return early
          if (tempAdded.length === 0) return;

          multipleSelect?.removeSelection();
          multipleSelect?.toggleToSelection(tempAdded);
          mode.sidebar = "addcomponent";
        });

        const componentLibVer = data["component_lib_ver"];
        if (typeof componentLibVer !== "string")
          throw new Error(
            "'/documents/get_document_edit' didn't return string for key 'component_lib_ver'.",
          );
        compLibVer.currentVer = componentLibVer;
        return getSavedComponentLibrary(componentLibVer);
      })
      .then((data) => {
        compLibUpgradeInfo = {
          to_version: data.upgrade_to_version,
          name_map: data.upgrade_name_map,
          content_list: data.upgrade_content_list,
          remove_list: data.upgrade_remove_list,
          diff_msgs: data.upgrade_diff_msgs,
        };
        compLibVer.latestVer = compLibUpgradeInfo.to_version;
      });
  }
  setContext("refreshDocument", loadDocument);

  watch(
    () => componentID,
    () => {
      if (componentID === null) return;
      // console.log("componentID changed", componentID);

      // Get all currently defined tags, so that autocomplete can be provided when modifying component tags
      fetch_("/documents/get_component_tags")
        .then((resp) => resp.json())
        .then((data: string[]) => {
          allComponentTags.splice(0, allComponentTags.length, ...data);
        });

      fetch_("/documents/savedcomponents_currentversion")
        .then((resp) => resp.text())
        .then((latestVer) => {
          compLibVer.latestVer = latestVer;
          compLibVer.currentVer = latestVer;
        });

      getSavedComponentLibrary().then(() => {
        if (componentID === null) return;
        const comp = savedComponents.find((comp) => comp.name === componentID);
        const editMatch = compLibEdits.current.find(
          (edit) => edit.type !== "remove" && edit.identName === componentID,
        );
        if (!comp && !editMatch) {
          if (docEl)
            docEl.innerHTML =
              "<div>Welcome to purgatory - Please either select or create a component</div>";
          return;
        }

        const compWithEdits = assign(
          $state.snapshot(comp) ?? {},
          editMatch ?? {},
        ) as SavedComponent;

        patchSync = true;

        const compBody = decodeComponentStr(compWithEdits.content, "component");
        if (docEl) docEl.innerHTML = "";
        docEl?.appendChild(compBody);

        request2AnimationFrames(() => {
          if (!docEl) return;
          const tempAdded = Array.from(docEl.querySelectorAll(".temp-added"));

          // There is in fact no attempt at adding a new node, thus we return early
          if (tempAdded.length === 0) return;

          multipleSelect?.removeSelection();
          multipleSelect?.toggleToSelection(tempAdded);
          mode.sidebar = "addcomponent";
        });

        mode.sidebar = "edit";
        multipleSelect?.removeSelection();
      });
    },
  );

  let docEl: HTMLElement | undefined = $state();
  setContext("getDocEl", () => docEl);

  let shiftPressed = $state(false);

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
  setContext("removeFromSelection", (nodes?: Node[] | Node) => {
    let currentlySelected: Element[] = [];
    if (Array.isArray(nodes))
      currentlySelected = $nodesSelection.filter((el) => nodes.includes(el));
    else if (nodes && nodes instanceof Element)
      currentlySelected = $nodesSelection.includes(nodes) ? [nodes] : [];
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
      elements?.forEach((el) =>
        ignoreDOMMutation(
          {
            node: el,
            type: "attributes",
            attributeName: name,
          },
          () => {},
        ),
      );
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

  let selected = $derived(
    $nodesSelection.length === 0
      ? $nodeHoverTarget
        ? [$nodeHoverTarget]
        : []
      : $nodesSelection,
  );

  function onKeydown(e: KeyboardEvent) {
    // console.log("Global keydown event");
    const inTextField = Boolean(
      document.activeElement?.closest(
        "[contenteditable='true'],[contenteditable='plaintext-only'],input,textarea",
      ),
    );
    if (e.key === "s" && !inTextField) {
      // mode.cursor = "noselect";
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
      mode.cursor = "move";
    } else if (e.key === "Delete" && !inTextField) {
      if ($nodesSelection.length > 0) {
        $nodesSelection.forEach((el) => el.remove());
        historyManager.suggestCreateNewHistoryItem();
        multipleSelect?.removeSelection();
      } else if ($nodeHoverTarget) {
        $nodeHoverTarget.remove();
        historyManager.suggestCreateNewHistoryItem();
      }
    } else if (
      e.key === "Escape" &&
      !document.querySelector(".autocomplete-display button") &&
      !inTextField
    ) {
      if (mode.sidebar === "addcomponent")
        $nodesSelection.forEach((el) => el.remove());

      if (mode.cursor === "select") multipleSelect?.removeSelection();
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
        historyManager.undo();
        // preventDefault here stops the browser's native undo/redo in contenteditable elements
        e.preventDefault();
      } catch (e) {
        console.error(e);
        console.warn(
          "Caught error while undoing. Resetting html string to before undo was attempted.",
        );
        const parsed = parseHTMLFragment(htmlStr, true, true);
        while (docEl?.firstChild) docEl.removeChild(docEl.firstChild);
        parsed.forEach((node) => docEl?.appendChild(node));
      }
    } else if (e.ctrlKey && e.key === "y") {
      try {
        historyManager.redo();
        e.preventDefault();
      } catch (e) {
        console.error(e);
        console.warn(
          "Caught error while redoing. Resetting html string to before redo was attempted.",
        );
        const parsed = parseHTMLFragment(htmlStr, true, true);
        while (docEl?.firstChild) docEl.removeChild(docEl.firstChild);
        parsed.forEach((node) => docEl?.appendChild(node));
      }
    } else if (e.ctrlKey && e.key === "Q") {
      debugCreateNewHistoryItem = !debugCreateNewHistoryItem;
      console.log(
        "⚠ debugCreateNewHistoryItem IS NOW",
        debugCreateNewHistoryItem,
      );
    } else return;
    // if (mode.sidebar === "component") mode.sidebar = "edit";
  }

  // const stopLogInterval = setInterval(() => {
  //   console.log("Focused element:", document.activeElement);
  // }, 1000);
  // onDestroy(() => clearInterval(stopLogInterval));

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
    }
  }

  type MutationIgnoreRecord = {
    node: Node;
    type: MutationRecord["type"];
    addedNodes?: MutationRecord["addedNodes"];
    removedNodes?: MutationRecord["removedNodes"];
    attributeName?: MutationRecord["attributeName"];
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

  const LOG_PATCH_SYNC = false;
  const LOG_DOC_HIST = true;
  const DO_PATCH_SYNC = false;

  // Also consider closing tags! They will change if the tag name of an element changes.
  //  However, there is no such mutation as "changing the tag name of an element"- that simply
  //  involves deleting and adding a new element.
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
  //  1- disallow non-element nodes as direct children of docEl
  //      AND enforce at least one element in the document
  //  2- try enforce no "collapsed" elements (that is, elements with 0 height and/or width),
  //    by making those that WOULD, take a single non-breaking space (&nbsp;) character as textContent
  //  3- check elements with only whitespace as text content if that white space could be removed
  //    and not have the element collapse (e.g. some CSS sets the height and width already), in which
  //    case remove that whitespace
  //  4- remove any last island of <br> child elements from elements that have only whitespace as text
  //    content. These <br>s do nothing (typically) for page flow or otherwise, and are just artefacts
  //    from the contentEditable process (in which there is no way for the user to delete them manually)
  //  5- sync the document to the database through patches to the HTML string
  //  6- update the undo stack, either adding a new state if another part of the editor asks for it,
  //      or merging into the current topmost state of the stack otherwise
  //  7- inform the CSS editor and Attribute editor about updates (especially those that don't originate
  //      from interacting with said editors).
  const { stop } = useMutationObserver(
    () => docEl,
    (unfilteredMutations) => {
      // console.log("mutation observer triggered", unfilteredMutations);

      const mutations: MutationRecord[] = [];
      for (const mutation of unfilteredMutations) {
        const target = mutation.target;
        // prettier-ignore
        const ignoreI = queuedMutationIgnores.findIndex((record) => {
          const addedNodesMatch = record.addedNodes ? record.addedNodes === mutation.addedNodes : true;
          const removedNodesMatch = record.removedNodes ? record.removedNodes === mutation.removedNodes : true;
          const attributeNameMatch = record.attributeName ? record.attributeName === mutation.attributeName : true;
          return record.node === target && record.type === mutation.type && addedNodesMatch && removedNodesMatch && attributeNameMatch;
        });
        if (ignoreI !== -1) {
          // console.log([...queuedMutationIgnores], mutation);
          queuedMutationIgnores.splice(ignoreI, 1);
        } else mutations.push(mutation);
      }

      for (const mutation of mutations) {
        const target = mutation.target;

        // 1)
        mutation.addedNodes.forEach((added) => {
          if (
            added.nodeType !== Node.ELEMENT_NODE &&
            added.parentElement === docEl
          )
            added.parentElement.removeChild(added);
        });
        request2AnimationFrames(() => {
          // console.log("Checking for empty document", docEl);
          if (docEl?.childElementCount === 0) {
            const div = document.createElement("div");
            div.innerHTML =
              "Without at least one node, it is impossible to add anything - as it relies on adding things RELATIVE to OTHER nodes.";
            docEl.appendChild(div);
          }
        });

        // 7) inform the CSS editor and Attribute editor about updates
        if (mutation.type === "attributes") {
          if (mutation.attributeName === "style")
            cssEditor?.syncElementInlineStyles(target);
          attributesEditor?.syncElementAttributes(target);
        }

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
          if (mode.cursor === "edit")
            getSelection()?.setBaseAndExtent(target, 0, target, 1);
        }
        // 3) We know this element has only whitespace- because of the early termination above-
        //     and so we're checking if the nbsp (or other) could be safely removed.
        if (el.innerText !== "") {
          // If the element's innerText is just a single nbsp character, that indicates
          //  the user would like this element to be empty, but we don't allow that
          //  unless the element has some non-zero area that could be hovered and selected.
          const undo = removeTextContent(el);
          if (el !== docEl) {
            const rect = el.getBoundingClientRect();
            if (rect.height * rect.width < 1) undo();
          } else {
            // The element we're trying to see is collapsed or not is the document container itself,
            //  which is guaranteed to stretch the screen height. Thus, for this element we see add heights
            //  of its immediate children instead.
            const children = Array.from(el.children);
            const avgArea = children
              .map((child) => {
                const rect = child.getBoundingClientRect();
                return (rect.height * rect.width) / children.length;
              })
              .reduce((p, c) => p + c, 0);
            if (avgArea < 1) undo();
          }
        }
      }

      if (patchSync === false && docEl) {
        console.log("Document loaded!");

        // [, htmlStr] = reconstructHTMLStr(docEl, false, 0, docNodes);
        [htmlStr] = reconstructHTMLString(
          docEl,
          {
            docNodes,
            docContainer: docEl,
          },
          false,
        );
        // console.log(docNodes);
        // console.log(htmlStr);

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
        collectedMutations.push(...processMutations(unfilteredMutations));
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

  const COMPONENT_DEBOUNCE_DURATION = 1000;
  const updateCompEditContent = useDebounce(
    () => {
      if (componentID === null || !docEl) return;
      const comp = comps.lib.find((comp) => comp.identName === componentID);
      if (!comp) return;
      updateCompEdit(componentID, generateCompContentStr(docEl, comp.name));
    },
    () => COMPONENT_DEBOUNCE_DURATION,
  );
  watch(
    () => comps.lib.find((comp) => comp.identName === componentID)?.name,
    (current, prev) => {
      if (current !== prev) updateCompEditContent();
    },
  );

  const patchInterval = setInterval(() => {
    if (!docEl || collectedMutations.length === 0) return;
    if (documentID === null) {
      collectedMutations = [];
      if (componentID !== null) {
        console.log("Debouncing component content edit.");
        updateCompEditContent();
      }
      return;
    }

    if (LOG_PATCH_SYNC)
      console.group(
        `Patch syncing ${collectedMutations.length} mutations:`,
        collectedMutations,
      );

    let patches: DocPatch[];
    [patches, stringPosForwardUpdateMap, stringPosBackwardUpdateMap, htmlStr] =
      patchMutations(
        collectedMutations,
        documentID,
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
          disableServerSync: !DO_PATCH_SYNC,
        },
      );

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
      console.log(
        "🎈 docHistory: ",
        structuredClone(historyManager.docHistory),
      );
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
      <EditText bind:this={editText} doc={docEl} />
      <NodeSelect {shiftPressed} doc={docEl} bind:this={nodeSelect} />
      <MultipleSelect bind:this={multipleSelect} />
      <AddNode doc={docEl} bind:this={addNode} />
      <MoveNodes doc={docEl} />
    {/if}

    <div class="doc w-3/4 max-w-[600px]" bind:this={docEl}>
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
