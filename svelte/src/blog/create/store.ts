import { writable, derived, type Writable } from "svelte/store";
import { elsListConnected } from "./helper";

type CursorMode = "select" | "edit" | "add" | "move" | "noselect";
export const cursorMode: Writable<CursorMode> = writable("select");

export const cssStyles: Writable<Map<Element, [k: string, v: string][]>> =
  writable(new Map());

export const nodeHoverTarget: Writable<Element | undefined> = writable();
export const nodesSelection: Writable<Element[]> = writable([]);
export const nodesIslandSelection = derived(nodesSelection, (nodesSelection) =>
  elsListConnected(nodesSelection),
);

type AutocompleteMode = "css" | "attributes" | "tag" | null;
export const autocompleteMode: Writable<AutocompleteMode> = writable(null);
export const autocompleteSuggestions: Writable<string[]> = writable([
  "margin",
  "margin-left",
  "margin-right",
  "margin-bottom",
  "margin-top",
]);
