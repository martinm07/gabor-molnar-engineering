<script module lang="ts">
  // export function addCards(cards: Card[], num: number) {
  //   console.log(`Fetching ${num} more cards...`);
  //   const p = cards.length / num;
  //   return fetch_(`/documents/get_latest?p=${p}&l=${num}`)
  //     .then((resp) => resp.json())
  //     .then((data) => {
  //       const cardData = data.map(
  //         ({ title, description, accent, thumbnail }: any) => {
  //           return {
  //             title,
  //             description,
  //             color: accent,
  //             svgPath: thumbnail,
  //           };
  //         },
  //       );
  //       cards.push(...cardData);
  //     });
  // }
</script>

<script lang="ts">
  // import { setContext } from "svelte";
  // import { fetch_ } from "/shared/helper";
  import "/shared/tailwindinit.css";
  import NavBar from "./NavBar.svelte";
  import RecentBlogs from "./RecentBlogs.svelte";
  import { homeState } from "./store.svelte";
  import { changeShowingAll } from "./url.svelte";
  import TagBlogs from "./TagBlogs.svelte";
  import ArrowRightIcon from "phosphor-svelte/lib/ArrowRightIcon";
  import { setContext } from "svelte";
  import Footer from "/shared/components/Footer.svelte";

  setContext("changeShowingAll", changeShowingAll);

  // const PAGE_SIZE = 6;
  // setContext("PAGE_SIZE", PAGE_SIZE);
</script>

<div class="min-h-[80vh]">
  <NavBar />

  <RecentBlogs />
</div>
{#if !homeState.showingAll}
  <div class="min-h-screen flex flex-col">
    <div class="bg-hatched h-[20vh] bg-stone-300"></div>

    <TagBlogs />

    <div class="h-8"></div>
    <div
      class="mt-auto h-20 flex items-center justify-center border-t-2 border-rock-300 bg-rock-100"
    >
      <a
        class="text-2xl text-rock-800 underline hover:no-underline flex items-center group"
        href="/documents/search"
        >Want more search options? <ArrowRightIcon
          class="ml-1 group-hover:translate-x-1 transition-transform"
        /></a
      >
    </div>
  </div>
{/if}

<Footer />

<style>
  :global(body) {
    background-color: var(--background);
  }

  .bg-hatched {
    --svg: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'><path d='M0 5 L5 0 L15 0 L0 15 Z M5 20 L15 20 L20 15 L20 5 Z' fill='%23000000'/></svg>");

    -webkit-mask-image: var(--svg);
    mask-image: var(--svg);

    -webkit-mask-repeat: repeat;
    mask-repeat: repeat;

    /* Adjust line scale/density by changing the mask size */
    -webkit-mask-size: 20px 20px;
    mask-size: 20px 20px;
  }
</style>
