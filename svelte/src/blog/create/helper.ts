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
  (node, nth) => node.childNodes[node.childNodes.length - 1 - nth ?? 0],
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

export function getElsList(
  commonAncestor: Node,
  optionalArgs?: { startNode?: Node; endNode?: Node },
) {
  const { startNode, endNode } = optionalArgs || {};
  const domEls: Node[] = [];
  let beforeStart = false;
  let afterEnd = false;

  function getEl(nodeOrEl: Node) {
    if (nodeOrEl?.nodeType === Node.ELEMENT_NODE)
      //type 1 is el
      return nodeOrEl;
    else return nodeOrEl?.parentElement;
  }

  //go backward and out:
  const commonAncestorEl = getEl(commonAncestor);
  let endEl = commonAncestorEl;
  let startEl = commonAncestorEl;
  if (endNode) endEl = getEl(endNode);
  if (startNode) {
    startEl = getEl(startNode);
    beforeStart = true;
  }
  let currentEl = startEl;
  const listEls: Array<Node | null> = [];
  do {
    listEls.push(currentEl);
  } while (
    currentEl !== commonAncestorEl &&
    (currentEl = currentEl?.parentElement ?? null)
  );
  if (
    endEl !== commonAncestorEl &&
    startEl !== commonAncestorEl &&
    endEl !== startEl
  ) {
    listEls.pop();
  }
  listEls.reverse(); //backward and out becomes forward and in

  //go forward and in:
  function walkTrees(branch: Node) {
    const branchNodes = branch.childNodes;
    for (let i = 0; !afterEnd && i < branchNodes.length; i++) {
      let currentNode = branchNodes[i];
      if (currentNode === startNode) {
        beforeStart = false;
      }
      if (!beforeStart && currentNode.nodeType === 1) {
        domEls.push(currentNode);
      }
      if (currentNode === endNode) {
        afterEnd = true;
      } else {
        walkTrees(currentNode);
      }
    }
  }
  walkTrees(commonAncestor);

  return domEls;
}

export function* getNodeInRange(range: AbstractRange) {
  let [start, end] = [range.startContainer, range.endContainer];
  if (start.nodeType < Node.TEXT_NODE || Node.COMMENT_NODE < start.nodeType) {
    start = start.childNodes[range.startOffset];
  }
  if (end.nodeType < Node.TEXT_NODE || Node.COMMENT_NODE < end.nodeType) {
    end = end.childNodes[range.endOffset - 1];
  }
  const relation = start.compareDocumentPosition(end);
  if (relation & Node.DOCUMENT_POSITION_PRECEDING) {
    [start, end] = [end, start];
  }

  const walker = document.createTreeWalker(document, NodeFilter.SHOW_ALL);
  walker.currentNode = start;
  yield start;
  while (walker.parentNode()) yield walker.currentNode;

  if (!start.isSameNode(end)) {
    walker.currentNode = start;
    while (walker.nextNode()) {
      yield walker.currentNode;
      if (walker.currentNode.isSameNode(end)) break;
    }
  }

  const subWalker = document.createTreeWalker(end, NodeFilter.SHOW_ALL);
  while (subWalker.nextNode()) yield subWalker.currentNode;
}

export function getNodesInRange(range: Range) {
  const nodes = [];
  const treeWalker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_ALL,
    {
      acceptNode(node) {
        // Only consider nodes that are part of the selection range
        if (range.intersectsNode(node)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      },
    },
  );

  let currentNode: Node | null = treeWalker.currentNode;

  while (currentNode) {
    if (currentNode.nodeType === Node.TEXT_NODE) nodes.push(currentNode);
    currentNode = treeWalker.nextNode();
  }

  return nodes;
}
