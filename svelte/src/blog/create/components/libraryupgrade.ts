import { mode, type SavedComponent } from "../store.svelte";
import {
  breakInheritance,
  decodeComponentStr,
  extractPartsFromCompStr,
} from "./component.svelte";

export interface CompLibUpgradeInfo {
  to_version: string;
  name_map: { [oldName: string]: string | undefined };
  content_list: string[];
  remove_list: string[];
  diff_msgs: {
    version: string;
    message: string;
    description?: string;
  }[];
}

interface AddedPartInfo {
  bodyStr: string;
  addedPart: string;
  compName: string;
}

/**
 *
 * @param oldBodyStr The old component body to compare
 * @param newBodyStr The new component body to compare
 * @returns The data-component attribute values (coming from oldBodyStr) for component parts that have been removed,
 *  and information (component part HTML string, part string) coming from newBodyStr for newly added component parts.
 */
const findCompStructureChanges = (
  oldBodyStr: string,
  newBodyStr: string,
): [removedParts: string[], addedParts: AddedPartInfo[]] => {
  const oldParts = extractPartsFromCompStr(oldBodyStr);
  const newParts = extractPartsFromCompStr(newBodyStr);

  // Parts in oldParts that aren't in newParts are parts that have been removed

  // Create a list of data-component attribute values, so removed component parts can be identified in the document and removed
  let removedParts = oldParts.filter(
    (oldPart) => !newParts.some((newPart) => oldPart.part === newPart.part),
  );
  // Filter out component parts that are children of a component part we're already removing
  removedParts = removedParts.filter(
    (removedPart) =>
      !removedParts.some(
        ({ part }) =>
          part.length < removedPart.part.length &&
          removedPart.part.startsWith(part),
      ),
  );

  // Parts in newParts that aren't in oldParts are parts that have been added
  let addedParts = newParts.filter(
    (newPart) => !oldParts.some((oldPart) => newPart.part === oldPart.part),
  );
  // Filter out component parts that are children of a component part we're already adding
  addedParts = addedParts.filter(
    (addedPart) =>
      !addedParts.some(
        ({ part }) =>
          part.length < addedPart.part.length &&
          addedPart.part.startsWith(part),
      ),
  );

  const finalAddedParts: AddedPartInfo[] = addedParts.map((part) => {
    return {
      bodyStr: part.partBody,
      addedPart: part.part,
      compName: part.compName,
    };
  });

  return [
    removedParts.map((removedPart) => removedPart.attrValue),
    finalAddedParts,
  ];
};

interface EditPartInfo {
  dataComponentValue: string;
  // number of attributes to replace
  numAttrsOld: number;
  // new attributes to replace with
  attrsNew: { name: string; value: string }[];

  // what about data- attributes that assocaite extra information with component instances?
  // the only "inherited" one at the moment is `data-component`.
  // also, in order to inherit styles from a stylesheet for components, we probably want a data- attribute for that; something like "data-componentname" which is just the component name (excluding the part string)
}

const findCompPartEdits = (
  oldBodyStr: string,
  newBodyStr: string,
): EditPartInfo[] => {
  const oldParts = extractPartsFromCompStr(oldBodyStr);
  const newParts = extractPartsFromCompStr(newBodyStr);

  const final: EditPartInfo[] = [];
  for (const oldPart of oldParts) {
    const newPart = newParts.find((newPart) => oldPart.part === newPart.part);
    if (!newPart) continue;

    const numAttrsOld = oldPart.partEl.attributes.length;

    const attrsNew = Array.from(newPart.partEl.attributes).map((attr) => {
      return {
        name: attr.name,
        value: attr.value,
      };
    });

    final.push({
      dataComponentValue: oldPart.attrValue,
      numAttrsOld,
      attrsNew,
    });
  }

  return final;
};

type ComponentFields = Omit<SavedComponent, "identName">;

interface EditedCompInfo {
  // old: ComponentFields;
  // new: ComponentFields;
  removedParts: string[];
  editedParts: EditPartInfo[];
  addedParts: AddedPartInfo[];
}

/**
 *
 * @param oldCompLib Old component library to compare
 * @param newCompLib New component library to compare
 * @param info Information given by the Python server about what has happened between the two component libraries (most importantly the nameMap)
 * @returns
 *  - `removedComps`: List of (old) component names for components that have been removed in the new component library.
 *  - `editedComps`: List of components that do have a mapping from the old component library to new the new version (i.e. that *could* have been edited).
 *     The component's data in the old component library is under the "old" field, and the new data is in the "new" field. This also has fields "removedParts" and "addedParts",
 *     specifying further information about how edits to the component body string have added or removed component parts.
 */
