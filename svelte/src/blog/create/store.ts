import { writable, type Writable } from "svelte/store";

type CursorMode = "select" | "edit" | "add" | "editprops";
export const cursorMode: Writable<CursorMode> = writable("select");

export const cssStyles: Writable<Map<Element, [k: string, v: string][]>> =
  writable(new Map());
