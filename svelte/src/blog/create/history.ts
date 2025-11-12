import { decode } from "he";
import type {
  DocNodeEntry,
  DocNodeMap,
  DocPatchDom,
  StringPosNodeMap,
} from "./docsyncing";
import { insertAfter } from "./helper";
import { nodesSelection } from "./store.svelte";
import { get } from "svelte/store";

export type DocHistoryStack = DocHistoryItem[];

// We could also sync the sidebarMode here, but I don't think that would be wanted (maybe it could be made an option in future)
type DocHistoryItem = {
  patches: DocPatchDom[];
  nodesSelection: number[] | null;
} & EditorCaret;

// TODO: Recovering other parts of the editor state, associating them with history state items
//       (currently, we just reset the selection whenever we undo or redo)

// The inclusion of "compName" | "compDesc" | "compTags" will also be accompied with fields for updating documents,
//  for the future when changes to these are included as part of the history stack (by having them sync with hidden elements
//  in the document body, allowing them to get picked up by the mutation observer and the rest of the pipeline).
type EditorCaret =
  | {
      focusArea: "css" | "tag" | "compName" | "compDesc" | "compTags";
      focusCaretStart: number;
      focusCaretEnd: number;
    }
  | {
      focusArea: "attr";
      focusAttrName: string;
      focusAttrField: "name" | "value";
      focusCaretStart: number;
      focusCaretEnd: number;
    }
  | {
      focusArea: "docText";
      focusNodeStringPos: number;
      focusCaretStart: number;
      focusCaretEnd: number;
    }
  | { focusArea: null };

export type HistoryStacksStore = { [id: string]: DocHistoryStack };

interface EditorHooks {
  resetSelection: () => any;
}

// --- 1) HOW HTML STRING POSITIONS STORED BY DOM PATCHES MUST BE MAPPED
// When a new set of patches is created, all of the stringPos values are in terms of the current (i.e. latest)
//  version of the HTML string.
// IF the set of patches is used to create a new history state, the values of backStart can be kept, while
//  the values of forwardStart must be mapped to the HTML string positions of the nodes when the document was
//  in its previous state. The forwardStart values that don't have a mapping should only be those for nodes that
//  were added by the new set of patches.
// IF the set of patches is used to merge into the current history state, then:
//  - for the patches being merged into, their values of forwardStart can be kept, while their values of
//     backStart must be mapped to the HTML string positions of the nodes in the document's new state
//  - for the patches we are merging, their values of backStart can be kept, while their values of
//     forwardStart must be mapped to the HTML string positions of the nodes when the document was in its
//     previous state.

// --- 2) HANDLING THE CASE WHERE A BACKSTART VALUE CAN'T BE MAPPED
// Let's say there is a patch to modify a node. When a new set of patches is merged in, this patch will
//  seek the new position of the node in the new HTML string (the new stringPos). However, it is possible
//  that the node has no place in the new HTML string, IF one of the recent patches removed the node.
// That means the patch is forced to keep its old stringPos value for the node.
// When we do later use the patches to try go backwards (i.e. perform an undo operation), first the patch
//  that removed the node will be used to add the node back in. This patch will have stored the stringPos of
//  the node that was required to be able to remove the node (when going in the forwards direction).
// From (1), we know that this
//  IS the position of the node in the HTML string from when the document was in its previous state.
// THUS, this must be the stringPos value stored by the earlier patch which modified this node; given that it
//       couldn't be mapped to a place in the new HTML string, it has to instead be mapped to what its place *was*
//       in the old HTML string (the HTML string from when the document was in its previous state).
// AND IF the node can't be mapped to what its place WAS in the old HTML string,
//        that means we must be referring to a node that was added in by one of the patches being merged into.
//        (1) patch adding node   (2) patch modifying node   (3) NEW patch removing node
//        Both (1) and (2) have backStart values that can't be mapped to the latest HTML string nor the base HTML string.
//        They refer to a node that was added and then removed in the same set of patches.
//     THUS we should map the backStart values in this case to a special value. Then, when undoing,
//        when we come to first using the patch that removed the node to add it back in,
//        we check if we'll be adding a node that has a place in the previous HTML string
//        (by checking if mapForwardStart is true), and if NOT, we DON'T add the node in.
//        Patches that later try to refer to this node we didn't add in will encounter the special value,
//        and will skip trying to apply those patches as well.

