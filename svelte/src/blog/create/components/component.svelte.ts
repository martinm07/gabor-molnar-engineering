import { get } from "svelte/store";
import {
  savedComponents,
  nodesSelection,
  nodeHoverTarget,
  type SavedComponent,
  compLibEdits,
  editorState,
  compLibVer,
} from "../store.svelte";
import { reconstructHTMLString } from "../docsyncing";
import {
  getAllChildNodes,
  getNextElement,
  getNodeParents,
  getNthParent,
} from "../helper";
import { fetch_, assign } from "/shared/helper";

const encodeStr = (str: string) => encodeURI(str);
const decodeStr = (str: string) => decodeURI(str);
// export function generateCompContentStr(el: Node, includeRoot = false) {
//   const walker = document.createTreeWalker(el, NodeFilter.SHOW_ALL);
//   let content = "";
//   const parts: string[] = [];
//   const parents: Node[] = [];
//   const siblingIndices: number[] = [0];
//   let prev: Node | undefined = undefined;
//   if (includeRoot) step(el);

//   while (walker.nextNode()) {
//     const node = walker.currentNode;
//     step(node);
//   }

//   function step(node: Node) {
//     // When we've escaped a parent, we need to add a closing tag
//     if (node.previousSibling === parents.at(-1)) {
//       content += "</>";
//       parents.pop();
//       siblingIndices.pop();
//     }
//     // When we haven't jumped to the next sibling, that means
//     //  we've jumped inside the previous element, it is now a parent
//     else if (prev && node.previousSibling !== prev) {
//       parents.push(prev);
//       siblingIndices.push(0);
//     }

//     // console.log(node, parents);

//     if (node instanceof Text) {
//       content += encodeStr(node.textContent ?? "");
//     } else if (node instanceof Element) {
//       let attrStr = "";
//       for (let i = 0; i < node.attributes.length; i++) {
//         const attr = node.attributes[i];
//         if (attr.nodeName === "data-component") continue;
//         attrStr += `:${attr.nodeName}="${encodeStr(attr.nodeValue ?? "")}"`;
//       }
//       siblingIndices[siblingIndices.length - 1]++;
//       parts.push(siblingIndices.join(","));
//       attrStr += `:data-component="${encodeStr(`${name}-[${siblingIndices.join(",")}]`)}"`;

//       content += `<${node.tagName.toLowerCase()}${attrStr}>`;
//       if (!node.hasChildNodes()) content += "</>";
//     }
//     prev = node;
//   }

//   return content;
// }

/**
 * Using 1-based indexing
 */
function getSiblingIndex(el: Element) {
  const parent = el.parentElement;
  if (!parent) return 1;
  const index = Array.from(parent.children).indexOf(el);
  if (index === -1)
    throw new Error("Somehow parent element didn't have element as child.");
  return index + 1;
}

export function generateCompContentStr(topEl: HTMLElement, compName: string) {
  // The reconstructHTMLString creates the HTML string for the document, taking
  //  into account masked attribute values, and also gives a mapping of nodes to
  //  their indexes and lengths in the generated HTML string, which allows us to
  //  manually insert "data-component" attributes without ever actually affecting
  //  the DOM.
  let [htmlStr, nodeMap] = reconstructHTMLString(
    topEl,
    { docContainer: topEl },
    false,
  );

  // Create a list of string updates to add all the data-componet attributes to HTMLElements
  const strUpdates: { insert: string; index: number }[] = [];
  const allPartsStrings: string[] = [];
  nodeMap.entries().forEach(([node, info]) => {
    if (info.isEl && node instanceof HTMLElement) {
      // This creates a list of the element, then all its parents up-to-but-not-including topEl
      //  (which is just the container for our component), reverses the order (to go from top-most
      //  to bottom-most element) and creates a string of the sibling indexes of all these elements.
      const partsStr = [node, ...getNodeParents(node, topEl)]
        .toReversed()
        .map((el) => getSiblingIndex(el))
        .join(",");

      strUpdates.push({
        index: info.stringPos + info.startTagLen - 1, // -1 because we want to insert before the closing ">"
        insert: ` data-component="${compName}-[${partsStr}]"`,
      });
      allPartsStrings.push(partsStr);
    }
  });

  // Sort so that the biggest index is first (avoiding index shifting)
  strUpdates.sort((a, b) => b.index - a.index);

  strUpdates.forEach(({ index, insert }) => {
    htmlStr = htmlStr.slice(0, index) + insert + htmlStr.slice(index);
  });

  return { content: htmlStr, parts: allPartsStrings.toSorted().join("|") };
}

