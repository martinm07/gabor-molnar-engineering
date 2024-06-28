<script context="module" lang="ts">
  export function addCards(cards: Card[], num: number) {
    console.log(`Fetching ${num} more cards...`);
    const p = cards.length / num;
    return fetch_(`/documents/get_latest?p=${p}&l=${num}`)
      .then((resp) => resp.json())
      .then((data) => {
        const cardData = data.map(
          ({ title, description, accent, thumbnail }: any) => {
            return {
              title,
              description,
              color: accent,
              svgPath: thumbnail,
            };
          },
        );
        cards.push(...cardData);
      });
  }
</script>

<script lang="ts">
  import { setContext } from "svelte";
  import { fetch_ } from "/shared/helper";
  import type { Card } from "./BlogsList.svelte";
  import "/shared/tailwindinit.css";
  import SearchBar from "../search/SearchBar.svelte";
  import RecentBlogs from "./RecentBlogs.svelte";
  import TagBlogs from "./TagBlogs.svelte";

  const PAGE_SIZE = 6;
  setContext("PAGE_SIZE", PAGE_SIZE);

  let showingAll: boolean = $state(
    window.location.pathname.startsWith("/documents/all"),
  );
  // if (window.location.pathname.startsWith("/documents/all")) showingAll = true;
</script>

<h1
  class="text-center text-5xl text-stone-600 font-bold font-serif pb-14 pt-28"
>
  Guidance Documents
</h1>
<SearchBar />
<RecentBlogs bind:showingAll />
{#if !showingAll}
  <TagBlogs />
{/if}

<style>
  :global(body) {
    background-color: var(--background);
  }
</style>
