<script lang="ts">
  import { cursorMode, nodeHoverTarget } from "../store";
  import { onDestroy, getContext } from "svelte";
  import { type IEditText } from "./EditText.svelte";

  interface Props {
    doc: HTMLElement;
  }
  let { doc }: Props = $props();

  const editText: IEditText["startEdit"] = getContext("startEdit");

  const getAllNodes = () => getAllChildNodes(doc).slice(1);
  function getAllChildNodes(node: Node): Node[] {
    if (!node.childNodes) return [node];
    return [
      node,
      ...Array(...node.childNodes).flatMap((node) => getAllChildNodes(node)),
    ];
  }

  function insertBefore(referenceNode: Node, newNode: Node) {
    referenceNode.parentNode?.insertBefore(newNode, referenceNode);
  }
  function insertAfter(referenceNode: Node, newNode: Node) {
    referenceNode.parentNode?.insertBefore(newNode, referenceNode.nextSibling);
  }

  type Rect = { x: number; y: number; w: number; h: number };
  const locationMap = new Map<Rect, HTMLElement>();
  let activeLocation: HTMLElement | undefined = $state();

  // For slightly adjusting the positioning of multiple locations on top of each
  //  (e.g. because of one being beside a nested element and the other beside a parent)
  const MAXDIFF = 5;
  const OFFSET = 5;
  const locationGroups: [Rect, [Rect, HTMLElement][]][] = [];
  function rectsSame(rect1: Rect, rect2: Rect) {
    return (
      Math.abs(rect1.h - rect2.h) < MAXDIFF &&
      Math.abs(rect1.w - rect2.w) < MAXDIFF &&
      Math.abs(rect1.x - rect2.x) < MAXDIFF &&
      Math.abs(rect1.y - rect2.y) < MAXDIFF
    );
  }
  function adjustGroup(group: [Rect, HTMLElement][]) {
    const b = 0.5 * OFFSET * (1 - group.length);
    group.forEach(([rect, el], i) => {
      const offset = b + i * OFFSET;
      const seg = reduceBoxToLine(rect);
      if (seg.direction === "right") {
        rect.y += offset;
        el.style.transform = `translateY(${offset}px)`;
      } else if (seg.direction === "down") {
        rect.x += offset;
        el.style.transform = `translateX(${offset}px)`;
      }
    });
  }

  function prevSibling(node: Node) {
    const prev = node.previousSibling;
    if (
      prev?.nodeType === Node.TEXT_NODE &&
      prev.textContent?.replace(/ /g, "") === "\n"
    )
      return prevSibling(prev);
    else return prev;
  }
  function nextSibling(node: Node) {
    const next = node.nextSibling;
    if (
      next?.nodeType === Node.TEXT_NODE &&
      next.textContent?.replace(/ /g, "") === "\n"
    )
      return nextSibling(next);
    else return next;
  }

  function addNewNodeSpots() {
    const allNodes = getAllNodes();
    const potentialLocations: HTMLElement[] = [];
    for (const node of allNodes) {
      if (node.nodeType === Node.TEXT_NODE) continue;

      let isInline: boolean = false;
      if (node instanceof Element) {
        isInline = getComputedStyle(node).display.includes("inline");
      }
      for (const insert of [insertBefore, insertAfter]) {
        const previousSib = prevSibling(node);
        const nextSib = nextSibling(node);

        // If the previous/next sibling is already a potential-location, then don't continue
        if (
          (insert === insertBefore &&
            previousSib instanceof HTMLElement &&
            previousSib.classList.contains("potential-location")) ||
          (insert === insertAfter &&
            nextSib instanceof HTMLElement &&
            nextSib.classList.contains("potential-location"))
        )
          continue;
        else {
          const el = document.createElement(isInline ? "span" : "div");
          el.classList.add("potential-location");
          insert(node, el);
          potentialLocations.push(el);
        }
      }
    }
    for (const el of potentialLocations) {
      const rect_ = el.getBoundingClientRect();
      const rect = { x: rect_.x, y: rect_.y, w: rect_.width, h: rect_.height };

      const scrollContainer = doc.parentElement!;
      rect.x += scrollContainer.scrollLeft;
      rect.y += scrollContainer.scrollTop;

      // Check if there's already a group created that this element falls into
      const group = locationGroups.find(([key]) => rectsSame(key, rect));
      if (group) {
        adjustGroup(group[1]);
        // If not, check all potential locations for another one the same rect as this, and create a group of
        //  those two. Since we're adding one at a time, and check for groups beforehand, there will always only ever
        //  be one other potential location that should be grouped with this el.
        // NOTE: There's a potential optimization to be had with not checking elements in the locationGroups array.
      } else {
        const sameLoc = Array(...locationMap.entries()).find(([key]) =>
          rectsSame(key, rect),
        );
        if (sameLoc) {
          locationGroups.push([rect, [sameLoc, [rect, el]]]);
          adjustGroup(locationGroups.at(-1)![1]);
        }
      }

      //// This kind of thing works for document flow layout, but breaks
      ////  (because of a different behaviour of 'absolute' positioning) in e.g. flex layout.
      // el.style.width = `${rect.w + 3}px`;
      // el.style.height = `${rect.h + 3}px`;
      // el.style.position = "absolute";

      // It's important for rect to be a reference, so that adjustGroup() can adjust it later
      locationMap.set(rect, el);
    }
  }

  function removeNewNodeSpots() {
    const allNodes = getAllNodes();
    for (const node of allNodes) {
      if (
        node instanceof HTMLElement &&
        node.classList.contains("potential-location")
      )
        node.remove();
    }
    Array(...locationMap.entries()).forEach(([key, _]) =>
      locationMap.delete(key),
    );
    locationGroups.splice(0, locationGroups.length);
  }

  $effect(() => {
    if ($cursorMode === "add") addNewNodeSpots();
    else removeNewNodeSpots();
  });
  onDestroy(removeNewNodeSpots);

  // The number of pixels the mouse cursor can be away (in any direction) for it to
  //  count as hovering a potential location element.
  const BUFFER = 20;

  // Represents line segment locked only to a change in x or a change in y (but not both)
  interface CardinalSegment {
    x: number;
    y: number;
    len: number;
    direction: "down" | "right";
  }
  type Vec2 = [x: number, y: number];

  // Calculates the squared euclidean distance to the closest point on a CardinalSegment
  function distanceToCardinaLSeg(seg: CardinalSegment, p: Vec2) {
    if (seg.direction === "down") {
      if (p[1] > seg.y && p[1] < seg.y + seg.len) return (p[0] - seg.x) ** 2;
      else {
        const dist1 = (seg.x - p[0]) ** 2 + (seg.y - p[1]) ** 2;
        const dist2 = (seg.x - p[0]) ** 2 + (seg.y + seg.len - p[1]) ** 2;
        return Math.min(dist1, dist2);
      }
    } else if (seg.direction === "right") {
      if (p[0] > seg.x && p[0] < seg.x + seg.len) return (p[1] - seg.y) ** 2;
      else {
        const dist1 = (seg.x - p[0]) ** 2 + (seg.y - p[1]) ** 2;
        const dist2 = (seg.x + seg.len - p[0]) ** 2 + (seg.y - p[1]) ** 2;
        return Math.min(dist1, dist2);
      }
    }
    return 0;
  }
  // Converts a rectangle (locked to the 2D grid) into a "center line". This is found by reducing both
  //  the height and width of the rectangle at the same rate until one of them is 0, resulting in a CardinalSegment.
  function reduceBoxToLine({ x, y, w, h }: Rect): CardinalSegment {
    const direction = w < h ? "down" : "right";
    const len = direction === "down" ? h - w : w - h;
    const offset = (direction === "down" ? w : h) / 2;
    return {
      x: x + offset,
      y: y + offset,
      len,
      direction,
    };
  }
