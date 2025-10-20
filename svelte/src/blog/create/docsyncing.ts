import { getNodeParents } from "./helper";
import { maskedAttributes } from "./store.svelte";
import { fetch_ } from "/shared/helper";
import he from "he";

export type DocNodeEntry =
  | {
      stringPos: number;
      stringLen: number;
      parentList: Element[];
      isEl: true;
      startTagLen: number;
    }
  | {
      stringPos: number;
      stringLen: number;
      parentList: Element[];
      isEl: false;
    };
export type DocNodeMap = Map<Node, DocNodeEntry>;

export type StringPosNodeMap = Map<number, Node>;

export type DocPatchStr = {
  value: string;
  start: number;
  length: number;
};
export type DocPatchDom = {
  start: number;
  type:
    | "addFirstChild"
    | "addNextSibling"
    | "remove"
    | "attributes"
    | "characterData";
  value: string;
  oldValue: string | null;
};
export type DocPatch = {
  str_: DocPatchStr;
  dom: DocPatchDom;
};

// Derived from MutationRecord type
export interface TempMutationRecord {
  readonly target: Node;
  readonly type: MutationRecordType;
  readonly addedNode: Node | null;
  readonly removedNode: Node | null;
  readonly previousSibling: Node | null;
  readonly oldValue: string | null;
  readonly attributeName: string | null;
}

//// There was an idea here of using an ordered map data structure to efficiently
////  only consider the nodes that are actually bigger than a given index in the string
////  for index shifting. The problem is that JavaScript isn't low-level enough to properly
////  implement this data structure that can be modified while we are iterating through keys.
////  Without that, this is no faster than just looping through the entire docNodes map.
////  ...and even with that, it is not obvious that the performance gain is tangible or even
////  existent at all.
////  There is some wisdom to be had in not implementing what isn't required, and also, as Donald Knuth said:
////  "Premature optimization is the root of all evils."

// import { OrderedMap } from "js-sdsl";
// type IndexNodeMap = OrderedMap<number, Node>;
// const indexNodeMap = new OrderedMap<number, Node>();

// function shiftKeysAfter(map: IndexNodeMap, index: number, offset: number) {
//   if (offset === 0) return;

//   let it = offset > 0 ? map.reverseUpperBound(index) : map.upperBound(index);
//   let end = offset > 0 ? map.rEnd() : map.end();

//   while (!it.equals(end)) {
//     const [key, value] = it.pointer;
//     map.eraseElementByIterator(it);
//     map.setElement(key + offset, value);
//   }
// }

function getNodeSourceRepresentation(node: Node): string {
  const textContent = he.encode(node.textContent ?? "", {
    useNamedReferences: true,
  });
  switch (node.nodeType) {
    // TODO: I want to explicitly deny ELEMENT_NODE case, because we never actually use this string representation-
    //        we build it up manually in the reconstructHTMLString function, and only use this function for
    //        finding the string reresentations of non-element nodes.
    case Node.ELEMENT_NODE:
      return (node as Element).outerHTML;
    case Node.TEXT_NODE:
      return textContent;
    case Node.COMMENT_NODE:
      return `<!--${textContent}-->`;
    case Node.DOCUMENT_TYPE_NODE:
      return new XMLSerializer().serializeToString(node);
    case Node.PROCESSING_INSTRUCTION_NODE:
      return `<?${(node as ProcessingInstruction).target} ${(node as ProcessingInstruction).data}?>`;
    case Node.CDATA_SECTION_NODE:
      return `<![CDATA[${(node as CDATASection).data}]]>`;
    case Node.DOCUMENT_FRAGMENT_NODE:
      return Array.from(node.childNodes)
        .map(getNodeSourceRepresentation)
        .join("");
    case Node.DOCUMENT_NODE:
      return new XMLSerializer().serializeToString(node);
    default:
      return "";
  }
}

