import { getAllTextNodes, lastChild, nextElementSibling } from "./helper";
import { mode } from "./store.svelte";
import { request2AnimationFrames } from "/shared/helper";

function removeTextContent(node: Node) {
  const oldText = getAllTextNodes(node).map((node_) => {
    const node = node_ as Text;
    const next = nextElementSibling(node);
    const parent = node.parentNode;
    if (parent) {
      ignoreDOMMutation(
        { node: parent, type: "childList", origin: "removeTextContent" },
        () => node.remove(),
      );
    }
    return { node, next, parent };
  });
  return () => {
    oldText.forEach(({ node, next, parent }) => {
      if (!parent) return;
      // For some reason, this insertBefore call is not consistent in triggering
      //  the MutationObserver; in block elements it does, and in inline elements
      //  it doesn't. Nothing changes, from 'parent', 'node' or 'next' or the return
      //  value of insertBefore() but this difference in behaviour still exists (at
      //  least in FireFox).
      // This is the reason that ignoreDOMMutation() sets a unique ID to each MutationIgnoreRecord,
      //  waits an animation frame for the observer to potentially trigger and removes
      //  this ID if it still exists in the array.
      // The above DOM mutation removing the text nodes also sometimes does the same thing, though less rarely.
      // Both of these might be due to both happening in the same frame, causing inconsistent behaviour.
      ignoreDOMMutation(
        { node: parent, type: "childList", origin: "Undo removeTextContent" },
        () => parent.insertBefore(node, next),
      );
    });
  };
}

// "strict = true" only returns true if the node's text content is an empty string
// "strict = false" returns true as long as it's only whitespace
function nodeWhitespaceRestricted(node: Node, strict = true) {
  if (node instanceof HTMLElement) {
    return (
      (strict ? node.innerText : node.innerText.trim()) === "" &&
      !node.classList.contains("potential-location") &&
      !node.parentElement?.classList.contains("potential-location")
    );
  } else if (node instanceof Text) {
    return (strict ? node.textContent : node.textContent?.trim()) === "";
  }
}

function addNBSP(el: Node) {
  if (!nodeWhitespaceRestricted(el)) return;
  if (el instanceof HTMLElement) {
    // While we could, instead of all this, just set el.textContet, but we should be
    //  sure what kind of DOM manipulation this produces; adding a new text node or editing an existing one?
    const allTextNodes = getAllTextNodes(el);
    if (allTextNodes.length > 0) {
      ignoreDOMMutation(
        { node: allTextNodes[0], type: "characterData", origin: "addNBSP1" },
        () => (allTextNodes[0].textContent = "\u00A0"),
      );
    } else {
      ignoreDOMMutation(
        { node: el, type: "childList", origin: "addNBSP2" },
        () => el.insertBefore(document.createTextNode("\u00A0"), el.firstChild),
      );
    }
  }
}

type MutationIgnoreRecord = {
  node: Node;
  type: MutationRecord["type"];
  addedNodes?: MutationRecord["addedNodes"];
  removedNodes?: MutationRecord["removedNodes"];
  attributeName?: MutationRecord["attributeName"];
  id?: number;
  origin?: string;
};
const queuedMutationIgnores: MutationIgnoreRecord[] = [];

let uuid: number = 0;
function ignoreDOMMutation(record: MutationIgnoreRecord, func: Function) {
  record.id ??= uuid++;
  queuedMutationIgnores.push(record);
  func();
  requestAnimationFrame(() => {
    const index = queuedMutationIgnores.findIndex(({ id }) => id === record.id);
    if (index !== -1) queuedMutationIgnores.splice(index, 1);
  });
}