// --- 3) HANDLING THE CASE WHERE A FORWARDSTART VALUE CAN'T BE MAPPED
// Let's say there is a patch to modify a node, and it is being merged into another set of patches. This patch
//  will seek the old position of the node in the HTML string from when the document was in its previous state.
// However, it is possible that this node had no place in the old HTML string, because it was newly added by one
//  of the patches in the merged set.
// That means the patch is forced to keep its stringPos value, which refers to the latest HTML string.
// When we do later use the patches to try go forwards (i.e. perform a redo operation), first the patch that
//  added the node will be used to, well, add the node. This patch will have stored the stringPos of the node
//  that is required for it to be able to remove the node, when going backwards. This
// IS the position of the node in the latest HTML string.
// THUS, this must be the stringPos value stored by the later patch which modifies the node; given that it
//       couldn't be mapped to a place in the old HTML string, it has to instead be mapped to its place in the new
//       HTML string. This is just the value it has before any mapping, so no mapping should be done.
//    THOUGH ALSO, now that this forwardStart value is in terms of the latest HTML string, when new patches
//       are merged in these values should be mapped to keep up-to-date with the HTML string, exactly like
//       the backStart values are in the patches being merged into.
// AND IF the node referred to by forwardStart can't be mapped to its place in the new HTML string,
//        that means the latest set of patches removed the node. In other words,
//        the patch now refers to a node that has no place in neither the old HTML string nor the new HTML string.
//        (it refers to a node that was added and then removed in the same set of patches).
//        When these patches are actually used, we'll first encounter the patch that adds this "ephemeral node".
//        Its backStart value up until the last moment it was able to map it (the moment before the set of patches that removes it)
//        would be set in tempPosNodes. This is problematic though, as it's a stringPos value from an arbitrary version of the HTML string,
//        that may interfere or override with other entries in tempPosNodes from different arbitrary HTML string versions.
//     THUS instead, we should map these backStart values to a special value. Then, when redoing,
//        when we come to first applying the patch that adds the node,
//        we check if we'll be adding a node that has a place in the next HTML string
//        (by checking if mapBackStart is true), and if NOT, we DON'T add the node in.
//        Patches that later try to refer to this node we didn't add in will encounter the special value,
//        and will skip trying to apply those patches as well.

const WAIT_NEW_HISTORY_ITEM_MS = 2000;

export class HistoryManager {
  // The most recent history state is at index 0 in this array
  docHistory: DocHistoryStack = [];
  docHistActiveIndex: number = -1;

  // These mappings are readonly, because only docsyncing.ts should be updating them every event
  //  cycle, when there are new mutations.
  docNodes: ReadonlyMap<Node, DocNodeEntry>;
  posNodes: ReadonlyMap<number, Node>;
  private prevStrPosForwardMap?: Map<number, number>;
  private prevPosNodes: ReadonlyMap<number, Node> = new Map();
  debug: boolean;

  flagSuggestNewHistoryItem: boolean = false;
  flagForceNewHistoryItem: boolean = false;
  flagHistoryStateChange: boolean = false;
  newHistoryItemTimeout?: NodeJS.Timeout;

  private claimedCaretState: EditorCaret = { focusArea: null };
  private editorHooks: EditorHooks;

  constructor(
    docNodes: DocNodeMap,
    stringPosNodeMap: StringPosNodeMap,
    editorHooks: EditorHooks,
    opts?: { debug?: boolean },
  ) {
    this.docNodes = docNodes;
    this.posNodes = stringPosNodeMap;
    this.editorHooks = editorHooks;
    this.debug = Boolean(opts?.debug);
  }

  /**
   * @returns The nodes in the current selection made by the editor (if there is any),
   *           mapped to its integer index in the HTML string, according to this.docNodes.
   *           This is a serializable identity for every node.
   */
  private generateNodeSelectionState() {
    const newNodesSelection = get(nodesSelection)
      .map((node) => {
        const nodePos = this.docNodes.get(node)?.stringPos;
        if (nodePos === undefined)
          // prettier-ignore
          console.error(
            "There was a node not in the selection not in docNodes while adding to the history stack.\nNode:",
            node, "docNodes:", this.docNodes,
          );
        return nodePos;
      })
      .filter((pos) => pos !== undefined);
    return newNodesSelection;
  }