function getElementString(
  el: Element,
): [startingTag: string, closingTag: string | null] {
  // Serialize the HTML opening tag into a string, taking into account attribute masks

  const attrs = Array.from(el.attributes)
    .map((attr) => {
      // Find if there's a mask for this attribute for this element
      const attrMask = maskedAttributes.find(
        ({ name, affectedEls }) =>
          name === attr.name && affectedEls.some(([el_]) => el_ === el),
      );
      // Use the user-facing value of the attribute mask if there is a mask, and otherwise use the real attribute value
      const value = attrMask
        ? attrMask.affectedEls.find(([el_]) => el_ === el)?.[1]
        : attr.value;
      // This condition may be triggered when the user facing value of the attribute is it not being present on the element.
      if (value === null || value === undefined) return;

      return (
        attr.name +
        '="' +
        he.encode(value, {
          useNamedReferences: true,
        }) +
        '"'
      );
    })
    .filter((strOrUndefined) => typeof strOrUndefined === "string")
    .join(" ");
  const startingTagStr = `<${el.tagName.toLowerCase()} ${attrs}>`;

  if (isVoidEl(el)) return [startingTagStr, null];
  else return [startingTagStr, `</${el.tagName.toLowerCase()}>`];
}

function isVoidEl(el: Element) {
  return !el.outerHTML.endsWith(`</${el.tagName.toLowerCase()}>`);
}

export function reconstructHTMLString(
  startNode: Node,
  p: { docNodes?: DocNodeMap; docContainer: Element; debug?: boolean },
  includeContainer: boolean = true,
): [finalStr: string, docNodes: DocNodeMap] {
  const docNodes: DocNodeMap = p.docNodes ?? new Map();
  for (const parentEl of getNodeParents(startNode, p.docContainer)) {
    if (isVoidEl(parentEl)) {
      if (p.debug)
        console.log(
          "%c        ⚠⚠⚠ Attempted adding a node (direct) which had a void element parent\n        ",
          "font-style: italic; color: #555;",
          startNode,
          "Void element parent:",
          parentEl,
        );
      return ["", docNodes];
    }
  }
  const voidEls: Set<Node> = new Set();

  const walker = document.createTreeWalker(startNode, NodeFilter.SHOW_ALL);

  let stringIndex: number = 0;
  let constructedHTMLString: string = "";

  const getNextNode = () => {
    if (includeContainer) {
      includeContainer = false;
      return walker.currentNode;
    } else return walker.nextNode();
  };

  const parentClosingTags: {
    key: Node;
    val: DocNodeEntry;
    closingTag: string;
  }[] = [];

  handleNode: while (getNextNode()) {
    const node = walker.currentNode;
    const parentList = getNodeParents(node, p.docContainer);

    for (const parentEl of parentList) {
      if (voidEls.has(parentEl)) {
        if (p.debug)
          console.log(
            "%c        ⚠⚠⚠ Attempted adding a node (child) which had a void element parent\n        ",
            "font-style: italic; color: #555;",
            node,
            "Void element parent:",
            parentEl,
          );
        continue handleNode;
      }
    }

    const nodeStr = getNodeSourceRepresentation(node);

    // Because of the order in which nodes are explored, when first coming across an element,
    //  we explore all the children of that element *first*, and the first thing that is explored
    //  *after* we have explored all the children is the next sibling of that element.
    // Note, that multiple elements may be closed at the same time e.g. <p>Hello <em>world</em></p><div></div>
    //  would have the parentClosingTags stack of [p, em] at <div>, whose previousSibling is <p>, not <em>
    //  Hence, we have to search the entire stack for matches, not just checking the top element of the stack
    const topClosedParentIndex = parentClosingTags.findLastIndex(
      ({ key }) => node.previousSibling === key,
    );
    if (topClosedParentIndex !== -1) {
      // Must keep this evaluation outside of the loop expression, which reevaluates every iteration
      //  - and the length of parentClosingTags changes as we pop elements
      const numIters = parentClosingTags.length - topClosedParentIndex;
      for (let _ = 0; _ < numIters; _++) {
        const { key, val, closingTag } = parentClosingTags.pop()!;
        // Add this parentElement now, since we finally know what the fullLen is (there are no more children to iterate through)
        docNodes.set(key, val);

        stringIndex += closingTag.length;
        constructedHTMLString += closingTag;
      }
    }

    if (node instanceof Element) {
      if (p.debug)
        console.log(
          "%c        Adding node",
          "font-style: italic; color: #555;",
          node,
        );
      // Find the length of the opening and closing tag of this element
      const [startingTag, closingTag] = getElementString(node);

      const index = stringIndex;
      // Note that we are using startingTag.length, not nodeStr.length. That is because all the children
      //  of this element are systematically going to be explored after this and added to the index/string.
      // Using nodeStr would be double counting them. The only thing unique to an element- that won't be
      //  considered- later is the startingTag and endTag e.g. <p style="margin:0;display:block;">  and </p>
      stringIndex += startingTag.length;
      constructedHTMLString += startingTag;
      const length = startingTag.length + (closingTag?.length ?? 0);

      parentClosingTags.forEach(({ val }) => (val.stringLen += length));

      if (closingTag !== null) {
        parentClosingTags.push({
          key: node,
          val: {
            stringPos: index,
            stringLen: length,
            isEl: true,
            startTagLen: startingTag.length,
            parentList,
          },
          closingTag,
        });
      } else {
        // If this is a void element, then we know what the full length is already and should set its docNodes entry now
        voidEls.add(node);

        docNodes.set(node, {
          stringPos: index,
          stringLen: length,
          isEl: true,
          startTagLen: startingTag.length,
          parentList,
        });
      }
    } else if (nodeStr.length > 0) {
      if (p.debug)
        console.log(
          "%c        Adding node",
          "font-style: italic; color: #555;",
          node,
        );
      docNodes.set(node, {
        stringPos: stringIndex,
        stringLen: nodeStr.length,
        isEl: false,
        parentList,
      });
      parentClosingTags.forEach(({ val }) => (val.stringLen += nodeStr.length));
      stringIndex += nodeStr.length;
      constructedHTMLString += nodeStr;
    } else {
      if (p.debug)
        console.log(
          "%c        Ignoring node because its string length is 0:",
          "font-style: italic; color: #555;",
          node,
        );
    }
  }
  // Any elements that were not yet processed because they didn't have next siblings, are processed now
  while (parentClosingTags.length > 0) {
    const { key, val, closingTag } = parentClosingTags.pop()!;
    docNodes.set(key, val);
    stringIndex += closingTag.length;
    constructedHTMLString += closingTag;
  }
  return [constructedHTMLString, docNodes];
}