// setTimeout(() => {
//   const el = document.querySelector("div:has(+ p)")!;
//   // console.log(el);
//   createNewComponent("new-comp", el);
//   console.log(get(savedComponents));
//   // console.log(decodeComponentStr(get(savedComponents)[0].content));
// }, 1000);

// export function decodeComponentStr(str: string) {
//   const fragment = document.createDocumentFragment();
//   let activeLoc: Node | null = null;
//   const regex = /(<[\s\S]+?>)|((?<=>)[\s\S]+?(?=<))/g;
//   // console.log(str.match(regex));
//   str.match(regex)?.forEach((substr) => {
//     if (substr === "</>") activeLoc = activeLoc?.parentNode ?? null;
//     // The substr is an element
//     else if (substr.startsWith("<")) {
//       // This regex matches colons only if there's an even number of double
//       //  quote characters behind it spread throughout the string
//       // FUN FACT: When the seperator given to .split() is a RegExp with capturing groups,
//       //            those groups will be spliced into the result (even if it's 'undefined')
//       // "Hello world".split(/o( )w/g) // Array(3) [ "Hell", " ", "orld" ]
//       const items = substr.slice(1, -1).split(/(?<=^[^"]*(?:"[^"]*"[^"]*)*):/g);
//       // console.log(substr, items);
//       const newEl = document.createElement(items[0]);
//       const allAttrs: { name: string; value: string }[] = items
//         .slice(1)
//         .map((item) => {
//           return {
//             name: item.split("=")[0],
//             value: decodeStr(item.split("=")[1].slice(1, -1)),
//           };
//         });
//       allAttrs.forEach((attr) => newEl.setAttribute(attr.name, attr.value));
//       if (activeLoc) activeLoc.appendChild(newEl);
//       else fragment.appendChild(newEl);
//       activeLoc = newEl;
//     } else {
//       // The substr is a text node
//       const newText = document.createTextNode(decodeStr(substr));
//       if (activeLoc) activeLoc.appendChild(newText);
//       else fragment.appendChild(newText);
//     }
//   });
//   // console.log(fragment);
//   return fragment;
// }
export function decodeComponentStr(
  content: string,
  for_: "document" | "component",
) {
  const fragment = document.createDocumentFragment();
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = content;

  if (for_ === "component")
    getAllChildNodes(tempDiv).forEach((node) => {
      if (node instanceof HTMLElement) node.removeAttribute("data-component");
    });

  while (tempDiv.firstChild) fragment.appendChild(tempDiv.firstChild);
  return fragment;
}

export function componentNameValid(str: string) {
  return (
    /-\[(\d+,)*\d+\]$/g.test(str) &&
    savedComponents.some(({ name }) => str.startsWith(name))
  );
}

function getCompNameAndPart(compName: string): [name: string, part: string] {
  if (!componentNameValid(compName))
    throw new Error(`Component name provided was invalid. Got: "${compName}"`);
  const nameParts = compName.split("-");
  const partsArr = nameParts.at(-1)!.slice(1, -1);
  return [nameParts.slice(0, -1).join("-"), partsArr];
}

