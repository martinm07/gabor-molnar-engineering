import { writable, type Writable } from "svelte/store";

interface RegState {
  page: string;
  doTransition: boolean;
}

const pages = ["name", "emailpass", "passconfirm", "congrats"];
const queryPage = new URLSearchParams(window.location.search).get("page");
const startPage = queryPage && pages.includes(queryPage) ? queryPage : pages[0];

export const state: Writable<RegState> = writable({
  page: startPage,
  doTransition: false,
});
// export const state: RegState = $state({ page: startPage, doTransition: false });
export function changePage(newPage: string, doTransition: boolean = false) {
  if (!pages.includes(newPage))
    throw new Error(
      `Unexpected value for newPage. Got '${newPage}' but expected one of ${pages.map((page) => "'" + page + "'").join(", ")}.`,
    );
  state.update((st) => Object.assign(st, { page: newPage, doTransition }));
  // const searchParams = new URLSearchParams(window.location.search);
  // searchParams.set("page", newPage);
  // window.location.search = searchParams.toString();
}
