import { get, writable, type Writable } from "svelte/store";
import { fetch_ } from "/shared/helper";

interface RegState {
  page: string;
  doTransition: boolean;
  name?: string;
  email?: string;
  password?: string;
  finished: boolean;
}

const pages = ["name", "emailpass", "passconfirm", "congrats"];
const queryPage = new URLSearchParams(window.location.search).get("page");
const startPage = queryPage && pages.includes(queryPage) ? queryPage : pages[0];

export function correctPage(page: string) {
  const pI = pages.findIndex((p) => p === page);
  const maxI = !get(state_).name ? 0 : !get(state_).email ? 1 : 2;
  const newPage = pages[Math.min(pI, maxI)];
  return newPage;
}

export const state_: Writable<RegState> = writable({
  page: startPage,
  doTransition: false,
  finished: false,
});
fetch_("/register/get_session_state")
  .then((resp) => resp.json())
  .then((data) => {
    state_.update((st) =>
      Object.assign(st, {
        name: data.username,
        email: data.email,
        password: data.password,
      }),
    );
    changePage(correctPage(get(state_).page), false);
  });

export function changePage(newPage: string, doTransition: boolean = false) {
  if (!pages.includes(newPage))
    throw new Error(
      `Unexpected value for newPage. Got '${newPage}' but expected one of ${pages.map((page) => "'" + page + "'").join(", ")}.`,
    );
  state_.update((st) => Object.assign(st, { page: newPage, doTransition }));
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.set("page", newPage);
  history.pushState(get(state_), "", "?" + searchParams.toString());
}

window.addEventListener("popstate", (e) => {
  if (get(state_).finished) return;
  const newPage = e?.state?.page ?? pages[0];
  const correctedPage = correctPage(newPage);
  if (newPage !== correctedPage) {
    changePage(correctedPage, false);
    return;
  }
  state_.update((st) =>
    Object.assign(st, { page: newPage, doTransition: false }),
  );
});