/**
 * Returns the index of the added node
 * Assumes node passed in is connected to the DOM
 */
function handleNodeAdd(
  node: Node,
  p: HandleMutationParams,
  returnType: "start" | "length" | "taglength" = "start",
): [patches: DocPatch[], startIndex: number] {
  const findStartIndex = (
    node: Node,
  ): [patches: DocPatch[], startIndex: number] => {
    if (node.previousSibling)
      return handleNodeAdd(node.previousSibling, p, "length");
    else if (node.parentNode === null) {
      throw new Error("Encountered node with no parentNode.");
    } else if (node.parentNode === p.docContainer) return [[], 0];
    else return handleNodeAdd(node.parentNode, p, "taglength");
  };
  const calculateStartIndex = (info: DocNodeEntry) => {
    let offset: number;
    if (returnType === "start") offset = 0;
    else if (returnType === "taglength" && info.isEl) offset = info.startTagLen;
    else offset = info.stringLen;
    return info.stringPos + offset;
  };

  {
    // If this node has a string representation length of 0, we don't add it to docNodes.
    //  However, this function still requires finding the index of this node (it may be used to find the index
    //  of a genuine node that does have non-zero length), thus we continue backwards in the chain to find the index
    //  without adding anything to docNodes
    if (getNodeSourceRepresentation(node).length === 0) {
      if (p.debug)
        console.log(
          "%c    Ignoring node because its string length is 0:",
          "font-style: italic;",
          node,
        );
      return findStartIndex(node);
    }
    // This too is for recursive calls from findStartIndex. If we run into a node that has already been added
    //  we can use it to calculate all the indexes forward to the original handleNodeAdd() call
    const nodeInfo = p.docNodes.get(node);
    if (nodeInfo) {
      if (p.debug)
        console.log(
          "%c    Ignoring node because it is already in docNodes:",
          "font-style: italic;",
          node,
        );
      return [[], calculateStartIndex(nodeInfo)];
    }

    if (isPotentialLocation(node)) {
      if (p.debug)
        console.log(
          "%c    Ignoring node because it is a potential location element:",
          "font-style: italic;",
          node,
        );
      return findStartIndex(node);
    }
  }

  if (p.debug) console.log("%c    Adding node", "font-style: italic;", node);

  // At this point, we are commited to adding this node (and its children) to docNodes
  const [patches, startIndex] = findStartIndex(node);
  const newPatches: DocPatch[] = [...patches];

  {
    const nodeInfo = p.docNodes.get(node);
    if (nodeInfo) {
      if (p.debug)
        console.log(
          "%c    Ignoring node because it is already in docNodes after findStartIndex call (added parent in calculating start index):",
          "font-style: italic;",
          node,
        );
      return [newPatches, calculateStartIndex(nodeInfo)];
    }
  }

  const [fullString, newDocNodes] = reconstructHTMLString(node, {
    docContainer: p.docContainer,
    debug: p.debug,
  });

  const newInfo = newDocNodes.get(node);
  if (!newInfo) {
    if (p.debug)
      console.error(
        "Couldn't find node in newDocNodes after calling reconstructHTMLString:",
        node,
        "\nThis may be because the element was a child of a void element.",
      );
    return [newPatches, startIndex];
  }

  // First we do all the index shifting- essentially "making space" for the added node before including it in docNodes
  let prevNodeStart: number = -1;
  p.docNodes.forEach((val) => {
    if (val.stringPos > prevNodeStart && val.stringPos < startIndex)
      prevNodeStart = val.stringPos;
    else if (val.stringPos >= startIndex) val.stringPos += fullString.length;
  });
  newInfo.parentList.forEach((parent) => {
    newPatches.push(...handleNodeAdd(parent, p)[0]);
    const parentInfo = p.docNodes.get(parent);
    if (!parentInfo)
      throw new Error(
        "Somehow couldn't find parentInfo after calling handleNodeAdd(parent)",
      );
    parentInfo.stringLen += fullString.length;
  });

  // Now we add the entries of the map reconstructHTMLString created to docNodes
  newDocNodes.entries().forEach(([key, val]) => {
    val.stringPos += startIndex;
    // The key to avoiding this scenario (laid out in the error msg) is first processing all the remove calls
    //  in a mutation record batch. Then processing all the add calls, then processing all the attributes and characterData calls.
    if (p.docNodes.has(key)) {
      if (p.debug)
        console.error(node, "is already in docNodes:", p.docNodes.get(key));
      throw new Error("Attempted to add node that is already in docNodes");
    } else p.docNodes.set(key, val);
  });

  const strPatch: DocPatch["str_"] = {
    value: fullString,
    start: startIndex,
    length: 0,
  };
  const domPatch: DocPatch["dom"] = {
    start: prevNodeStart,
    type: node.previousSibling ? "addNextSibling" : "addFirstChild",
    value: fullString,
    oldValue: "",
  };
  const patch: DocPatch = { str_: strPatch, dom: domPatch };
  newPatches.push(patch);

  // Apply string patch to HTML string right away
  if (p.htmlStr) p.htmlStr = applyPatches(p.htmlStr, [patch]);

  return [newPatches, calculateStartIndex(newInfo)];
}

