<script lang="ts">
  import { getContext, onMount } from "svelte";
  import { watch } from "runed";
  import Fuse, { type FuseResult } from "fuse.js";
  import {
    selection,
    mode,
    compLibVer,
    type SavedComponent,
  } from "../store.svelte";
  import { changePage, editorState } from "../url.svelte";
  import { isElementVisible } from "../helper";
  import {
    decodeComponentStr,
    comps,
    updateCompAdd,
    updateCompRemove,
    updateCompRestore,
  } from "./component.svelte";
  import ArrowsCounterClockwise from "phosphor-svelte/lib/ArrowsCounterClockwiseIcon";

  const setSelection: (nodes?: Node[] | Node) => void =
    getContext("setSelection");
  // const comps.lib = comps.lib();
  // $inspect(comps.lib);

  const fuse = new Fuse<(typeof comps.lib)[0]>([], {
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
        getFn: (comp) => comp.tags ?? "",
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

  // Sync the Fuse collection with components
  watch(
    [() => $state.snapshot(comps.lib), () => editorState.resourceName],
    () => {
      fuse.setCollection($state.snapshot(comps.lib));
      updateSearchResults();
    },
  );
  onMount(() => {
    fuse.setCollection($state.snapshot(comps.lib));
  });

  // Update the search results when the query changes
  function updateSearchResults() {
    if (query) {
      const { parsed, exactPhrases, withinTags } = parseQuery(query);
      const parsedQuery = parsed.replace(/""/g, "").trim();
      const fuseResults = fuse.search(parsedQuery);

      // If there are tag requirements...
      if (withinTags.length > 0) {
        // Include ALL components that satisfy the tag requirements, and filter all
        //  from the search results that don't
        const allWithTag = comps.lib.filter((comp) => {
          if (withinTags.every((tag) => comp.tags?.split(",").includes(tag)))
            return true;
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
      results = results.filter((result) =>
        editorState.mode === "component" && mode.sidebar === "addcomponent"
          ? editorState.resourceName !== result.item.identName
          : true,
      );
      // console.log(parsedQuery, withinTags, exactPhrases);
    } else {
      results = comps.lib
        .filter((comp) =>
          editorState.mode === "component" && mode.sidebar === "addcomponent"
            ? editorState.resourceName !== comp.identName
            : true,
        )
        .map((comp, i) => {
          return {
            item: comp,
            refIndex: i,
          };
        });
    }
  }
  watch(
    () => query,
    (_, prev) => {
      // console.log("Updating search results (query update): ", query);
      updateSearchResults();
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
    comp: (typeof comps.lib)[0],
    matches: FuseResult<(typeof comps.lib)[0]>["matches"],
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
      else if (match.key === "tags") newComp.tags = value;
    }
    return newComp;
  }

  /**
   * Adds currently selected component to document, by taking the first element of the current selection and replacing it with the DocumentFragment decoded from the component body string.
   * @param i_ If provided, specifies the index of the component to add to the document. Otherwise, activeResultI is used.
   */
  function selectComponentAdd(i_?: number) {
    if (editorState.mode !== "document") return;
    const i = i_ ?? activeResultI;
    // console.log("Selected component!", results[i]);
    const componentFrag = decodeComponentStr(
      results[i].item.content,
      editorState.mode,
    );
    const topLevel = Array(...componentFrag.childNodes);
    selection.selected[0].replaceWith(componentFrag);
    setSelection(topLevel);
    mode.sidebar = "edit";
    query = "";
  }

  function selectComponentEdit(comp: (typeof comps.lib)[0]) {
    if (!compLibVer.isVersFetched || !compLibVer.isLibUpToDate) return;
    changePage(
      "component",
      comp.identName,
      editorState.mode === "document"
        ? editorState.resourceName
        : editorState.documentRedirect,
    );
  }

  function selectComponentCreate() {
    let startName = 1;
    while (comps.lib.some((comp) => comp.name === `unnamed-${startName}`))
      startName++;
    const edit = updateCompAdd({
      name: `unnamed-${startName}`,
      content: `<div data-component="unnamed-${startName}-[1]">*initial*</div>`,
      parts: "1",
    });
    changePage(
      "component",
      edit.identName,
      editorState.mode === "document"
        ? editorState.resourceName
        : editorState.documentRedirect,
    );
  }

  function selectComponentRemove(comp: (typeof comps.lib)[0]) {
    updateCompRemove(comp.identName);
  }

  function selectComponentRestore(comp: (typeof comps.lib)[0]) {
    updateCompRestore(comp.identName);
  }

  const compStateToSortNum = (
    a: (typeof comps.lib)[0],
    b: (typeof comps.lib)[0],
  ) => {
    const toNum = (state: typeof a.state) => {
      if (state === "added") return -3;
      if (state === "removed") return -2;
      if (state === "modified") return -1;
      else return 0;
    };
    return toNum(a.state) - toNum(b.state);
  };

  let query = $state("");
  let results: FuseResult<(typeof comps.lib)[0]>[] = $state([]);
  let resultsSorted = $derived(
    results.toSorted((a, b) => compStateToSortNum(a.item, b.item)),
  );
  let resultEls: HTMLElement[] = $state([]);
  let activeResultI: number = $state(-1);
  let searchInpFocused = $state(false);
</script>

<form
  onsubmit={(e) => {
    selectComponentAdd();
    e.preventDefault();
  }}
  role="search"
  class="my-2 sticky z-20 top-0"
  class:hidden={!mode.sidebar.includes("component")}
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
        e.stopPropagation();
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

{#snippet resultEl(comp: (typeof comps.lib)[0], i: number)}
  <svelte:element
    this={mode.sidebar === "viewcomponent" ? "a" : "div"}
    href="/documents/edit/component/{comp.identName}"
    bind:this={resultEls[i]}
    class:active={i === activeResultI}
    role="button"
    tabindex="0"
    onkeydown={(e: KeyboardEvent) => {
      if (e.key === "Enter")
        mode.sidebar === "addcomponent"
          ? selectComponentAdd(i)
          : editorState.mode === "component" && selectComponentEdit(comp);
    }}
    onclick={(e: Event) => {
      e.preventDefault();
      mode.sidebar === "addcomponent"
        ? selectComponentAdd(i)
        : editorState.mode === "component" && selectComponentEdit(comp);
    }}
    class="component-search-result flex my-1 p-1 rounded-lg [.active]:bg-rock-100 hover:bg-rock-100 has-[.inner-btn:hover]:bg-background! focus:bg-rock-100 cursor-pointer scroll-mt-16 scroll-mb-4"
    class:!cursor-default={editorState.mode === "document" &&
      mode.sidebar === "viewcomponent"}
  >
    <div class="w-full" class:line-through={comp.state === "removed"}>
      <div class="font-mono">{@html comp.name}</div>
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
    <div class="flex items-center justify-center">
      {#if mode.sidebar === "addcomponent" || editorState.mode !== "component"}
        <a
          href="/documents/edit/component/{comp.identName}"
          class="inner-btn hover:bg-rock-100 focus:bg-rock-100 p-1 rounded-lg [.disabled]:opacity-40 [.disabled]:pointer-events-none"
          class:disabled={!compLibVer.isLibUpToDate}
          tabindex={!compLibVer.isLibUpToDate ? -1 : 0}
          aria-label="Edit component"
          onclick={(e) => {
            e.preventDefault();
            selectComponentEdit(comp);
          }}
          onkeydown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopImmediatePropagation();
              selectComponentEdit(comp);
            }
          }}
        >
          <ion-icon name="build-outline"></ion-icon>
        </a>
      {:else if mode.sidebar === "viewcomponent" && comp.state !== "removed"}
        <button
          aria-label="Remove component"
          class="inner-btn hover:bg-rock-100 focus:bg-rock-100 p-1 rounded-lg [.disabled]:hidden"
          onclick={(e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            selectComponentRemove(comp);
          }}
          onkeydown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopImmediatePropagation();
              selectComponentRemove(comp);
            }
          }}><ion-icon name="trash-outline"></ion-icon></button
        >
      {:else if mode.sidebar === "viewcomponent"}
        <button
          aria-label="Restore component"
          class="inner-btn hover:bg-rock-100 focus:bg-rock-100 p-1 rounded-lg [.disabled]:hidden text-lg"
          onclick={(e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            selectComponentRestore(comp);
          }}
          onkeydown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopImmediatePropagation();
              selectComponentRestore(comp);
            }
          }}><ArrowsCounterClockwise /></button
        >
      {/if}
    </div>
  </svelte:element>
{/snippet}

