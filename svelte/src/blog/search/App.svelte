<script lang="ts">
  import CaretDownIcon from "phosphor-svelte/lib/CaretDownIcon";
  import BlogsList from "../home/BlogsList.svelte";
  import NavBar from "../home/NavBar.svelte";
  import {
    changeSearchQueryURL,
    pageState,
    query,
    search,
    typesenseHitToCard,
    type SortOption,
  } from "./store.svelte";
  import "/shared/tailwindinit.css";
  import TagDropdown from "./TagDropdown.svelte";
  import DateDropdown from "./DateDropdown.svelte";
  import { type TypesenseResults } from "/shared/types";
  import {
    ellipsesAnimationAttachment,
    fetch_,
    preventDefault,
  } from "/shared/helper";
  import type { Card } from "../home/store.svelte";
  import { onMount } from "svelte";
  import Pagination from "./Pagination.svelte";

  import SortDescendingIcon from "phosphor-svelte/lib/SortDescendingIcon";
  import SortAscendingIcon from "phosphor-svelte/lib/SortAscendingIcon";
  import { watch } from "runed";
  import Footer from "/shared/components/Footer.svelte";

  onMount(() => {
    query.restoreStateFromQueryStr();
    search();
  });

  $inspect(query.newQueryStr);

  // function snipText(text: string, cutoff: number = 30) {
  //   if (text.split(" ").length <= cutoff) return text;
  //   return text.slice(0, cutoff).trimEnd() + " [...]";
  // }
  // function processSnippet(snippet: string, fullField: string) {
  //   if (!snippet) return snippet;
  //   const snippetRaw = snippet.replace(/(<mark>)|(<\/mark>)/g, "");
  //   if (snippetRaw === fullField) return snippet;
  //   return "[...] " + snippet.trim() + " [...]";
  // }

  const resultCards: Card[] = $derived.by(() => {
    const hits = pageState.searchResults?.hits;
    if (!hits || hits.length === 0) return [];

    // return hits.map((hit) => {
    //   const instant = Temporal.Instant.fromEpochMilliseconds(
    //     hit.document.date_updated * 1000,
    //   );
    //   const dateUpdated = instant.toZonedDateTimeISO("UTC").toPlainDate();

    //   const mainMatch =
    //     processSnippet(
    //       hit.highlight.description?.snippet,
    //       hit.document.description,
    //     ) ??
    //     processSnippet(hit.highlight.body?.snippet, hit.document.body) ??
    //     hit.document.description;

    //   const tags =
    //     hit.highlight.tags?.map((el: any) => el.snippet) ?? hit.document.tags;

    //   return {
    //     title: hit.highlight.title?.snippet ?? hit.document.title,
    //     description: mainMatch,
    //     tags,
    //     dateUpdated,
    //     accent: hit.document.accent,
    //     svgIcon: hit.document.thumbnail,
    //   };
    // });
    return hits.map((hit) => typesenseHitToCard(hit));
  });

  // https://github.com/typesense/typesense/issues/2431
  // Typesense only supports descending order when sorting items by relevance
  watch(
    () => query.sortBy,
    () => {
      if (query.sortBy === "relevance") query.sortOrder = "desc";
    },
  );
</script>

<!-- <div class="grid grid-cols-[1fr_3fr] grid-rows-[auto_1fr_auto] w-screen"> -->
<div
  class="grid grid-cols-1 md:grid-cols-[1fr_3fr] grid-rows-[auto_auto_1fr_auto] md:grid-rows-[auto_1fr_auto] w-screen min-h-[calc(100vh+13rem)]"