  private clonePosNodes(): typeof this.posNodes {
    const newPosNodes: StringPosNodeMap = new Map();
    this.posNodes.forEach((node, stringPos) => {
      newPosNodes.set(stringPos, node);
    });
    return newPosNodes;
  }

  private mapForwardStartVals(
    patches: DocPatchDom[],
    forwardMap: Map<number, number>,
    prevForwardMap?: Map<number, number>,
  ) {
    this.log(
      "💙 Mapping forwardStart vals using forwardMap:",
      forwardMap,
      "and prevForwardMap:",
      prevForwardMap,
    );
    // Apply stringPosForwardUpdateMap to forwardstart values of patches
    //  (this is the same whether we're merging the patches, or creating a new history item)
    patches.forEach((patch) => {
      // Patches which remove nodes are in terms of the previous HTML string
      //  (where they have a non-0 length and thus unique stringPos), so we use prevStrPosForwardMap to map them
      const mappedForwardStart = (
        patch.type.includes("remove") ? prevForwardMap : forwardMap
      )?.get(patch.forwardStart);

      if (mappedForwardStart !== undefined) {
        this.log(
          `💙 ▶▶▶ Mapped forward start. "${patch.forwardStart}" -> "${mappedForwardStart}"`,
        );
        patch.forwardStart = mappedForwardStart;
      } else {
        // This means there is no place for this node in the old HTML string. The consequences
        //  of this are discussed in top-level comments of this file, in (3).
        // The conclusion is that this patch has to keep its forwardStart, which is in terms of
        //  the latest HTML string. No modification is made.
        patch.mapForwardStart = false;
        this.log(
          `💙 ▶▶▶ Didn't map forward start. "${patch.forwardStart}" remains in:`,
          patch,
        );
        return;
      }
    });
  }

