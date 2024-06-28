<script lang="ts">
  import { onDestroy } from "svelte";
  import { on } from "svelte/events";
  import { fetch_, preventDefault } from "/shared/helper";
  import { watch } from "runed";

  let bgEl: HTMLElement;

  let prevScrollY: number = 0;
  const offScroll = on(document, "scroll", () => {
    if (!searchHidden && !searchEmpty) return;
    const deltaY = window.scrollY - prevScrollY;
    const elTop = bgEl.getBoundingClientRect().top;

    if (deltaY > 0 && elTop <= -bgEl.offsetHeight) {
      bgEl.style.position = "fixed";
      bgEl.style.top = `-${bgEl.offsetHeight}px`;
    } else if (deltaY < 0 && elTop >= 0) {
      bgEl.style.position = "fixed";
      bgEl.style.top = `0px`;
    } else if (bgEl.style.position === "fixed") {
      bgEl.style.position = "absolute";
      const top = Number.parseFloat(bgEl.style.top);
      bgEl.style.top = `${top + window.scrollY}px`;
    }

    prevScrollY = window.scrollY;
  });
  onDestroy(offScroll);

  let value = $state("definitely real");
  interface Results {
    search_time_ms: number;
    found: number;
    out_of: number;
    hits: Array<{
      document: { [key: string]: any };
      highlight: {
        [key: string]: any;
      };
      highlights: Array<{
        field: string;
        matched_tokens: string[];
        snippet: string;
      }>;
    }>;
  }
  let results: Results | undefined = $state();
  let searchEmpty = $state(true);
  let searchHidden = $state(false);
  watch(
    () => value,
    () => {
      if (!value) {
        searchEmpty = true;
        return;
      }
      searchEmpty = false;
      searchHidden = false;
      bgEl.style.position = "fixed";
      bgEl.style.top = `0px`;

      const searchParams = new URLSearchParams([["q", value]]);
      fetch_(`/documents/query?${searchParams.toString()}`)
        .then((resp) => resp.json())
        .then((data) => {
          console.log(data);
          results = data;
        });
    },
    {
      lazy: true,
    },
  );

  function bodyClick(e: MouseEvent) {
    if (
      (<HTMLElement>e.target).closest(".search-results") ||
      (<HTMLElement>e.target).closest(".navbar")
    )
      return;
    if (searchEmpty) return;
    searchHidden = true;
  }
  function keyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && !searchHidden && !searchEmpty) {
      searchHidden = true;
    }
  }

  function snipText(text: string, cutoff: number = 30) {
    if (text.split(" ").length <= cutoff) return text;
    return text.slice(0, cutoff).trimEnd() + " [...]";
  }
  function processSnippet(snippet: string, fullField: string) {
    // console.log(snippet, fullField);
    if (!snippet) return snippet;
    const snippetRaw = snippet.replace(/(<mark>)|(<\/mark>)/g, "");
    if (snippetRaw === fullField) return snippet;
    return "[...] " + snippet.trim() + " [...]";
  }
</script>

<svelte:body onclick={bodyClick} />
<svelte:window onkeydown={keyDown} />
{#if results && !searchEmpty && !searchHidden}
  <div
    class="search-results fixed top-14 w-3/4 left-1/2 -translate-x-1/2 z-50 max-h-[calc(100%_-_4.5rem)] overflow-y-scroll border-2 border-t-0 border-rock-400 rounded"
  >
    <div class="w-full bg-background">
      {#if results.hits.length === 0}
        <div class="text-center py-4 text-lg text-rock-700">
          No results found for <span
            class="inline-block px-1 bg-rock-100 rounded font-mono text-base"
            >{value}</span
          >
        </div>
      {/if}
      {#each results.hits as result}
        {@const subSnip =
          processSnippet(
            result.highlight.description?.snippet,
            result.document.description,
          ) ??
          processSnippet(
            result.highlight.body?.snippet,
            result.document.body,
          ) ??
          snipText(result.document.description)}
        <a
          href="/read/article"
          class="search-result border-b-2 last-of-type:border-b-0 border-rock-400 p-3 relative group hover:bg-rock-100 block"
        >
          <h3 class="font-serif text-xl text-rock-700">
            {@html result.highlight.title?.snippet ?? result.document.title}
          </h3>
          <ul class="mb-3">
            {#each (result.highlight.tags)?.map((el: any) => el.snippet) ?? result.document.tags as tagName}
              <li
                class="inline-block w-fit px-1 border-2 border-rock-300 rounded text-xs font-bold mx-1 text-rock-500"
              >
                {@html tagName}
              </li>
            {/each}
          </ul>
          <p class="px-3 text-stone-600 text-center pb-5">
            {@html subSnip}
          </p>
          <div
            style="--accent: rgb({result.document.accent});"
            class="absolute bottom-1 right-3 font-bold underline group-hover:no-underline text-stone-500"
          >
            Read document
          </div>
        </a>
      {/each}
    </div>
  </div>
{/if}

<form
  method="get"
  action="/documents/search"
  bind:this={bgEl}
  class="navbar absolute w-full h-14 top-0 bg-steel-50 bg-opacity-85 border-b-2 border-rock-400 z-50 flex items-center justify-center"
>
  <input
    bind:value
    onfocus={() => (searchHidden = false)}
    name="q"
    type="text"
    placeholder="search"
    class="w-72 md:w-96 h-10 bg-background border-2 border-rock-400 z-50 font-mono text-lg px-3 focus:outline-none focus:ring-4 focus:ring-rock-200 rounded"
  />
  <button
    type="submit"
    class="size-10 rounded border-2 border-rock-400 ml-1.5 flex items-center justify-center bg-background text-rock-500 hover:bg-rock-200 hover:text-rock-600"
    ><ion-icon
      name="search-outline"
      class="text-xl"
      style="--ionicon-stroke-width: 48px;"
    ></ion-icon></button
  >
</form>

<style>
  :global(.search-result mark) {
    background-color: var(--rock-100);
    color: inherit;
  }
  :global(.search-result:hover mark) {
    background-color: var(--rock-200);
  }
</style>