<div class="text-rock-700" class:hidden={!mode.sidebar.includes("component")}>
  {#each resultsSorted as result, i}
    {@const comp = addHighlights(result.item, result.matches)}
    {#if (resultsSorted[i - 1]?.item?.state ?? "unmodified") !== comp.state}
      <div
        class="sec-title text-lg font-bold mx-1 relative flex items-center justify-center"
      >
        <div class="absolute w-full h-0.5 bg-rock-200"></div>
        <span class="uppercase bg-background text-rock-600 inline-block z-10"
          >{comp.state}</span
        >
      </div>
    {/if}
    {@render resultEl(comp, i)}
    <div
      class="h-[2px] bg-rock-200 last-of-type:h-0 has-[+_.sec-title]:h-0"
    ></div>
  {/each}
</div>

<div
  class="p-2 flex items-center justify-center mt-4"
  class:hidden={!mode.sidebar.includes("component") ||
    editorState.mode !== "component"}
>
  <button
    class="px-3 py-1.5 border-steel-300 border-2 rounded bg-steel-100 text-steel-600 font-bold text-lg font-mono shadow-2xs inset-shadow-xs inset-shadow-rock-500 hover:shadow-md hover:inset-shadow-2xs hover:inset-shadow-steel-100 hover:px-3.5 transition-[padding,box-shadow] hover:active:bg-steel-200 hover:active:text-steel-700 hover:active:translate-y-1"
    onclick={selectComponentCreate}>New component</button
  >
</div>

{#if comps.savedLib.length === 0 && editorState.mode !== "component" && mode.sidebar.includes("component")}
  <div class="text-3xl italic text-gray-400 text-center mt-4">
    There appear to be no components in this library, for now.<br />
    <a
      class="underline hover:no-underline text-gray-500"
      href="/documents/edit/component"
      onclick={(e) => {
        e.preventDefault();
        changePage("component", "null", editorState.resourceName);
      }}
      onkeydown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          changePage("component", "null", editorState.resourceName);
        }
      }}>Edit component library?</a
    >
  </div>
{/if}

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