const createCompLibDiff = (
  oldCompLib: ComponentFields[],
  newCompLib: ComponentFields[],
  info: CompLibUpgradeInfo,
): [removedComps: string[], editedComps: EditedCompInfo[]] => {
  /** List of (old) component names for components that have been removed in the new component library. */
  const removedComps: string[] = [];
  /** List of components that do have a mapping from the old component library to new the new version (i.e. that *could* have been edited). The component's data in the old component library is under the "old" field, and the new data is in the "new" field. */
  const editedComps: EditedCompInfo[] = [];

  const nameMap = info.name_map;
  // Populate removedComps and editedComps, using nameMap
  oldCompLib.forEach((old) => {
    const mapped = nameMap[old.name];
    if (mapped) {
      const new_ = newCompLib.find((comp) => comp.name === mapped);
      if (new_) {
        const [removedParts, addedParts] = findCompStructureChanges(
          old.content,
          new_.content,
        );
        const editedParts = findCompPartEdits(old.content, new_.content);

        editedComps.push({
          // old,
          // new: new_,
          removedParts,
          editedParts,
          addedParts,
        });
      } else {
        console.error(
          `Component has a name mapping, but no entry in the new component library, mapping was "${old.name}" -> "${mapped}".\nOld component: ${old}\nNew component library: ${newCompLib}`,
        );
      }
    } else {
      // Component existed in the old library, but doesn't in the new library; it must've been removed.
      removedComps.push(old.name);
    }
  });

  return [removedComps, editedComps];
};

const handleRemovedComponents = (
  docContainer: HTMLElement,
  compNames: string[],
) => {
  const walker = document.createTreeWalker(
    docContainer,
    NodeFilter.SHOW_ELEMENT,
  );

  let el: Element;
  while ((el = walker.nextNode() as Element)) {
    // const current = walker.currentNode as Element;
    const dataComponent = el.getAttribute("data-component");
    if (!dataComponent) continue;
    if (
      compNames.some((compName) => dataComponent.startsWith(compName + "-["))
    ) {
      // This element is a part of a component that has been removed in the latest component library version (that we're upgrading to).
      // Instead of outright removing it from the document (which seems too destructive), we just "disinherit" it; keeping it in the document,
      //  though making note that it's no longer a component.

      breakInheritance([el]);
    }
  }
};

const handleRemovedCompParts = (
  docContainer: HTMLElement,
  dataComponentValues: string[],
) => {
  const toRemove: Element[] = [];

  const walker = document.createTreeWalker(
    docContainer,
    NodeFilter.SHOW_ELEMENT,
  );

  let el: Element;
  while ((el = walker.nextNode() as Element)) {
    // const current = walker.currentNode as Element;
    const dataComponent = el.getAttribute("data-component");
    if (!dataComponent) continue;
    if (dataComponentValues.includes(dataComponent)) {
      toRemove.push(el);
    }
  }

  toRemove.forEach((el) => el.remove());
};

const handleEditedCompParts = (
  docContainer: HTMLElement,
  compPartEdits: EditPartInfo[],
  info: CompLibUpgradeInfo,
) => {
  const walker = document.createTreeWalker(
    docContainer,
    NodeFilter.SHOW_ELEMENT,
  );

  let el: Element;
  while ((el = walker.nextNode() as Element)) {
    const dataComponent = el.getAttribute("data-component");
    if (!dataComponent) continue;

    const editInfo = compPartEdits.find(
      (edit) => edit.dataComponentValue === dataComponent,
    );
    if (!editInfo) continue;

    const dataCompLibVer = el.getAttribute("data-complibver");
    if (dataCompLibVer === info.to_version) {
      // prettier-ignore
      console.log("Skipping updating attributes of element", el, "due to element having data-complibver value of", info.to_version, "which indicates that it has already been upgraded.");
      continue;
    }

    // PERFORM MODIFICATION OF ELEMENT

    const currentAttrs = Array.from(el.attributes).map((attr) => {
      return {
        name: attr.name,
        value: attr.value,
      };
    });
    currentAttrs.forEach((attr) => el.removeAttribute(attr.name));

    // prettier-ignore
    if (currentAttrs.length < editInfo.numAttrsOld) console.error("The number of attributes found on element", el, `is less than the number of attributes that should be inherited (numAttrsOld = ${editInfo.numAttrsOld})`);

    currentAttrs.splice(0, editInfo.numAttrsOld, ...editInfo.attrsNew);

    currentAttrs.forEach((attr) => {
      el.setAttribute(attr.name, attr.value);
    });

    el.setAttribute("data-complibver", info.to_version);
  }
};

