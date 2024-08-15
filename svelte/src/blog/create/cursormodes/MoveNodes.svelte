<script lang="ts">
  import { onDestroy, getContext } from "svelte";
  import { on } from "svelte/events";
  import { watch } from "runed";
  import { cursorMode, nodesSelection } from "../store";
  import { prevSibling, nextSibling } from "../helper";
  import { PotentialLocations, type Rect } from "./AddNode.svelte";
  import { type IAttributesEditor } from "../editors/attributes/AttributesEditor.svelte";

  const startAttributeUsage: IAttributesEditor["startAttributeUsage"] =
    getContext("startAttributeUsage");
  const updateHighlight: () => void = getContext("updateHighlight");

  interface Props {
    doc: HTMLElement;
  }
  let { doc }: Props = $props();

  // Checks if a list of elements is a connected island of siblings (or children in the sibling island)
  // Returns a list of elements that aren't contained by any other elements in the array sorted
  //  by the order they appear in the DOM, if they indeed form a connected island, or an empty list otherwise.
  function elsListConnected(els: Element[]) {
    if (els.length <= 1) return els;
    // filter out all elements that are contained by other elements in the array
    const remainingEls = els.filter(
      (el) => !els.some((el_) => el_ !== el && el_.contains(el)),
    );
    const frontier: Element[] = [remainingEls[0]];
    const sortedTopLevel: Element[] = [remainingEls[0]];
    remainingEls.splice(0, 1);

    const itemIncluded = (item: Element) => {
      // console.log("checking if item ", item, " is included in ", remainingEls);
      const isIncluded = remainingEls.findIndex((el) => el === item);
      if (isIncluded !== -1) {
        remainingEls.splice(isIncluded, 1);
        return true;
      }
      return false;
    };

    while (frontier.length > 0 && remainingEls.length > 0) {
      const item = frontier.splice(0, 1)[0];
      if (!item) continue;
      for (const siblingFunc of [prevSibling, nextSibling]) {
        const sibling = siblingFunc(item);
        if (sibling && sibling instanceof Element && itemIncluded(sibling)) {
          frontier.push(sibling);
          // sortedTopLevel.
          if (siblingFunc === prevSibling) sortedTopLevel.unshift(sibling);
          else sortedTopLevel.push(sibling);
        }
      }
    }
    return remainingEls.length === 0 ? sortedTopLevel : [];
  }

  let nodesIslandSelection: Element[] = $derived(
    elsListConnected($nodesSelection),
  );
  let endPrevAttrMask: (() => void) | undefined;
  watch(
    () => nodesIslandSelection,
    () => {
      if (endPrevAttrMask) endPrevAttrMask();
      if (nodesIslandSelection.length > 0)
        [endPrevAttrMask] = startAttributeUsage(
          "draggable",
          "true",
          $nodesSelection,
        );
      else endPrevAttrMask = undefined;
    },
  );

  const potentialLocations = new PotentialLocations(doc);
  // onDestroy(potentialLocations.removePotentialLocs);
  const docParent = doc.parentElement!;

  const off1 = on(docParent, "dragstart", (e) => {
    console.log(e.target);
    if (
      nodesIslandSelection.some(
        (el) => e.target instanceof Node && el.contains(e.target),
      )
    ) {
      $cursorMode = "move";
      potentialLocations.addPotentialLocs(
        (loc) =>
          !nodesIslandSelection.some(
            (el) =>
              el.contains(loc) ||
              prevSibling(el) === loc ||
              nextSibling(el) === loc,
          ),
      );
    }
  });
  onDestroy(off1);

  const off2 = on(docParent, "dragend", (e) => {
    potentialLocations.removePotentialLocs();
    if ($cursorMode === "move") $cursorMode = "select";
  });
  onDestroy(off2);

  const off3 = on(docParent, "dragover", (e) => {
    if ($cursorMode !== "move") return;
    potentialLocations.activeLocation = potentialLocations.handleHover(e);
    if (potentialLocations.activeLocation) e.preventDefault();
  });
  onDestroy(off3);

  const off4 = on(docParent, "drop", (e) => {
    if ($cursorMode !== "move" || !potentialLocations.activeLocation) return;
    e.preventDefault();
    potentialLocations.activeLocation.after(...nodesIslandSelection);
    updateHighlight();
  });
  onDestroy(off4);
</script>
