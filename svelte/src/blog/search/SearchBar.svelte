<script lang="ts">
  import { onDestroy } from "svelte";
  import { on } from "svelte/events";
  import { fetch_, preventDefault } from "/shared/helper";
  import type { TypesenseResults } from "/shared/types";
  import { watch } from "runed";
  import SearchCard from "./SearchCard.svelte";

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
  let results: TypesenseResults | undefined = $state();
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
      {#key results.hits}
        {#each results.hits as result}
          <SearchCard info={result} />
        {/each}
      {/key}
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
