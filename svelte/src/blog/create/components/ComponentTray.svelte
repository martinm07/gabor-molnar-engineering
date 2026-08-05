<script lang="ts">
  import Fuse, { type FuseResult } from "fuse.js";
  import {
    type SavedComponent,
    type SavedComponentWithEdit,
  } from "../store.svelte";
  import { type Snippet } from "svelte";
  import { watch } from "runed";

  interface Props {
    mainAction?: (comp: SavedComponentWithEdit) => void;
    mainActionTag: "a" | "button" | "none";

    secondaryAction?: (comp: SavedComponentWithEdit) => void;
    secondaryActionTag: "a" | "button" | "none";
    secondaryActionContent?: Snippet<[comp: SavedComponentWithEdit]>;
    secondaryActionLabel?: string;

    generateHref?: (comp: SavedComponentWithEdit) => string;

    comps: SavedComponentWithEdit[];
  }

  let {
    mainAction,
    mainActionTag,

    secondaryAction,
    secondaryActionTag,
    secondaryActionContent,
    secondaryActionLabel,

    generateHref,

    comps,
  }: Props = $props();

  const fuse = new Fuse<SavedComponentWithEdit>([], {
    ignoreLocation: true,
    ignoreFieldNorm: false,
    includeMatches: true,
    // useExtendedSearch: true,
    keys: [
      {
        name: "name",
        weight: 0.475,
      },
      {
        name: "description",
        getFn: (comp) => comp.description ?? "",
        weight: 0.475,
      },
      {
        name: "tags",
        getFn: (comp) => comp.tags ?? "",
        weight: 0.05,
      },
    ],
  });

  watch(
    () => $state.snapshot(comps),
    (compsSnapshot) => {
      fuse.setCollection(compsSnapshot);
      updateSearchResults();
    },
  );

  interface ParseQueryResult {
    originalQuery: string;
    strippedQuery: string;
    tagFilters: string[];
    exactPhrases: string[];
  }
  function parseQuery(query: string): ParseQueryResult {
    const tagFilters: string[] = [];
    const exactPhrases: string[] = [];

    const extractTagsRegex = /\[(.+?)\]/g;
    const spliceTagInfo: { index: number; length: number }[] = [];

    query.matchAll(extractTagsRegex).forEach((match) => {
      const tag = match[1];
      tagFilters.push(tag);
      spliceTagInfo.push({
        index: match.index,
        length: match[0].length,
      });
    });

    let queryWithoutTags = query;
    spliceTagInfo.sort((a, b) => b.index - a.index);
    spliceTagInfo.forEach(
      ({ index, length }) =>
        (queryWithoutTags =
          queryWithoutTags.slice(0, index) +
          queryWithoutTags.slice(index + length)),
    );

    const extractExactPhrasesRegex = /"(.+?)"/g;
    const transformPhrasesInfo: {
      index: number;
      length: number;
      value: string;
    }[] = [];

    queryWithoutTags.matchAll(extractExactPhrasesRegex).forEach((match) => {
      const exactPhrase = match[1];
      exactPhrases.push(exactPhrase);
      transformPhrasesInfo.push({
        index: match.index,
        length: match[0].length,
        value: exactPhrase,
      });
    });

    let finalQuery = queryWithoutTags;
    transformPhrasesInfo.sort((a, b) => b.index - a.index);
    transformPhrasesInfo.forEach(
      ({ index, length, value }) =>
        (finalQuery =
          finalQuery.slice(0, index) +
          value +
          finalQuery.slice(index + length)),
    );

    return {
      originalQuery: query,
      strippedQuery: finalQuery,
      tagFilters,
      exactPhrases,
    };
  }

  let query = $state("");

  let searchResults: SavedComponentWithEdit[] = $state([]);

  const sortedSearchResults = $derived(
    searchResults.toSorted((a, b) => {
      const toNum = (state: typeof a.state) => {
        if (state === "added") return -3;
        if (state === "removed") return -2;
        if (state === "modified") return -1;
        else return 0;
      };
      return toNum(a.state) - toNum(b.state);
    }),
  );

  /**
   * Uses `query`, parses it using `parseQuery`, uses the result in `fuse.search`,
   * and then splices searchResults with the new results
   * (filtering results to those that have the tags and exact phrases found in the query syntax, and adding HTML <mark> elements to the values in the resulting `comp.name`, `comp.description` and `comp.tags` fields).
   */
  function updateSearchResults() {
    if (!query) {
      searchResults = comps;
      return;
    }

    const { strippedQuery, tagFilters, exactPhrases } = parseQuery(query);
    const results = fuse.search(strippedQuery);

    searchResults = [];
    for (const result of results) {
      if (!componentHasTags(result.item, tagFilters)) continue;
      if (!componentHasPhrases(result.item, exactPhrases)) continue;

      const markedComp = addMarksToComponent(result.item, result.matches);
      searchResults.push(markedComp);
    }
  }

  function componentHasTags(comp: SavedComponentWithEdit, tags: string[]) {
    const compTags = (comp.tags ?? "").split(",");
    return tags.every((tag) => compTags.includes(tag));
  }

  function componentHasPhrases(
    comp: SavedComponentWithEdit,
    exactPhrases: string[],
  ) {
    return exactPhrases.every(
      (phrase) =>
        comp.name.includes(phrase) ||
        comp.description?.includes(phrase) ||
        comp.tags?.includes(phrase),
    );
  }

  function addMarksToComponent(
    comp: SavedComponentWithEdit,
    matches: FuseResult<SavedComponentWithEdit>["matches"],
  ): SavedComponentWithEdit {
    // `matches` is an array of objects, where each object specifies a different key
    // for the comp item, and has an array `indices` where each item is a 2-tuple of numbers,
    // giving the start and end characters for the match.

    // prettier-ignore
    const markedComp = structuredClone(comp) as unknown as { [key: string]: string; };

    for (const keyMatches of matches ?? []) {
      if (!keyMatches.key || !keyMatches.value) {
        console.error(
          "Fuse.js match object didn't have a 'key' and/or 'value' field.",
          keyMatches,
          matches,
        );
        continue;
      }

      const oldValue = keyMatches.value;
      let newValue = oldValue;

      const sortedIndices = keyMatches.indices.toSorted(
        ([aIndex], [bIndex]) => bIndex - aIndex,
      );
      sortedIndices.forEach(([startIndex, endIndex]) => {
        const insertValue =
          "<mark>" + oldValue.slice(startIndex, endIndex + 1) + "</mark>";
        newValue =
          newValue.slice(0, startIndex) +
          insertValue +
          newValue.slice(endIndex + 1);
      });

      markedComp[keyMatches.key] = newValue;
    }

    return markedComp as unknown as SavedComponentWithEdit;
  }

  //////////////

  let searchBoxFocused = $state(false);

  let activeResultI = $state(-1);
