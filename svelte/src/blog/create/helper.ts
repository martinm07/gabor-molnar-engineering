function recurseIgnoreWhitspace(
  traverseFromNode: (node: Node, ...args: any) => Node | null,
  recurse: (
    func: (node: Node, ...args: any) => Node | null,
    node: Node,
    ...args: any
  ) => Node | null,
) {
  const returnFunc = (node: Node, ...args: any) => {
    const next = traverseFromNode(node, ...args);
    if (next?.nodeType === Node.TEXT_NODE && next.textContent?.trim() === "")
      return recurse(returnFunc, node, ...args);
    else return next;
  };
  return returnFunc;
}

export const prevSibling = recurseIgnoreWhitspace(
  (node) => node.previousSibling,
  (func, node) => func(node.previousSibling!),
);
export const nextSibling = recurseIgnoreWhitspace(
  (node) => node.nextSibling,
  (func, node) => func(node.nextSibling!),
);
export const firstChild = recurseIgnoreWhitspace(
  (node, nth) => node.childNodes[nth ?? 0],
  (func, node, nth) => func(node, (nth ?? 0) + 1),
);
export const lastChild = recurseIgnoreWhitspace(
  (node, nth) => node.childNodes[node.childNodes.length - 1 - (nth ?? 0)],
  (func, node, nth) => func(node, (nth ?? 0) + 1),
);
export const nextElementSibling = function (node: Node): Node | null {
  const next = node.nextSibling;
  if (!next) return null;
  if (next?.nodeType !== Node.ELEMENT_NODE) return nextElementSibling(next);
  return next;
};
export function getAllTextNodes(node: Node): Node[] {
  if (node.nodeType === Node.TEXT_NODE) return [node];
  return Array(...node.childNodes).flatMap((child) =>
    child.nodeType === Node.TEXT_NODE ? [child] : getAllTextNodes(child),
  );
}

// A port of the jQuery UI scrollParent() method
// https://stackoverflow.com/a/42543908/11493659
export function getScrollParent(
  element: Element,
  includeHidden: boolean = false,
) {
  let style = getComputedStyle(element);
  const excludeStaticParent = style.position === "absolute";
  const overflowRegex = includeHidden
    ? /(auto|scroll|hidden)/
    : /(auto|scroll)/;

  if (style.position === "fixed") return document.body;
  for (
    let parent: Element | null = element;
    (parent = parent.parentElement);

  ) {
    style = getComputedStyle(parent);
    if (excludeStaticParent && style.position === "static") continue;
    if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX))
      return parent;
  }

  return document.body;
}

export function isElementVisible(
  el: HTMLElement,
  opts: { marginTop?: number; marginBottom?: number } = {},
) {
  const scrollContainer = getScrollParent(el);

  if (!scrollContainer) return;
  const scrollRect = scrollContainer.getBoundingClientRect();
  const minY = scrollRect.y;
  const maxY = scrollRect.y + scrollRect.height;

  const rect = el.getBoundingClientRect();

  const computed = getComputedStyle(el);
  const marginTop =
    opts.marginTop ?? Number.parseFloat(computed.scrollMarginTop);
  const marginBottom =
    opts.marginBottom ?? Number.parseFloat(computed.scrollMarginBottom);

  return (
    rect.y > minY + marginTop && rect.y + rect.height < maxY - marginBottom
  );
}

// THE FOLLLOWING 3 ARE CURRENTLY UNUSED

// Traverses up the parent chain until it finds a parent with a next sibling
export function findNextSibling(node: Node): Node | null {
  if (node.nextSibling) return node.nextSibling;
  else return node.parentNode ? findNextSibling(node.parentNode) : null;
}

export function endsWith(str: string, regex: RegExp) {
  const result = regex.exec(str);
  if (!result) return false;
  return str.length === result.index + result[0].length;
}

export const insertAtIndex = (
  insert: string,
  str?: string | null,
  id?: number,
) => {
  if (!str) return "";
  return str.slice(0, id) + insert + str.slice(id);
};

export class ClonedSelection implements Selection {
  anchorNode: Node | null;
  anchorOffset: number;
  focusNode: Node | null;
  focusOffset: number;
  isCollapsed: boolean;
  rangeCount: number;
  type: string;
  private ranges: Range[];

  constructor(selection: Selection) {
    this.anchorNode = selection.anchorNode;
    this.anchorOffset = selection.anchorOffset;
    this.focusNode = selection.focusNode;
    this.focusOffset = selection.focusOffset;
    this.isCollapsed = selection.isCollapsed;
    this.rangeCount = selection.rangeCount;
    this.type = selection.type;
    this.ranges = [];

    for (let i = 0; i < selection.rangeCount; i++) {
      this.ranges.push(selection.getRangeAt(i).cloneRange());
    }
  }

  getRangeAt(index: number): Range {
    if (index < 0 || index >= this.rangeCount) {
      throw new Error("Invalid index");
    }
    return this.ranges[index];
  }

  addRange(range: Range): void {
    this.ranges.push(range.cloneRange());
    this.rangeCount = this.ranges.length;
  }

  removeRange(range: Range): void {
    const index = this.ranges.findIndex((r) => r === range);
    if (index !== -1) {
      this.ranges.splice(index, 1);
      this.rangeCount = this.ranges.length;
    }
  }

  removeAllRanges(): void {
    this.ranges = [];
    this.rangeCount = 0;
  }

  collapse() {
    throw new Error("Not implemented");
  }
  extend() {
    throw new Error("Not implemented");
  }
  setBaseAndExtent() {
    throw new Error("Not implemented");
  }
  selectAllChildren(node: Node): void {
    throw new Error("Not implemented");
  }
  setPosition() {
    throw new Error("Not implemented");
  }
  containsNode(): boolean {
    throw new Error("Not implemented");
  }
  deleteFromDocument(): void {
    throw new Error("Not implemented");
  }
  empty(): void {
    this.removeAllRanges();
  }

  collapseToEnd() {
    throw new Error("Not implemented");
  }
  collapseToStart() {
    throw new Error("Not implemented");
  }
  modify() {
    throw new Error("Not implemented");
  }

  toString(): string {
    return this.ranges.map((range) => range.toString()).join("");
  }
}

// Checks if a list of elements is a connected island of siblings (or children in the sibling island)
// Returns a list of elements that aren't contained by any other elements in the array sorted
//  by the order they appear in the DOM, if they indeed form a connected island, or an empty list otherwise.
export function elsListConnected(els: Element[]) {
  if (els.length <= 1) return els;
  // filter out all elements that are contained by other elements in the array
  const remainingEls = els.filter(
    (el) => !els.some((el_) => el_ !== el && el_.contains(el)),
  );
  const frontier: Element[] = [remainingEls[0]];
  const sortedTopLevel: Element[] = [remainingEls[0]];
  remainingEls.splice(0, 1);

  const itemIncluded = (item: Element) => {
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
        // Add item to the stack
        frontier.push(sibling);
        // Also add it the final return value, in DOM appearance order
        if (siblingFunc === prevSibling) sortedTopLevel.unshift(sibling);
        else sortedTopLevel.push(sibling);
      }
    }
  }
  return remainingEls.length === 0 ? sortedTopLevel : [];
}
