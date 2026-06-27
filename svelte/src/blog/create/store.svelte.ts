import { writable, type Writable } from "svelte/store";
import { elsListConnected } from "./helper";
import { PersistedState, useDebounce } from "runed";
import type { CompLibUpgradeInfo } from "./components/component.svelte";

type CursorMode = "select" | "edit" | "add" | "move" | "noselect";
type SidebarMode = "edit" | "addcomponent" | "viewcomponent" | "viewer";

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

/////////////////////////////////////////// AUTOCOMPLETE

type AutocompleteMode =
  | "css"
  | "attributes"
  | "tag"
  | "component"
  | "doctag"
  | null;
export const autocompleteMode: Writable<AutocompleteMode> = writable(null);
export const autocompleteSuggestions: Writable<string[]> = writable([]);

/////////////////////////////////////////// ATTRIBUTE MASKING

export interface MaskAttribute {
  name: string;
  value?: string | null;
  affectedEls: [Element, string | null | undefined][];
}
export const maskedAttributes: MaskAttribute[] = [];

/////////////////////////////////////////// DOCUMENT INFO

export interface DocumentInfo {
  id: string;

  title: string;
  description: string;
  tags: string[];
  accent: string;
  thumbnail: string;

  // status: "featured" | "public" | "unlisted" | "private";
  status: string;

  body: string;
  componentLibVer: string;
}

export type TDocMetaFields =
  | "id"
  | "title"
  | "description"
  | "tags"
  | "accent"
  | "thumbnail"
  | "status"
  | "componentLibVer";

export const docMetaFields = [
  "id",
  "title",
  "description",
  "tags",
  "accent",
  "thumbnail",
  "status",
  "componentLibVer",
];

class Doc {
  info: DocumentInfo = $state({
    id: "",
    title: "",
    description: "",
    tags: [],
    accent: "",
    thumbnail: "",
    status: "",
    body: "",
    componentLibVer: "",
  });

  // savedInfo: DocumentInfo =
}

export const doc = new Doc();

interface DocumentTag {
  name: string;
  description: string;
  accent: string;
}

export const allDocumentTags: DocumentTag[] = $state([]);

// export const docInfo: DocumentInfo | null = null;

/////////////////////////////////////////// MEDIA TRAY

export interface FileState {
  file: File;
  status: "idle" | "uploading" | "queued" | "failed" | "completed";
  progress: string;
  errMessage: string | null;
}
export const fileStates: FileState[] = $state([]);

/////////////////////////////////////////// COMPONENT LIBRARY

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

///////////////////////////// LOCAL SAVING

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