// This function to be called in a MutationObserver is to
//  1- disallow non-element nodes as direct children of docEl
//      AND enforce at least one element in the document
//  2- try enforce no "collapsed" elements (that is, elements with 0 height and/or width),
//    by making those that WOULD, take a single non-breaking space (&nbsp;) character as textContent
//  3- check elements with only whitespace as text content if that white space could be removed
//    and not have the element collapse (e.g. some CSS sets the height and width already), in which
//    case remove that whitespace
//  4- remove any last island of <br> child elements from elements that have only whitespace as text
//    content. These <br>s do nothing (typically) for page flow or otherwise, and are just artefacts
//    from the contentEditable process (in which there is no way for the user to delete them manually)
export function handleCollapsePrevention(
  unfilteredMutations: MutationRecord[],
  docEl?: HTMLElement,
) {
  // console.log("mutation observer triggered", unfilteredMutations);

  const mutations: MutationRecord[] = [];
  for (const mutation of unfilteredMutations) {
    const target = mutation.target;
    // prettier-ignore
    const ignoreI = queuedMutationIgnores.findIndex((record) => {
        const addedNodesMatch = record.addedNodes ? record.addedNodes === mutation.addedNodes : true;
        const removedNodesMatch = record.removedNodes ? record.removedNodes === mutation.removedNodes : true;
        const attributeNameMatch = record.attributeName ? record.attributeName === mutation.attributeName : true;
        return record.node === target && record.type === mutation.type && addedNodesMatch && removedNodesMatch && attributeNameMatch;
      });
    if (ignoreI !== -1) {
      // console.log([...queuedMutationIgnores], mutation);
      queuedMutationIgnores.splice(ignoreI, 1);
    } else mutations.push(mutation);
  }

  for (const mutation of mutations) {
    const target = mutation.target;

    // 1)
    mutation.addedNodes.forEach((added) => {
      if (added.nodeType !== Node.ELEMENT_NODE && added.parentElement === docEl)
        added.parentElement.removeChild(added);
    });
    request2AnimationFrames(() => {
      // console.log("Checking for empty document", docEl);
      if (docEl?.childElementCount === 0) {
        const div = document.createElement("div");
        div.innerHTML =
          "Without at least one node, it is impossible to add anything - as it relies on adding things RELATIVE to OTHER nodes.";
        docEl.appendChild(div);
      }
    });

    // 2) Handle newly added nodes, making sure they aren't collapsed
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach(addNBSP);
    }

    const el =
      mutation.type === "characterData" ? target.parentElement : target;

    // Handling of 2/3 and 4 are only required if the element only contains whitespace
    if (!(el instanceof HTMLElement) || !nodeWhitespaceRestricted(el, false))
      continue;

    let removedBRs: boolean = false;
    // 4) Remove any list island of BRs
    while (true) {
      const last = lastChild(el);
      if (last instanceof HTMLElement && last.tagName === "BR") {
        ignoreDOMMutation(
          { node: el, type: "childList", origin: "removeBR" },
          () => last.remove(),
        );
        removedBRs = true;
      } else {
        // 2) If BRs were removed then there's a chance that the element has no collapsed
        //     which must be handled.
        if (removedBRs && el.innerText === "") addNBSP(el);
        break;
      }
    }

    // 2) Check if the modification of this element has collapsed it, and rectify if so
    if (el.innerText === "") {
      const rect = el.getBoundingClientRect();
      if (rect.height * rect.width >= 1) continue;

      addNBSP(el);
      if (mode.cursor === "edit")
        getSelection()?.setBaseAndExtent(target, 0, target, 1);
    }
    // 3) We know this element has only whitespace- because of the early termination above-
    //     and so we're checking if the nbsp (or other) could be safely removed.
    if (el.innerText !== "") {
      // If the element's innerText is just a single nbsp character, that indicates
      //  the user would like this element to be empty, but we don't allow that
      //  unless the element has some non-zero area that could be hovered and selected.
      const undo = removeTextContent(el);
      if (el !== docEl) {
        const rect = el.getBoundingClientRect();
        if (rect.height * rect.width < 1) undo();
      } else {
        // The element we're trying to see is collapsed or not is the document container itself,
        //  which is guaranteed to stretch the screen height. Thus, for this element we see add heights
        //  of its immediate children instead.
        const children = Array.from(el.children);
        const avgArea = children
          .map((child) => {
            const rect = child.getBoundingClientRect();
            return (rect.height * rect.width) / children.length;
          })
          .reduce((p, c) => p + c, 0);
        if (avgArea < 1) undo();
      }
    }
  }
}
