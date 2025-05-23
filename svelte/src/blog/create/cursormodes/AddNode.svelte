<script module lang="ts">
  import { prevSibling, nextSibling, firstChild, lastChild } from "../helper";

  export type Rect = { x: number; y: number; w: number; h: number };
  // Represents line segment locked only to a change in x or a change in y (but not both)
  interface CardinalSegment {
    x: number;
    y: number;
    len: number;
    direction: "down" | "right";
  }
  type Vec2 = [x: number, y: number];

  function getAllChildNodes(node: Node): Node[] {
    if (!node.childNodes) return [node];
    return [
      node,
      ...Array(...node.childNodes).flatMap((node) => getAllChildNodes(node)),
    ];
  }

  function isInline(node: Node) {
    return (
      node instanceof Element &&
      getComputedStyle(node).display.includes("inline")
    );
  }

  function insertBefore(referenceNode: Node, newNode: Node) {
    referenceNode.parentNode?.insertBefore(newNode, referenceNode);
  }
  function insertAfter(referenceNode: Node, newNode: Node) {
    referenceNode.parentNode?.insertBefore(newNode, referenceNode.nextSibling);
  }
  function insertFirst(referenceNode: Node, newNode: Node) {
    referenceNode.insertBefore(newNode, referenceNode.firstChild);
  }
  function insertLast(referenceNode: Node, newNode: Node) {
    referenceNode.insertBefore(newNode, null);
  }

  function createRect(el: Element, doc?: Element): Rect {
    const rect = el.getBoundingClientRect();
    if (doc) {
      const scrollContainer = doc.parentElement!;
      rect.x += scrollContainer.scrollLeft;
      rect.y += scrollContainer.scrollTop;
    }
    return { x: rect.x, y: rect.y, h: rect.height, w: rect.width };
  }

  function rectsSame(rect1: Rect, rect2: Rect, MAXDIFF: number = 5) {
    const rect1Dir = rect1.w < rect1.h ? "down" : "right";
    const rect2Dir = rect2.w < rect2.h ? "down" : "right";
    if (rect1Dir !== rect2Dir) return false;
    // Check if two rects are the same on their minor axis (i.e. the one
    //  they'll get slightly adjusted on by adjustGroup()) and they overlap
    //  on their major axes.
    if (rect1Dir === "down") {
      const sameAxis =
        Math.abs(rect1.w - rect2.w) < MAXDIFF &&
        Math.abs(rect1.x - rect2.x) < MAXDIFF;
      const roughlyWithinSpan =
        rect1.y < rect2.y
          ? rect2.y < rect1.y + rect1.h
          : rect1.y < rect2.y + rect2.h;
      return sameAxis && roughlyWithinSpan;
    } else {
      const sameAxis =
        Math.abs(rect1.h - rect2.h) < MAXDIFF &&
        Math.abs(rect1.y - rect2.y) < MAXDIFF;
      const roughlyWithinSpan =
        rect1.x < rect2.x
          ? rect2.x < rect1.x + rect1.w
          : rect1.x < rect2.x + rect2.w;
      return sameAxis && roughlyWithinSpan;
    }
  }
  function adjustGroup(
    group: { rect: Rect; origRect: Rect; el: HTMLElement }[],
    doc?: Element,
    OFFSET: number = 5,
  ) {
    // Sort the array by the order in which the elements appear in the DOM
    group.sort((a, b) => {
      const comparison = a.el.compareDocumentPosition(b.el);
      if (comparison === Node.DOCUMENT_POSITION_PRECEDING) return 1;
      else if (comparison === Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      else return 0;
    });
    const b = 0.5 * OFFSET * (1 - group.length);
    group.forEach(({ rect, origRect, el }, i) => {
      const offset = b + i * OFFSET;
      const seg = reduceBoxToLine(rect);
      if (seg.direction === "right") {
        rect.y = origRect.y + offset;
        el.style.transform = `translateY(${offset}px)`;
      } else if (seg.direction === "down") {
        rect.x = origRect.x + offset;
        el.style.transform = `translateX(${offset}px)`;
      }
      // Because inline elements aren't affected by transform, we create a visual
      //  that can be by making the <span>s have an absolutely positioned inline-block <div> child element.
      // Note we don't make the <span> inline-block itself as that can alter page flow.
      if (isInline(el)) {
        const newEl = document.createElement("div");
        el.style.boxShadow = "none";
        el.style.background = "none";
        newEl.style.height = `${rect.h}px`;
        newEl.style.width = `${rect.w}px`;
        el.insertBefore(newEl, null);
        request2AnimationFrames(() => {
          const newRect = createRect(newEl, doc);
          el.style.transform +=
            seg.direction === "right"
              ? ` translateX(${rect.x - newRect.x}px)`
              : ` translateY(${rect.y - newRect.y}px)`;
          rect.x = seg.direction === "right" ? rect.x - newRect.x : newRect.x;
          rect.y = seg.direction === "right" ? rect.y - newRect.y : newRect.y;
        });
      }
    });
  }

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

  export class PotentialLocations {
    doc: HTMLElement;
    locationMap: Map<Rect, HTMLElement> = new Map();
    locationGroups: Array<
      [Rect, { rect: Rect; origRect: Rect; el: HTMLElement }[]]
    > = [];
    activeLocation: HTMLElement | undefined = $state();

    MAXDIFF: number;
    OFFSET: number;
    BUFFER: number;

    private addedLocs: boolean = false;

    constructor(
      doc: HTMLElement,
      params?: { maxDiff?: number; offset?: number; buffer?: number },
    ) {
      this.doc = doc;
      // For slightly adjusting the positioning of multiple locations on top of each other
      //  (e.g. because of one being beside a nested element and the other beside a parent)
      this.MAXDIFF = params?.maxDiff ?? 5;
      this.OFFSET = params?.offset ?? 6;
      // The number of pixels the mouse cursor can be away (in any direction) for it to
      //  count as hovering a potential location element.
      this.BUFFER = params?.buffer ?? 20;
    }

    addPotentialLocs(filterLocs: (loc: HTMLElement) => boolean = () => true) {
      if (this.addedLocs) return;
      const allNodes = getAllChildNodes(this.doc).slice(1);
      const potentialLocations: HTMLElement[] = [];
      for (const node of allNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        const inline = isInline(node);

        for (const insert of [
          insertBefore,
          insertAfter,
          insertFirst,
          insertLast,
        ]) {
          // If the location-to-be-inserted is already a potential-location, then don't insert
          const isLocEl = (node: any) =>
            node instanceof HTMLElement &&
            node.classList.contains("potential-location");
          if (
            (insert === insertBefore && isLocEl(prevSibling(node))) ||
            (insert === insertAfter && isLocEl(nextSibling(node))) ||
            (insert === insertFirst && isLocEl(firstChild(node))) ||
            (insert === insertLast && isLocEl(lastChild(node)))
          )
            continue;

          const el = document.createElement(inline ? "span" : "div");
          el.classList.add("potential-location");
          insert(node, el);
          if (!filterLocs(el)) {
            el.remove();
            continue;
          }
          potentialLocations.push(el);
        }
      }
      for (const el of potentialLocations) {
        const rect = createRect(el, this.doc);

        // Check if there's already a group created that this element falls into
        const group = this.locationGroups.find(([key]) =>
          rectsSame(key, rect, this.MAXDIFF),
        );
        // console.log(el, [...this.locationGroups], rect, group);
        if (group) {
          // If this element hasn't already been added to the group, then add it and adjust
          if (!group[1].some((item) => item.el === el)) {
            group[1].push({ rect, origRect: structuredClone(rect), el });
            adjustGroup(group[1], this.doc, this.OFFSET);
          }
          // If not, check all potential locations for another one the same rect as this, and create a group of
          //  those two. Since we're adding one at a time, and check for groups beforehand, there will always only ever
          //  be one other potential location that should be grouped with this el.
          // NOTE: There's a potential optimization to be had with not checking elements in the locationGroups array.
        } else {
          const sameLoc = Array(...this.locationMap.entries()).find(([key]) =>
            rectsSame(key, rect, this.MAXDIFF),
          );
          if (sameLoc) {
            this.locationGroups.push([
              structuredClone(rect),
              [
                {
                  rect: sameLoc[0],
                  origRect: structuredClone(sameLoc[0]),
                  el: sameLoc[1],
                },
                { rect, origRect: structuredClone(rect), el },
              ],
            ]);
            adjustGroup(this.locationGroups.at(-1)![1], this.doc, this.OFFSET);
          }
        }

        // It's important for rect to be a reference, so that adjustGroup() can adjust it later
        this.locationMap.set(rect, el);
      }
      this.addedLocs = true;
    }

    removePotentialLocs() {
      if (!this.addedLocs) return;
      const allNodes = getAllChildNodes(this.doc).slice(1);
      for (const node of allNodes) {
        if (
          node instanceof HTMLElement &&
          node.classList.contains("potential-location")
        )
          node.remove();
      }
      Array(...this.locationMap.entries()).forEach(([key, _]) =>
        this.locationMap.delete(key),
      );
      this.locationGroups.splice(0, this.locationGroups.length);
      this.doc.parentElement!.style.cursor = "initial";
      this.addedLocs = false;
    }

    handleHover(e: MouseEvent) {
      const scrollContainer = this.doc.parentElement!;
      const mouseX = e.clientX + scrollContainer.scrollLeft;
      const mouseY = e.clientY + scrollContainer.scrollTop;
      let addedActive: [
        { x: number; y: number; w: number; h: number },
        HTMLElement,
      ][] = [];
      for (const [key, value] of this.locationMap.entries()) {
        value.classList.remove("active");
        if (
          mouseX > key.x - this.BUFFER &&
          mouseX < key.x + key.w + this.BUFFER &&
          mouseY > key.y - this.BUFFER &&
          mouseY < key.y + key.h + this.BUFFER
        ) {
          addedActive.push([key, value]);
        }
      }

      if (addedActive.length === 1) {
        addedActive[0][1].classList.add("active");
        this.doc.parentElement!.style.cursor = "pointer";
        return addedActive[0][1];
      } else if (addedActive.length > 1) {
        // Find and select the element with the smallest euclidean distance
        const activeDists: [number, HTMLElement][] = addedActive.map((el) => {
          const seg = reduceBoxToLine(el[0]);
          return [distanceToCardinaLSeg(seg, [mouseX, mouseY]), el[1]];
        });
        const bestI = activeDists.reduce(
          (p, c, i, a) => (c[0] < a[p][0] ? i : p),
          0,
        );
        activeDists[bestI][1].classList.add("active");
        this.doc.parentElement!.style.cursor = "pointer";
        return addedActive[bestI][1];
      } else {
        this.doc.parentElement!.style.cursor = "initial";
        return undefined;
      }
    }
  }

  export interface IAddNode {
    handleAddOperation(): void;
  }
</script>

<script lang="ts">
  import { onDestroy, getContext } from "svelte";
  import { watch } from "runed";
  import {
    cursorMode,
    nodeHoverTarget,
    nodesIslandSelection,
    sidebarMode,
  } from "../store";
  import { type IEditText } from "./EditText.svelte";
  import { request2AnimationFrames } from "/shared/helper";

  interface Props {
    doc: HTMLElement;
  }
  let { doc }: Props = $props();

  const editText: IEditText["startEdit"] = getContext("startEdit");
  const setSelection: (nodes?: Node[] | Node) => void =
    getContext("setSelection");

  const potentialLocations = new PotentialLocations(doc);

  watch(
    () => $cursorMode,
    (_, prev) => {
      if ($cursorMode === "add") potentialLocations.addPotentialLocs();
      else if (prev === "add") potentialLocations.removePotentialLocs();
    },
  );
  // onDestroy(potentialLocations.removePotentialLocs);

  export function handleAddOperation() {
    const selection = getSelection();

    // For wrapping text in a new node, it requires the selection be fully contained
    //  in a single text node. This condition may be arbitrarily missed if there are multiple
    //  contiguous text nodes in the DOM structure which could have been combined together
    // That is what .normalize() does.
    selection?.focusNode?.parentElement?.normalize();

    if (
      selection &&
      !selection.isCollapsed &&
      selection.anchorNode === selection.focusNode &&
      doc.contains(selection.anchorNode)
    ) {
      // Wrap selection in new node
      const fragment = document.createDocumentFragment();
      const range = selection.getRangeAt(0);
      const node = selection.anchorNode!;
      const startText = document.createTextNode(
        node.textContent?.slice(0, range.startOffset) ?? "",
      );
      fragment.appendChild(startText);
      const span = document.createElement("span");
      span.textContent =
        node.textContent?.slice(range.startOffset, range.endOffset) ?? "";
      fragment.appendChild(span);
      const endText = document.createTextNode(
        node.textContent?.slice(range.endOffset) ?? "",
      );
      fragment.appendChild(endText);
      node.parentNode?.replaceChild(fragment, node);

      $nodeHoverTarget = span;
      setSelection();
    } else if ($nodesIslandSelection.length > 0) {
      const newEl = document.createElement("div");
      $nodesIslandSelection[0].parentNode?.insertBefore(
        newEl,
        $nodesIslandSelection[0],
      );
      $nodesIslandSelection.forEach((node) => newEl.appendChild(node));
      setSelection(newEl);
    } else {
      setSelection([]);
      $cursorMode = "add";
    }
  }
</script>

<svelte:window
  onmousemove={(e) => {
    if ($cursorMode !== "add") return;
    potentialLocations.activeLocation = potentialLocations.handleHover(e);
  }}
  onclick={() => {
    if ($cursorMode === "add" && potentialLocations.activeLocation) {
      const active = potentialLocations.activeLocation;

      // We cannot modify a potential-location to turn it into the actual node, as the document syncer ignores potential-location elements.
      const newEl = document.createElement(active.tagName.toLowerCase());
      newEl.innerHTML = "&nbsp;";
      // We also MUST insert the element BEFORE the potential-location, as the document syncer uses the previousSibling to determine
      //  how to patch the document HTML string, and it causes an error if the previous sibling is the ignored potential-location element.
      active.before(newEl);

      setSelection(newEl);
      // editText();
      $sidebarMode = "component";
      $cursorMode = "select";
      request2AnimationFrames(() => {
        // const selection = getSelection();
        // selection?.selectAllChildren(active);
        const btn = document.querySelector(".create-empty-node");
        if (btn instanceof HTMLElement) btn.focus();
      });
    }
  }}
/>

<style>
  :global(:root) {
    --potential-location-width: 1.5px;
  }
  :global(.potential-location) {
    box-shadow: 0 0 0 var(--potential-location-width) var(--rock-400);
    background: var(--rock-400);
    border-radius: 5px;
  }
  :global(.potential-location.active) {
    /* box-shadow:
      0 0 0 3px var(--rock-200),
      0 0 0 4px var(--rock-500);
    background: var(--rock-200); */
    box-shadow: 0 0 0 var(--potential-location-width) #0060df;
    background: #0060df;
  }
  :global(.potential-location div) {
    display: inline-block;
    position: absolute;
    transform: inherit;
    box-shadow: 0 0 0 var(--potential-location-width) var(--rock-400);
    background: var(--rock-400);
    border-radius: 5px;
  }
  :global(.potential-location.active div) {
    box-shadow: 0 0 0 var(--potential-location-width) #0060df;
    background: #0060df;
  }
</style>