function handleNodeRemove(
  node: Node,
  p: HandleMutationParams,
): [patches: DocPatch[]] {
  const nodeInfo = p.docNodes.get(node);
  if (!nodeInfo) {
    if (p.debug)
      console.warn(
        "%c    Attempted to remove a node not found in nodeInfo",
        "font-style: italic;",
      );
    return [[]];
  }

  // getAllChildNodes(node).forEach((child) => p.docNodes.delete(child));

  p.docNodes.delete(node);
  if (p.debug) console.log("%c    Removing node", "font-style: italic;", node);
  // Also delete all the children. Cannot exactly rely on getAllChildNodes, because
  //  there may have been removals also happening that stop what is considered a child
  //  of this node by the map at this time from being an actual child now
  //  (what getAllChildNodes is checking)
  p.docNodes.forEach((val, key) => {
    if (
      nodeInfo.isEl &&
      val.stringPos >= nodeInfo.stringPos + nodeInfo.startTagLen &&
      val.stringPos < nodeInfo.stringPos + nodeInfo.stringLen
    ) {
      p.docNodes.delete(key);
      if (p.debug)
        console.log("%c    Removing node", "font-style: italic;", key);
    } else if (val.stringPos >= nodeInfo.stringPos + nodeInfo.stringLen) {
      // It's fine to modify this entry during iteration as it doesn't affect other entries
      val.stringPos -= nodeInfo.stringLen;
    }
  });

  nodeInfo.parentList.forEach((parent) => {
    const parentInfo = p.docNodes.get(parent);
    // A parent can't be removed from docNodes without also removing its children.
    // When adding a node, all its parents are also added to docNodes.
    // Thus, it should be impossible for there to be a node which have parents with missing docNodes entries.
    if (!parentInfo)
      throw new Error(
        "Somehow found parent of node which doesn't have docNodes entry in remove call",
      );
    parentInfo.stringLen -= nodeInfo.stringLen;
  });

  const strPatch: DocPatch["str_"] = {
    value: "",
    start: nodeInfo.stringPos,
    length: nodeInfo.stringLen,
  };
  const domPatch: DocPatch["dom"] = {
    start: nodeInfo.stringPos,
    type: "remove",
    value: "",
    oldValue: getNodeSourceRepresentation(node),
  };
  const patch: DocPatch = { str_: strPatch, dom: domPatch };

  // Apply string patch to HTML string right away
  if (p.htmlStr) p.htmlStr = applyPatches(p.htmlStr, [patch]);

  return [[patch]];
}

