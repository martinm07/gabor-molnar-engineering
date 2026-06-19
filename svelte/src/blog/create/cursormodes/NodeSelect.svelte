<script module lang="ts">
  export interface INodeSelect {
    updateHighlight: () => void;
  }
</script>

<script lang="ts">
  import { onDestroy } from "svelte";
  import { on } from "svelte/events";
  import { mode, selection } from "../store.svelte";

  interface Props {
    shiftPressed: boolean;
    docEl: HTMLElement;
  }

  let { shiftPressed, docEl }: Props = $props();

  let highlight: HTMLElement;
  let targetOriginal: Element | undefined;
  let ancestorCount: number = 0;

  let doSelect = $derived(mode.cursor === "select");
  let displaySelection = $derived(
    mode.cursor !== "edit" && mode.cursor !== "add" && mode.cursor !== "move",
  );
  // When we're not in select mode, we still want to keep track of the 'theoretical hover target'
  //  so that when we go back to select mode we can instantly be back in sync with the mouse position.
  $effect(() => {
    if (doSelect) selection.hover = targetOriginal;
  });

  const off1 = on(docEl, "mouseover", (e) => {
    if (!(e.target instanceof Element)) return;
    const target = e.target === docEl ? undefined : e.target;
    if (doSelect) selection.hover = target;
    targetOriginal = target;
    ancestorCount = 0;
  });
  onDestroy(off1);

  const off2 = on(docEl, "mouseleave", (e) => {
    if (doSelect) selection.hover = undefined;
    targetOriginal = undefined;
    ancestorCount = 0;
  });
  onDestroy(off2);

  $effect(() => {
    if (selection.hover && selection.hover instanceof HTMLElement)
      updateHighlight();
  });

  export function updateHighlight() {
    if (!selection.hover || !(selection.hover instanceof HTMLElement)) return;
    const rect = selection.hover.getBoundingClientRect();

    let offsetTop = 0,
      offsetLeft = 0;
    let scrollTop = 0,
      scrollLeft = 0;
    if (highlight.offsetParent) {
      const parentRect = highlight.offsetParent.getBoundingClientRect();
      offsetTop = parentRect.top;
      offsetLeft = parentRect.left;
      scrollTop = highlight.offsetParent.scrollTop;
      scrollLeft = highlight.offsetParent.scrollLeft;
    }
    highlight.style.height = `${rect.height}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.left = `${scrollLeft + rect.x - offsetLeft}px`;
    highlight.style.top = `${scrollTop + rect.y - offsetTop}px`;
  }

  function onWheel(e: WheelEvent) {
    if (mode.cursor !== "select") return;
    if (shiftPressed && e.deltaY < 0) {
      const parent = selection.hover?.parentElement ?? undefined;
      if (parent instanceof HTMLElement && parent.classList.contains("doc"))
        return;
      selection.hover = parent;
      ancestorCount++;
    } else if (shiftPressed && e.deltaY > 0) {
      let parent = targetOriginal;
      ancestorCount = Math.max(0, ancestorCount - 1);
      for (let i = 0; i < ancestorCount; i++)
        parent = parent?.parentElement ?? undefined;
      selection.hover = parent;
    }
  }
</script>

<svelte:window onwheel={onWheel} />
<div
  class:hidden={!selection.hover || !displaySelection}
  class="absolute border-8 rounded-xl border-rock-500/50 box-content -translate-x-2 -translate-y-2 pointer-events-none z-10"
  class:border-dashed={selection.hover?.getAttribute("data-component")}
  bind:this={highlight}
></div>
