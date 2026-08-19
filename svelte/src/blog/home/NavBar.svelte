<script lang="ts">
  import { onDestroy } from "svelte";
  import { on } from "svelte/events";
  import { fetch_, preventDefault } from "/shared/helper";
  import type { TypesenseResults } from "/shared/types";
  import { watch } from "runed";
  import SearchResult from "./SearchResult.svelte";

  interface Props {
    disableSearchBox?: boolean;
    disableHiding?: boolean;
  }
  let { disableSearchBox, disableHiding }: Props = $props();

  let bgEl: HTMLElement;

  let prevScrollY: number = 0;
  const offScroll = on(document, "scroll", () => {
    if (disableHiding) {
      bgEl.style.position = "fixed";
      bgEl.style.top = `0px`;
      return;
    }

    if (!searchHidden && !searchEmpty) return;
    const deltaY = window.scrollY - prevScrollY;
    const elTop = bgEl.getBoundingClientRect().top;

    if (deltaY > 0 && elTop <= -bgEl.offsetHeight) {
      bgEl.style.position = "fixed";
      bgEl.style.top = `-${bgEl.offsetHeight}px`;
    } else if ((deltaY < 0 && elTop >= 0) || window.scrollY === 0) {
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

  let value = $state("");
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
    console.log(e.target);
    if (
      (<HTMLElement>e.target).closest(".search-results") ||
      (<HTMLElement>e.target).closest(".navbar")
    )
      return;
    if (searchEmpty) return;
    searchHidden = true;
  }

  // let activeResultI = $state(-1);
</script>

<svelte:body onclick={bodyClick} />
<!-- <svelte:window onkeydown={keyDown} /> -->

<nav
  class="navbar absolute grid items-center w-full h-15 top-0 bg-white/95 bg-opacity-85 border-b-2 border-rock-100/75 z-50 shadow-[0px_5px_20px_-10px_#e4e4e4] col-span-full"
  bind:this={bgEl}
>
  <div class="flex h-15">
    <a
      href="/"
      class="block left-1.5 top-1.5 h-[calc(100%+1rem)] bg-white rounded-full p-1 box-content"
      ><img
        class="w-full h-full"
        src="{!globalThis.jinjaParsed
          ? 'http://localhost:5000'
          : ''}/static/intro/img/logo.svg"
        alt="Logo"
      /></a
    >
    <a
      href="/documents"
      class="flex items-center ml-1 md:ml-6 text-lg text-rock-800 px-2 my-0.5 border-b-0 hover:border-b-2 border-transparent hover:border-rock-300 hover:text-rock-600 hover:shadow-[inset_0px_-85px_20px_-100px_black] transition-[border-color,box-shadow,color] duration-200"
      >Documents</a
    >
  </div>
  {#if !disableSearchBox}
    <form
      method="get"
      action="/documents/search?q={value}"
      class="flex justify-end"
      onsubmit={(e) => {}}
    >
      <input
        bind:value
        onfocus={() => {
          searchHidden = false;
        }}
        name="q"
        type="text"
        placeholder="search"
        class="searchbox w-72 md:w-96 h-10 bg-background border-2 border-rock-300 z-50 font-mono text-lg px-3 focus:outline-none focus:ring-4 focus:ring-steel-200/70 rounded transition-all"
        onkeydown={(e) => {
          console.log(e.key);
          if (e.key === "Escape" && !searchHidden && !searchEmpty) {
            searchHidden = true;
          }
          // else if (
          //   e.key === "ArrowDown" &&
          //   activeResultI < (results?.hits.length ?? 0)
          // ) {
          //   activeResultI += 1;
          // } else if (e.key === "ArrowUp" && activeResultI > 0) {
          //   activeResultI -= 1;
          // }
        }}
      />
      <button
        type="submit"
        aria-label="Submit query"
        class="size-10 rounded border-2 border-rock-300 mx-1.5 flex items-center justify-center bg-background text-rock-500 hover:bg-rock-100 hover:text-rock-600 hover:active:ring-4 ring-steel-200/70 hover:active:translate-y-0.5 transition-all"
        ><ion-icon
          name="search-outline"
          class="text-xl"
          style="--ionicon-stroke-width: 48px;"
        ></ion-icon></button
      >
    </form>
  {:else}
    <div></div>
  {/if}

  <div></div>
</nav>

{#if results && !searchEmpty && !searchHidden}
  <div
    class="search-results fixed top-15 w-3/4 md:w-1/2 left-1/2 -translate-x-1/2 z-50 max-h-[calc(70%-4.5rem)] overflow-y-scroll border-2 border-t-0 border-rock-100/75 rounded-b-xl bg-white shadow-lg"
  >
    <div class="w-full bg-white">
      {#if results.hits.length === 0}
        <div class="text-center py-4 text-lg text-rock-700">
          No results found for <span
            class="inline-block px-1 bg-white rounded font-mono text-base"
            >{value}</span
          >
        </div>
      {/if}
      {#key results.hits}
        {#each results.hits as result, i}
          <SearchResult info={result} />
        {/each}
      {/key}
    </div>
  </div>
{/if}

<div class="h-15 col-span-full"></div>

<style>
  @media screen and (min-width: 55rem) {
    .navbar {
      grid-template-columns: 1fr auto 1fr;
    }
  }

  @media screen and (min-width: 35rem) and (max-width: 55rem) {
    .navbar {
      grid-template-columns: auto 1fr 0;
    }
  }

  @media screen and (max-width: 35rem) {
    .navbar {
      grid-template-columns: auto 1fr 0;
    }

    .searchbox {
      display: none;
    }
  }
</style>
