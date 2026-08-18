import { on } from "svelte/events";
import { homeState } from "./store.svelte";

history.replaceState(
  { showingAll: homeState.showingAll },
  "",
  document.location.href,
);

on(window, "popstate", (e) => {
  if (e.state?.showingAll) {
    homeState.showingAll = true;
    // showMore(false);
  } else {
    homeState.showingAll = false;
    // recentCards.splice(PAGE_SIZE);
  }
});

export function changeShowingAll(newShowingAll: boolean) {
  homeState.showingAll = newShowingAll;
  const newHref = newShowingAll ? "/documents/all" : "/documents";
  history.pushState({ showingAll: newShowingAll }, "", newHref);
}