  addToHistoryStack(
    patches: DocPatchDom[],
    strPosForwardMap: Map<number, number>,
    strPosBackwardMap: Map<number, number>,
  ): [strPosForwardMap: Map<number, number>] {
    if (this.flagHistoryStateChange) {
      this.prevStrPosForwardMap = strPosForwardMap;
      // this.prevStrPosNodeMapKeys = Array.from(this.posNodes.keys());
      this.prevPosNodes = this.clonePosNodes();
      if (this.debug)
        console.groupCollapsed(
          "%c Skipping adding list of patches due to HistoryStateChange flag. Skipped:",
          "color: gray;",
          patches,
        );
      return [strPosForwardMap];
    }

    // Check if the patches actually change anything
    if (
      patches.every((patch) => patch.forwardValue === patch.backValue) &&
      this.docHistory.length !== 0
    ) {
      if (this.debug)
        console.groupCollapsed(
          "%c Skipping adding list of patches due to patches not changing anything. Skipped",
          "color: gray;",
          patches,
        );
      return [strPosForwardMap];
    }

    if (this.debug)
      console.groupCollapsed(
        `Adding to the history stack ${patches.length} patch/es.`,
      );

    clearInterval(this.newHistoryItemTimeout);
    this.newHistoryItemTimeout = setTimeout(() => {
      console.log(
        `WAITED ${WAIT_NEW_HISTORY_ITEM_MS}ms - FORCING NEW HISTORY ITEM`,
      );
      this.flagForceNewHistoryItem = true;
    }, WAIT_NEW_HISTORY_ITEM_MS);

    // Note that if we make an edit from a previous history state, this will always make that edit
    //  a new history item (along with splicing away all history states more recent),
    //  as that seems like more intuitive behaviour.
    if (
      this.flagForceNewHistoryItem ||
      this.flagSuggestNewHistoryItem ||
      this.docHistActiveIndex > 0 ||
      this.docHistory.length <= 1 // Add to the history stack if we need to create the initial state, or so that we never merge onto the initial state
    ) {
      this.log("Adding a new item onto the history stack.");
      this.flagForceNewHistoryItem = false;

      if (this.docHistActiveIndex > 0) {
        this.log("Splicing newer history states from current state.");
        this.docHistory.splice(0, this.docHistActiveIndex);
      }

      const resetForwardMap: Map<number, number> = new Map();
      this.prevStrPosForwardMap = new Map();
      // The new BASE stringPos values are the ones referring to the version of the HTML string right before
      //  this set of patches was applied, since these are the first patches of the new history item,
      // UNLESS this is the first history item (which has no version of the HTML string "before")- the first
      //  history item gets special treatment :)
      if (this.docHistory.length === 0)
        this.posNodes.forEach((_, key) => {
          resetForwardMap.set(key, key);
          this.prevStrPosForwardMap!.set(key, key);
        });
      else {
        this.prevPosNodes.forEach((node, oldStringPos) => {
          this.prevStrPosForwardMap!.set(oldStringPos, oldStringPos);

          const newStringPos = this.docNodes.get(node)?.stringPos;
          if (newStringPos === undefined) {
            // This refers to a node that doesn't have a place in the new HTML string; skip mapping it
            return;
          }
          resetForwardMap.set(newStringPos, oldStringPos);
        });
      }

      this.log("🧡 RESET stringPosForwardUpdateMap", resetForwardMap);
      this.mapForwardStartVals(
        patches,
        resetForwardMap,
        this.prevStrPosForwardMap,
      );

      this.docHistory.unshift({
        // We don't need to store patches in the initial history state stack item
        patches: this.docHistory.length > 0 ? patches : [],
        nodesSelection: this.generateNodeSelectionState(),
        ...this.claimedCaretState,
      });
      this.docHistActiveIndex = 0;

      this.prevPosNodes = this.clonePosNodes();
      return [resetForwardMap];
    } else {
      this.log(
        "Merging onto the history stack. Claimed caret state: ",
        this.claimedCaretState,
      );

      // Apply stringPosForwardUpdateMap to forwardStart values of the patches that we are adding to the history stack
      this.mapForwardStartVals(
        patches,
        strPosForwardMap,
        this.prevStrPosForwardMap,
      );

      // Apply stringPosBackwardUpdateMap to backStart values of the patches that are being merged into
      this.docHistory[0].patches.forEach((patch) => {
        // This patch has already failed to be mapped to a latest HTML string once, and so has
        //  been mapped to the HTML string from when the document was in its previous state.
        // stringPos values are guaranteed to be unique when they all refer to the same HTML string,
        //  but not when they refer to different HTML strings, so we make sure to early-return here
        //  to avoid accidental mapping of this node to an unrelated node in the new HTML string.
        if (!patch.mapBackStart) return;

        const mappedBackStart = strPosBackwardMap.get(patch.backStart);
        if (mappedBackStart !== undefined) {
          patch.backStart = mappedBackStart;
        } else {
          // The node referred to in this patch has no place in the new HTML string.
          // That means it was removed by a patch in the provided `patches`. That patch will
          //  give a recovered version of this node a stringPos from the HTML string from
          //  when the document was in its previous state.
          // We can map to that value using the forwardUpdateMap which mapped OLD stringPos values
          //  to the BASE stringPos values. The provided forwardUpdateMap maps NEW string Pos values; the
          //  *previously* provided forwardUpdateMap mapped OLD stringPos values.
          // Note this is safe (as in, a previous forwardUpdateMap will exist) because a call which merges
          //  onto existing history state can never be the first call of this function (the first call must
          //  add a state, onto an empty stack).
          // IMP: If document history is saved in a persistent storage solution, storage of
          //       prevStringPosForwardUpdateMap may also be required.
          if (!this.prevStrPosForwardMap)
            throw new Error(
              "Got call to merge onto history stack with prevStringPosForwardUpdateMap undefined.",
            );
          let newMappedBackStart = this.prevStrPosForwardMap.get(
            patch.backStart,
          );

          if (newMappedBackStart === undefined) {
            this.warn(
              "Setting backStart value that couldn't be mapped using the backwardMap nor the previous forwardMap to -2",
            );
            newMappedBackStart = -2;
          }

          patch.backStart = newMappedBackStart;
          patch.mapBackStart = false;
        }
      });

      // Refer to the end of 3) in the top-level comment for an explanation
      // Essentially, we're updating all the forwardStart values that refer to the latest HTML string
      //  along with the backStart values that refer to the latest HTML string.
      this.docHistory[0].patches.forEach((patch) => {
        if (patch.mapForwardStart) return;

        if (patch.forwardStart === -2) {
          this.log(
            "Skipping mapping forwardStart to latest HTML string because forwardStart is -2",
          );
          return;
        }

        const mappedForwardStart = strPosBackwardMap.get(patch.forwardStart);
        if (mappedForwardStart !== undefined) {
          this.log(
            `Mapping forwardStart to the latest HTML string using strPosBackwardMap: "${patch.forwardStart}" -> "${mappedForwardStart}" on patch`,
            patch,
          );
          patch.forwardStart = mappedForwardStart;
        } else {
          this.warn(
            `Was unable to map forwardStart to latest HTML string using strPosBackwardMap. Assuming that this is because the latest set of patches removed the node being referred to`,
          );
          patch.forwardStart = -2;
        }
      });

      this.docHistory[0].patches.push(...patches);
      // TODO: Might want to NOT override caret state if we're overriding with null.
      //       Depends on what behaviour will be more intuitive.
      Object.assign(this.docHistory[0], this.claimedCaretState);

      this.docHistory[0].nodesSelection = this.generateNodeSelectionState();

      // IMP: Make sure any earlier returns in this function have a copy of this line.
      this.prevStrPosForwardMap = strPosForwardMap;
      this.prevPosNodes = this.clonePosNodes();
      return [strPosForwardMap];
    }
  }

