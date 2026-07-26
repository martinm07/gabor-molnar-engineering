import { get } from "svelte/store";
import {
  savedComponents,
  selection,
  type SavedComponent,
  compLibEdits,
  compLibVer,
  doc,
} from "../store.svelte";
import { editorState } from "../url.svelte";
import { type DocNodeMap } from "../documents/docsyncing";
import {
  getAllChildNodes,
  getNextElement,
  getNodeParents,
  getNthParent,
  parseHTMLFragment,
} from "../helper";
import { fetch_, assign } from "/shared/helper";
import { extractPartsFromCompEls } from "./libraryupgrade";

const encodeStr = (str: string) => encodeURI(str);
const decodeStr = (str: string) => decodeURI(str);

/**
 * Using 1-based indexing
 */
function getSiblingIndex(el: Element) {
  const parent = el.parentElement;
  if (!parent) return 1;
  // TODO: Make this take into account not-body elements.
  const index = Array.from(parent.children)
    .filter((el) => !el.classList.contains("not-body"))
    .indexOf(el);
  if (index === -1)
    throw new Error("Somehow parent element didn't have element as child.");
  return index + 1;
}

/**
 * Generates the component body string that can be saved to the server. It takes the HTML string representation of what is currently in the editor
 *  and adds "data-component" attributes to the elements, to identify the different elements as part of the same component, while also identifying the specific part of the component they represent.
 * @param topEl Element containing the component (it itself is not included as part of the component)
 * @param htmlStr The HTML string representation of what is currently in the DOM
 * @param nodeMap The mapping of DOM node objects to information about their position in htmlStr, that is generated alongisde htmlStr by the editor
 * @param compName The name of the component
 * @returns
 */
export function generateCompContentStr(
  topEl: HTMLElement,
  htmlStr: string,
  nodeMap: DocNodeMap,
  compName: string,
) {
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

      // Void elements end as "<img src='...' />", where non void elements end in "<div title='...'>"
      const isVoidEl = htmlStr
        .slice(info.stringPos, info.stringPos + info.startTagLen)
        .endsWith(" />");

      strUpdates.push({
        index: info.stringPos + info.startTagLen - (isVoidEl ? 3 : 1), // -1 because we want to insert before the closing ">"
        insert: ` data-component="${compName}-[${partsStr}]" data-componentname="${compName}"`,
      });
      allPartsStrings.push(partsStr);
    }
  });

  // console.log("-------------------");
  // console.log(htmlStr);
  // console.log(strUpdates);

  // Sort so that the biggest index is first (avoiding index shifting)
  strUpdates.sort((a, b) => b.index - a.index);

  strUpdates.forEach(({ index, insert }) => {
    htmlStr = htmlStr.slice(0, index) + insert + htmlStr.slice(index);
  });

  // console.log(htmlStr);
  // console.log("-------------------");

  return { content: htmlStr, parts: allPartsStrings.toSorted().join("|") };
}

// FUN FACT: When the seperator given to .split() is a RegExp with capturing groups,
//            those groups will be spliced into the result (even if it's 'undefined')

/**
 * Converts component body string into a DocumentFragment that can be inserted into the DOM
 * @param content Component body
 * @param for_ Whether the resulting DocumentFragment is to be inserted into a document, or to be used in editing the component itself (in the component library editor). When being editing in the editor, all the data-component attributes are removed.
 * @returns
 */
export function decodeComponentStr(
  content: string,
  for_: "document" | "component",
) {
  const fragment = document.createDocumentFragment();
  const tempDiv = document.createElement("div");

  const parsed = parseHTMLFragment(content, true, true);
  parsed.forEach((node) => tempDiv.appendChild(node));

  if (for_ === "component") {
    getAllChildNodes(tempDiv).forEach((node) => {
      if (node instanceof HTMLElement) node.removeAttribute("data-component");
      if (node instanceof HTMLElement)
        node.removeAttribute("data-componentname");
    });
  } else if (for_ === "document") {
    getAllChildNodes(tempDiv).forEach((node) => {
      if (node instanceof HTMLElement) {
        node.setAttribute("data-complibver", doc.info.componentLibVer);

        Array.from(node.attributes).forEach((attr, i) => {
          if (attr.name === "style") {
            replaceAttrAtIndex(node, i, "data-dummycompstyle", attr.value);
          } else if (attr.name.startsWith("data-style-")) {
            replaceAttrAtIndex(
              node,
              i,
              `data-dummycompstyle-${attr.name.slice("data-style-".length)}`,
              attr.value,
            );
          }
        });
      }
    });
  }

  while (tempDiv.firstChild) fragment.appendChild(tempDiv.firstChild);
  return fragment;
}

const indexOfAttr = (el: Element, attributeName: string) =>
  Array.from(el.attributes).findIndex((attr) => attr.name === attributeName);

function replaceAttrAtIndex(
  el: Element,
  index: number,
  name: string,
  value: string,
) {
  const oldAttributes = Array.from(el.attributes);
  if (index < 0 || index >= oldAttributes.length) {
    console.error("Index out of range");
    return;
  }
  oldAttributes.forEach((attr) => el.removeAttribute(attr.name));

  const newAttribute = document.createAttribute(name);
  newAttribute.value = value;
  const newAttributes = oldAttributes.toSpliced(index, 1, newAttribute);

  newAttributes.forEach((attr) => el.setAttribute(attr.name, attr.value));
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

  const bodyStr = saved.content;
  // We use decodeComponentStr() here, rather than a function like extractPartsFromCompStr() in libraryupgrade.ts,
  //  so that we get all the same processing for component instances being added to a document as we have when adding a new node
  //  that is an instance of a component, or any other situation. Whenever we're "inserting" a component instance into a document,
  //  we should ALWAYS be using decodeComponentStr().
  const decodedComp = decodeComponentStr(bodyStr, "document");
  const compParts = extractPartsFromCompEls(decodedComp);

  const partEl = compParts.find((compPart) => compPart.part === part)?.partEl;
  if (!partEl) {
    throw new Error(
      `Could not find the provided part in the provided component.`,
    );
  }

  // Replace the parsed children of the component part with the actual children of the element we're converting
  while (partEl.firstChild) partEl.removeChild(partEl.firstChild);
  while (el.firstChild) partEl.appendChild(el.firstChild);
  // Replace element with component part in document
  el.insertAdjacentElement("afterend", partEl);
  el.remove();

  if (selection.hover === el) selection.hover = partEl;
  if (selection.selected.some((item) => item === el))
    selection.selected = selection.selected.map((item) =>
      item === el ? partEl : item,
    );
}

export function protectInheritedAttrs(el: Element) {
  if (!el.hasAttribute("data-component")) return;
  // console.log("Protecting inherited attributes of element", el);``
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
  // console.log(`Updating component edit with name "${identName}"`, update);

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

export function discardLibChanges() {
  compLibEdits.current.splice(0);
  // Reload page so that the saved component library is refetched
  location.reload();
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
