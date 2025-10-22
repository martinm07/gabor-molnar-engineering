import type {
  DocNodeEntry,
  DocNodeMap,
  DocPatchDom,
  StringPosNodeMap,
} from "./docsyncing";
import { nodesSelection } from "./store.svelte";
import { get } from "svelte/store";

export type DocHistoryStack = DocHistoryItem[];

// We could also sync the sidebarMode here, but I don't think that would be wanted (maybe it could be made an option in future)
type DocHistoryItem = {
  patches: DocPatchDom[];
  nodesSelection: number[] | null;
} & EditorCaret;

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
//  couldn't be mapped to a place in the old HTML string, it has to instead be mapped to its place in the new
//  HTML string. This is just the value it has before any mapping, so no mapping should be done.

export class HistoryManager {
  // The most recent history state is at index 0 in this array
  docHistory: DocHistoryStack = [];
  docHistActiveIndex: number = -1;

  // These mappings are readonly, because only docsyncing.ts should be updating them every event
  //  cycle, when there are new mutations.
  docNodes: ReadonlyMap<Node, DocNodeEntry>;
  stringPosNodeMap: ReadonlyMap<number, Node>;
  private prevStrPosForwardMap?: Map<number, number>;
  private prevStrPosNodeMapKeys?: ReadonlyArray<number>;
  debug: boolean;

  flagNewHistoryItem: boolean = false;
  flagHistoryStateChange: boolean = false;

  private claimedCaretState: EditorCaret = { focusArea: null };

  constructor(
    docNodes: DocNodeMap,
    stringPosNodeMap: StringPosNodeMap,
    opts?: { debug?: boolean },
  ) {
    this.docNodes = docNodes;
    this.stringPosNodeMap = stringPosNodeMap;
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

  addToHistoryStack(
    patches: DocPatchDom[],
    strPosForwardMap: Map<number, number>,
    strPosBackwardMap: Map<number, number>,
  ): [strPosForwardMap: Map<number, number>] {
    if (this.flagHistoryStateChange) {
      this.prevStrPosForwardMap = strPosForwardMap;
      this.prevStrPosNodeMapKeys = Array.from(this.stringPosNodeMap.keys());
      if (this.debug)
        console.log(
          "Skipping adding list of patches due to HistoryStateChange flag. Skipped:",
          patches,
        );
      return [strPosBackwardMap];
    }

    // Apply stringPosForwardUpdateMap to forwardstart values of patches
    //  (this is the same whether we're merging the patches, or creating a new history item)
    patches.forEach((patch) => {
      const mappedForwardStart = strPosForwardMap.get(patch.forwardstart);
      if (mappedForwardStart !== undefined) {
        patch.forwardstart = mappedForwardStart;
      } else {
        // This means there is no place for this node in the old HTML string. The consequences
        //  of this are discussed in top-level comments of this file, in (3).
        // The conclusion is that this patch has to keep its forwardStart, which is in terms of
        //  the latest HTML string. No modification is made.
        return;
      }
    });

    // Note that if we make an edit from a previous history state, this will always make that edit
    //  a new history item (along with splicing away all history states more recent),
    //  as that seems like more intuitive behaviour.
    if (
      this.flagNewHistoryItem ||
      this.docHistActiveIndex > 0 ||
      this.docHistory.length <= 1 // Add to the history stack if we need to create the initial state, or so that we never merge onto the initial state
    ) {
      if (this.debug) console.log("Adding a new item onto the history stack.");

      if (this.docHistActiveIndex > 0) {
        if (this.debug)
          console.log("Splicing newer history states from current state.");
        this.docHistory.splice(0, this.docHistActiveIndex);
      }

      this.docHistory.unshift({
        // We don't need to store patches in the initial history state stack item
        patches: this.docHistory.length > 0 ? patches : [],
        nodesSelection: this.generateNodeSelectionState(),
        ...this.claimedCaretState,
      });
      this.docHistActiveIndex = 0;

      const resetForwardMap: Map<number, number> = new Map();
      // The new BASE stringPos values are the ones referring to the version of the HTML string right before
      //  this set of patches was applied, since these are the first patches of the new history item,
      // UNLESS this is the first history item (which has no version of the HTML string "before")- the first
      //  history item gets special treatment :)
      if (this.docHistory.length === 1)
        this.stringPosNodeMap.forEach((_, key) =>
          resetForwardMap.set(key, key),
        );
      else {
        if (!this.prevStrPosNodeMapKeys)
          throw new Error(
            "prevStrPosNodeMapKeys is undefined even though this isn't the first history item",
          );
        this.prevStrPosNodeMapKeys.forEach((key) =>
          resetForwardMap.set(key, key),
        );
      }

      this.prevStrPosNodeMapKeys = Array.from(this.stringPosNodeMap.keys());
      this.prevStrPosForwardMap = strPosForwardMap;
      return [resetForwardMap];
    } else {
      if (this.debug)
        console.log(
          "Merging onto the history stack. Claimed caret state: ",
          this.claimedCaretState,
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
          const newMappedBackStart = this.prevStrPosForwardMap.get(
            patch.backStart,
          );
          if (newMappedBackStart === undefined) {
            // prettier-ignore
            console.error("Patch", patch, "had backStart value", patch.backStart, "not in prevStringPosForwardUpdateMap: ", this.prevStrPosForwardMap);
            throw new Error(
              "Failed mapping backStart value using previous stringPosForwardUpdateMap.",
            );
          }
          patch.backStart = newMappedBackStart;
          patch.mapBackStart = false;
        }
      });

      this.docHistory[0].patches.push(...patches);
      // TODO: Might want to NOT override caret state if we're overriding with null.
      //       Depends on what behaviour will be more intuitive.
      Object.assign(this.docHistory[0], this.claimedCaretState);

      this.docHistory[0].nodesSelection = this.generateNodeSelectionState();

      // IMP: Make sure any earlier returns in this function have a copy of this line.
      this.prevStrPosForwardMap = strPosForwardMap;
      this.prevStrPosNodeMapKeys = Array.from(this.stringPosNodeMap.keys());
      return [strPosForwardMap];
    }
  }

  claimCaretState(caretState: EditorCaret) {
    if (this.debug)
      console.log("Claimed the caret state! Setting it to: ", caretState);
    this.claimedCaretState = caretState;
  }

  suggestCreateNewHistoryItem() {
    if (this.debug) console.log("Flagged for new history item!");
    this.flagNewHistoryItem = true;
  }

  resetFlagsAndClaims() {
    this.claimedCaretState = { focusArea: null };
    this.flagNewHistoryItem = false;
    this.flagHistoryStateChange = false;
  }
}