function handleAttributeChange(
  el: Element,
  p: HandleMutationParams,
): [patches: DocPatch[]] {
  const nodeInfo = p.docNodes.get(el);
  if (!nodeInfo) {
    if (p.debug)
      console.warn(
        "----Attempted to change the attribute of an element not found in nodeInfo:",
        el,
        "\n    This may be because the element has a void element parent.",
      );
    return [[]];
  } else if (!nodeInfo.isEl) {
    console.error(
      "Target of attribute change was not considered element in docNodes:",
      el,
    );
    return [[]];
  }

  const [newStartTag] = getElementString(el);
  const lenDiff = newStartTag.length - nodeInfo.startTagLen;

  if (lenDiff !== 0) {
    p.docNodes.forEach((val, key) => {
      if (val.stringPos >= nodeInfo.stringPos + nodeInfo.startTagLen)
        val.stringPos += lenDiff;
    });
    nodeInfo.parentList.forEach((parent) => {
      const parentInfo = p.docNodes.get(parent);
      if (!parentInfo)
        throw new Error(
          "Somehow found parent of node which doesn't have docNodes entry in attribute call",
        );
      parentInfo.stringLen += lenDiff;
    });
  }

  // Define the patch before we update the nodeInfo of this node
  const strPatch: DocPatch["str_"] = {
    value: newStartTag,
    start: nodeInfo.stringPos,
    length: nodeInfo.startTagLen,
  };
  const domPatch: DocPatch["dom"] = {
    start: nodeInfo.stringPos,
    type: "attributes",
    value: newStartTag,
    oldValue:
      p.htmlStr?.slice(
        nodeInfo.stringPos,
        nodeInfo.stringPos + nodeInfo.startTagLen,
      ) ?? null,
  };
  const patch: DocPatch = { str_: strPatch, dom: domPatch };

  nodeInfo.startTagLen += lenDiff;
  nodeInfo.stringLen += lenDiff;
  if (p.debug) console.log("----Changing attributes of node", el);

  // Apply string patch to HTML string right away
  if (p.htmlStr) p.htmlStr = applyPatches(p.htmlStr, [patch]);

  return [[patch]];
}

