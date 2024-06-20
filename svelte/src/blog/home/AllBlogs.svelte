<!-- UNUSED -->

<script lang="ts">
  import type { Card } from "./BlogsList.svelte";
  import { addCards } from "./App.svelte";
  import BlogsList from "./BlogsList.svelte";
  import DummyCard from "./DummyCard.svelte";
  import { getContext, onMount } from "svelte";
  import { useIntersectionObserver, watch } from "runed";

  const PAGE_SIZE: number = getContext("PAGE_SIZE");

  interface Props {
    initialCards?: Card[];
  }
  let { initialCards = [] }: Props = $props();

  let addCardsFetch: Promise<void> = $state(Promise.resolve());
  const blogCards: Card[] = $state([]);
  onMount(() => {
    blogCards.push(...initialCards);
    addCards(blogCards, PAGE_SIZE);
  });

  let intersectionEl: HTMLElement | undefined = $state();
  let isAtBottom: boolean = $state(false);
  const bottomOvserver = useIntersectionObserver(
    () => intersectionEl,
    (entries) => {
      const entry = entries[0];
      if (!entry) return;
      isAtBottom = entry.isIntersecting;
    },
  );

  let finishedAllBlogs: boolean = $state(false);
  // watch(
  //   () => isAtBottom,
  //   (atBottom) => {
  //     const numBefore = blogCards.length;
  //     if (!finishedAllBlogs && atBottom)
  //       addCardsFetch = addCards(blogCards, PAGE_SIZE).then(() => {
  //         const numAfter = blogCards.length;
  //         if (numAfter < numBefore + PAGE_SIZE) {
  //           finishedAllBlogs = true;
  //           bottomOvserver.stop();
  //         }
  //       });
  //   },
  // );
</script>

<BlogsList cards={blogCards} />
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
  <div
    class="absolute bottom-0 -z-50 h-[30vh] w-full"
    bind:this={intersectionEl}
  ></div>
{:catch}
  <div class="text-center text-red-500 px-6 font-bold text-lg">
    Something unexpected happened. Sorry for the inconvenience and please try
    again later.
  </div>
{/await}
