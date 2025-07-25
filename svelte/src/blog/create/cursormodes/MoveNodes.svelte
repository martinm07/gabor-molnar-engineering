<script lang="ts">
  import { onDestroy, getContext } from "svelte";
  import { on } from "svelte/events";
  import { watch } from "runed";
  import { mode, nodesIslandSelection, nodesSelection } from "../store.svelte";
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

  let endPrevAttrMask: (() => void) | undefined;
  watch(
    () => $nodesIslandSelection,
    () => {
      if (endPrevAttrMask) endPrevAttrMask();
      if ($nodesIslandSelection.length > 0)
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
      $nodesIslandSelection.some(
        (el) => e.target instanceof Node && el.contains(e.target),
      )
    ) {
      mode.cursor = "move";
      potentialLocations.addPotentialLocs(
        (loc) =>
          !$nodesIslandSelection.some(
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
    if (mode.cursor === "move") mode.cursor = "select";
  });
  onDestroy(off2);

  const off3 = on(docParent, "dragover", (e) => {
    if (mode.cursor !== "move") return;
    potentialLocations.activeLocation = potentialLocations.handleHover(e);
    if (potentialLocations.activeLocation) e.preventDefault();
  });
  onDestroy(off3);

  const off4 = on(docParent, "drop", (e) => {
    if (mode.cursor !== "move" || !potentialLocations.activeLocation) return;
    e.preventDefault();
    potentialLocations.activeLocation.before(...$nodesIslandSelection);
    updateHighlight();
  });
  onDestroy(off4);
</script>