>
  <NavBar disableSearchBox={true} disableHiding={!pageState.isMobile} />

  <div
    class="border-b-2 md:border-b-0 md:border-r-2 border-rock-100/75 relative px-2 not-md:py-6 bg-white flex flex-col items-center min-h-[calc(100vh-3.75rem)]"
  >
    <div class="font-serif text-rock-700 text-3xl text-center mb-2 md:mt-6">
      Advanced Search
    </div>
    <form
      class="md:sticky md:top-22 md:min-w-[2.2rem] max-w-[28rem] w-full"
      onsubmit={(e) => {
        e.preventDefault();
        query.page = 1;
        search().then(changeSearchQueryURL);
        // const data = search();
        // console.log("🎈🎈🎈🎈🎈", data);
      }}
    >
      <div class="my-4 flex px-1">
        <input
          class="border-2 rounded border-steel-300 bg-stone-50 py-1.5 px-2 focus:outline-none focus:ring-4 ring-steel-300/50 w-full text-steel-800 font-mono leading-tight focus:bg-white placeholder:italic"
          type="text"
          name="search"
          id="search"
          placeholder="search query"
          bind:value={query.q}
        />
      </div>
      <TagDropdown />
      <DateDropdown />
      <div class="mt-8 md:mt-12 flex items-center justify-center flex-col">
        <button
          class="text-xl text-steel-600 border-2 border-steel-300 px-4 py-2 rounded-lg font-semibold bg-stone-50 shadow hover:bg-stone-100 hover:px-5 active:ring-4 ring-stone-200 active:bg-stone-200 active:translate-y-1 transition-[background-color,box-shadow,opacity,padding] disabled:pointer-events-none disabled:opacity-60 disabled:shadow-none"
          disabled={(!query.queryDifferent &&
            pageState.searchSubmitState !== "error") ||
            pageState.searchSubmitState === "searching"}
          type="submit">Submit Query</button
        >
        {#if pageState.searchSubmitState === "searching"}
          <p class="font-mono italic text-steel-700 mt-2">
            Searching <span
              class="absolute"
              {@attach ellipsesAnimationAttachment}
            ></span>
          </p>
        {:else if pageState.searchSubmitState === "error"}
          <p class="font-mono leading-tight text-red-700 mt-2">
            Encountered an unexpected error.<br />Please try again later
          </p>
        {:else}
          <p class="font-mono mt-2">&nbsp;</p>
        {/if}
      </div>
    </form>
  </div>

  <div class="flex flex-col">
    <div class="h-12 border-b-2 border-rock-100/75 bg-background-50 flex">
      <div
        class="not-md:ml-auto md:mr-auto flex items-center text-lg text-rock-800"
      >
        <label for="sortby" class="mx-2">Sort by:</label>
        <select
          name="sortby"
          id="sortby"
          class="font-bold text-rock-700 font-mono leading-tight border-2 border-stone-300 rounded p-1 hover:bg-stone-200"
          bind:value={query.sortBy}
          oninput={(e) => {
            if (!(e.target instanceof HTMLSelectElement)) return;
            query.sortBy = e.target.value as SortOption;
            search().then(changeSearchQueryURL);
          }}
        >
          <option value="relevance">Relevance</option>
          <option value="date_created">Date created</option>
          <option value="date_updated">Date updated</option>
        </select>
        <!-- https://github.com/typesense/typesense/issues/2431 -->
        <!-- We must disable this when sorting by relevance -->
        <button
          class="text-2xl mx-4 border-2 border-stone-300 rounded p-1 hover:bg-stone-200"
          class:hidden={query.sortBy === "relevance"}
          title={query.sortOrder === "asc"
            ? "Ascending order"
            : "Descending order"}
          onclick={() => {
            if (query.sortOrder === "desc") query.sortOrder = "asc";
            else if (query.sortOrder === "asc") query.sortOrder = "desc";
            search().then(changeSearchQueryURL);
          }}
        >
          {#if query.sortOrder === "desc"}
            <SortDescendingIcon />
          {:else if query.sortOrder === "asc"}
            <SortAscendingIcon />
          {/if}
        </button>
      </div>
    </div>
    {#if pageState.searchResults}
      <div class="text-steel-700 text-sm inline-block mt-2 px-4">
        {pageState.searchResults.found} results found. Searched {pageState
          .searchResults.out_of} documents in {pageState.searchResults
          .search_time_ms}ms.
      </div>
    {/if}
    <BlogsList
      cards={resultCards}
      showLoading={pageState.searchSubmitState === "searching"}
    />
    <!-- <div class="mt-auto h-24 bg-red-700"></div> -->
    <Pagination />
  </div>
  <!-- <div class="col-span-full h-52 bg-stone-600"></div> -->
  <Footer />
</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
</style>
