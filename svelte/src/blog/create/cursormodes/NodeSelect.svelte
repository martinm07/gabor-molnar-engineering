<script context="module" lang="ts">
  export interface INodeSelect {
    updateHighlight: () => void;
  }
</script>

<script lang="ts">
  import { onDestroy } from "svelte";
  import { on } from "svelte/events";
  import { cursorMode, nodeHoverTarget } from "../store";

  interface Props {
    shiftPressed: boolean;
    doc: HTMLElement;
  }

  let { shiftPressed, doc }: Props = $props();

  let highlight: HTMLElement;
  let targetOriginal: Element | undefined;
  let ancestorCount: number = 0;

  const off1 = on(doc, "mouseover", (e) => {
    if (!(e.target instanceof Element) || $cursorMode !== "select") return;
    $nodeHoverTarget = e.target;
    targetOriginal = e.target;
    ancestorCount = 0;
  });
  onDestroy(off1);

  const off2 = on(
    doc,
    "mouseleave",
    (e) => $cursorMode === "select" && ($nodeHoverTarget = undefined),
  );
  onDestroy(off2);

  $effect(() => {
    if ($nodeHoverTarget && $nodeHoverTarget instanceof HTMLElement)
      updateHighlight();
  });

  export function updateHighlight() {
    if (!$nodeHoverTarget || !($nodeHoverTarget instanceof HTMLElement)) return;
    const rect = $nodeHoverTarget.getBoundingClientRect();

    let offsetTop = 0,
      offsetLeft = 0;
    let scrollTop = 0,
      scrollLeft = 0;
    if ($nodeHoverTarget.offsetParent) {
      const parentRect = $nodeHoverTarget.offsetParent.getBoundingClientRect();
      offsetTop = parentRect.top;
      offsetLeft = parentRect.left;
      scrollTop = $nodeHoverTarget.offsetParent.scrollTop;
      scrollLeft = $nodeHoverTarget.offsetParent.scrollLeft;
    }
    highlight.style.height = `${rect.height}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.left = `${scrollLeft + rect.x - offsetLeft}px`;
    highlight.style.top = `${scrollTop + rect.y - offsetTop}px`;
  }

  function onWheel(e: WheelEvent) {
    if ($cursorMode !== "select") return;
    if (shiftPressed && e.deltaY < 0) {
      const parent = $nodeHoverTarget?.parentElement ?? undefined;
      if (parent instanceof HTMLElement && parent.classList.contains("doc"))
        return;
      $nodeHoverTarget = parent;
      ancestorCount++;
    } else if (shiftPressed && e.deltaY > 0) {
      let parent = targetOriginal;
      ancestorCount = Math.max(0, ancestorCount - 1);
      for (let i = 0; i < ancestorCount; i++)
        parent = parent?.parentElement ?? undefined;
      $nodeHoverTarget = parent;
    }
  }
</script>

<svelte:window onwheel={onWheel} />
<div
  class:hidden={!$nodeHoverTarget ||
    ($cursorMode !== "select" && $cursorMode !== "editprops")}
  class="absolute ring-8 rounded ring-rock-500 ring-opacity-50 pointer-events-none z-10"
  bind:this={highlight}
></div>