  claimCaretState(caretState: EditorCaret) {
    this.log("Claimed the caret state! Setting it to: ", caretState);
    this.claimedCaretState = caretState;
  }

  suggestCreateNewHistoryItem() {
    if (!this.flagSuggestNewHistoryItem)
      this.log("✨✨✨ Flagged for new history item!");
    this.flagSuggestNewHistoryItem = true;
  }

  resetFlagsAndClaims() {
    this.claimedCaretState = { focusArea: null };
    this.flagSuggestNewHistoryItem = false;
    this.flagHistoryStateChange = false;
  }

  private parseHTMLFragment(htmlStr: string): Node[] {
    // A <template> element is efficient, because the content is inert;
    //  scripts don't run, images don't load.
    // The other option for this behaviour was using (new DOMParser()).parseFromString(htmlStr, "text/xml")
    // "text/html" produces a HTML document starting with a root <html> node, which is not what we want.
    // "text/xml", meanwhile, doesn't handle bare Text nodes.
    const template = document.createElement("template");
    template.innerHTML = htmlStr;
    return Array.from(template.content.childNodes);
  }

  private removeNode(referredNode: Node, patch: DocPatchDom) {
    if (!referredNode.isConnected) {
      console.warn(
        "The node is already removed from the DOM: ",
        referredNode,
        "by patch:",
        patch,
      );
      return;
    }
    const parent = referredNode.parentNode;
    if (!parent)
      throw new Error(
        "referredNode didn't have parent despite being connected",
      );
    parent.removeChild(referredNode);
  }

  private addNode(referredNode: Node, value: string, patch: DocPatchDom) {
    const newNodes = this.parseHTMLFragment(value);

    if (newNodes.length === 0) console.warn(`Added nothing from "${value}"`);

    if (patch.type === "addFirstChild" || patch.type === "removeFirstChild") {
      if (!(referredNode instanceof Element)) {
        console.error("referredNode:", referredNode);
        throw new Error(
          "referredNode was not an element while trying to insert node as its first child.",
        );
      }
      newNodes.toReversed().forEach((node) => referredNode.prepend(node));
    } else if (
      patch.type === "addNextSibling" ||
      patch.type === "removeNextSibling"
    ) {
      newNodes.toReversed().forEach((node) => insertAfter(referredNode, node));
    } else {
      throw new Error("Unexpected value for patch.type");
    }

    // TODO: How should this case be properly handled?
    // ANSWER: This scenario should in fact be impossible! processMutations() in `docsyncing.ts`
    //          ensures that we're only ever adding (or removing) one node at a time.
    if (newNodes.length > 1)
      console.warn(
        `ADDED MORE THAN ONE NODE AT ONCE.\ntempPosNodes WILL ONLY MAP THE PATCH'S backStart VALUE FOR THE FIRST NODE.`,
      );
    return newNodes;
  }

