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
  direction: string;
  private ranges: Range[];

  constructor(selection: Selection) {
    this.anchorNode = selection.anchorNode;
    this.anchorOffset = selection.anchorOffset;
    this.focusNode = selection.focusNode;
    this.focusOffset = selection.focusOffset;
    this.isCollapsed = selection.isCollapsed;
    this.rangeCount = selection.rangeCount;
    this.type = selection.type;
    this.direction = selection.direction;
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

  getComposedRanges(options?: GetComposedRangesOptions): StaticRange[] {
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

export function sortNodesInDocumentOrder(nodes: NodeList) {
  return Array.from(nodes).sort((a, b) => {
    if (a === b) return 0;
    const position = a.compareDocumentPosition(b);
    // DOCUMENT_POSITION_PRECEDING means b comes before a, so a > b
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    return 0;
  });
}

export function isInputEvent(e: Event): e is InputEvent {
  return "inputType" in e;
}

export function closest(
  rootNode: Node | null,
  searchNode: Node | null,
): boolean {
  if (rootNode === null || searchNode === null) return false;

  let currentNode: Node | null = rootNode;
  let found = false;
  while (currentNode !== null) {
    if (currentNode === searchNode) {
      found = true;
      break;
    }
    currentNode = currentNode.parentNode;
  }
  return found;
}

export function closestClass(
  node: Node | null | undefined,
  searchClass: string,
) {
  if (node instanceof Element) return node.closest(`.${searchClass}`);
  else return node?.parentElement?.closest(`.${searchClass}`) ?? null;
}

/**
 * Returns recursive list of all child nodes of node, including the node itself
 */
export function getAllChildNodes(node: Node): Node[] {
  if (!node.childNodes) return [node];
  return [
    node,
    ...Array(...node.childNodes).flatMap((node) => getAllChildNodes(node)),
  ];
}

export function insertAfter(existingNode: Node, newNode: Node) {
  const parent = existingNode.parentNode;
  if (!parent) throw new Error("Provided existingNode didn't have parent node");
  existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}

/**
 * Returns an array of parent elements for a given node up to, but not including, a specified top element.
 *
 * Traverses the DOM tree upwards from the provided `node`, collecting all parent elements until it reaches
 * the `topEl` or the root of the tree. If the `node` is the same as `topEl` or is not contained within `topEl`,
 * an empty array is returned.
 *
 * @param node - The starting DOM node whose parent elements are to be collected.
 * @param topEl - The top-most DOM node to stop the traversal (not included in the result).
 * @returns An array of parent elements from the `node` up to (but not including) `topEl`.
 */
export function getNodeParents(node: Node, topEl: Node): Element[] {
  if (node === topEl || !topEl.contains(node)) return [];

  let parent = node.parentElement;
  const allParents: Element[] = [];

  while (parent && parent !== topEl) {
    allParents.push(parent);
    parent = parent.parentElement;
  }
  return allParents;
}

export function getNthParent(el: Element, n: number) {
  let final: Element | null = el;
  for (let i = 0; i < n; i++) final = final?.parentElement ?? null;
  return final;
}

// Generated by Claude
export function getNextElement(element: Element) {
  // First, try to get the first child
  if (element.firstElementChild) {
    return element.firstElementChild;
  }

  // If no children, try next sibling
  if (element.nextElementSibling) {
    return element.nextElementSibling;
  }

  // If no next sibling, go up the tree and find next sibling of ancestors
  let parent = element.parentElement;
  while (parent) {
    if (parent.nextElementSibling) {
      return parent.nextElementSibling;
    }
    parent = parent.parentElement;
  }

  return undefined; // No next element found
}

const domParser = new DOMParser();

export function parseHTMLFragment(
  htmlStr: string,
  useXMLParser: boolean = true,
  hasMultipleTopEls: boolean = false,
): Node[] {
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
  parseAsXML: if (useXMLParser) {
    const htmlStr_ = hasMultipleTopEls ? `<div>${htmlStr}</div>` : htmlStr;
    const parsed = domParser.parseFromString(htmlStr_, "text/xml");

    // Resort to using a HTML parser if there's a paser error
    if (parsed.getElementsByTagName("parsererror").length > 0) {
      console.warn(
        `Detected parsing error. Resorting to using a HTML parser instead.Tried parsing:\n${htmlStr_}`,
      );
      break parseAsXML;
    }

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
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT,
    );

    const rootHTML = nodeToHTML(walker.currentNode) as Element;
    // console.log("%cstarting tree search from node", "font-style: italic", rootHTML);

    const xmlToHTML = new Map<Node, Node>();
    xmlToHTML.set(walker.currentNode, rootHTML);

    let i = 0;
    while (walker.nextNode()) {
      const current = walker.currentNode;
      const currentHTML = nodeToHTML(current);
      // console.log(`%c${i}: processing`, "font-style: italic", current);

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

    if (hasMultipleTopEls) return Array.from(rootHTML.childNodes);
    else return [rootHTML];
  }

  // A <template> element is efficient, because the content is inert;
  //  scripts don't run, images don't load.
  const template = document.createElement("template");
  template.innerHTML = htmlStr;
  return Array.from(template.content.childNodes);
}

// https://stackoverflow.com/a/32922084/11493659
export function deepEqual(x: any, y: any): boolean {
  const ok = Object.keys,
    tx = typeof x,
    ty = typeof y;
  return x && y && tx === "object" && tx === ty
    ? ok(x).length === ok(y).length &&
        ok(x).every((key) => deepEqual(x[key], y[key]))
    : x === y;
}