export function changeElToComp(el: Element, compName: string) {
  const [name, part] = getCompNameAndPart(compName);
  // console.log(name, part);
  const saved = savedComponents.find((item) => item.name === name)!;
  // console.log(saved);
  if (!saved.parts.split("|").includes(part))
    throw new Error(
      `The provided component name does not have the provided part "${part} NOT IN ${saved.parts
        .split("|")
        .map((str) => '"' + str + '"')
        .join("  ")}"`,
    );
  const content = saved.content;

  // This assumes that the order of the parts array will match the content string document order
  const elIndex = saved.parts.split("|").findIndex((item) => item === part);
  // This regex matches the first e.g. <tagName:attr1="value"> that has at
  //  least an elIndex number of </> behind it in the string
  // const regex = new RegExp(
  //   String.raw`(?<=(?:[^]*<\/>[^]*){` +
  //     String(elIndex) +
  //     String.raw`})<[^/]+?>`,
  // );

  const regex = new RegExp(
    String.raw`(?<=(?:<[^/][^]*){` + String(elIndex) + String.raw`})<[^/]*?>`,
  );

  const match = regex.exec(content)?.[0]?.slice(1, -1);
  console.log(elIndex, match);
  if (!match)
    throw new Error(
      `Could not find the provided part in the provided component name content`,
    );
  const newTagName = match.split(":")[0];
  let el_ = el;
  if (el.tagName !== newTagName.toUpperCase()) {
    const newEl = document.createElement(newTagName);
    while (el.firstChild) newEl.appendChild(el.firstChild);
    el.replaceWith(newEl);

    if (get(nodeHoverTarget) === el) nodeHoverTarget.set(newEl);
    if (get(nodesSelection).some((item) => item === el))
      nodesSelection.update((old) =>
        old.map((item) => (item === el ? newEl : item)),
      );

    el_ = newEl;
  }

  const newAttrs: [string, string][] = match
    .split(/(?<=^[^"]*(?:"[^"]*"[^"]*)*):/g)
    .slice(1)
    .map((str) => {
      const parts = str.split("=");
      return [parts[0], decodeStr(parts[1].slice(1, -1))];
    });
  newAttrs.forEach(([name, newVal]) => {
    if (el_.getAttribute(name) !== newVal) el_.setAttribute(name, newVal);
  });
  // console.log(Array(...el_.attributes));
  Array(...el_.attributes).forEach((attr) => {
    if (!newAttrs.some(([name]) => name === attr.nodeName))
      el_.removeAttribute(attr.nodeName);
  });
}

// The database integration will be as follows;
// There is one table for guidance documents, whether published or unpublished, that also includes the
//  component library UID, and a separate table for the saved components, and then another table "params"
//  that has an entry for the current saved components' table UID.
// When queried to make changes to the saved components table, all the views return the resultant UID
// The loaded guidance document of the editor has its own UID (from the table entry), and there's a view the
//  editor can call to update the UID, along with an update to the content, when the user selects that they
//  would like this to happen

export interface CompParts {
  name: string;
  content: string;
  parts: string;
  description: string;
  tags: string;
}
type CompPartsKey = keyof CompParts;
// prettier-ignore
const keysList: Array<CompPartsKey> = ["name", "content", "parts", "description", "tags"];

export function updateCompEdit(identName: string, update: Partial<CompParts>) {
  console.log(`Updating component edit with name "${identName}"`, update);

  const currentLib = $state.snapshot(savedComponents);
  const newLib = compLibEdits.current;

  let i: number;
  // If the component already has an edit stored which is updating an existing component
  if (
    (i = newLib.findIndex(
      (edit) => edit.type === "edit" && edit.identName === identName,
    )) !== -1
  ) {
    newLib[i] = assign($state.snapshot(newLib[i]), update);

    const current = currentLib.find((comp) => comp.name === identName);
    if (!current)
      throw new Error(
        "compLibEdits is editing a component which doesn't exist in the current library",
      );

    // Check if the edits have made it identical to what component currently are, in which
    //  case remove the edit entry from compLibEdits (so the user is not given a false impression
    //  of "saving changes" when there are no changes).
    const isSame = keysList.every(
      (keyName) =>
        newLib[i][keyName] === undefined ||
        newLib[i][keyName] === null ||
        current[keyName] === newLib[i][keyName],
    );
    if (isSame) newLib.splice(i, 1);
  } else if (
    // If the component is being added, in which case change what is being added
    (i = newLib.findIndex(
      (edit) => edit.type === "add" && edit.identName === identName,
    )) !== -1
  ) {
    newLib[i] = assign($state.snapshot(newLib[i]), update);
    // For added component, their identifying name *is* their current name (because they had no previous name)
    // newLib[i] = assign($state.snapshot(newLib[i]), { name: identName });
  } else if (
    // If the component does not have an existing edit or is being added, then create a new edit
    (i = currentLib.findIndex((comp) => comp.name === identName)) !== -1
  ) {
    // We only create the new edit if something is actually changing
    const isSame = keysList.every(
      (keyName) =>
        update[keyName] === undefined ||
        update[keyName] === null ||
        currentLib[i][keyName] === update[keyName],
    );

    if (!isSame)
      newLib.push({
        type: "edit",
        identName: currentLib[i].name,
        ...update,
      });
  }
}

export function updateCompAdd(add: { name: string } & Partial<CompParts>) {
  const newLib = compLibEdits.current;

  // Generates a hexadeciaml number
  // (Math.random generates a float between 0 - 1, convert to hex with toString and slice the "0." at the start)
  const identName = Math.random().toString(16).slice(2);

  const newLibEdit: (typeof compLibEdits.current)[0] = {
    type: "add",
    identName,
    ...add,
  };
  newLib.push(newLibEdit);
  return newLibEdit;
}

export function updateCompRemove(identName: string) {
  const newLib = compLibEdits.current;
  const addedI = newLib.findIndex(
    (edit) => edit.type === "add" && edit.identName === identName,
  );
  if (addedI !== -1) newLib.splice(addedI, 1);
  else
    newLib.push({
      type: "remove",
      identName: identName,
    });
}
export function updateCompRestore(identName: string) {
  const newLib = compLibEdits.current;
  const i = newLib.findIndex(
    (edit) => edit.type === "remove" && edit.identName === identName,
  );
  if (i !== -1) newLib.splice(i, 1);
}

export function saveLibChanges(
  msg: string,
  desc: string,
  submitBtn: HTMLButtonElement | null,
) {
  const edits = $state.snapshot(compLibEdits.current);

  type UpdateVal = {
    name?: string;
    description?: string;
    tags?: string;
    content?: string;
    parts?: string[];
  };
  const nameToUpdateVal = (edit: (typeof edits)[0]): UpdateVal => {
    return {
      name: edit.name,
      description: edit.description,
      tags: edit.tags,
      content: edit.content,
      parts: edit.parts?.split("|"),
    };
  };

  const update: { [oldName: string]: UpdateVal } = {};
  edits
    .filter((edit) => edit.type === "edit")
    .forEach((edit) => {
      update[edit.identName] = nameToUpdateVal(edit);
    });

  const add: UpdateVal[] = [];
  edits
    .filter((edit) => edit.type === "add")
    .forEach((edit) => {
      add.push(nameToUpdateVal(edit));
    });

  const remove: string[] = [];
  edits
    .filter((edit) => edit.type === "remove")
    .forEach((edit) => {
      remove.push(edit.identName);
    });

  const final: { [key: string]: any } = {
    version: $state.snapshot(compLibVer.currentVer),
    message: msg,
    description: desc,
  };
  if (Object.keys(update).length > 0) final.update = update;
  if (add.length > 0) final.add = add;
  if (remove.length > 0) final.remove = remove;

  if (submitBtn) submitBtn.disabled = true;

  fetch_("/documents/update_components", {
    method: "post",
    body: JSON.stringify(final),
  })
    .then((resp) => {
      if (!resp.ok) {
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      // Clear out all the saved edits when saving to server is successful
      compLibEdits.current.splice(0, compLibEdits.current.length);
      // Reload page so that the saved component library is refetched
      location.reload();
    })
    .catch((err) => {
      if (submitBtn) submitBtn.disabled = false;
    });
}

export function upgradeDoc(
  docContainer: HTMLElement,
  newCompLib: Omit<SavedComponent, "identName">[],
  info: CompLibUpgradeInfo,
) {
  const nameMap = info.name_map;

  const walker = document.createTreeWalker(
    docContainer,
    NodeFilter.SHOW_ELEMENT,
  );
  const toRemove: Element[] = [];
  const toTransferChildren: { from: Element; to: Element }[] = [];

  // interface ParsedCompCache {
  //   partEls: Element[] | null;
  //   name: string | null;
  //   parts: string[] | null;
  // }
  // const compCache: ParsedCompCache = {
  //   partEls: null,
  //   name: null,
  //   parts: null,
  // }
  // const findPartEl = (part: string) => compCache.partEls?.find((el) => {
  //   const partStr = el.getAttribute("data-component");
  //   if (!partStr) return false;
  //   const elPart = /.*-\[(.+)\]/.exec(partStr)?.[1];
  //   if (!elPart) return false;

  //   return elPart === part;
  // })

  const parseElPartStr = (
    el: Element,
  ):
    | { isPart: false; name: undefined; part: undefined }
    | { isPart: true; name: string; part: string } => {
    const partStr = el.getAttribute("data-component");
    if (!partStr) {
      return {
        isPart: false,
        name: undefined,
        part: undefined,
      };
    }
    let compName = /(.*)-\[.+\]/.exec(partStr)?.[1];
    const part = /.*-\[(.+)\]/.exec(partStr)?.[1];
    if (!compName || !part) {
      console.warn(
        `data-component string "${partStr}" was not able to be parsed.`,
      );
      return {
        isPart: false,
        name: undefined,
        part: undefined,
      };
    }
    compName = nameMap[compName] ?? compName;
    return {
      isPart: true,
      name: compName,
      part,
    };
  };

  const contentStrToPartEl = (content: string, part: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;

    const found = getAllChildNodes(tempDiv)
      .slice(1)
      .find(
        (node) => node instanceof Element && parseElPartStr(node).part === part,
      ) as Element;
    if (!found)
      throw new Error(
        `Could not find part "${part}" in the given content string:\n\n${content}`,
      );
    return found;
  };

  function step(current: Element, next?: Element) {
    const {
      isPart: currentIsPart,
      name: compName,
      part: currentPart,
    } = parseElPartStr(current);
    if (!currentIsPart) {
      return;
    }

    // First check if the next step is to the expected next component part
    const compInfo = newCompLib.find((comp) => comp.name === compName);
    if (!compInfo) {
      toRemove.push(current);
      return;
    }

    const checkParts = compInfo.parts.split("|");
    const currentPartIndex = checkParts.indexOf(currentPart);
    if (currentPartIndex !== -1 && currentPartIndex !== checkParts.length - 1) {
      const currentNextPart = next ? parseElPartStr(next).part : undefined;
      const realNextPart = checkParts[currentPartIndex + 1];
      if (realNextPart !== currentNextPart) {
        // Then we must add the next expected part
        const elToAdd = contentStrToPartEl(compInfo.content, realNextPart);
        // We are inserting the next expected part *after* the current element, so that
        //  it is picked up in the next iteration of the TreeWalker, and this automatically
        //  handles "islands" of newly added parts (imagine a train building its own train tracks as it goes).
        if (currentPart + ",1" === realNextPart) current.prepend(elToAdd);
        else {
          const partParts = currentPart
            .split(",")
            .map((str) => Number.parseInt(str));
          let nextRelativeParents = 0;
          while (nextRelativeParents <= partParts.length) {
            let partNew = partParts.slice(
              0,
              partParts.length - nextRelativeParents,
            );
            partNew[partParts.length - 1 - nextRelativeParents] += 1;
            // prettier-ignore
            // console.log(partNew.join(","), " =? ", realNextPart, partParts, nextRelativeParents);
            if (partNew.join(",") === realNextPart) break;
            nextRelativeParents++;
          }
          if (nextRelativeParents > partParts.length)
            throw new Error(
              `Could not determine where to place newly added component part. Going from "${currentPart}" to "${realNextPart}".`,
            );
          getNthParent(current, nextRelativeParents)?.after(elToAdd);
        }
      }
    } else if (currentPartIndex === -1) {
      // That means this component part must've been removed, and so we must remove this element
      toRemove.push(current);
      return;
    }

    const elToReplaceWith = contentStrToPartEl(compInfo.content, currentPart);
    while (elToReplaceWith.firstChild)
      elToReplaceWith.removeChild(elToReplaceWith.firstChild);

    // We insert it before the current element, so that it is not picked up in the next iteration of the TreeWalker
    current.before(elToReplaceWith);
    toRemove.push(current);
    toTransferChildren.push({ from: current, to: elToReplaceWith });
  }

  while (walker.nextNode()) {
    const current = walker.currentNode as Element;
    step(current, getNextElement(current));
  }

  toTransferChildren.forEach(({ from, to }) => {
    while (from.firstChild) to.appendChild(from.firstChild);
  });
  toRemove.forEach((el) => el.remove());
}

class Comps {
  /**
   * The saved state of the currently selected component, or an empty object if not in component mode.
   */
  savedCurrent: Partial<CompParts> & { identName: string } = $derived.by(() => {
    if (editorState.mode !== "component")
      return { identName: editorState.resourceName };
    const comps = $state.snapshot(savedComponents);
    let info = comps.find((comp) => comp.name === editorState.resourceName);
    return info ?? { identName: editorState.resourceName };
  });

  /**
   * The current state of the component being edited, merging saved info and unsaved edits.
   */
  current: Partial<CompParts> & { identName: string } = $derived.by(() => {
    if (editorState.mode !== "component")
      return { identName: editorState.resourceName };
    let compEdit = compLibEdits.current.find(
      (edit) =>
        edit.type !== "remove" && edit.identName === editorState.resourceName,
    );

    return assign(this.savedCurrent, compEdit ?? {});
  });

  /**
   * The list of components data as it is saved on the server.
   */
  savedLib: SavedComponent[] = savedComponents;
  /**
   * The list of components with edits applied.
   */
  lib: (SavedComponent & {
    state: "unmodified" | "modified" | "added" | "removed";
  })[] = $derived.by(() => {
    const savedComps = $state.snapshot(savedComponents);

    // For example, when viewing a document who's component library isn't up to date in one tab,
    //  and making edits to the component library in another tab, we don't want those edits to be
    //  applied to the old component library in the tab where we're viewing the document.
    if (
      editorState.mode !== "component" ||
      (compLibVer.isVersFetched && !compLibVer.isLibUpToDate)
    )
      return savedComps.map((comp) =>
        Object.assign(comp, { state: "unmodified" as "unmodified" }),
      );

    const newSavedComps = savedComps.map((comp) => {
      const edit = compLibEdits.current.find(
        (edit) => edit.type !== "remove" && edit.identName === comp.name,
      );
      const updated = assign(
        comp,
        edit ?? { identName: comp.name },
      ) as (typeof this.lib)[0];

      if (
        compLibEdits.current.some(
          (edit) => edit.type === "remove" && edit.identName === comp.name,
        )
      )
        updated.state = "removed";
      else if (edit) updated.state = "modified";
      else updated.state = "unmodified";

      return updated;
    });

    const added = $state
      .snapshot(compLibEdits.current)
      .filter((edit) => edit.type === "add")
      .map((comp) => {
        const final = comp as unknown as (typeof this.lib)[0];
        final.state = "added";
        return final;
      });

    return [...newSavedComps, ...added];
  });
}

export const comps = new Comps();

export interface GetCompLibFetchReturn {
  library: Omit<SavedComponent, "identName">[];
  version: string;
  upgrade_to_version: string;
  upgrade_name_map: { [oldName: string]: string };
  upgrade_content_list: string[];
  upgrade_remove_list: string[];
  upgrade_diff_msgs: {
    version: string;
    message: string;
    description?: string;
  }[];
}

export interface CompLibUpgradeInfo {
  to_version: string;
  name_map: { [oldName: string]: string };
  content_list: string[];
  remove_list: string[];
  diff_msgs: {
    version: string;
    message: string;
    description?: string;
  }[];
}