</script>

<svelte:window
  onmousemove={(e) => {
    const scrollContainer = doc.parentElement!;
    const mouseX = e.clientX + scrollContainer.scrollLeft;
    const mouseY = e.clientY + scrollContainer.scrollTop;
    let addedActive: [{x: number, y: number, w: number, h: number}, HTMLElement][] = [];
    for (const [key, value] of locationMap.entries()) {
      value.classList.remove("active");
      if (
        mouseX > key.x - BUFFER &&
        mouseX < key.x + key.w + BUFFER &&
        mouseY > key.y - BUFFER &&
        mouseY < key.y + key.h + BUFFER
      ) {
        addedActive.push([key, value]);
      }
    }

    if (addedActive.length === 1) {
      addedActive[0][1].classList.add("active");
      activeLocation = addedActive[0][1];
      doc.style.cursor = "pointer";
    } else if (addedActive.length > 1) {
      // Find and select the element with the smallest euclidean distance
      const activeDists: [number, HTMLElement][] = addedActive.map((el) => {
        const seg = reduceBoxToLine(el[0]);
        return [distanceToCardinaLSeg(seg, [mouseX, mouseY]), el[1]];
      });
      const bestI = activeDists.reduce((p, c, i, a) => c[0] < a[p][0] ? i : p, 0);
      activeDists[bestI][1].classList.add("active");
      activeLocation = addedActive[bestI][1];
      doc.style.cursor = "pointer";
    } else {
      activeLocation = undefined;
      doc.style.cursor = "initial";
    }
  }}
  onclick={() => {
    if ($cursorMode === "add" && activeLocation) {
      activeLocation.removeAttribute("style");
      activeLocation.removeAttribute("class");
      activeLocation.textContent = "here I am!";
      $nodeHoverTarget = activeLocation;
      editText();
    }
  }}
/>

<style>
  :global(.potential-location) {
    box-shadow: 0 0 0 2px var(--rock-400);
    background: var(--rock-400);
    border-radius: 5px;
  }
  :global(.potential-location.active) {
    /* box-shadow:
      0 0 0 3px var(--rock-200),
      0 0 0 4px var(--rock-500);
    background: var(--rock-200); */
    box-shadow: 0 0 0 2px #0060df;
    background: #0060df;
  }
</style>
