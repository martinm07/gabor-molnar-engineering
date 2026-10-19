import * as csstree from "css-tree";
import * as htmlparser2 from "htmlparser2";

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
  for (let parent: Element | null = element; (parent = parent.parentElement);) {
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

export function closestAttribute(
  node: Node | null | undefined,
  searchAttr: string,
) {
  if (node instanceof Element) return node.closest(`[${searchAttr}]`);
  else return node?.parentElement?.closest(`[${searchAttr}]`);
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

// const domParser = new DOMParser();
export const XHTML_NS = "http://www.w3.org/1999/xhtml";

export function parseHTMLFragment(
  htmlStr: string,
  parentNamespace?: string | null,
): Node[] {
  const root = document.createDocumentFragment();
  const stack: Node[] = [root];
  const nsStack = [parentNamespace ?? XHTML_NS]; // namespace of the current parent

  // We AVOID using a HTML parser (like htmlparser2.Parser with xmlMode: false), as they generally expect a full HTML document (starting with a root <html> node and so on)
  //  *and* because HTML parsers implement corrective behaviour to certain structures, for example breaking block elements out of inline containers, transforming e.g. `<p><div></div></p>` -> `<p></p><div></div><p></p>`.
  // An XML parser meanwhile won't do these things, as it doesn't consider tag names to have any meaning (it doesn't know what a 'p' tag is, or a 'div', etc.).
  // However, XML is a different spec/standard and so has some differences in expectation from HTML. Some things that an XML parser won't understand:
  //  1) Void elements that dont end in " />"
  //  2) Attributes whose values aren't quoted
  //  3) Boolean attributes which don't have a value
  //  4) Named references to entities e.g. "&nbsp;" (basically requires hex or numeric references)
  //  5) Empty comments, comments with "--" inside
  //  6) Implicit changes in namespaces (HTML/browsers implicitly understand SVG and MathML namespaces)

  // We use this XML parser over the browser's builtin one (through the DOMParser API) for a few reasons:
  // - DOMParser can't handle bare Text nodes in "text/xml", where this one can
  // - DOMParser implements "Attribute Value Normalization" (https://www.xml.com/axml/target.html#AVNormalize),
  //    which strips newlines and things from attribute values (which HTML doesn't do and hence can mess things up), where this doesn't
  // - In general this is a "forgiving" parser, where the XML parser is STRICT and is very quick to throw an error.
  const parser = new htmlparser2.Parser(
    {
      onopentag(name, attribs) {
        const ns = attribs.xmlns ?? nsStack[nsStack.length - 1];

        const el = ns
          ? document.createElementNS(ns, name)
          : document.createElement(name);
        for (const [k, v] of Object.entries(attribs)) {
          if (k !== "xmlns") el.setAttribute(k, v);
        }
        stack[stack.length - 1].appendChild(el);
        stack.push(el);
        nsStack.push(ns);
      },
      onclosetag() {
        stack.pop();
        nsStack.pop();
      },
      ontext(text) {
        stack[stack.length - 1].appendChild(document.createTextNode(text));
      },
      oncomment(data) {
        stack[stack.length - 1].appendChild(document.createComment(data));
      },
    },
    { xmlMode: true, decodeEntities: true },
  );

  parser.write(htmlStr);
  parser.end();
  root.normalize(); // merge adjacent text nodes (ontext can fire in chunks)
  return Array.from(root.childNodes);
}

console.log(parseHTMLFragment("Hello wlrd"));

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

export class DynamicStylesheet<T> {
  stylesheetPosMap: Map<T, number>;
  stylesheet: CSSStyleSheet;

  readonly isConstructedStylesheet: boolean;

  constructor(useConstructedStylesheet = true) {
    this.stylesheetPosMap = new Map();

    this.isConstructedStylesheet = useConstructedStylesheet;
    if (this.isConstructedStylesheet) {
      this.stylesheet = new CSSStyleSheet();
      document.adoptedStyleSheets.push(this.stylesheet);
    } else {
      const style = document.createElement("style");
      document.head.appendChild(style);
      if (!style.sheet)
        throw new Error("Created <style> element had a style.sheet of null.");
      this.stylesheet = style.sheet;
    }
  }

  setRule(rule: string, key: T, index?: number): boolean {
    //  p { ... }   div { ... }   h1 { ... }
    // |          |             |            |
    // 0          1             2            3
    // (we'll have indexes always refer to the rule that directly follows it)
    const existingIndex = this.stylesheetPosMap.get(key);
    try {
      if (existingIndex === undefined) {
        const newIndex = index ?? this.stylesheet.cssRules.length;
        if (newIndex < 0 || newIndex > this.stylesheet.cssRules.length)
          throw new Error("Index given to setRule is out of bounds.");

        this.stylesheet.insertRule(rule, newIndex);

        this.stylesheetPosMap.forEach((i, key) => {
          if (i >= newIndex) this.stylesheetPosMap.set(key, i + 1);
        });
        this.stylesheetPosMap.set(key, newIndex);
      } else {
        const newIndex = index ?? existingIndex;
        if (newIndex < 0 || newIndex > this.stylesheet.cssRules.length)
          throw new Error("Index given to setRule is out of bounds.");

        if (existingIndex !== newIndex)
          this.stylesheetPosMap.forEach((i, key_) => {
            if (key === key_) return;
            // We remove from existing index and insert at newIndex.
            // If existingIndex is greater, everything between existingIndex and newIndex gets bumped up by 1
            // if newIndex is greater, everything between existingIndex and newIndex gets bumped down by 1
            if (existingIndex > newIndex && i >= newIndex && i < existingIndex)
              this.stylesheetPosMap.set(key_, i + 1);
            if (existingIndex < newIndex && i > existingIndex && i <= newIndex)
              this.stylesheetPosMap.set(key_, i - 1);
          });

        this.stylesheetPosMap.set(key, newIndex);
        this.stylesheet.deleteRule(existingIndex);
        this.stylesheet.insertRule(rule, newIndex);
      }
      return true;
    } catch (e) {
      console.error(
        `Failed to insert rule into stylesheet under the key`,
        key,
        ":",
        rule,
      );
      if (existingIndex !== undefined) {
        // We deleted the rule at index, but failed to supply a new rule (the `rule` parameter provided was malformed);
        //  remove this key from the stylesheetPosMap
        this.stylesheetPosMap.delete(key);
      }

      return false;
    }
  }

  removeRule(key: T) {
    const index = this.stylesheetPosMap.get(key);
    if (index === undefined) {
      // prettier-ignore
      console.error("Key not found in stylesheetPosMap when removing rule. Key: ", key, "in map:", this.stylesheetPosMap);
      return;
    }

    this.stylesheet.deleteRule(index);
    this.stylesheetPosMap.delete(key);
    // We need to index shift all the subsequent entries in the map
    this.stylesheetPosMap
      .entries()
      .filter(([_, id_]) => id_ > index)
      .forEach(([key_, id_]) => {
        this.stylesheetPosMap.set(key_, id_ - 1);
      });
  }

  clear() {
    Array.from(this.stylesheetPosMap.entries())
      .toSorted((a, b) => b[1] - a[1])
      .forEach(([key, index]) => {
        this.stylesheet.deleteRule(index);
        this.stylesheetPosMap.delete(key);
      });
  }

  destroy() {
    if (this.isConstructedStylesheet) {
      const i = document.adoptedStyleSheets.indexOf(this.stylesheet);
      if (i === -1) {
        console.error(
          "Could not find style sheet in document.adoptedStyleSheets",
          this.stylesheet,
          document.adoptedStyleSheets,
        );
        return;
      }
      document.adoptedStyleSheets.splice(i, 1);
    } else {
      const i = Array.from(document.head.children).findIndex(
        (el) => el instanceof HTMLStyleElement && el.sheet === this.stylesheet,
      );
      if (i === -1) {
        console.error(
          "Could not find style sheet in document head",
          this.stylesheet,
          document.head.children,
        );
        return;
      }
      document.head.removeChild(document.head.children[i]);
    }
  }
}

export class DynamicGroupStylesheet<T> extends DynamicStylesheet<number> {
  stylesheetGroupMap: Map<T, number[]>;
  private counter = 0;

  constructor(useConstructedStylesheet = true) {
    super(useConstructedStylesheet);
    this.stylesheetGroupMap = new Map();
  }

  setRules(rules: string | string[], key: T) {
    const rulesList = DynamicGroupStylesheet.rulesToList(rules);

    let stylesheetKeys = this.stylesheetGroupMap.get(key);
    if (!stylesheetKeys) {
      stylesheetKeys = [];
      this.stylesheetGroupMap.set(key, stylesheetKeys);
    }
    // if (stylesheetKeys = this.stylesheetPosMap.get(key)) {
    for (let i = 0; i < rulesList.length; i++) {
      const rule = rulesList[i];
      if (i < stylesheetKeys.length) {
        this.setRule(rule, stylesheetKeys[i]);
      } else {
        const newKey = this.counter++;
        this.setRule(rule, newKey);
        stylesheetKeys.push(newKey);
      }
    }

    stylesheetKeys
      .slice(rulesList.length)
      .forEach((key) => this.removeRule(key));
  }

  static rulesToList(rules: string | string[]) {
    let rulesList: string[];
    if (typeof rules === "string") {
      const ast = csstree.parse(rules, {
        parseValue: false,
        parseAtrulePrelude: false,
        parseRulePrelude: false,
      });

      if (ast.type === "StyleSheet") {
        rulesList = [];
        ast.children.forEach((node, item, list) => {
          rulesList.push(csstree.generate(node));
        });
      } else {
        console.warn(
          "Root of AST wasn't a StyleSheet node; parsing as single rule",
        );
        rulesList = [csstree.generate(ast)];
      }
    } else rulesList = rules;
    return rulesList;
  }
}

export function isInSveltePreview(
  node: Node | null | undefined,
  p?: { container?: Element; cache?: SveltePreviewCheckCache },
): boolean {
  if (!node || (p?.container && !p.container.contains(node))) return false;

  const isStartBoundary = (node: Node) =>
    node.nodeType === Node.COMMENT_NODE &&
    node.textContent?.trim() === "!<SVELTECOMP-PREVIEW>";
  const isEndBoundary = (node: Node) =>
    node.nodeType === Node.COMMENT_NODE &&
    node.textContent?.trim() === "!</SVELTECOMP-PREVIEW>";

  if (isStartBoundary(node) || isEndBoundary(node)) {
    // console.log(
    //   "🍀🍀 decided inSveltePreview true because node passed in was a boundary marker",
    //   node,
    // );
    return true;
  }

  const getResult = (): boolean => {
    if (p?.cache?.has(node)) return p.cache.get(node)!;

    // const searched = [];

    let searchNode = node.previousSibling ?? node.parentNode;
    while (searchNode) {
      if (searchNode === p?.container) return false;
      if (p?.cache?.has(searchNode)) return p.cache.get(searchNode)!;

      if (isStartBoundary(searchNode)) {
        //   console.log(
        //     "🍀🍀 decided inSveltePreview true because of backtracing to first finding startBoundary",
        //     searched,
        //   );
        return true;
      } else if (isEndBoundary(searchNode)) return false;

      // searched.push(searchNode);
      searchNode = searchNode.previousSibling ?? searchNode.parentNode;
    }
    return false;
  };

  const result = getResult();
  if (p?.cache) p.cache.set(node, result);
  return result;
}

export type SveltePreviewCheckCache = Map<Node, boolean>;
