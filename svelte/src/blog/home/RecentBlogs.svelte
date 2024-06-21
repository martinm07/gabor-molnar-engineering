<script lang="ts">
  import { getContext } from "svelte";
  import { useIntersectionObserver, watch } from "runed";
  import { preventDefault } from "/shared/helper";
  import { addCards } from "./App.svelte";
  import type { Card } from "./BlogsList.svelte";
  import BlogsList from "./BlogsList.svelte";
  import DummyCard from "./DummyCard.svelte";
  import "/shared/tailwindinit.css";
  const PAGE_SIZE: number = getContext("PAGE_SIZE");

  interface Props {
    showingAll?: boolean;
  }
  let { showingAll = $bindable(false) }: Props = $props();

  let addCardsFetch: Promise<any> = $state(Promise.resolve());
  const blogCards: Card[] = $state([]);
  addCardsFetch = addCards(blogCards, PAGE_SIZE);

  function showMore(pushState = true) {
    showingAll = true;
    finishedAllBlogs = false;
    bottomObserver.resume();
    if (pushState)
      history.pushState({ showingAll: true }, "", "/documents/all");
    addCardsFetch = addCards(blogCards, PAGE_SIZE);
  }

  let intersectionEl: HTMLElement | undefined = $state();
  let isAtBottom: boolean = $state(false);
  const bottomObserver = useIntersectionObserver(
    () => intersectionEl,
    (entries) => {
      const entry = entries[0];
      if (!entry) return;
      isAtBottom = entry.isIntersecting;
    },
  );

  let finishedAllBlogs: boolean = $state(false);
  watch(
    () => isAtBottom,
    (atBottom) => {
      const numBefore = blogCards.length;
      if (!finishedAllBlogs && atBottom)
        addCardsFetch = addCards(blogCards, PAGE_SIZE).then(() => {
          const numAfter = blogCards.length;
          if (numAfter < numBefore + PAGE_SIZE) {
            finishedAllBlogs = true;
            bottomObserver.pause();
          }
        });
    },
  );

  history.replaceState({ showingAll }, "", document.location.href);
  window.addEventListener("popstate", (e) => {
    if (e.state?.showingAll) {
      showMore(false);
    } else {
      showingAll = false;
      blogCards.splice(PAGE_SIZE);
    }
  });
</script>

<h1 class="text-3xl text-stone-600 font-sans p-8 pt-14 font-bold">
  Latest Guidance Documents
</h1>
<BlogsList cards={blogCards} />
{#if !showingAll}
  <div class="py-10 text-center">
    <a
      onclick={preventDefault(showMore)}
      href="/documents/all"
      class="inline-block px-4 py-2 border-2 rounded border-stone-600 text-text text-xl bg-stone-100 underline hover:no-underline hover:bg-stone-200 active:bg-stone-300"
      >See All</a
    >
  </div>
{/if}
{#await addCardsFetch}
  <div
    class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 justify-items-center gap-5 px-5"
  >
    <DummyCard />
    <DummyCard class="hidden md:block" />
    <DummyCard class="hidden xl:block" />
    <DummyCard class="hidden 2xl:block" />
  </div>
{:then}
  {#if showingAll}
    <div
      class="absolute bottom-0 -z-50 h-[30vh] w-full"
      bind:this={intersectionEl}
    ></div>
  {/if}
{:catch}
  <div class="text-center text-red-500 px-6 font-bold text-lg">
    Something unexpected happened. Sorry for the inconvenience and please try
    again later.
  </div>
{/await}
{#if showingAll}
  <div class="h-14"></div>
{/if}
