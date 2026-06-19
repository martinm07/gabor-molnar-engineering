import { on } from "svelte/events";

interface EditorState {
  mode: "document" | "component";
  resourceName: string; // Either the ID of the document or the component
  documentRedirect: string | null; // To support a "back button" when coming to component editor from document
}

let startMode: "document" | "component";
let startResourceName: string;
let startDocumentRedirect: string | null;

// /documents/edit/<document ID>
// /documents/edit/component/<component ID>
if (globalThis.jinjaParsed) {
  if (window.location.pathname.includes("/edit/component/"))
    startMode = "component";
  else startMode = "document";

  const resourceName = window.location.pathname.split("/").at(-1);
  if (!resourceName) throw new Error("");
  startResourceName = resourceName;

  const query = new URLSearchParams(window.location.search);
  if (query.has("redirect")) startDocumentRedirect = query.get("redirect");
  else startDocumentRedirect = null;
} else {
  // /blog/create/?id=1&mode=document
  // /blog/create/?id=1&mode=component
  const query = new URLSearchParams(window.location.search);

  let mode = query.get("mode") ?? "document";
  if (mode !== "document" && mode !== "component") {
    console.warn(
      `Value '${mode}' of key 'mode' in URL query was not recognized as either 'document' or 'component'. Defaulting to 'document'.`,
    );
    mode = "document";
  }
  startMode = mode as "document" | "component";

  let resourceName = query.get("id");
  if (!resourceName) {
    console.warn(`Missing value for key 'id' in URL query. Defaulting to '1'.`);
    resourceName = "1";
  }
  startResourceName = resourceName;

  let documentRedirect = query.get("redirect");
  startDocumentRedirect = documentRedirect;
}

// export const editorState: Writable<EditorState> = writable({
//   mode: startMode,
//   resourceName: startResourceName,
//   documentRedirect: startDocumentRedirect,
// });
export const editorState: EditorState = $state({
  mode: startMode,
  resourceName: startResourceName,
  documentRedirect: startDocumentRedirect,
});

function generateURL() {
  const state_ = $state.snapshot(editorState);

  let url: string;
  if (globalThis.jinjaParsed) {
    const query = new URLSearchParams();
    if (state_.documentRedirect) query.set("redirect", state_.documentRedirect);
    url = `/documents/edit${state_.mode === "component" ? "/component" : ""}/${state_.resourceName}?${query.toString()}`;
  } else {
    const query = new URLSearchParams();
    query.set("id", state_.resourceName);
    query.set("mode", state_.mode);
    if (state_.documentRedirect) query.set("redirect", state_.documentRedirect);
    url = `?${query.toString()}`;
  }
  return url;
}

export function changePage(
  mode?: EditorState["mode"],
  resourceName?: EditorState["resourceName"],
  documentRedirect?: EditorState["documentRedirect"],
) {
  // If nothing has been set to update, return early
  if (!mode && !resourceName) return;

  const state_ = $state.snapshot(editorState);
  // If the update doesn't change anything, return early (TODO: Maybe not wanted)
  if (mode === state_.mode && resourceName === state_.resourceName) return;

  const updatedState: Partial<EditorState> = {};
  if (mode) updatedState["mode"] = mode;
  if (resourceName) updatedState["resourceName"] = resourceName;
  if (documentRedirect !== undefined)
    updatedState["documentRedirect"] = documentRedirect;

  // editorState.update((st) => assign(st, updatedState));
  Object.assign(editorState, updatedState);

  history.pushState($state.snapshot(editorState), "", generateURL());
}

history.replaceState($state.snapshot(editorState), "", generateURL());

on(window, "popstate", (e) => {
  const state = e.state as EditorState;
  console.log("popstate fired", state);
  // editorState.update(() => state);
  Object.keys(editorState).forEach((key) => {
    delete editorState[key as keyof EditorState];
  });
  Object.assign(editorState, state);
});
