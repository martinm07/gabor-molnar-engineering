<script lang="ts">
  import { onMount } from "svelte";
  import Color from "color";
  import BlogsList from "./BlogsList.svelte";
  import { getCardsForTag, getTags, type Card, type Tag } from "./store.svelte";
  import { convertAccent } from "/shared/helper";
  import { watch } from "runed";

  const NUM_CARDS_FOR_TAG = 25;

  let tagsFetch: Promise<Tag[]> | undefined = $state();
  const tags: Tag[] = $state([]);
  let activeTagI: number = $state(0);

  const tagCards: Card[] = $state([]);
  let tagCardsFetch: Promise<Card[]> | undefined = $state();
  let isLoadingCards: boolean = $state(true);

  onMount(() => (tagsFetch = getTags(tags)));

  watch([() => activeTagI, () => tags.length], () => {
    if (activeTagI < 0 || activeTagI >= tags.length) return;
    const currentActiveTagI = $state.snapshot(activeTagI);
    tagCards.splice(0, tagCards.length);
    isLoadingCards = true;
    tagCardsFetch = getCardsForTag(tags[activeTagI].name, NUM_CARDS_FOR_TAG);
    // We use the `currentActiveTagI === activeTagI` check to make sure we still actually
    //  want to show these cards by the time they've finished fetching
    //  (since in that time it's possible the user already selected a different tag, if they're spam-clicking).
    tagCardsFetch
      .then(
        (cardsData) =>
          currentActiveTagI === activeTagI &&
          tagCards.splice(0, tagCards.length, ...cardsData),
      )
      .finally(
        () => currentActiveTagI === activeTagI && (isLoadingCards = false),
      );
  });

  $inspect(isLoadingCards);
</script>

<h2
  class="text-4xl text-text-700 mt-14 mb-8 text-center font-bold text-balance"
>
  Browse Documents By Tag
</h2>

<div class="flex justify-center mb-8">
  <div class="w-7xl px-4 md:px-12">
    {#await tagsFetch}
      <span class="tags-loading-text font-mono text-rock-700"
        >Loading tags...</span
      >
    {:catch}
      <span class="text-red-700 font-bold"></span>
    {/await}
    {#each tags as tag, i}
      {const accent = Color(convertAccent(tag.accent))}
      <button
        class="inline-flex items-center text-rock-800 text-lg border rounded border-rock-300 m-1.5 px-1.5 font-mono bg-rock-50 tracking-tight hover:bg-rock-100 [.active.isdark]:text-rock-50 [.active]:bg-(--color) transition-colors"
        class:active={i === activeTagI}
        class:isdark={accent.isDark()}
        style="word-spacing: -0.25rem; --color: {accent.toString()}"
        onclick={() =>
          activeTagI === i ? (activeTagI = -1) : (activeTagI = i)}
      >
        <span class="w-3 h-3 rounded-sm bg-(--color) mr-1"></span>
        {tag.name}
      </button>
    {/each}
  </div>
</div>

{#if activeTagI >= 0 && activeTagI < tags.length}
  <BlogsList cards={tagCards} showLoading={isLoadingCards} />
  {#if tagCards.length === 0 && !isLoadingCards}
    <p class="text-2xl text-rock-600 italic text-center px-8">
      There are no guidance documents under this tag, for now...
    </p>
  {/if}
{:else if activeTagI === -1}
  <p class="text-2xl text-rock-600 italic text-center px-8">
    Select a tag to see the associated guidance documents we've written.
  </p>
{/if}

<style>
  .tags-loading-text {
    animation: pulse-animation 1s linear infinite;
  }
  @keyframes pulse-animation {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
    100% {
      opacity: 1;
    }
  }
</style>
