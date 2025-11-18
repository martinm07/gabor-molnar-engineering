import { decode, encode } from "he";
import {
  reconstructHTMLString,
  type DocNodeEntry,
  type DocNodeMap,
  type DocPatchDom,
  type StringPosNodeMap,
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

type EphemeralNodeMapEntry = {
  posPreceding: number;
  addType: "nextSibling" | "firstChild";
  useDefaultMap: boolean;
};

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

const WAIT_NEW_HISTORY_ITEM_MS = 5000;

export class HistoryManager {
  // The most recent history state is at index 0 in this array
  docHistory: DocHistoryStack = [];
  docHistActiveIndex: number = -1;

  // These mappings are readonly, because only docsyncing.ts should be updating them every event
  //  cycle, when there are new mutations.
  docNodes: ReadonlyMap<Node, DocNodeEntry>;
  posNodes: ReadonlyMap<number, Node>;
  getDocContainer: () => HTMLElement | undefined;
  private prevStrPosForwardMap?: Map<number, number>;
  private prevPosNodes: ReadonlyMap<number, Node> = new Map();
  private prevNodeAddLocs: number[] = [];
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
    getDocContainer: () => HTMLElement | undefined,
    editorHooks: EditorHooks,
    opts?: { debug?: boolean },
  ) {
    this.docNodes = docNodes;
    this.posNodes = stringPosNodeMap;
    this.getDocContainer = getDocContainer;
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

  static handleEphemeralAddOrRemovePatch(
    startOffset: number,
    patchContents: string,
    subPos: number[],
    checkMap: Map<number, number>,
    childrenUseDefaultMap: boolean,
  ): [
    mainEphemeral: boolean,
    newEntries: Map<number, EphemeralNodeMapEntry>,
    newPatchContents: string,
  ] {
    const ephemeralNodeMapOut: Map<number, EphemeralNodeMapEntry> = new Map();

    const isOpening = (x: string) => /^<[^\/].*>$/.test(x);
    const isClosing = (x: string) => /^<\/.*>$/.test(x);

    // NOTE: We rely on subPos already being in the order from least to greatest (and it should already be)
    //        so that we process child nodes in the canonical document order.
    // subPos.sort((a, b) => a - b);

    // Add in the 0 test offset, and filter out offsets from subPos for encasing closing tags
    const testOffsets = [0, ...subPos].filter(
      (startIndex, i, arr) =>
        !isClosing(patchContents.slice(startIndex, arr[i + 1])),
    );

    const getNextOffset = (offset: number): number => {
      const i = subPos.indexOf(offset);
      if (i === subPos.length - 1) return patchContents.length;
      else return subPos[i + 1];
    };

    const getTotalLen = (offset_: number, str_: string) => {
      let totalLen = getNextOffset(offset_) - offset_;
      let leftToClose = isOpening(str_.slice(offset_, getNextOffset(offset_)))
        ? 1
        : 0;
      while (leftToClose > 0) {
        const currentOffset = offset_ + totalLen;
        const nextOffset = getNextOffset(currentOffset);
        totalLen += nextOffset - currentOffset;
        const strFragment = str_.slice(currentOffset, nextOffset);
        if (isOpening(strFragment)) leftToClose++;
        else if (isClosing(strFragment)) leftToClose--;
      }
      return totalLen;
    };

    const spliceInfo: { start: number; len: number }[] = [];

    for (const offset of testOffsets) {
      const testPos = offset + startOffset;
      if (checkMap.get(testPos) === undefined) {
        if (offset === 0) {
          return [true, ephemeralNodeMapOut, patchContents];

          // We ignore childNodes which already have a parent processed as an ephemeral node
        } else if (
          !spliceInfo.some(
            ({ start, len }) => offset >= start && offset < start + len,
          )
        ) {
          // The offset of the previous "thing", whether that's an opening tag, closing tag, or text node
          const prevOffset = [0, ...subPos][subPos.indexOf(offset)];
          const addType = isOpening(patchContents.slice(prevOffset, offset))
            ? "firstChild"
            : "nextSibling";

          // prettier-ignore
          console.log("offset: ", offset, "prevOffset: ", prevOffset, "subPos:", subPos, "startOffset:", startOffset);

          const prevNodeStart = testOffsets[testOffsets.indexOf(offset) - 1];

          if (!ephemeralNodeMapOut.get(prevNodeStart + startOffset)) {
            ephemeralNodeMapOut.set(testPos, {
              posPreceding: prevNodeStart + startOffset,
              addType,
              useDefaultMap: childrenUseDefaultMap,
            });
          } else {
            // The posPreceding for this ephemeral node is itself an ephemeral node. We keep stealing the entries of successively preceding ephemeral nodes
            //  until we get one which has a posPreceding value that refers to a REAL node.
            let stolenEntry = ephemeralNodeMapOut.get(
              prevNodeStart + startOffset,
            )!;
            while (true) {
              const newStolenEntry = ephemeralNodeMapOut.get(
                stolenEntry.posPreceding,
              );
              if (!newStolenEntry) break;
              stolenEntry = newStolenEntry;
            }
            // prettier-ignore
            console.log(`STOLE EPHEMERALNODEMAP ENTRY OF PRECEDING NODE. From posProceding "${prevNodeStart + startOffset}" to "${stolenEntry.posPreceding}".`);

            ephemeralNodeMapOut.set(testPos, stolenEntry);
          }

          spliceInfo.push({
            start: offset,
            len: getTotalLen(offset, patchContents),
          });
        }
      }
    }

    // Sort from highest start index/offset first, to lowest
    spliceInfo.sort((a, b) => b.start - a.start);

    spliceInfo.forEach(
      ({ start, len }) =>
        (patchContents =
          patchContents.slice(0, start) + patchContents.slice(start + len)),
    );

    return [false, ephemeralNodeMapOut, patchContents];
  }

  private mapForwardStartVals(
    patches: DocPatchDom[],
    forwardMap: Map<number, number>,
    prevForwardMap?: Map<number, number>,
    prevNodeAddLocs?: number[],
    startI?: number,
  ) {
    this.log(
      "💙 Mapping forwardStart vals using forwardMap:",
      forwardMap,
      "and prevForwardMap:",
      prevForwardMap,
    );
    // Apply stringPosForwardUpdateMap to forwardstart values of patches
    //  (this is the same whether we're merging the patches, or creating a new history item)
    patches.forEach((patch, i_) => {
      const i = startI === undefined ? "null" : startI + i_;

      if (
        patch.type.startsWith("remove") &&
        prevNodeAddLocs?.includes(patch.forwardStart)
      ) {
        this.log(
          `💙 ▶▶▶ ${i}: Didn't map forwardStart value "${patch.forwardStart}" for remove-type patch, since it had a match in prevNodeAddLocs. Assuming this to mean the node is ephemeral.`,
          patch,
          "prevNodeAddLocs:",
          prevNodeAddLocs,
        );
        patch.mapForwardStart = false;
        return;
      }

      // Patches which remove nodes are in terms of the previous HTML string
      //  (where they have a non-0 length and thus unique stringPos), so we use prevStrPosForwardMap to map them
      const mappedForwardStart = (
        patch.type.startsWith("remove") ? prevForwardMap : forwardMap
      )?.get(patch.forwardStart);

      if (mappedForwardStart !== undefined) {
        this.log(
          `💙 ▶▶▶ ${i}: Mapped forward start. "${patch.forwardStart}" -> "${mappedForwardStart}"`,
        );
        patch.forwardStart = mappedForwardStart;
      } else if (patch.forwardStart === -1) {
        // We don't map -1, but we also don't say it "doesn't have a place in the old HTML string",
        //  by setting `patch.mapForwardStart = false;`
        this.log(`💙 ▶▶▶ ${i}: Skipped forward start value of "-1"`, patch);
        return;
      } else {
        // This means there is no place for this node in the old HTML string. The consequences
        //  of this are discussed in top-level comments of this file, in (3).
        // The conclusion is that this patch has to keep its forwardStart, which is in terms of
        //  the latest HTML string. No modification is made.
        patch.mapForwardStart = false;
        this.log(
          `💙 ▶▶▶ ${i}: Didn't map forward start. "${patch.forwardStart}" remains in:`,
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
      this.prevNodeAddLocs = [];
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
      this.log(
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
        [],
        0,
      );

      this.docHistory.unshift({
        // We don't need to store patches in the initial history state stack item
        patches: this.docHistory.length > 0 ? patches : [],
        nodesSelection: this.generateNodeSelectionState(),
        ...this.claimedCaretState,
      });
      this.docHistActiveIndex = 0;

      this.prevStrPosForwardMap = resetForwardMap;
      this.prevNodeAddLocs = patches
        .filter((patch) => patch.type.startsWith("add"))
        .map((patch) => patch.backStart);
      this.prevPosNodes = this.clonePosNodes();
      return [resetForwardMap];
    } else {
      this.log(
        "Merging onto the history stack. Merging:",
        structuredClone(patches),
      );

      // Maps "last known position" of the ephemeral node to the position of the node BEFORE it, as well as if
      //  the ephemeral node was the first child to, or next sibling of, said node, as well as whether the reference
      //  to said node is in the base HTML string or the new HTML string.

      /** Maps the "last known position" of an ephemeral node to information about the node preceding it when redoing- i.e. for fixing forwardStart values. */
      const ephemeralNodeForwardMap: Map<number, EphemeralNodeMapEntry> =
        new Map();
      /** Maps the "last known position" of an ephemeral node to information about the node preceding it when undoing- i.e. for fixing backStart values. */
      const ephemeralNodeBackMap: Map<number, EphemeralNodeMapEntry> =
        new Map();

      // Refer to the end of 3) in the top-level comment for an explanation
      // Essentially, we're updating all the forwardStart values that refer to the latest HTML string
      //  (because they couldn't be mapped to the previous version of the HTML string,
      //   presumably because the node is added by the set of patches currently being worked on).
      // This function is called once for every patch in the set being merged into (i.e. treating
      //  these forwardStart values exactly as backStart values; they need to keep being updated to the latest HTML string).
      const handleBackMappedForwardStarts = (patch: DocPatchDom, i: number) => {
        if (patch.mapForwardStart) return;

        if (patch.forwardStart === -2) {
          this.log(
            `${i}: Skipping mapping forwardStart to latest HTML string because forwardStart is -2`,
          );
          return;
        }

        const mappedForwardStart = strPosBackwardMap.get(patch.forwardStart);
        if (mappedForwardStart !== undefined) {
          this.log(
            `${i}: Mapping forwardStart to the latest HTML string using strPosBackwardMap: "${patch.forwardStart}" -> "${mappedForwardStart}" on patch`,
            patch,
          );
          patch.forwardStart = mappedForwardStart;
        } else {
          // This forwardStart, which in the first place couldn't be mapped to the base HTML string, can't be mapped to
          //  the latest HTML string either. That makes it an ephemeral node.

          this.warn(
            `${i}: Was unable to map forwardStart ${patch.forwardStart} to latest HTML string using strPosBackwardMap. Assuming that this is because the latest set of patches removed the node being referred to. Patch:`,
            patch,
            "strPosBackwardMap:",
            strPosBackwardMap,
          );
          if (patch.type.startsWith("add")) {
            // This patch has a forwardStart adding a node, either as the first child of, or next sibling to, an ephemeral node.
            // We still want to be able to add this node despite never adding the ephemeral node (because we can't).
            // Thus, we populate a map as we process the nodes which maps the "last known index" of the ephemeral node to the
            //  node which preceded IT (through reading the patch which adds the ephemeral node in the first place, done in handleForwardMappedBackStarts).

            const newForwardStart = ephemeralNodeForwardMap.get(
              patch.forwardStart,
            );

            if (newForwardStart === undefined) {
              console.error(
                `${i}: forwardStart value of add-type referred to an ephemeral node, not in ephemeralNodeForwardMap:`,
                ephemeralNodeForwardMap,
                "patch:",
                patch,
              );
              patch.forwardStart = -2;
            } else {
              this.log(
                `${i}: Mapped "${patch.forwardStart}" -> "${newForwardStart.posPreceding}" and "${patch.type}" -> "${newForwardStart.addType}" and mapForwardStart "${patch.mapForwardStart}" -> "${newForwardStart.useDefaultMap}" using ephemeralNodeMap:`,
                ephemeralNodeForwardMap,
              );
              patch.forwardStart = newForwardStart.posPreceding;

              if (newForwardStart.addType === "nextSibling")
                patch.type = "addNextSibling";
              if (newForwardStart.addType === "firstChild")
                patch.type = "addFirstChild";

              patch.mapForwardStart = newForwardStart.useDefaultMap;
            }
          } else {
            patch.forwardStart = -2;
          }
        }
      };

      // Called at most once for a given patch, only on the patches which are being merged into,
      //  to try map its backStart to the base HTML string, once the
      //  node backStart refers to no longer has a place in the latest HTML string
      //  (presumably because some patch in the latest set of patches being merged in removed said node).
      //  If it can't be mapped to the base HTML string either, then it handles backStart as an ephemeral node.
      const handleForwardMappedBackStarts = (patch: DocPatchDom, i: number) => {
        // The node referred to in this patch has no place in the new HTML string.
        // That means it was removed by a patch in the provided `patches`. That patch will
        //  give a recovered version of this node a stringPos from the HTML string from
        //  when the document was in its previous state.
        // We can map to that value using the forwardUpdateMap which mapped OLD stringPos values
        //  to the BASE stringPos values. The provided forwardUpdateMap maps NEW string Pos values; the
        //  *previously* provided forwardUpdateMap mapped OLD stringPos values.
        // Note this is safe (as in, a previous forwardUpdateMap will exist) because a call which merges
        //  onto existing history stack can never be the first call of this function (the first call must
        //  add a state, onto an empty stack).
        // IMP: If document history is saved in a persistent storage solution, storage of
        //       prevStringPosForwardUpdateMap may also be required.
        if (!this.prevStrPosForwardMap)
          throw new Error(
            "Got call to merge onto history stack with prevStringPosForwardUpdateMap undefined.",
          );

        // What can happen is, in the EXACT previous HTML string (for the patches that were added there) we can have a patch adding a node (perhaps this patch), that in the latest
        //  set of patches is removed. It is correctly sensed from a lack of mapping into the latest HTML string of the backStart of this patch that the node must've
        //  been removed. However, when it tries to map this backStart to the base HTML string it must use the previous forwardMap. And SINCE the previous HTML string was where this
        //  ephemeral node was first added in, then that map will be mapping the location of whatever the ephemeral node kicked out from that location i.e. it will make a spurious
        //  match with this random other node.
        // To handle this, we have some extra info in prevNodeAddLocs that on creation essentially says
        //   "these are all the spots new nodes were added in this patch set- if you're using the nodePosForwardMap created
        //    alongside this for the next set of patches, and you have a match in these spots, then sorry bucko but you have an ephemeral on your hand... Good luck~ :)"
        // A mirror of this logic also exists in mapForwardStartVals() for handling remove-type patches (whose backStart is also in terms of the previous strPosForwardMap).
        if (this.prevNodeAddLocs.includes(patch.backStart)) {
          this.log(
            `${i}: Didn't map backStart "${patch.backStart}" using the previous strPosForwardMap, becuase it had a match in prevNodeAddLocs. Assuming this to mean the node referred here is ephemeral.`,
          );
          patch.mapBackStart = false;
          return;
        }

        const newMappedBackStart = this.prevStrPosForwardMap.get(
          patch.backStart,
        );

        if (newMappedBackStart === undefined) {
          // This means the patch refers to an "ephemeral node"; a node which was added and then removed in the same set of patches.
          this.warn(
            `${i}: Encountered backStart value "${patch.backStart}" that couldn't be mapped to the base HTML string nor the latest HTML string; hence referring to an ephemeral node.`,
          );

          if (patch.type.startsWith("remove")) {
            // This patch has a backStart which would try to add a node, either as the first child of, or next sibling to, an ephemeral node.
            // We still want to be able to add this node in while undoing, and so must not rely on the ephemeral node for positioning.
            //  Hence, we use the ephemeralNodeMap to get the position of a node we CAN rely on.

            const newBackStart = ephemeralNodeBackMap.get(patch.backStart);

            if (newBackStart === undefined) {
              console.error(
                `${i}: backStart value of remove-type patch (which is add-type in the reverse direction) referred to an ephemeral node, not in ephemeralNodeBackMap:`,
                ephemeralNodeBackMap,
                "patch:",
                patch,
              );
              patch.backStart = -2;
              patch.mapBackStart = false;
            } else {
              this.log(
                `${i}: Mapped "${patch.backStart}" -> "${newBackStart.posPreceding}" and "${patch.type}" -> "${newBackStart.addType}" and mapBackStart: "${patch.mapBackStart}" -> "${newBackStart.useDefaultMap}" using ephemeralNodeMap:`,
                ephemeralNodeBackMap,
              );
              patch.backStart = newBackStart.posPreceding;

              if (newBackStart.addType === "firstChild")
                patch.type = "removeFirstChild";
              if (newBackStart.addType === "nextSibling")
                patch.type = "removeNextSibling";

              patch.mapBackStart = newBackStart.useDefaultMap;
            }
          } else {
            patch.backStart = -2;
            patch.mapBackStart = false;
          }
        } else {
          this.log(
            `${i}: Mapping backStart to the base HTML string using the previous strPosForwardMap: "${patch.backStart}" -> "${newMappedBackStart}" on patch`,
            patch,
          );
          patch.backStart = newMappedBackStart;
          patch.mapBackStart = false;
        }
      };

      this.log("🔷 strPosBackwardMap:", strPosBackwardMap);
      this.log("🔷 prevStrPosForwardMap:", this.prevStrPosForwardMap);

      // Process the backStarts of the `patches` being merged in,
      //  mapping those with mapBackStart false to the base HTML string, and
      //  handling resultant backStart ephemeral node references where they can't be mapped to the base HTML string
      // Adding entries to the ephemeralNodeBackMap using the remove-type patches which removed the ephemeral nodes
      patches.toReversed().forEach((patch, i_) => {
        let i = this.docHistory[0].patches.length + (patches.length - 1 - i_);

        // It is possible for mapBackStart to already be false; because backStarts are created in the reverse order
        //  from which they will be executed, it is possible in remove-type patches (where backStarts are trying to add nodes in)
        //  that backStart refers to a node that doesn't exist in the latest HTML string. This is because the patch is created
        //  before a later remove-type patch removes the node being referred to (hence, it doesn't exist in the latest HTML string obviously).
        // `docsyncing` is set up to leave the backStarts of these remove-type patches in the previous version of the HTML string.
        //  Hence, we can use prevStrPosForwardMap to map them.
        if (!patch.mapBackStart) {
          if (!this.prevStrPosForwardMap)
            throw new Error(
              "Got call to merge onto history stack with prevStringPosForwardUpdateMap undefined.",
            );
          const newMappedBackStart = this.prevStrPosForwardMap.get(
            patch.backStart,
          );
          if (newMappedBackStart !== undefined) {
            this.log(
              `${i}: Mapping backStart to the base HTML string using the previous strPosForwardMap: "${patch.backStart}" -> "${newMappedBackStart}" on patch`,
              patch,
            );
            patch.backStart = newMappedBackStart;
          } else {
            // backStart refers to an ephemeral node
            this.warn(
              `${i}: Encountered backStart value "${patch.backStart}" that couldn't be mapped to the base HTML string nor the latest HTML string; hence referring to an ephemeral node.`,
            );

            // If it's a remove-type patch then backStart refers to a preceding node for the location of where to add something back in
            //  while undoing. We still want to be able to do that, and so utilise ephemeralNodeBackMap to find some reference node to use
            //  instead of this ephemeral node.
            if (patch.type.startsWith("remove")) {
              const newBackStart = ephemeralNodeBackMap.get(patch.backStart);

              // This shouldn't legitimately happen (that is, there should always be a matching entry in ephemeralNodeBackMap).
              // Any patches referring to an ephemeral node must be ordered before the patch that removes the ephemeral node.
              // We process patches in the reverse order, so that the first patch that makes reference to an ephemeral node
              //  should be the patch removing it.
              // - ephemeral #1   --- REMOVE ephemeral #3 ---> - ephemeral #1 --- REMOVE ephemeral #2 ---> - ephemeral #1 --- REMOVE ephemeral #1 ---> NADA
              // - ephemeral #2        (ref -> ephemeral #2)   - ephemeral #2      (ref -> ephemeral #1)
              // - ephemeral #3
              // ...processed in the reverse order;
              // ephemeral #1 processed first; backStart is normal and doesn't need to be mapped, gets added to ephemeralNodeMap
              // ephemeral #2 processed next; backStart get mapped using ephemralNodeMap here to avoid ephemeral #1, then it and its mapped backStart are added to the map
              // ephemeral #3 processed last; again backStart gets mapped using ephemeralNodeMap, and notice that it should, in one go, already be referring to the node
              //               that precedes ephemeral #1, a real node (since we map backStarts before adding to the map).
              if (!newBackStart) {
                console.error(
                  "Could not find entry in ephemeralNodeBackMap,",
                  ephemeralNodeBackMap,
                  "for patch:",
                  patch,
                );
                patch.backStart = -2;
              } else {
                // Essentially, "steal" and replace all the information about adding a node back in (while undoing) in this patch
                this.log(
                  `${i}:  for backStart, "${patch.backStart}" -> "${newBackStart.posPreceding}" and "${patch.type}" -> "${newBackStart.addType}" and mapBackStart: "${patch.mapBackStart}" -> "${newBackStart.useDefaultMap}" using ephemeralNodeBackMap:`,
                  ephemeralNodeBackMap,
                );
                patch.backStart = newBackStart.posPreceding;

                if (newBackStart.addType === "firstChild")
                  patch.type = "removeFirstChild";
                if (newBackStart.addType === "nextSibling")
                  patch.type = "removeNextSibling";

                patch.mapBackStart = newBackStart.useDefaultMap;
              }
            } else {
              this.warn(
                `Unexpectedly encountered patch which has mapBackStart false, but isn't remove type. Will set backStart to -2 since it referred to an ephemeral node.`,
                patch,
              );
              patch.backStart = -2;
            }
          }
        }

        // We do this after a potential necessary mapping of a backStart value to the base HTML string,
        //  so that the updated backStart would be inserted into the ephemeralNodeBackMap.
        if (patch.type.startsWith("remove")) {
          // We are removing a node which can't be mapped to the base HTML string. Hence, an ephemeral node

          if (patch.backValue === null)
            throw new Error(
              "patch has a backValue of null. Unable to use HistoryManager",
            );
          if (!this.prevStrPosForwardMap)
            console.error(
              "Somehow, we're trying to merge patches while prevStrPosForwardMap is undefined",
            );
          else {
            const [mainIsEphemeral, newEntries, newBackValue] =
              HistoryManager.handleEphemeralAddOrRemovePatch(
                patch.forwardStart,
                patch.backValue,
                patch.subPos,
                this.prevStrPosForwardMap,
                // We set childrenUseDefaultMap to false because this is for adding entries to ephemeralNodeBackMap, to specify backStart values
                //  referring to a node preceding the ephemeral node that other patches can use instead of relying on the ephemeral node.
                //  Every ephemeral child only has access to reference nodes that have been removed by this patch.
                //  Hence, any backStart values they provide in the map are of nodes that don't exist in the latest HTML string; mapBackStart is false
                false,
              );

            if (patch.backValue !== newBackValue)
              this.warn(
                `!!! CHANGING THE backValue OF A NODE: "${patch.backValue}" -> "${newBackValue}"`,
              );
            patch.backValue = newBackValue;

            if (mainIsEphemeral) {
              ephemeralNodeBackMap.set(patch.forwardStart, {
                posPreceding: patch.backStart,
                addType:
                  patch.type === "removeFirstChild"
                    ? "firstChild"
                    : "nextSibling",
                useDefaultMap: patch.mapBackStart,
              });
              this.log(
                `${i}: Set in ephemeralNodeBackMap MAIN NODE, "${patch.forwardStart}" -> `,
                ephemeralNodeBackMap.get(patch.forwardStart),
              );
            } else {
              newEntries.forEach((val, key) => {
                ephemeralNodeBackMap.set(key, val);
                this.log(
                  `${i}: Set in ephemeralNodeBackMap CHILD NODE, "${key}" -> `,
                  ephemeralNodeBackMap.get(key),
                );
              });
            }
          }
        }

        // Apply stringPosForwardUpdateMap to forwardStart values of the patches that we are adding to the history stack
        // We do this after checking if the patch is responsible for removing any ephemeral nodes, since it is possible
        //  that only a child node is ephemeral and so the main node mapped by this (which we don't want to do before we
        //  set the child nodes' "last known locations")
        this.mapForwardStartVals(
          [patch],
          strPosForwardMap,
          this.prevStrPosForwardMap,
          this.prevNodeAddLocs,
          i,
        );
      });

      // Apply stringPosBackwardUpdateMap to backStart values of the patches that are being merged into
      this.docHistory[0].patches.forEach((patch, i) => {
        // We interweave the handling of forwardStart and backStart values together (i.e. not splitting them into two different loops)
        //  for the potential case that two or more nodes next to each other,
        //  become EPHEMERAL at the same time;
        //  we need the ephemeralNodeMap to "carry forward" the position of a non-ephemeral node
        //  across multiple ephemeral nodes, i.e. the forwardStart value of this patch fully
        //  resolved BEFORE we use it in adding a new entry in the ephemeralNodeMap, done below.
        handleBackMappedForwardStarts(patch, i);

        // Checking a node and its children from this add-type patch, for if they still have a place in the latest HTML string
        // We are looking for the first patch which initially adds in a now-ephemeral node...
        if (patch.type.startsWith("add")) {
          // ...so that we may use the forwardStart value to get the position of the node which preceded it,
          // so that patches which try to add nodes by positioning relative to the ephemeral node can be
          //  informed to use the node which precedes it instead (as the ephemeral node won't be added in in undos/redos).

          // Note, there should only ever be one patch which adds in a given ephemeral node, so we shouldn't need to check
          //  if an entry for this already exists.

          const [mainIsEphemeral, newEntries, newForwardValue] =
            HistoryManager.handleEphemeralAddOrRemovePatch(
              patch.backStart,
              patch.forwardValue,
              patch.subPos,
              strPosBackwardMap,
              // We set childrenUseDefaultMap to false because this is for adding entries to ephemeralNodeForwardMap, to specify forwardStart values
              //  referring to a node preceding the ephemeral node that other patches can use instead of relying on the ephemeral node.
              //  Every ephemeral child only has access to reference nodes that have been added by this patch.
              //  Hence, any forwardStart values they provide in the map are of nodes that didn't exist in the base HTML string; mapForwardStart is false
              false,
            );

          if (patch.forwardValue !== newForwardValue)
            this.warn(
              `!!! CHANGING THE forwardValue OF A NODE: "${patch.forwardValue}" -> "${newForwardValue}"`,
            );
          patch.forwardValue = newForwardValue;

          if (mainIsEphemeral) {
            ephemeralNodeForwardMap.set(patch.backStart, {
              addType:
                patch.type === "addFirstChild" ? "firstChild" : "nextSibling",
              posPreceding: patch.forwardStart,
              useDefaultMap: patch.mapForwardStart,
            });

            patch.backStart = -2;
            patch.mapBackStart = false;
            this.log(
              `${i}: Set in ephemeralNodeForwardMap MAIN NODE, "${patch.backStart}" -> `,
              ephemeralNodeForwardMap.get(patch.backStart),
            );
          } else {
            newEntries.forEach((val, key) => {
              ephemeralNodeForwardMap.set(key, val);
              this.log(
                `${i}: Set in ephemeralNodeForwardMap CHILD NODE, "${key}" -> `,
                ephemeralNodeForwardMap.get(key),
              );
            });
          }
        }

        // If the patch early-returns here:
        // This patch has already failed to be mapped to a latest HTML string once, and so has
        //  been mapped to the HTML string from when the document was in its previous state.
        // stringPos values are guaranteed to be unique when they all refer to the same HTML string,
        //  but not when they refer to different HTML strings, so we make sure to early-return here
        //  to avoid accidental mapping of this node to an unrelated node in the new HTML string.
        if (!patch.mapBackStart) return;

        if (patch.backStart === -2 || patch.backStart === -1) {
          this.log(
            `Skipping mapping backStart value; it is ${patch.backStart}`,
          );
          return;
        }

        const mappedBackStart = strPosBackwardMap.get(patch.backStart);
        if (mappedBackStart !== undefined) {
          this.log(
            `${i}: Mapping backStart to the latest HTML string using the strPosBackwardMap: "${patch.backStart}" -> "${mappedBackStart}" on patch`,
            patch,
          );
          patch.backStart = mappedBackStart;
        } else handleForwardMappedBackStarts(patch, i);
      });

      patches.forEach((patch, i) => {
        // Remove-type patches that have a forwardStart which can't be mapped to the base HTML string should immediately have their forwardStart set to -2

        // Q: Can a new add-type patch ever have a forwardStart that immediately refers to an ephemeral node?
        // A: NO, because that would the require the node it references to be removed after the patch is created, which is IMPOSSIBLE
        //        since all the remove-type patches are processed first.
        // Thus, if an add-type patch in `patches` has mapForwardStart false, it can never be ephemeral and there's no need to check.
        // Similar logic applies to characterData/attributes patches; their forwardStarts can never refer to an ephemeral node
        //  since they too are processed after all remove-type patches.

        if (patch.type.startsWith("remove") && !patch.mapForwardStart) {
          this.log(
            `${this.docHistory[0].patches.length + i}: Encountered remove-type patch whose forwardStart couldn't be mapped to the base HTML string. Setting to -2 (considering it to refer to an ephemeral node).`,
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
      this.prevNodeAddLocs = patches
        .filter((patch) => patch.type.startsWith("add"))
        .map((patch) => patch.backStart);
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

  private domParser = new DOMParser();

  parseHTMLFragment(htmlStr: string, isAttributes: boolean): Node[] {
    // "text/html" produces a HTML document starting with a root <html> node, which is not what we want.
    // "text/xml", meanwhile, doesn't handle bare Text nodes.

    // If the htmlStr is an element, and is not being used for attributes intepreting attributes,
    //  we use DOMParser with "text/xml" in order to AVOID CORRECTIONS TO THE STRUCTURE;
    //  a HTML parser corrects things like block elements inside inline containers; `<p><div></div></p>` -> `<p></p><div></div><p></p>`
    //  where an XML parser doesn't. The XML document then needs to be reinterpreted as a HTML document and everything works.
    // IMP: XML IS STRICT AND WILL ERROR IF IT DOESN'T LIKE SOMETHING. THIS INCLUDES:
    //  1) Void elements that dont end in " />"
    //  2) Attributes whose values aren't quoted
    //  3) Boolean attributes which don't have a value
    //  4) Named references to entities e.g. "&nbsp;" (basically requires hex or numeric references)
    //  5) Empty comments, comments with "--" inside
    //  6) Differences in "namespaces" (more research in general has to be done here)
    if (htmlStr.startsWith("<") && !isAttributes) {
      this.log(`Parsing "${htmlStr}".`);
      const parsed = this.domParser.parseFromString(htmlStr, "text/xml");

      const nodeToHTML = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return document.createTextNode(node.textContent ?? "");
        } else if (node.nodeType === Node.COMMENT_NODE) {
          return document.createComment(node.textContent ?? "");
        } else if (node.nodeType !== Node.ELEMENT_NODE) {
          console.warn(
            "node wasn't Text node, Comment node or Element. Not sure what to do with it:",
            node,
          );
          return document.createTextNode("");
        }

        const el = node as Element;

        const htmlEl = document.createElement(el.nodeName);

        for (let i = 0; i < el.attributes.length; i++) {
          const attr = el.attributes[i];
          htmlEl.setAttribute(attr.name, attr.value);
        }

        return htmlEl;
      };

      const walker = document.createTreeWalker(
        parsed.documentElement,
        NodeFilter.SHOW_ELEMENT |
          NodeFilter.SHOW_TEXT |
          NodeFilter.SHOW_COMMENT,
      );

      const rootHTML = nodeToHTML(walker.currentNode) as Element;
      console.log("starting tree search from node", rootHTML);

      const xmlToHTML = new Map<Node, Node>();
      xmlToHTML.set(walker.currentNode, rootHTML);

      let i = 0;
      while (walker.nextNode()) {
        const current = walker.currentNode;
        const currentHTML = nodeToHTML(current);
        // this.log(`%c${i}: processing`, "font-style: italic", current);

        const parent = current.parentNode;
        const parentHTML = parent ? xmlToHTML.get(parent) : null;

        if (!parentHTML) {
          console.error("Node has no parent in map:", current, xmlToHTML);
          break;
        }

        parentHTML.appendChild(currentHTML);

        if (current.nodeType === Node.ELEMENT_NODE) {
          xmlToHTML.set(current, currentHTML);
        }

        i++;
      }

      this.log("OUTPUT:", rootHTML);
      return [rootHTML];
    } else {
      // A <template> element is efficient, because the content is inert;
      //  scripts don't run, images don't load.
      const template = document.createElement("template");
      template.innerHTML = htmlStr;
      return Array.from(template.content.childNodes);
    }
  }

  /**
   * When we add nodes back in (either as part of undo/redo) any previously separate but adjacent child Text nodes
   *  will invariably be treated as a single added Text node (they "coalesce").\
   * We can handle this whenever we try to "do something" with the node- adding something next to it, removing it
   *  (but in that case the node was ephemeral, and so was never added in the first place- we don't need to concern ourselves with remove calls),
   *  or changing its characterData (though that doesn't call this method)- by using the "expectedLen" field on the
   *  add/remove patches to split the Text node into two. Luckily this means we'll never need to update posNodes,
   *  though we will need to update tempPosNodes (which is the responsibility of the caller).
   * @param node The preceding node that an add/remove-type patch is trying to use to add something in
   * @param expectedLen The expected length of the node in terms of its "he encoded" string
   * @returns A tuple of both nodes that resulted from the split (the second one possibly being null).
   */
  private handleSplittingTextNode(
    node: Node,
    expectedLen: number,
  ): [node1: Node, node2: Node | null] {
    if (expectedLen === -1) {
      this.log(
        "Skipping the check of if the referred node is of expected length, as expectedLen is -1",
      );
      return [node, null];
    } else if (node.nodeType !== Node.TEXT_NODE) {
      this.log(
        "The reffered node is not a text node; skipping checking if it's the expected length",
      );
      return [node, null];
    } else if (node.textContent === null) {
      this.warn("referredNode was a TextNode, but had a textContent of null");
      return [node, null];
    } else if (!node.isConnected) {
      this.warn("referredNode was not connected to the DOM");
      return [node, null];
    }

    const checkStr = encode(node.textContent, { useNamedReferences: false });
    if (checkStr.length !== expectedLen) {
      this.warn(
        "FOUND REFERRED NODE THAT'S TEXT NODE WITH UNEXPECTED LENGTH. SPLITTING IT ACCORDINGLY",
      );
      const secondNodeStr = decode(checkStr.slice(expectedLen));
      const secondNode = document.createTextNode(secondNodeStr);
      insertAfter(node, secondNode);
      node.textContent = decode(checkStr.slice(0, expectedLen));

      return [node, secondNode];
    }

    return [node, null];
  }

  private removeNode(referredNode: Node, patch: DocPatchDom) {
    if (!referredNode.isConnected) {
      this.warn(
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

  private addNode(
    referredNode: Node,
    value: string,
    stringPos: number,
    tempPosNodes: Map<number, Node>,
    patch: DocPatchDom,
  ) {
    const newNodes = this.parseHTMLFragment(value, false);

    if (newNodes.length === 0) this.warn(`Added nothing from "${value}"`);

    const [newRefNode, extraNode] = this.handleSplittingTextNode(
      referredNode,
      patch.expectedLen,
    );

    if (patch.type === "addFirstChild" || patch.type === "removeFirstChild") {
      if (!(newRefNode instanceof Element)) {
        console.error("referredNode:", newRefNode);
        throw new Error(
          "referredNode was not an element while trying to insert node as its first child.",
        );
      }
      newNodes.toReversed().forEach((node) => newRefNode.prepend(node));
    } else if (
      patch.type === "addNextSibling" ||
      patch.type === "removeNextSibling"
    ) {
      newNodes.toReversed().forEach((node) => insertAfter(newRefNode, node));
    } else {
      throw new Error("Unexpected value for patch.type");
    }

    // TODO:
    // If there IS more than one node being added at once, in all likelihood what happened is the HTML parser
    //  tried to "correct" some illegal html structure, e.g. `<p><div>No block elements inside an inline container!</div>Lorem ipsum<p>`
    // -> `<p></p><div>[...]</div>Lorem ipsum<p></p>` (3 nodes in a fragment).
    // This is a big problem, and we simply need to disallow the editor from making these sorts of illegal modifications.
    // Luckily, we can still use the undo/redo system to reverse illegal modifications IF we handle them ASAP,
    //  as the illegal patches themselves should generally be able to be handled (it's only when, for example, undoing
    //  a deletion of an inline container, after an illegal block element child was added to it, that the system fails because
    //  of this parser).
    // ANOTHER OPTION:
    // AN XMLParser WITH "text/xml" SET WILL *NOT* TRY TO CORRECT ILLEGAL HTML STRUCTURE.
    // WE CAN USE XMLParser HERE INSTEAD.
    if (newNodes.length > 1)
      console.error(
        `ADDED MORE THAN ONE NODE AT ONCE.\ntempPosNodes WILL ONLY MAP THE PATCH'S backStart VALUE FOR THE FIRST NODE.`,
      );
    else if (newNodes[0] instanceof Element) {
      // We need to determine all of the child nodes that were added alongside the "main node", as further patches
      //  may rely on their existence within tempPosNodes
      const docContainer = this.getDocContainer();
      if (!docContainer) throw new Error("docContainer not defined.");
      // TODO: This can use the new logic involving subPos (in handleEphemeralAddOrRemovePatch) instead
      const [_, addedDocNodes] = reconstructHTMLString(newNodes[0], {
        docContainer,
      });
      addedDocNodes.forEach((nodeInfo, node) => {
        this.log(
          `Added to tempPosNodes, "${patch.forwardStart + nodeInfo.stringPos}" -> `,
          node,
        );
        tempPosNodes.set(stringPos + nodeInfo.stringPos, node);
      });
    } else {
      this.log(`Added to tempPosNodes, "${stringPos}" -> `, newNodes[0]);
      tempPosNodes.set(stringPos, newNodes[0]);
    }

    if (extraNode) {
      this.log(
        `Added to tempPosNodes, "${stringPos + value.length}" -> `,
        extraNode,
      );
      tempPosNodes.set(stringPos + value.length, extraNode);
    }

    return newNodes;
  }

  private setAttributes(referredNode: Node, value: string, patch: DocPatchDom) {
    const newNode = this.parseHTMLFragment(value, true).at(0);
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

  private setCharacterData(
    referredNode: Node,
    value: string,
    expectedLen: number,
  ) {
    if (referredNode instanceof Element)
      this.warn("characterData is an element in a characterData patch.");

    let finalVal: string = value;
    if (referredNode.textContent) {
      const encoded = encode(referredNode.textContent, {
        useNamedReferences: false,
      });
      if (encoded.length > expectedLen) {
        this.warn(
          "FOUND TEXT NODE WITH UNEXPECTED LENGTH. WILL MODIFY TEXT CONTENT ACCORDINGLY",
        );
        finalVal = value + encoded.slice(expectedLen);
      } else if (encoded.length < expectedLen)
        console.error(
          `Text node was somehow smaller than the expected length (${expectedLen}):`,
          referredNode,
        );
    }

    referredNode.textContent = decode(finalVal);
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

      if (patch.type.startsWith("add") && !patch.mapBackStart) {
        // If mapBackStart is false, that means we'd be adding a node which has no place in the latest HTML string,
        //  likely because it'll be removed by a later patch in the set. We must skip adding this "ephemeral node" in the first place.
        this.warn(
          `${i}: Skipping adding node because mapBackStart is false, assuming this to mean that the node would just be removed by a later patch in the set.`,
        );
        continue;
      } else if (patch.type.startsWith("remove") && !patch.mapForwardStart) {
        // If mapForwardStart is false, that means we'd be removing a node which had no place in the base HTML string,
        //  likely because it was added earlier in this same set of patches. We must skip trying to remove this "ephemeral node",
        //  since it's never going to be added in the first place.
        this.warn(
          `${i}: Skipping removing node because mapForwardStart is false, assuming this to mean that the node is ephemeral and won't be added in the first place.`,
        );
        continue;
      } else if (patch.forwardStart === -1) {
        this.warn(
          `${i}: Encountered forwardStart value of -1; assuming this is for adding a node at the top of the document`,
        );
        // Set referredNode to the element containing the entire document. The add type should also already be "FirstChild"
        referredNode = this.posNodes.get(0)?.parentNode ?? undefined;
      } else if (patch.forwardStart === -2 && !patch.mapForwardStart) {
        this.log(
          `${i}: Encountered forwardStart of -2; skipping applying the patch.`,
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
          this.addNode(
            referredNode,
            patch.forwardValue,
            // We are adding the node going forwards, so we're removing the node going backwards,
            //  and so backStart refers to the node itself (whereas forwardStart refers to the node before).
            patch.backStart,
            tempPosNodes,
            patch,
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
          this.setCharacterData(
            referredNode,
            patch.forwardValue,
            patch.backValue!.length,
          );
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
      if (patch.type.startsWith("remove") && !patch.mapForwardStart) {
        // If mapForwardStart is false, that means we'd be adding back in a node which has no place in the previous HTML string (which is what we're recovering),
        //  likely because it'll be removed by a later patch in the set. We must skip adding this "ephemeral node" in the first place.
        this.warn(
          `${i}: Skipping adding node because mapForwardStart is false (in a remove-type patch), assuming this to mean that the node would just be removed by a later patch in the set.`,
        );
        continue;
      } else if (patch.type.startsWith("add") && !patch.mapBackStart) {
        // If mapBackStart is false, that means we'd be removing a node which had no place in the HTML string we left from,
        //  likely because it was added earlier in this same set of patches. We must skip trying to remove this "ephemeral node",
        //  since it's never going to be added in the first place.
        this.warn(
          `${i}: Skipping add-type patch removing node because mapBackStart is false, assuming this to mean that the node is ephemeral and won't be added in the first place.`,
        );
        continue;
      } else if (patch.backStart === -1) {
        this.warn(
          `${i}: Encountered backStart value of -1; assuming this is for adding a node at the top of the document`,
        );
        // Set referredNode to the element containing the entire document. The remove type should also already be "FirstChild"
        referredNode = this.posNodes.get(0)?.parentNode ?? undefined;
      } else if (patch.backStart === -2) {
        this.log(
          `${i}: Encountered backStart value of -2; skipping applying the patch`,
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

      // "remove" | "addFirstChild" | "addNextSibling" | "attributes" | "characterData"
      const reverseType = (val: typeof patch.type): string => {
        if (val === "addFirstChild") return "remove";
        if (val === "addNextSibling") return "remove";
        if (val === "removeFirstChild") return "addFirstChild";
        if (val === "removeNextSibling") return "addNextSibling";
        return val;
      };
      this.log(
        `▶▶▶ (${i}) Undo - perform "${reverseType(patch.type)}" from node at "${patch.backStart}":`,
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

          this.addNode(
            referredNode,
            patch.backValue!,
            // We are removing the node going forwards, and so forwardStart refers to the node itself
            //  (whereas backStart refers to the node before).
            patch.forwardStart,
            tempPosNodes,
            patch,
          );
          break;
        case "attributes":
          this.setAttributes(referredNode, patch.backValue!, patch);
          break;
        case "characterData":
          this.setCharacterData(
            referredNode,
            patch.backValue!,
            patch.forwardValue.length,
          );
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
