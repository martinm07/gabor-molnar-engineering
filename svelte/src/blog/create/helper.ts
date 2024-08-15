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

  // Implement other methods of the Selection interface
  // These methods won't modify the actual document selection
  // but will update the ClonedSelection object
  collapse(node: Node | null, offset?: number | undefined): void {}
  extend(node: Node, offset?: number | undefined): void {}
  setBaseAndExtent(
    anchorNode: Node,
    anchorOffset: number,
    focusNode: Node,
    focusOffset: number,
  ): void {}
  selectAllChildren(node: Node): void {}
  setPosition(node: Node | null, offset?: number | undefined): void {}

  // These methods return constant values for a cloned selection
  containsNode(
    node: Node,
    allowPartialContainment?: boolean | undefined,
  ): boolean {
    return false;
  }

  deleteFromDocument(): void {
    // No action for cloned selection
  }

  empty(): void {
    this.removeAllRanges();
  }

  collapseToEnd(): void {}
  collapseToStart(): void {}
  modify(alter?: string, direction?: string, granularity?: string): void {}

  toString(): string {
    return this.ranges.map((range) => range.toString()).join("");
  }
}
