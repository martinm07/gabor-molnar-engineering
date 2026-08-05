import {
  compLib,
  compLibEdits,
  savedComponents,
  type SavedComponent,
  type SavedComponentWithEdit,
} from "../store.svelte";
import { editorState } from "../url.svelte";
import { assign, fetch_ } from "/shared/helper";

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
    version: $state.snapshot(compLib.latestVer),
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
  lib: SavedComponentWithEdit[] = $derived.by(() => {
    const savedComps = $state.snapshot(savedComponents);

    // For example, when viewing a document who's component library isn't up to date in one tab,
    //  and making edits to the component library in another tab, we don't want those edits to be
    //  applied to the old component library in the tab where we're viewing the document.
    if (editorState.mode !== "component")
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
