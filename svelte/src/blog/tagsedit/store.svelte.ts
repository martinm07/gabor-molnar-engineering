import { useDebounce, watch } from "runed";
import { on } from "svelte/events";

const CHECK_CHANGES_DEBOUNCE = 2000;

export interface IncomingData {
  name: string;
  description: string;
  accent: string | null;
  documentTitles: string[];
}

export interface DocTag {
  name: string;
  description: string;
  accent: string | null;
  accentDisabled: boolean;
  documentTitles: string[];
  removed: boolean;
}

export const savedTags: DocTag[] = [];
export const tags: DocTag[] = $state([]);
// inputTags are for storing the field values, particularly for when we're storing an invalid value (particularly of name, which we can't store when empty or when duplicate)
export const inputTags: Partial<DocTag>[] = $state([]);

type EditorModes = "edit" | "add" | "save";
class Editor {
  activeI: number = $state(-1);
  mode: EditorModes = $state("edit");
  changes: boolean = $state(false);

  getInputTag(i: number) {
    console.log("Getting inputTag");
    if (!inputTags[i]) inputTags[i] = {};
    return inputTags[i];
  }
}

export const ed = new Editor();

export function tagsSame(tag1: DocTag, tag2: DocTag): boolean {
  let final = true;

  if (tag1.name !== tag2.name || tag1.description !== tag2.description)
    final = false;

  if (tag1.accentDisabled !== tag2.accentDisabled) final = false;
  else if (!tag1.accentDisabled && tag1.accent !== tag2.accent) final = false;

  return final;
}

export const checkChanges = useDebounce(
  () => {
    // If tags have been added
    if (tags.length !== savedTags.length) ed.changes = true;
    // If tags have been removed
    else if (tags.some((tag) => tag.removed)) ed.changes = true;
    else if (
      tags.every((tag, i) => {
        const stag = savedTags[i];
        return tagsSame(tag, stag);
      })
    )
      ed.changes = false;
    else ed.changes = true;
  },
  () => CHECK_CHANGES_DEBOUNCE,
);

on(window, "beforeunload", (e) => {
  checkChanges.runScheduledNow();
  if (ed.changes) e.preventDefault();
});
