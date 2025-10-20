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

export class HistoryManager {
  // The most recent history state is at index 0 in this array
  docHistory: DocHistoryStack = [];
  docHistActiveIndex: number = -1;

  // These mappings are readonly, because only docsyncing.ts should be updating them every event
  //  cycle, when there are new mutations.
  docNodes: ReadonlyMap<Node, DocNodeEntry>;
  stringPosNodeMap: ReadonlyMap<number, Node>;
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

  addToHistoryStack(patches: DocPatchDom[]) {
    if (this.flagHistoryStateChange) {
      if (this.debug)
        console.log(
          "Skipping adding list of patches due to HistoryStateChange flag. Skipped:",
          patches,
        );
      return;
    }
    // Note that if we make an edit from a previous history state, this will always make that edit
    //  a new history item (along with splicing away all history states more recent),
    //  as that seems like more intuitive behaviour.
    if (
      this.flagNewHistoryItem ||
      this.docHistActiveIndex > 0 ||
      this.docHistory.length === 0
    ) {
      if (this.debug) console.log("Adding a new item onto the history stack.");

      if (this.docHistActiveIndex > 0) {
        if (this.debug)
          console.log("Splicing newer history states from current state.");
        this.docHistory.splice(0, this.docHistActiveIndex);
      }

      this.docHistory.unshift({
        patches,
        nodesSelection: this.generateNodeSelectionState(),
        ...this.claimedCaretState,
      });
      this.docHistActiveIndex = 0;
    } else {
      if (this.debug)
        console.log(
          "Merging onto the history stack. Claimed caret state: ",
          this.claimedCaretState,
        );

      this.docHistory[0].patches.push(...patches);
      // TODO: Might want to NOT override caret state if we're overriding with null.
      //       Depends on what behaviour will be more intuitive.
      Object.assign(this.docHistory[0], this.claimedCaretState);

      this.docHistory[0].nodesSelection = this.generateNodeSelectionState();
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
