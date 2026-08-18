<script lang="ts">
  import { getContext } from "svelte";
  import { useIntersectionObserver, watch } from "runed";
  import { preventDefault } from "/shared/helper";
  import BlogsList from "./BlogsList.svelte";
  import "/shared/tailwindinit.css";
  import { addCards, PAGE_SIZE, homeState, type Card } from "./store.svelte";

  const changeShowingAll: (newShowingAll: boolean) => void =
    getContext("changeShowingAll");

  const recentCards: Card[] = $state([]);
  // Whenever we go from not showing all blog cards to doing so, we set loadedAllCards back to false, so that all the new cards get refetched
  // Whenever we go from showing all blog cards to not, we splice away all those extra cards that were loaded.
  watch(
    () => homeState.showingAll,
    () => {
      if (homeState.showingAll) loadedAllCards = false;
      if (!homeState.showingAll) recentCards.splice(PAGE_SIZE);
    },
  );

  let addCardsFetch: Promise<any> = $state(Promise.resolve());
  let isLoadingCards = $state(true);
  let loadedAllCards = false;

  addCardsFetch = addCards(recentCards, PAGE_SIZE);
  // Whenever addCardsFetch gets reassigned, we set isLoadingCards back to true,
  //  and set a callback to set isLoadingCards to false when the fetch is done.
  $effect(() => {
    isLoadingCards = true;
    addCardsFetch.finally(() => (isLoadingCards = false));
  });

  let intersectionEl: HTMLElement | undefined = $state();
  const bottomObserver = useIntersectionObserver(
    () => intersectionEl,
    (entries) => {
      const entry = entries[0];
      if (!entry || !entry.isIntersecting) return;
      if (isLoadingCards || loadedAllCards) return;

      addCardsFetch = addCards(recentCards, PAGE_SIZE).then((cardData) => {
        if (cardData.length < PAGE_SIZE) loadedAllCards = true;
      });
    },
  );
</script>

<h1 class="text-5xl text-stone-600 font-serif mt-14 text-center">
  {homeState.showingAll ? "All" : "Latest"} Guidance Documents
</h1>
<p class="text-xl text-stone-600 text-center my-4 px-8">
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
  incididunt ut labore
</p>
<div class="h-8"></div>
<BlogsList cards={recentCards} showLoading={isLoadingCards} />

{#if !homeState.showingAll}
  <div class="py-10 text-center">
    <a
      onclick={(e) => {
        e.preventDefault();
        changeShowingAll(true);
      }}
      href="/documents/all"
      class="inline-block px-4 py-2 text-steel-700 text-2xl group"
      ><span class="underline group-hover:no-underline">See All</span><span
        class="inline-block ml-2 text-3xl font-mono group-hover:translate-x-1 transition-transform"
        >&gt;</span
      ></a
    >
  </div>
{/if}
{#await addCardsFetch then}
  {#if homeState.showingAll}
    <div class="absolute -z-50 h-1 w-full" bind:this={intersectionEl}></div>
  {/if}
{:catch}
  <div class="text-center text-red-500 px-6 font-bold text-lg">
    Something unexpected happened. Sorry for the inconvenience and please try
    again later.
  </div>
{/await}
{#if homeState.showingAll}
  <div class="h-14"></div>
{/if}