  private setAttributes(referredNode: Node, value: string, patch: DocPatchDom) {
    const newNode = this.parseHTMLFragment(value).at(0);
    if (!newNode || !(newNode instanceof Element))
      throw new Error(`Could not parse string "${value}" as a single element.`);
    if (!(referredNode instanceof Element)) {
      console.error("referredNode: ", referredNode, "for patch:", patch);
      throw new Error(
        "referredNode was not an element for a patch modifying attributes.",
      );
    }
    const allAttrs = Array.from(newNode.attributes);
    // Remove all attributes from referredNode
    while (referredNode.attributes.length > 0)
      referredNode.removeAttribute(referredNode.attributes[0].name);
    // Set all the attributes parsed from `value` onto referredNode
    allAttrs.forEach((attr) => {
      referredNode.setAttribute(
        attr.name,
        decode(attr.value, { isAttributeValue: true }),
      );
    });
  }

  private setCharacterData(referredNode: Node, value: string) {
    if (referredNode instanceof Element)
      console.warn("characterData is an element in a characterData patch.");
    referredNode.textContent = decode(value);
  }

  redo() {
    this.log(
      `🎈🎈🎈 Attempting Redo! Going from index ${this.docHistActiveIndex} -> ${this.docHistActiveIndex - 1}`,
    );
    if (this.docHistActiveIndex === 0) {
      this.log("Not redoing because we're at the latest state.");
      return;
    }

    // const tempDocNodes: DocNodeMap = new Map();
    const tempPosNodes: Map<number, Node> = new Map();

    const patches = this.docHistory[this.docHistActiveIndex - 1].patches;
    for (let i = 0; i < patches.length; i++) {
      const patch = patches[i];

      let referredNode: Node | undefined;

      if (patch.forwardStart === -1) {
        this.warn(
          "Encountered forwardStart value of -1; assuming this is for adding a node at the top of the document",
        );
        // Set referredNode to the element containing the entire document. The add type should also already be "FirstChild"
        referredNode = this.posNodes.get(0)?.parentNode ?? undefined;
      } else if (patch.forwardStart === -2 && !patch.mapForwardStart) {
        this.log(
          "Encountered forwardStart of -2; skipping applying the patch.",
        );
        continue;
      } else {
        referredNode = patch.mapForwardStart
          ? this.posNodes.get(patch.forwardStart)
          : tempPosNodes.get(patch.forwardStart);
      }

      if (!referredNode) {
        console.error(
          "posNodes:",
          this.posNodes,
          "tempPosNodes:",
          tempPosNodes,
        );
        if (patch.forwardStart === -1)
          throw new Error(`Could not resolve forwardStart value of -1`);
        else
          throw new Error(
            `Could not resolve forwardStart value "${patch.forwardStart}" using ${patch.mapForwardStart ? "posNodes" : "tempPosNodes"}.`,
          );
      }

      this.log(
        `▶▶▶ (${i}) Redo - perform "${patch.type}" from node at "${patch.forwardStart}":`,
        referredNode,
      );

      switch (patch.type) {
        case "addFirstChild":
        case "addNextSibling":
          // If mapBackStart is false, that means we'd be adding a node which has no place in the latest HTML string,
          //  likely because it'll be removed by a later patch in the set. We must skip adding this "ephemeral node" in the first place.
          if (!patch.mapBackStart) {
            this.warn(
              "Skipping adding node because mapBackStart is false, assuming this to mean that the node would just be removed by a later patch in the set.",
            );
            break;
          }

          const newNodes = this.addNode(
            referredNode,
            patch.forwardValue,
            patch,
          );
          // We are adding the node going forwards, so we're removing the node going backwards,
          //  and so backStart refers to the node itself (whereas forwardStart refers to the node before).
          tempPosNodes.set(patch.backStart, newNodes[0]);
          this.log(
            "Adding new entry to tempPosNodes from patch",
            patch,
            "to node",
            newNodes[0],
          );
          break;
        case "removeFirstChild":
        case "removeNextSibling":
          this.removeNode(referredNode, patch);
          break;
        case "attributes":
          this.setAttributes(referredNode, patch.forwardValue, patch);
          break;
        case "characterData":
          this.setCharacterData(referredNode, patch.forwardValue);
          break;
      }
    }

    this.editorHooks.resetSelection();

    this.docHistActiveIndex--;
    this.flagHistoryStateChange = true;
  }

