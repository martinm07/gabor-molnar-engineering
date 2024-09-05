<script lang="ts">
  import { getContext } from "svelte";
  import { watch } from "runed";
  import Fuse, { type FuseResult } from "fuse.js";
  import {
    savedComponents,
    nodesSelection,
    type SavedComponent,
    sidebarMode,
  } from "../store";
  import { isElementVisible } from "../helper";
  import { decodeComponentStr } from "./component";

  const setSelection: (nodes?: Node[] | Node) => void =
    getContext("setSelection");

  const fuse = new Fuse<SavedComponent>([], {
    ignoreLocation: true,
    ignoreFieldNorm: false,
    includeMatches: true,
    useExtendedSearch: true,
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
        getFn: (comp) => comp.tags.join(","),
        weight: 0.05,
      },
    ],
  });

  function parseQuery(str: string) {
    let oplessStr = str.replace(/=|'|!|\^|\$/g, "");

    const withinTags: string[] = [];
    for (const match of Array(
      ...oplessStr.matchAll(/\[[^\]]*\]/g),
    ).toReversed()) {
      oplessStr =
        oplessStr.slice(0, match.index) +
        oplessStr.slice(match.index + match[0].length);
      withinTags.push(match[0].slice(1, -1));
    }

    const quotes = oplessStr.split('"');
    quotes.forEach(
      (quote, i) => quotes[i] && (quotes[i] = `"${quote.trim()}"`),
    );
    const exactPhrases: string[] = [];
    for (let i = 1; i < quotes.length; i += 2) {
      exactPhrases.push(quotes[i].slice(1, -1));
      quotes[i] = `'${quotes[i]}`;
    }

    return { parsed: quotes.join(" ").trim(), exactPhrases, withinTags };
  }

  // Sync the Fuse collection with $savedComponents
  watch(
    () => $savedComponents,
    () => {
      fuse.setCollection($savedComponents);
    },
  );
  // Update the search results when the query changes
  watch(
    () => query,
    (_, prev) => {
      if (query) {
        const { parsed, exactPhrases, withinTags } = parseQuery(query);
        const parsedQuery = parsed.replace(/""/g, "").trim();
        const fuseResults = fuse.search(parsedQuery);

        // If there are tag requirements...
        if (withinTags.length > 0) {
          // Include ALL components that satisfy the tag requirements, and filter all
          //  from the search results that don't
          const allWithTag = $savedComponents.filter((comp) => {
            if (withinTags.every((tag) => comp.tags.includes(tag))) return true;
            else return false;
          });
          results = [
            ...fuseResults.filter((result) => {
              return allWithTag.some((comp) => result.item === comp);
            }),
            ...allWithTag
              .filter(
                (comp) => !fuseResults.some((result) => result.item === comp),
              )
              .map((comp, i) => {
                return {
                  item: comp,
                  refIndex: i,
                };
              }),
          ];
        } else {
          results = fuseResults;
        }
        // console.log(parsedQuery, withinTags, exactPhrases);
      } else {
        results = $savedComponents.map((comp, i) => {
          return {
            item: comp,
            refIndex: i,
          };
        });
      }
      if (typeof prev === "string") activeResultI = 0;
    },
  );
  // Potentially scroll the element into view when the activeResultI changes
  watch(
    () => activeResultI,
    (_, prev) => {
      if (activeResultI === -1) return;
      const el = resultEls[activeResultI];
      if (!el) return;
      if (!isElementVisible(el))
        el.scrollIntoView({
          block: activeResultI > (prev ?? Infinity) ? "end" : "start",
        });
    },
  );

  function addHighlights(
    comp: SavedComponent,
    matches: FuseResult<SavedComponent>["matches"],
  ) {
    if (!matches) return comp;
    // console.log($state.snapshot(comp), $state.snapshot(matches));
    const newComp = $state.snapshot(comp);
    for (const match of matches) {
      let value = match.value;
      let maxIndex: number = Infinity;
      match.indices
        .toSorted((a, b) => b[1] - a[1])
        .forEach(([start, end_]) => {
          if (start >= maxIndex) return;
          const end = Math.min(end_ + 1, maxIndex);
          value =
            value?.slice(0, start) +
            "<mark>" +
            value?.slice(start, end) +
            "</mark>" +
            value?.slice(end);
          maxIndex = start;
        });
      if (match.key === "name") newComp.name = value ?? "";
      else if (match.key === "description") newComp.description = value;
      else if (match.key === "tags") newComp.tags = value?.split(",") ?? [];
    }
    return newComp;
  }

  function selectComponent(i_?: number) {
    const i = i_ ?? activeResultI;
    // console.log("Selected component!", results[i]);
    const componentFrag = decodeComponentStr(results[i].item.content);
    const topLevel = Array(...componentFrag.childNodes);
    $nodesSelection[0].replaceWith(componentFrag);
    setSelection(topLevel);
    $sidebarMode = "edit";
    query = "";
  }

  let query = $state("");
  let results: FuseResult<SavedComponent>[] = $state([]);
  let resultEls: HTMLElement[] = $state([]);
  let activeResultI: number = $state(-1);
  let searchInpFocused = $state(false);
