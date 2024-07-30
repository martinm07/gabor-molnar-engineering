import { writable, type Writable } from "svelte/store";

type CursorMode = "select" | "edit" | "add" | "noselect";
export const cursorMode: Writable<CursorMode> = writable("select");

export const cssStyles: Writable<Map<Element, [k: string, v: string][]>> =
  writable(new Map());

export const nodeHoverTarget: Writable<Element | undefined> = writable();
export const nodesSelection: Writable<Element[]> = writable([]);