function handleCharacterDataChange(
  node: Node,
  p: HandleMutationParams,
): [patches: DocPatch[]] {
  const nodeInfo = p.docNodes.get(node);
  // TODO: We ignore adding nodes with a string representation length of 0 to docNodes, because they
  //        potentially mess up the algorithm (at this point that should be reconsidered, though).
  //        An attribute change will not bring a node from 0 to non-0 length because elements can never
  //        have 0 length. However, a characterData mutation could do that, and so in this case we may
  //        be unfairly ignoring a node that is modified to have non-0 length.
  //       A characterData mutation may also modify a node to have 0 length, which would ruin the point
  //        of ignoring them in the first place.
  if (!nodeInfo) {
    if (p.debug)
      console.warn(
        "----Attempted to change the text content of a node not found in nodeInfo:",
        node,
        "\n    This may be because the node has 0 length in its string representation,\n    or because the node has a void element parent.",
      );
    return [[]];
  }

  const newNodeStr = getNodeSourceRepresentation(node);
  const lenDiff = newNodeStr.length - nodeInfo.stringLen;

  if (lenDiff !== 0) {
    p.docNodes.forEach((val, key) => {
      if (val.stringPos >= nodeInfo.stringPos + nodeInfo.stringLen)
        val.stringPos += lenDiff;
    });
    nodeInfo.parentList.forEach((parent) => {
      const parentInfo = p.docNodes.get(parent);
      if (!parentInfo) {
        throw new Error(
          "Somehow found parent of node which doesn't have docNodes entry in attribute call",
        );
      }
      parentInfo.stringLen += lenDiff;
    });
  }

  // Define the patch before we update the nodeInfo of this node
  const strPatch: DocPatch["str_"] = {
    value: newNodeStr,
    start: nodeInfo.stringPos,
    length: nodeInfo.stringLen,
  };
  const domPatch: DocPatch["dom"] = {
    start: nodeInfo.stringPos,
    type: "characterData",
    value: newNodeStr,
    oldValue:
      p.htmlStr?.slice(
        nodeInfo.stringPos,
        nodeInfo.stringPos + nodeInfo.stringLen,
      ) ?? null,
  };
  const patch: DocPatch = { str_: strPatch, dom: domPatch };

  nodeInfo.stringLen += lenDiff;
  if (p.debug) console.log("----Changing text of node", node);

  // Apply string patch to HTML string right away
  if (p.htmlStr) p.htmlStr = applyPatches(p.htmlStr, [patch]);

  return [[patch]];
}

interface HandleMutationParams {
  docNodes: DocNodeMap;
  docContainer: Element;
  htmlStr?: string;
  debug?: boolean;
}

export function handleMutationRecordPatch(
  record: TempMutationRecord,
  p: HandleMutationParams,
): [patches: DocPatch[], newHTMLStr?: string] {
  const patches: DocPatch[] = [];

  // prettier-ignore
  if (!p.htmlStr) console.warn("Without providing the last derived htmlStr of the document, the DOM patches for attributes and characterData won't have an oldValue.")

  switch (record.type) {
    case "childList":
      if (record.addedNode) {
        const node = record.addedNode;
        const nodeInfo = p.docNodes.get(node);

        if (node.isConnected && !nodeInfo) {
          if (p.debug) console.log("----Adding node", node);
          const [newPatches] = handleNodeAdd(node, p, "start");
          patches.push(...newPatches);
        } else if (p.debug) {
          console.log(
            `---Not adding node because ${!node.isConnected ? "it is not connected to the DOM. " : ""} ${nodeInfo ? "it is already in docNodes" : ""}:`,
            node,
          );
        }
      } else if (record.removedNode) {
        const node = record.removedNode;
        const nodeInfo = p.docNodes.get(node);

        if (nodeInfo) {
          if (p.debug) console.log("----Removing node", node);
          const [newPatches] = handleNodeRemove(node, p);
          patches.push(...newPatches);
        } else if (p.debug) {
          console.log(
            "----Not removing node because it is already missing from docNodes:",
            node,
          );
        }
      }
      break;
    case "attributes":
      {
        const node = record.target;
        const [newPatches] = handleAttributeChange(node as Element, p);
        patches.push(...newPatches);
      }
      break;
    case "characterData":
      {
        const node = record.target;
        const [newPatches] = handleCharacterDataChange(node, p);
        patches.push(...newPatches);
      }
      break;
  }

  return [patches, p.htmlStr];
}