</script>

<form
  onsubmit={(e) => {
    selectComponent();
    e.preventDefault();
  }}
  role="search"
  class="my-2 sticky z-10 top-0"
  class:hidden={$sidebarMode !== "component"}
>
  <input
    type="text"
    placeholder="search"
    bind:value={query}
    onfocusin={() => {
      searchInpFocused = true;
      activeResultI = 0;
    }}
    onfocusout={() => {
      searchInpFocused = false;
      activeResultI = -1;
    }}
    onkeydown={(e) => {
      if (e.key === "ArrowUp") {
        activeResultI = Math.max(activeResultI - 1, 0);
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        activeResultI = Math.min(activeResultI + 1, results.length - 1);
        e.preventDefault();
      } else if (e.key === "Escape" && e.target instanceof HTMLInputElement) {
        e.target.blur();
      }
    }}
    class="px-2 py-1 border-2 border-rock-600 rounded font-mono text-rock-700 w-full bg-rock-50 placeholder:italic focus:outline-none ring-rock-200 focus:ring-4"
  />
  <div
    class="w-full py-1 border-2 border-t-0 border-rock-400 rounded-b-lg rounded-t bg-background flex items-center justify-center pointer-events-none absolute"
    class:hidden={!searchInpFocused || query}
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
</form>
<div class="text-rock-700" class:hidden={$sidebarMode !== "component"}>
  {#each results as result, i}
    {@const comp = addHighlights(result.item, result.matches)}
    <!-- {result.matches.} -->
    <div
      bind:this={resultEls[i]}
      class:active={i === activeResultI}
      role="button"
      tabindex="0"
      onkeydown={(e) => {
        if (e.key === "Enter") selectComponent(i);
      }}
      onclick={() => selectComponent(i)}
      class="component-search-result flex my-1 p-1 rounded-lg [&.active]:bg-rock-100 hover:bg-rock-100 has-[button:hover]:!bg-background focus:bg-rock-100 cursor-pointer scroll-mt-16 scroll-mb-4"
    >
      <div class="w-full">
        <div class="font-mono">{@html comp.name}</div>
        <div class="text-rock-600 text-sm">{@html comp.description ?? ""}</div>
        <div class="text-sm mt-1 w-full">
          {#each comp.tags as tag}
            <span
              class="bg-steel-100 border-[1px] border-steel-200 rounded px-0.5 m-0.5 inline-block"
              >{@html tag}</span
            >
          {/each}
        </div>
      </div>
      <div class="flex items-center justify-center">
        <button class="hover:bg-rock-100 focus:bg-rock-100 p-1 rounded-lg">
          <ion-icon name="build-outline"></ion-icon>
        </button>
      </div>
    </div>
    <div class="h-[2px] bg-rock-200 last-of-type:h-0"></div>
  {/each}
</div>

<style>
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
