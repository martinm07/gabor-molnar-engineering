<script lang="ts">
  import { watch } from "runed";
  import {
    changeSearchQueryURL,
    pageState,
    query,
    search,
  } from "./store.svelte";

  import CaretLeftIcon from "phosphor-svelte/lib/CaretLeftIcon";
  import CaretRightIcon from "phosphor-svelte/lib/CaretRightIcon";

  const perPage = $derived(pageState.searchResults?.request_params.per_page);
  const total = $derived(pageState.searchResults?.found);

  const loaded = $derived(perPage !== undefined && total !== undefined);

  let numPages = $derived(loaded ? Math.ceil(total! / perPage!) : 0);
  watch(
    () => numPages,
    () => {
      if (query.page < 1) query.page = 1;
      if (query.page > numPages) query.page = numPages;
    },
  );

  const MAX_DISPLAY = 5;

  const defaultNumBefore = Math.floor((MAX_DISPLAY - 1) / 2);
  const defaultNumAfter = Math.ceil((MAX_DISPLAY - 1) / 2);

  let displayStart = $derived.by(() => {
    const frontMissing = Math.max(0, defaultNumAfter - (numPages - query.page));
    const start = query.page - (defaultNumBefore + frontMissing);
    const startClamped = Math.max(1, start);
    return startClamped;
  });
  let displayEnd = $derived.by(() => {
    const backMissing = Math.max(0, defaultNumBefore - (query.page - 1));
    const end = query.page + (defaultNumAfter + backMissing);
    const endClamped = Math.min(numPages, end);
    return endClamped;
  });

  let pages: number[] = $derived.by(() => {
    return Array.from(
      Array(displayEnd - displayStart + 1),
      (_, i) => i + displayStart,
    );
  });

  function submitPageChange() {
    search().then(() => {
      changeSearchQueryURL();
      setTimeout(() => {
        const searchResultsEl = document.querySelector(".cards-container");
        console.log("Scrolling to", searchResultsEl);
        if (!searchResultsEl || !(searchResultsEl instanceof HTMLElement)) {
          console.error(
            "Wasn't able to scroll to top search result; no cards container detected.",
          );
          return;
        }
        if (window.matchMedia("(width <= 48rem)").matches)
          window.scrollTo(0, searchResultsEl.offsetTop - 40);
        else window.scrollTo(0, 0);
      });
    });
  }
</script>

<div
  class="p-5 font-mono text-xl text-steel-600 flex items-center justify-center mt-auto"
>
  <button
    onclick={() => {
      query.page -= 1;
      submitPageChange();
    }}
    type="button"
    disabled={query.page <= 1}
    aria-label="Previous page"
    class="p-2 bg-background inline-flex items-center justify-center rounded mr-4 hover:bg-rock-100 active:bg-rock-200/70 active:text-steel-700 border-2 border-steel-200 ring-rock-200/60 focus:ring-4 disabled:bg-background disabled:text-steel-600 disabled:opacity-40"
  >
    <CaretLeftIcon weight="bold" />
  </button>
  {#each pages as page_}
    <button
      class:active={page_ === query.page}
      type="button"
      class="mx-1 bg-background px-2.5 py-0.5 border-2 border-steel-200 rounded [.active]:bg-rock-100 ring-rock-200/60 [.active]:ring-4 transition-all hover:bg-rock-100 [.active]:cursor-default"
      onclick={() => {
        query.page = page_;
        submitPageChange();
      }}
    >
      {page_}
    </button>
  {/each}
  <button
    onclick={() => {
      query.page += 1;
      submitPageChange();
    }}
    type="button"
    disabled={query.page >= numPages}
    aria-label="Next page"
    class="p-2 bg-background inline-flex items-center justify-center rounded ml-4 hover:bg-rock-100 active:bg-rock-200/70 active:text-steel-700 border-2 border-steel-200 ring-rock-200/60 focus:ring-4 disabled:bg-background disabled:text-steel-600 disabled:opacity-40"
  >
    <CaretRightIcon weight="bold" />
  </button>
</div>
