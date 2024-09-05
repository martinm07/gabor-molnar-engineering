<script module lang="ts">
  export interface IMultipleSelect {
    toggleToSelection: (nodes?: Node[] | Node) => void;
    removeSelection: () => void;
    updateHighlights: () => void;
  }
</script>

<script lang="ts">
  import { watch } from "runed";
  import { nodeHoverTarget, nodesSelection } from "../store";

  let highlights: HTMLElement[] = $state([]);

  type Rect = { x: number; y: number; w: number; h: number };
  function expandRect(base: Rect, applied: Rect): Rect {
    const x = Math.min(base.x, applied.x);
    const y = Math.min(base.y, applied.y);
    return {
      x,
      y,
      w: Math.max(base.x + base.w, applied.x + applied.w) - x,
      h: Math.max(base.y + base.h, applied.y + applied.h) - y,
    };
  }

  export function updateHighlights() {
    if ($nodesSelection.length === 0) return;
    const convertDOMRect = (rect: DOMRect): Rect => {
      return {
        x: rect.x,
        y: rect.y,
        w: rect.width,
        h: rect.height,
      };
    };
    // const rect = $nodesSelection
    //   .map((el) => convertDOMRect(el.getBoundingClientRect()))
    //   .reduce((p, c) => expandRect(p, c));

    let i = 0;
    for (const highlight of highlights) {
      if (!$nodesSelection[i]) continue;
      const rect = convertDOMRect($nodesSelection[i].getBoundingClientRect());
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
      highlight.style.height = `${rect.h}px`;
      highlight.style.width = `${rect.w}px`;
      highlight.style.left = `${scrollLeft + rect.x - offsetLeft}px`;
      highlight.style.top = `${scrollTop + rect.y - offsetTop}px`;

      i++;
    }
  }

  watch(
    () => $nodesSelection,
    () => updateHighlights,
  );

  export function toggleToSelection(nodes_?: Node[] | Node) {
    let nodes: Element[];
    if (nodes_) {
      if (nodes_ instanceof Element) nodes = [nodes_];
      else if (!(nodes_ instanceof Node))
        nodes = nodes_.filter((node) => node instanceof Element);
      else return;
    } else if ($nodeHoverTarget) nodes = [$nodeHoverTarget];
    else return;
    if (nodes.length === 0) return;

    const selectionRemovals = $nodesSelection.filter((el) => {
      if (nodes.includes(el)) {
        // Make sure to not later add nodes that were already in the selection and are now being toggled 'off'
        nodes = nodes.filter((node) => node !== el);
        return false;
      } else return true;
    });

    $nodesSelection = [...nodes, ...selectionRemovals];
  }
  export function removeSelection() {
    $nodesSelection = [];
  }
</script>

{#each $nodesSelection as _, i}
  <div
    class:hidden={$nodesSelection.length === 0}
    class="absolute ring-4 rounded ring-rock-700 ring-opacity-50 pointer-events-none z-10"
    bind:this={highlights[i]}
  ></div>
{/each}