export function processMutations(
  mutations: MutationRecord[],
): TempMutationRecord[] {
  const final: TempMutationRecord[] = mutations.flatMap((record) => {
    const total =
      record.type === "childList"
        ? record.addedNodes.length + record.removedNodes.length
        : 1;
    const removed =
      record.type === "childList" ? record.removedNodes.length : NaN;
    return Array.from(Array(total), (_, i) => {
      return {
        target: record.target,
        type: record.type,
        attributeName: record.attributeName,
        oldValue: record.oldValue,
        removedNode: i < removed ? record.removedNodes[i] : null,
        addedNode: i >= removed ? record.addedNodes[i - removed] : null,
        previousSibling: record.previousSibling,
      };
    });
  });

  return final;
}

const isPotentialLocation = (node?: Node | null) =>
  node instanceof HTMLElement &&
  (node.classList.contains("potential-location") ||
    node.parentElement?.classList.contains("potential-location"));

let prevFetch: Promise<Response> | null = null;
export function patchMutations(
  mutations: TempMutationRecord[],
  documentID: number,
  p: {
    docNodes: DocNodeMap;
    stringPosNodeMap: StringPosNodeMap;
    docContainer: Element;
  },
  opts: {
    updateHTMLStr?: string;
    debug?: boolean;
    disableServerSync?: boolean;
  } = {},
) {
  let newHTMLString = opts.updateHTMLStr ?? "";

  // Should be negative if a precedes b
  mutations.sort((a, b) => {
    // childList mutatuons precede all other mutations.
    // Among childList mutations, all remove node mutations precede all add node mutations.
    // Among non-childList mutations, the order does not matter.
    if (a.type === "childList" && b.type === "childList") {
      if (a.removedNode && b.addedNode) return -1;
      else if (a.addedNode && b.removedNode) return 1;
    } else if (a.type === "childList" && b.type !== "childList") return -1;
    else if (a.type !== "childList" && b.type === "childList") return 1;
    return 0;
  });

  if (opts.debug) console.log("Final mutation list order:", mutations);

  const patches: DocPatch[] = [];
  for (const mutation of mutations) {
    // Ignore anything and everything to do with 'potential-location's
    // Potential-locations created by the editor are either a div element
    //  with the relevant class or a span element with the relevant class
    //  and a single direct child which is a div (without the class).
    if (
      isPotentialLocation(mutation.target) ||
      isPotentialLocation(mutation.addedNode) ||
      isPotentialLocation(mutation.removedNode)
    )
      continue;

    const [newPatches, htmlStrUpdate] = handleMutationRecordPatch(mutation, {
      ...p,
      htmlStr: opts.updateHTMLStr ? newHTMLString : undefined,
      debug: opts.debug,
    });
    patches.push(...newPatches);

    if (opts.updateHTMLStr) {
      if (typeof htmlStrUpdate !== "string")
        throw new Error(
          "Somehow got undefined htmlStrUpdate from handleMutationRecordPatch when opts.updateHTMLStr was set.",
        );
      // handleMutationRecordPatch updates the HTML string immediately after every docNodes change
      //  (when a new patch is created), because DOM `DocPatch`es of type attribute and characterData rely
      //  on an up-to-date HTML string for their `oldValue`s.
      newHTMLString = htmlStrUpdate;
    }
  }

  p.stringPosNodeMap = new Map();
  p.docNodes.forEach((val, key) => p.stringPosNodeMap.set(val.stringPos, key));

  console.log("PATCHES:", patches);

  const createFetch = () =>
    fetch_("/documents/sync_document_patch", {
      method: "post",
      body: JSON.stringify({
        id: documentID,
        patches: patches.map((patch) => {
          return {
            index: patch.str_.start,
            length: patch.str_.length,
            value: patch.str_.value,
          };
        }),
      }),
    });

  if (!opts.disableServerSync && patches.length > 0) {
    if (prevFetch === null) prevFetch = createFetch();
    else prevFetch = prevFetch.then(createFetch);
  }

  return newHTMLString;
}

export function applyPatches(docStr: string, patches: DocPatch[]) {
  // debugger;
  for (const patch of patches) {
    // debugger;
    docStr =
      docStr.slice(0, patch.str_.start) +
      patch.str_.value +
      docStr.slice(patch.str_.start + patch.str_.length);
  }
  return docStr;
}
