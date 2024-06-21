<script lang="ts">
  import { getContext, onDestroy } from "svelte";
  import { on } from "svelte/events";
  import { fetch_ } from "/shared/helper";
  import BlogsList from "./BlogsList.svelte";
  import type { IBlogsList } from "./BlogsList.svelte";
  import DummyCard from "./DummyCard.svelte";
  import type { Card } from "./BlogsList.svelte";
  import "./style.css";
  const PAGE_SIZE = getContext("PAGE_SIZE");

  type DictList = { [key: string]: any }[];

  let tags: DictList = $state([]);
  const tagsFetch = fetch_("documents/get_tagnames")
    .then((resp) => {
      return resp.json();
    })
    .then((data) => {
      tags = data;
      return data;
    });
  let activeTag: number = $state(0);
  let tagblogsFetch: Promise<any> = $state(Promise.resolve());
  let tagBlogs: Card[] = $state([]);
  let blogsListComp: IBlogsList;

  $effect(() => {
    if (tags.length <= activeTag) return;
    const params = new URLSearchParams([
      ["name", $state.snapshot(tags)[activeTag].name],
      ["l", PAGE_SIZE],
    ]);
    tagblogsFetch = fetch_(`documents/get_blogs_tag?${params.toString()}`)
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
        tagBlogs = cardData;
        blogsListComp.recalculateBumps();
        return cardData;
      });
  });

  function fadeColor(color: string, alpha: number) {
    const color_ = color.split(" ").map((str) => Number.parseInt(str));
    return color_.map((c) => alpha * c + (1 - alpha) * 255).join(" ");
  }
  function darkenColor(color: string, alpha: number) {
    const color_ = color.split(" ").map((str) => Number.parseInt(str));
    return color_.map((c) => alpha * c).join(" ");
  }

  let mousePos: { x: number; y: number } = { x: 0, y: 0 };
  const offMouse = on(document, "mousemove", (e) => {
    const event = e as MouseEvent;
    mousePos = { x: event.clientX, y: event.clientY };
  });
  onDestroy(offMouse);

  let tagsBlockEl: HTMLElement;
  let totalDelta = 0;
  const offScroll = on(
    document,
    "wheel",
    (e) => {
      const event = e as WheelEvent;
      const rect = tagsBlockEl.getBoundingClientRect();

      if (tagsBlockEl.scrollWidth <= tagsBlockEl.clientWidth) return;
      if (event.deltaY === 0 || event.deltaX !== 0) return;

      if (mousePos.y > rect.y && mousePos.y < rect.y + rect.height) {
        e.preventDefault();

        // Instead of using the current tagsBlockEl.scrollLeft value (which may be some intermediate
        //  interpolated value if the user scrolls fast, causing that scroll to be cut off short if
        //  we were to calculate from there), we accumulate delta values from the wheel events,
        //  clamping the value to [0, tagsBlockEl.scrollWidth - rect.width].
        if (event.deltaY > 0)
          totalDelta += Math.min(
            event.deltaY,
            tagsBlockEl.scrollWidth - (rect.width + totalDelta),
          );
        else if (event.deltaY < 0)
          totalDelta += Math.max(event.deltaY, -totalDelta);
        else return;

        tagsBlockEl.scroll({
          left: totalDelta,
          behavior: "smooth",
        });
      }
    },
    { passive: false },
  );
  onDestroy(offScroll);
</script>

<h1 class="text-3xl text-stone-600 font-sans p-8 pt-14 font-bold">
  View documents of a specific tag
</h1>
<div
  bind:this={tagsBlockEl}
  class="tags-block text-nowrap overflow-x-scroll mb-0 py-3 border-y-2 border-rock-200 bg-rock-50"
>
  {#await tagsFetch}
    loading...
  {:then}
    {#each tags as tag, i}
      {@const colorLight = fadeColor(tag.color, 0.2)}
      {@const colorMed = fadeColor(tag.color, 0.4)}
      {@const colorDark = darkenColor(tag.color, 0.7)}
      <button
        onmouseup={() => (activeTag = i)}
        onfocusin={() => (activeTag = i)}
        type="button"
        style="--accent: rgb({tag.color}); --accent-light: rgb({colorLight}); --accent-med: rgb({colorMed}); --accent-dark: rgb({colorDark});"
        class="px-3 py-1 border-2 rounded border-[--accent] text-[--accent] font-bold bg-[--accent-light] mx-2 focus:outline-none transition-shadow hover:bg-[--accent-med]"
        class:active={i === activeTag}>{tag.name}</button
      >
    {/each}
  {:catch}
    Something went wrong. Please try again later
  {/await}
</div>
<div
  style="--accent-light: rgb({tags[activeTag]
    ? fadeColor(tags[activeTag].color, 0.1)
    : '255 255 255'});"
  class="bg-[--accent-light] py-8 border-b-2 border-rock-200"
>
  <BlogsList cards={tagBlogs} bind:this={blogsListComp} />
</div>
{#await tagblogsFetch}
  <div
    class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 justify-items-center gap-5 px-5"
  >
    <DummyCard />
    <DummyCard class="hidden md:block" />
    <DummyCard class="hidden xl:block" />
    <DummyCard class="hidden 2xl:block" />
  </div>
{/await}
<div class="text-center my-4">
  <a
    href="/documents/search"
    class="text-rock-600 text-xl underline hover:no-underline inline-flex items-center"
    >For more results and search options<ion-icon
      class="text-3xl ml-1"
      name="arrow-forward-outline"
    ></ion-icon></a
  >
</div>

<style>
  .tags-block::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }
  .tags-block {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  button.active {
    box-shadow: 0 0 0 5px var(--steel-300);
    background-color: var(--accent-med);
    color: var(--accent-dark);
  }
</style>
