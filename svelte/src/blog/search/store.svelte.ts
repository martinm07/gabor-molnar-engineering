import { on } from "svelte/events";
import { fetch_ } from "/shared/helper";
import type { TypesenseHit, TypesenseResults } from "/shared/types";
import type { Card } from "../home/store.svelte";

export interface Tag {
  name: string;
  description?: string;
  accent?: string;
  selected: boolean;
}

export const docTags: Tag[] = $state([]);

export type SortOption = "relevance" | "date_created" | "date_updated";
const SORT_OPTIONS: SortOption[] = [
  "relevance",
  "date_created",
  "date_updated",
];
const isSortOption = (x: any): x is SortOption => SORT_OPTIONS.includes(x);

type SortOrder = "desc" | "asc";
const SORT_ORDERS: SortOrder[] = ["desc", "asc"];
const isSortOrder = (x: any): x is SortOrder => SORT_ORDERS.includes(x);

class Query {
  q = $state("");

  selectedTags: string[] = $state([]);
  fromDate: string | null = $state(null);
  toDate: string | null = $state(null);
  sortBy: SortOption = $state("relevance");
  sortOrder: "desc" | "asc" = $state("desc");

  page: number = $state(1);

  newQueryStr = $derived.by(() => {
    const searchParams = new URLSearchParams();

    searchParams.append("q", this.q);
    if (this.selectedTags.length > 0)
      searchParams.append("tags", this.selectedTags.join(","));
    if (this.fromDate) searchParams.append("fromdate", this.fromDate);
    if (this.toDate) searchParams.append("todate", this.toDate);
    searchParams.append("sort", this.sortBy);
    if (this.sortOrder === "asc") searchParams.append("asc", "");
    searchParams.append("page", `${this.page}`);

    return "?" + searchParams.toString();
  });
  lastSubmittedQuery = $state(window.location.search);

  queryDifferent = $derived(this.lastSubmittedQuery !== this.newQueryStr);

  static queriesEqual(q1: string, q2: string) {
    const query1 = new URLSearchParams(q1);
    const query2 = new URLSearchParams(q2);
    let equal = query1.get("q") === query2.get("q");
    equal =
      equal &&
      (() => {
        // The `==` instead of `===` means "" == null will match, which we want
        if (!query1.get("tags") || !query2.get("tags"))
          return query1.get("tags") == query2.get("tags");
        const query1Tags = query1.get("tags")!.split(",");
        const query2Tags = query2.get("tags")!.split(",");
        if (query1Tags.length !== query2Tags.length) return false;
        const query2Sorted = query2Tags.toSorted();
        return query1Tags.toSorted().every((tag, i) => tag === query2Sorted[i]);
      })();
    equal = equal && query1.get("fromdate") === query2.get("fromdate");
    equal = equal && query1.get("todate") === query2.get("todate");
    equal = equal && query1.get("sort") === query2.get("sort");
    equal = equal && query1.get("desc") == query2.get("desc");
    return equal;
  }

  restoreStateFromQueryStr() {
    const query = new URLSearchParams(window.location.search);

    this.q = query.get("q") ?? "";
    this.selectedTags = query.get("tags")?.split(",") ?? [];
    this.fromDate = query.get("fromdate") ?? null;
    this.toDate = query.get("todate") ?? null;

    let sortBy;
    if (isSortOption((sortBy = query.get("sort")))) this.sortBy = sortBy;
    else this.sortBy = "relevance";

    if (query.get("asc")) this.sortOrder = "asc";
    else this.sortOrder = "desc";

    let page;
    if (!Number.isNaN((page = Number.parseInt(query.get("page") ?? ""))))
      this.page = page;
    else this.page = 1;
  }
}

export const query = new Query();

export function changeSearchQueryURL() {
  console.log("🎈🎈🎈 changeSearchQueryURL");
  history.pushState({}, "", query.newQueryStr);
  query.lastSubmittedQuery = query.newQueryStr;
}

on(window, "popstate", (e) => {
  console.log("Now ", window.location.search);
  query.restoreStateFromQueryStr();
  search();
  query.lastSubmittedQuery = query.newQueryStr;
});

///////////////////////

const isMobile = () => window.matchMedia("(width <= 55rem)").matches;

class PageState {
  isMobile = $state(isMobile());
  searchSubmitState: "idle" | "searching" | "error" = $state("idle");
  searchResults: TypesenseResults | undefined = $state();
}
export const pageState = new PageState();
on(window, "resize", () => {
  pageState.isMobile = isMobile();
});

export async function search() {
  console.log("submitted query!");
  const newQuery = query.newQueryStr;
  console.log(newQuery);

  pageState.searchSubmitState = "searching";
  if (pageState.searchResults) pageState.searchResults.hits = [];

  let resp: Response;
  try {
    resp = await fetch_(`/documents/advanced_query${newQuery}`);
    if (!resp.ok) {
      pageState.searchSubmitState = "error";
      return resp;
    }
  } catch {
    pageState.searchSubmitState = "error";
    return;
  }

  const data: TypesenseResults = await resp.json();

  pageState.searchResults = data;
  console.log($state.snapshot(pageState.searchResults));
  pageState.searchSubmitState = "idle";
  // changeSearchQueryURL();

  return data;
}

function processSnippet(snippet: string, fullField: string) {
  if (!snippet) return snippet;
  const snippetRaw = snippet.replace(/(<mark>)|(<\/mark>)/g, "");
  if (snippetRaw === fullField) return snippet;
  return "[...] " + snippet.trim() + " [...]";
}

export function typesenseHitToCard(hit: TypesenseHit): Card {
  const instant = Temporal.Instant.fromEpochMilliseconds(
    hit.document.date_updated * 1000,
  );
  const dateUpdated = instant.toZonedDateTimeISO("UTC").toPlainDate();

  const mainMatch =
    processSnippet(
      hit.highlight.description?.snippet,
      hit.document.description,
    ) ??
    processSnippet(hit.highlight.body?.snippet, hit.document.body) ??
    hit.document.description;

  const tags =
    hit.highlight.tags?.map((el: any) => el.snippet) ?? hit.document.tags;

  return {
    title: hit.highlight.title?.snippet ?? hit.document.title,
    description: mainMatch,
    tags,
    dateUpdated,
    accent: hit.document.accent,
    svgIcon: hit.document.thumbnail,
  };
}