const handleAddedCompParts = (
  docContainer: HTMLElement,
  addedCompParts: AddedPartInfo[],
) => {
  const walker = document.createTreeWalker(
    docContainer,
    NodeFilter.SHOW_ELEMENT,
  );

  const searchDataComponents: string[] = [];
  const insertPartAs: ("child" | "sibling")[] = [];
  addedCompParts.forEach((addInfo, i) => {
    const addedPart = addInfo.addedPart
      .split(",")
      .map((x) => Number.parseInt(x));
    if (addedPart.length > 1) {
      searchDataComponents[i] = addedPart.slice(0, -1).join(",");
      insertPartAs[i] = "child";
    } else {
      if (addedPart.length <= 0) {
        console.error("Got part string with no parts.");
        return;
      }
      if (addedPart[0] === 0) {
        console.error("Newly added component part was [1].", addInfo);
        return;
      }
      // We shouldn't have to worry about addedPart[0] being 0, as that would imply that before, this component consisted of 0 elements (which would mean it was *nothing*), which shouldn't be possible.
      searchDataComponents[i] = `${addedPart[0] - 1}`;
      insertPartAs[i] = "sibling";
    }
  });

  let el: Element;
  while ((el = walker.nextNode() as Element)) {
    const dataComponent = el.getAttribute("data-component");
    if (!dataComponent) continue;

    // const addPartIs: number[] = [];
    for (let i = 0; i < addedCompParts.length; i++) {
      const insertAs = insertPartAs[i];
      const addInfo = addedCompParts[i];
      const searchDataComponent = searchDataComponents[i];
      if (!insertAs || !addInfo || !searchDataComponent) continue;

      const addDataComponent = `${addInfo.compName}-[${addInfo.addedPart}]`;

      const targetDataComponent = `${addInfo.compName}-[${searchDataComponent}]`;
      if (targetDataComponent !== dataComponent) continue;

      const bodyFrag = decodeComponentStr(addInfo.bodyStr, "document");
      const body = bodyFrag.childNodes[0];
      // prettier-ignore
      if (bodyFrag.childNodes.length !== 1 || !(body instanceof Element)) {
        console.error("Parsed component part didn't have a single containing element.", el);
        continue;
      }

      if (insertAs === "sibling") {
        const elsNextSibling = el.nextSibling;
        let siblingDataComponent: string | null;
        if (
          elsNextSibling instanceof Element &&
          (siblingDataComponent =
            elsNextSibling.getAttribute("data-component")) &&
          siblingDataComponent === addDataComponent
        ) {
          console.log(
            "Skipping inserting newly added component part as sibling to element because it already has an element of that component part as a next sibling:",
            el,
          );
          continue;
        }

        el.insertAdjacentElement("afterend", body);
      } else if (insertAs === "child") {
        // Determine where among its children to insert the new component part
        let insertI = -1;
        let insertAtEnd = false;
        let alreadyInserted = false;

        const children = Array.from(el.children);

        for (const [i, child] of children.entries()) {
          const childDataComp = child.getAttribute("data-component");
          if (!childDataComp) continue;

          if (addDataComponent === childDataComp) {
            // This parent element already has this component part added to it, so we'll skip adding it again
            alreadyInserted = true;
            break;
          }

          if (addDataComponent > childDataComp) {
            insertI = i;
            // If this component part is the last one of the children, then the new part we're trying to add should appear after the last component part, and hence we'll just append it as the very last child
            insertAtEnd = true;
          } else {
            // There is at least this component part, that should appear AFTER the new part we're trying to insert, hence we shouldn't "insert at end"
            insertAtEnd = false;
          }
        }

        if (alreadyInserted) {
          console.log(
            "Skipping inserting newly added component part to element because it already has an element of that component part as a child:",
            el,
          );
          continue;
        }

        if (insertI === -1) {
          el.insertAdjacentElement("afterbegin", body);
        } else if (insertAtEnd) {
          el.insertAdjacentElement("beforeend", body);
        } else {
          children[insertI].insertAdjacentElement("afterend", body);
        }
      }
    }
  }
};

export function upgradeDoc(
  docContainer: HTMLElement,
  oldCompLib: ComponentFields[],
  newCompLib: ComponentFields[],
  info: CompLibUpgradeInfo,
) {
  console.log(
    "======================= Performing component library upgrade on document",
  );
  console.log("oldCompLib:", oldCompLib);
  console.log("newCompLib:", newCompLib);
  console.log("info:", info);

  const [removedComps, editedComps] = createCompLibDiff(
    oldCompLib,
    newCompLib,
    info,
  );

  console.log("removedComps:", removedComps);
  console.log("editedComps:", editedComps);

  // Break inheritance of components in the documents that were removed (rather than remove them from the document)
  handleRemovedComponents(docContainer, removedComps);

  // Remove component parts that have been removed (editedComps.removedParts)
  handleRemovedCompParts(
    docContainer,
    editedComps.flatMap((edit) => edit.removedParts),
  );

  // Edit component parts inherited attributes and styles
  handleEditedCompParts(
    docContainer,
    editedComps.flatMap((edit) => edit.editedParts),
    info,
  );

  // Add newly added component parts (editedComps.addedParts)
  handleAddedCompParts(
    docContainer,
    editedComps.flatMap((edit) => edit.addedParts),
  );

  console.log(
    "======================= End of log on component library upgrade",
  );
}
