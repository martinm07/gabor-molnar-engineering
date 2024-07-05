<script lang="ts">
  import type { TypesenseResults } from "/shared/types";
  import "/shared/tailwindinit.css";
  import SearchCard from "./SearchCard.svelte";
  import { setContext } from "svelte";
  import { watch } from "runed";
  import TagsDropdown from "./TagsDropdown.svelte";
  import DateDropdown from "./DateDropdown.svelte";
  import { fetch_, preventDefault } from "/shared/helper";
  import Pagination from "./Pagination.svelte";

  type DictList = { [key: string]: any }[];

  let tags: DictList = $state([]);
  let fromDate: string = $state("");
  let toDate: string = $state("");
  let value = $state("");
  let sortBy = $state("");
  let sortOrder = $state("desc");

  let page = $state(1);
  // $inspect(page);

  let lastSubmittedQuery: string = $state("");
  let query: string = $derived.by(() => {
    const tags_filter = tags
      .filter((tag) => tag.selected)
      .map((tag) => tag.value)
      .join(",");
    const searchParams = new URLSearchParams([
      ["tags", tags_filter],
      ["fromdate", fromDate],
      ["todate", toDate],
      ["sort", sortBy],
      ["desc", JSON.stringify(sortOrder !== "asc")],
      ["q", value],
      ["page", JSON.stringify(page)],
    ]);
    return "?" + searchParams.toString();
  });
  // $inspect("query: " + query);
  // $inspect("lastSubmittedQuery: " + lastSubmittedQuery);

  function queriesEqual(q1: string, q2: string) {
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

  let queryModified = $derived(!queriesEqual(query, lastSubmittedQuery));

  let results: TypesenseResults | undefined = $state();

  function getURLParams() {
    const query = new URLSearchParams(window.location.search);
    const tagsStr = query.get("tags")?.split(",") || [];
    return {
      q: query.get("q") ?? "",
      selectedTags: tagsStr,
      fromDate_: query.get("fromdate"),
      toDate_: query.get("todate"),
      sortBy_: query.get("sort") || "relevance",
      sortOrder_: query.get("desc") === "false" ? "asc" : "desc",
      page_: Number.parseInt(query.get("page") || "1"),
    };
  }

  function search(
    pushState: boolean = true,
    setState: boolean = true,
    manualQuery?: string,
  ) {
    const query_ = manualQuery ?? query;
    lastSubmittedQuery = query_;
    const resp = fetch_(`/documents/advanced_query${query_}`)
      .then((resp) => resp.json())
      .then((data: TypesenseResults) => {
        console.log(data);
        results = data;

        if (!setState) return;
        const {
          selectedTags: selectedTagNames,
          fromDate_,
          toDate_,
          sortBy_,
          sortOrder_,
          q,
          page_,
        } = getURLParams();

        const tags_counts =
          data.facet_counts.find((facet) => facet.field_name === "tags")
            ?.counts ?? [];
        const selectedTags = tags.filter((tag) => tag.selected);
        tags = Object.assign(
          selectedTags,
          tags_counts.map((tag) =>
            Object.assign(tag, {
              selected: Boolean(
                selectedTagNames.find((name) => name === tag.value),
              ),
            }),
          ),
        );

        if (fromDate_) fromDate = fromDate_;
        if (toDate_) toDate = toDate_;
        sortBy = sortBy_;
        sortOrder = sortOrder_;
        value = q;
        page = page_;
      });
    if (pushState) history.pushState({}, "", query_);
    return resp;
  }
  search(false, true, window.location.search).then(
    () => (lastSubmittedQuery = query),
  );

  watch(
    () => [sortBy, sortOrder],
    (_, p) => {
      if (p.some((el) => !el)) return;
      const query_ = new URLSearchParams(lastSubmittedQuery);
      query_.set("sort", sortBy);
      query_.set("desc", JSON.stringify(sortOrder !== "asc"));
      search(true, false, "?" + query_.toString());
    },
    { lazy: true },
  );
  watch(
    () => page,
    (_, p) => {
      if (!p) return;
      const query_ = new URLSearchParams(lastSubmittedQuery);
      query_.set("page", JSON.stringify(page));
      search(true, false, "?" + query_.toString()).then(() => {
        const topResult = document.querySelector(".search-result");
        if (!(topResult instanceof HTMLElement)) return;
        window.scrollTo(0, topResult.offsetTop);
      });
    },
  );

  window.addEventListener("popstate", (e) => {
    console.log("POP");
    search(false, true, window.location.search);
  });

  setContext("divider", divider);
</script>

{#snippet divider()}
  <div class="w-5/6 ml-[8.3%] h-0.5 bg-rock-300"></div>
{/snippet}

<TagsDropdown bind:tags />
{@render divider()}
<DateDropdown bind:fromDate bind:toDate />
{@render divider()}
<form
  method="get"
  onsubmit={preventDefault(search)}
  class="p-5 text-center border-b-2 border-rock-300 bg-background"
>
  <input
    type="text"
    bind:value
    placeholder="search"
    class="border-2 border-rock-400 px-3 py-1 w-full max-w-[500px] rounded font-mono focus:outline-none ring-rock-200 focus:ring-4"
  />
  <br />
  <button
    type="submit"
    disabled={!queryModified}
    class="mt-4 px-5 py-2 text-lg text-steel-600 border-2 border-steel-400 bg-steel-100 rounded-lg shadow-[inset_4px_4px_white,inset_-8px_-8px_var(--steel-200)] disabled:shadow-none disabled:opacity-40 disabled:bg-background transition-all hover:ring-4 hover:ring-rock-200 disabled:ring-0"
  >
    Submit Query</button
  >
</form>
<div class="bg-steel-100 px-5 py-3 relative z-10 text-right">
  <div class="ml-auto inline-flex items-center">
    <label for="sortby" class="mr-2 font-bold text-rock-600">Sort by:</label
    ><select
      bind:value={sortBy}
      class="bg-background px-2 py-1 rounded text-rock-700"
      name="sortby"
      id="sortby"
    >
      <option value="relevance">Relevance</option>
      <option value="date_created">Date Created</option>
    </select>
    <button
      class="h-7 px-1 ml-3 bg-background hover:bg-rock-200 hover:text-rock-700 rounded text-rock-600 text-xl flex items-center disabled:opacity-40 disabled:bg-background disabled:text-rock-600"
      title="{sortOrder === 'asc' ? 'Ascending' : 'Descending'} Order"
      onclick={() => {
        sortOrder = sortOrder === "desc" ? "asc" : "desc";
      }}
      disabled={sortBy === "relevance"}
    >
      {#if sortOrder === "asc" && sortBy !== "relevance"}
        <ion-icon name="caret-up"></ion-icon>
      {:else}
        <ion-icon name="caret-down"></ion-icon>
      {/if}
    </button>
  </div>
  {#if results}
    <div class="text-steel-700 text-sm inline-block mt-4 float-left">
      {results.found} results found. Searched {results.out_of} documents in {results.search_time_ms}ms.
    </div>
  {/if}
  <div class="clear-left"></div>
</div>
{#if results}
  {#key results.hits}
    {#each results.hits as result}
      <SearchCard info={result} />
    {/each}
  {/key}
  <Pagination
    bind:page
    perPage={results.request_params.per_page}
    total={results.found}
  />
{/if}