</script>

<form
  onsubmit={(e) => {
    e.preventDefault();
    let selectedCompI: number;
    if (searchBoxFocused && activeResultI > -1) selectedCompI = activeResultI;
    else if (e.submitter?.dataset?.i !== undefined)
      selectedCompI = Number.parseInt(e.submitter.dataset.i);
    else {
      console.error("Could not determine selected component.");
      return;
    }

    const selectedComp = sortedSearchResults[selectedCompI];
    mainAction?.(selectedComp);
  }}
>
  <div class="my-2 sticky z-20 top-4">
    <input
      type="text"
      placeholder="search"
      bind:value={query}
      class="px-2 py-1 border-2 border-rock-600 rounded font-mono text-rock-700 w-full bg-rock-50 placeholder:italic focus:outline-none ring-rock-200 focus:ring-4"
      oninput={() => updateSearchResults()}
      onfocusin={() => {
        searchBoxFocused = true;
        activeResultI = 0;
      }}
      onfocusout={() => {
        searchBoxFocused = false;
        activeResultI = -1;
      }}
      onkeydown={(e) => {
        if (e.key === "ArrowUp") {
          activeResultI = Math.max(activeResultI - 1, 0);
          e.preventDefault();
        } else if (e.key === "ArrowDown") {
          activeResultI = Math.min(
            activeResultI + 1,
            sortedSearchResults.length - 1,
          );
          e.preventDefault();
        } else if (e.key === "Escape" && e.target instanceof HTMLInputElement) {
          e.target.blur();
          e.stopPropagation();
        }
      }}
    />
    <!-- Helper box showing the syntax for search queries (when the search box is empty) -->
    <div
      class="w-full py-1 border-2 border-t-0 border-rock-400 rounded-b-lg rounded-t bg-background flex items-center justify-center pointer-events-none absolute"
      class:hidden={!searchBoxFocused || query}
    >
      <div class="inline-block text-rock-700">
        <span class="inline-block my-0.5"
          ><span class="font-mono inline-block mr-1">[tag]</span><span
            class="text-rock-500">search within tag</span
          ></span
        ><br />
        <span class="inline-block my-0.5"
          ><span class="font-mono inline-block mr-1">"words here"</span><span
            class="text-rock-500">exact phrase</span
          ></span
        >
      </div>
    </div>
  </div>

  {#each sortedSearchResults as comp, i}
    {let state = comp.state ?? "normal"}
    {let active = $derived(i === activeResultI)}

    {const prevState = sortedSearchResults[i - 1]?.state}
    {#if comp.state && comp.state !== prevState}
      <!-- (this is purely for the component library editor) Insert a divider/header that gives the states of the following component results. -->
      <div
        class="sec-title text-lg font-bold mx-1 relative flex items-center justify-center"
      >
        <div class="absolute w-full h-0.5 bg-rock-200"></div>
        <span class="uppercase bg-background text-rock-600 inline-block z-10"
          >{comp.state}</span
        >
      </div>
    {/if}

    <!-- Container for component display result -->
    <div
      class="component-search-result flex relative my-1 p-1 rounded-lg [.active]:bg-rock-100 hover:bg-rock-100 focus-within:bg-rock-100 scroll-mt-16 scroll-mb-4 has-[.secondary-btn:hover]:bg-background! text-rock-700"
      class:active
    >
      <!-- Main information on component (name, description, tags) -->
      <div class="w-full" class:line-through={state === "removed"}>
        <!-- Name is our main interactible element, we use a ::before style so that hovering
             anywhere over the display result hovers the title. -->
        {#if mainActionTag === "a"}
          <a
            href={generateHref?.(comp)}
            class="breakout-interactible font-mono static"
            onclick={(e) => {
              // FUN FACT: the "onclick" event handler fires even when the anchor tag is interacted with via keyboard (e.g. pressing Enter) or other ways! Intercepting the click event is hence the "idiomatic" way of intercepting anchor tag navigation for SPAs.

              e.preventDefault();
              mainAction?.(comp);
            }}>{@html comp.name}</a
          >
        {:else if mainActionTag === "button"}
          <button
            class="breakout-interactible font-mono static"
            type="submit"
            data-i={i}>{@html comp.name}</button
          >
        {:else}
          <div class="font-mono static">{@html comp.name}</div>
        {/if}

        <div class="text-rock-600 text-sm">{@html comp.description ?? ""}</div>
        <div class="text-sm mt-1 w-full">
          {#each comp.tags?.split(",") ?? [] as tag}
            <span
              class="bg-steel-100 border border-steel-200 rounded px-0.5 m-0.5 inline-block"
              >{@html tag}</span
            >
          {/each}
        </div>
      </div>
      <!-- Secondary action (to the side of the main information) -->
      {#if secondaryActionTag === "a" && secondaryActionContent}
        <div class="flex items-center justify-center z-10">
          <a
            aria-label={secondaryActionLabel}
            href={generateHref?.(comp)}
            class="secondary-btn hover:bg-rock-100 focus:bg-rock-100 p-1 rounded-lg [.disabled]:hidden text-lg py-2"
            onclick={(e) => {
              e.preventDefault();
              secondaryAction?.(comp);
            }}>{@render secondaryActionContent(comp)}</a
          >
        </div>
      {:else if secondaryActionTag === "button" && secondaryActionContent}
        <div class="flex items-center justify-center z-10">
          <button
            aria-label={secondaryActionLabel}
            class="secondary-btn hover:bg-rock-100 focus:bg-rock-100 p-1 rounded-lg [.disabled]:hidden text-lg py-2"
            type="button"
            onclick={(e) => {
              e.preventDefault();
              secondaryAction?.(comp);
            }}>{@render secondaryActionContent(comp)}</button
          >
        </div>
      {/if}
    </div>
    <div
      class="h-[2px] bg-rock-200 last-of-type:h-0 has-[+_.sec-title]:h-0"
    ></div>
  {/each}
</form>

<style>
  .breakout-interactible,
  .breakout-interactible::before {
    cursor: pointer;
  }

  .breakout-interactible::before {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  :global(.component-search-result mark) {
    background-color: var(--steel-100);
    color: inherit;
  }
  :global(
    .component-search-result.active mark,
    .component-search-result:focus mark,
    .component-search-result:hover mark,
    .component-search-result span mark
  ) {
    background-color: var(--steel-200);
  }
</style>