  undo() {
    this.log(
      `🎈🎈🎈 Attempting Undo! Going from index ${this.docHistActiveIndex} -> ${this.docHistActiveIndex + 1}`,
    );
    if (this.docHistActiveIndex === this.docHistory.length - 1) {
      this.log("Not undoing because we're at the base state.");
      return;
    }

    const tempPosNodes: Map<number, Node> = new Map();

    const patches = this.docHistory[this.docHistActiveIndex].patches;

    if (patches.some((patch) => patch.backValue === null))
      throw new Error(
        "Cannot undo with backValue being null in DocPatchDom objects.",
      );

    // We go through the patches in the reverse order
    for (let i = patches.length - 1; i >= 0; i--) {
      const patch = patches[i];

      let referredNode: Node | undefined;

      // If backStart is -1, then docsyncing.ts handleNodeRemove couldn't find a node in the map which preceded the node being removed.
      //  This can happen when the node being removed is the topmost element of the document (i.e. the one at index 0)
      if (patch.backStart === -1) {
        this.warn(
          "Encountered backStart value of -1; assuming this is for adding a node at the top of the document",
        );
        // Set referredNode to the element containing the entire document. The remove type should also already be "FirstChild"
        referredNode = this.posNodes.get(0)?.parentNode ?? undefined;
      } else if (patch.backStart === -2) {
        this.log(
          "Encountered backStart value of -2; skipping applying the patch",
        );
        continue;
      } else {
        referredNode = patch.mapBackStart
          ? this.posNodes.get(patch.backStart)
          : tempPosNodes.get(patch.backStart);
      }

      if (!referredNode) {
        console.error(
          "posNodes:",
          this.posNodes,
          "tempPosNodes:",
          tempPosNodes,
        );
        if (patch.backStart === -1)
          throw new Error(`Could not resolve backStart value of -1`);
        else
          throw new Error(
            `Could not resolve backStart value "${patch.backStart}" using ${patch.mapBackStart ? "posNodes" : "tempPosNodes"}`,
          );
      }

      this.log(
        `▶▶▶ (${i}) Undo - perform "${patch.type}" from node at "${patch.backStart}":`,
        referredNode,
      );

      switch (patch.type) {
        case "addFirstChild":
        case "addNextSibling":
          // --- We must REMOVE this node (since we are going backwards)
          this.removeNode(referredNode, patch);
          break;
        case "removeFirstChild":
        case "removeNextSibling":
          // --- We must ADD this node (since we are going backwards)

          // If mapForwardStart is false, that means we'd be adding back in a node which has no place in the previous HTML string (which is what we're recovering),
          //  likely because it'll be removed by a later patch in the set. We must skip adding this "ephemeral node" in the first place.
          if (!patch.mapForwardStart) {
            this.warn(
              "Skipping adding node because mapForwardStart is false, assuming this to mean that the node would just be removed by a later patch in the set.",
            );
            break;
          }

          const newNodes = this.addNode(referredNode, patch.backValue!, patch);
          // We are removing the node going forwards, and so forwardStart refers to the node itself
          //  (whereas backStart refers to the node before).
          tempPosNodes.set(patch.forwardStart, newNodes[0]);
          break;
        case "attributes":
          this.setAttributes(referredNode, patch.backValue!, patch);
          break;
        case "characterData":
          this.setCharacterData(referredNode, patch.backValue!);
          break;
      }
    }

    this.editorHooks.resetSelection();

    this.docHistActiveIndex++;
    this.flagHistoryStateChange = true;
  }

  private log(message?: any, ...optionalParams: any[]) {
    if (this.debug) console.log(message, ...optionalParams);
  }

  private warn(message?: any, ...optionalParams: any[]) {
    if (this.debug) console.warn(message, ...optionalParams);
  }
}
