import { writable, derived, type Writable, get } from "svelte/store";
import { on } from "svelte/events";
import { elsListConnected } from "./helper";
import { fetch_, assign } from "/shared/helper";
import { PersistedState, useDebounce } from "runed";
import type { CompLibUpgradeInfo } from "./components/component.svelte";

type CursorMode = "select" | "edit" | "add" | "move" | "noselect";
// export const cursorMode: Writable<CursorMode> = writable("select");
type SidebarMode = "edit" | "addcomponent" | "viewcomponent" | "viewer";
// export const sidebarMode: Writable<SidebarMode> = writable("edit");

class Mode {
  cursor: CursorMode = $state("select");
  sidebar: SidebarMode = $state("edit");
}
export const mode = new Mode();

export const cssStyles: Writable<Map<Element, [k: string, v: string][]>> =
  writable(new Map());

class Selection {
  hover: Element | undefined = $state();
  selected: Element[] = $state([]);
  island: Element[] = $derived(elsListConnected(this.selected));
  main: Element[] = $derived(
    this.selected.length === 0
      ? this.hover
        ? [this.hover]
        : []
      : this.selected,
  );
}
export const selection = new Selection();

type AutocompleteMode = "css" | "attributes" | "tag" | "component" | null;
export const autocompleteMode: Writable<AutocompleteMode> = writable(null);
export const autocompleteSuggestions: Writable<string[]> = writable([]);

export interface MaskAttribute {
  name: string;
  value?: string | null;
  affectedEls: [Element, string | null | undefined][];
}
export const maskedAttributes: MaskAttribute[] = [];

export interface SavedComponent {
  // id: string;
  identName: string;
  name: string;
  content: string;
  parts: string;
  description?: string;
  tags?: string;
}

// const savedComps_: SavedComponent[] = [
// {
//   name: "component1",
//   content: "",
//   tags: ["food", "recipie"],
//   description: "You know what they say; you never forget your first...",
//   parts: ["1", "1,1", "1,2"],
// },
// {
//   name: "second-comp",
//   content: "",
//   tags: ["methodology", "general", "sensei"],
//   description:
//     "Lorem ipsum dolor sit amet consecutor aler to honotni arigatoue gozaimasu",
//   parts: ["1", "2", "2,1"],
// },
// {
//   name: "third",
//   content: "",
//   tags: ["edible"],
//   description: "third is the one with the edible hairy chest",
//   parts: ["1", "2", "3"],
// },
// {
//   name: "yon-nin-wa-sutekina-aru",
//   content: "",
//   tags: ["general", "philosophy"],
//   description: "Japanese writing",
//   parts: ["1", "1,1", "1,1,1"],
// },
// ];

// export const savedComponents: Writable<SavedComponent[]> =
//   writable(savedComps_);
export const savedComponents: SavedComponent[] = $state([]);

export const allComponentTags: string[] = $state([]);

// export const compLibVer: {
//   currentVer: string | null;
//   latestVer: string | null;
// } = $state({
//   currentVer: null,
//   latestVer: null,
// });
// export let isLibUpToDate_ = $derived(
//   compLibVer.currentVer !== null &&
//     compLibVer.latestVer !== null &&
//     compLibVer.currentVer === compLibVer.latestVer,
// );
// export const isLibUpToDate = () => isLibUpToDate_;
class CompLibVer {
  currentVer: string | null = $state(null);
  latestVer: string | null = $state(null);
  isLibUpToDate: boolean = $derived(
    this.currentVer !== null &&
      this.latestVer !== null &&
      this.currentVer === this.latestVer,
  );
  isVersFetched: boolean = $derived(
    this.currentVer !== null && this.latestVer !== null,
  );

  upgradeInfo: CompLibUpgradeInfo | null = $state(null);
}
export const compLibVer = new CompLibVer();

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

interface CompLibEdit {
  type: "add" | "remove" | "edit";
  identName: string;
  name?: string;
  content?: string;
  parts?: string;
  description?: string;
  tags?: string;
}

export const compLibEdits = new PersistedState<CompLibEdit[]>(
  "compLibEdits",
  [],
);

interface LocalSaveDocEntry {
  id: string;
  lastUsed: number;
  body: string;
  compLibVer: string;
}

interface LocalSaveLibEntry {
  version: string;
  lastUsed: number;
  comps: SavedComponent[];
  definedTags?: string[];
}

type LocalSaveEntry = LocalSaveDocEntry | LocalSaveLibEntry;

export function localSaveEntryIsDoc(
  entry: LocalSaveEntry,
): entry is LocalSaveDocEntry {
  return entry.hasOwnProperty("id");
}
export function localSaveEntryIsLib(
  entry: LocalSaveEntry,
): entry is LocalSaveLibEntry {
  return entry.hasOwnProperty("version");
}

// 7 days
const MAX_LOCALSAVE_ENTRY_LIFETIME = 1000 * 60 * 60 * 24 * 7;

export function pruneLocalSave() {
  // This is a value of time in milliseconds
  const now = Date.now();

  Object.entries(localSave.current).forEach(([key, val]) => {
    if (val && now - val.lastUsed > MAX_LOCALSAVE_ENTRY_LIFETIME) {
      delete localSave.current[key];
    }
  });
}

type LocalSave = Partial<Record<string, LocalSaveEntry>>;
export const localSave = new PersistedState<LocalSave>("localSave", {});

export const debounceCancellables: ReturnType<typeof useDebounce>[] = [];
