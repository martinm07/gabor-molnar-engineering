<script lang="ts">
  import BlogCard from "./BlogCard.svelte";
  import { fetch_, preventDefault } from "/shared/helper";
  import { watch } from "runed";
  import "/shared/tailwindinit.css";

  //#region
  const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Turpis cursus in hac habitasse platea dictumst quisque. Elementum facilisis leo vel fringilla est ullamcorper eget nulla. Vitae congue mauris rhoncus aenean vel. Tortor aliquam nulla facilisi cras fermentum odio. Dolor sed viverra ipsum nunc aliquet. A diam maecenas sed enim ut. Fermentum odio eu feugiat pretium nibh ipsum consequat nisl vel. Nulla aliquet enim tortor at auctor. Sapien pellentesque habitant morbi tristique senectus et.

Convallis convallis tellus id interdum velit. Mi tempus imperdiet nulla malesuada pellentesque elit. In fermentum et sollicitudin ac orci phasellus egestas tellus. Etiam non quam lacus suspendisse faucibus interdum. Egestas fringilla phasellus faucibus scelerisque eleifend donec pretium. Sed cras ornare arcu dui vivamus arcu felis bibendum ut. Lectus nulla at volutpat diam ut venenatis. Lobortis feugiat vivamus at augue eget. Vitae elementum curabitur vitae nunc sed velit dignissim. Egestas maecenas pharetra convallis posuere morbi leo. Ipsum consequat nisl vel pretium. Faucibus a pellentesque sit amet porttitor eget dolor. Pharetra et ultrices neque ornare aenean euismod elementum nisi quis. Aliquam ut porttitor leo a. Eu sem integer vitae justo eget magna.

Morbi tincidunt ornare massa eget egestas. Eleifend quam adipiscing vitae proin sagittis nisl rhoncus mattis. Suspendisse ultrices gravida dictum fusce ut. Auctor augue mauris augue neque gravida in fermentum. Eu lobortis elementum nibh tellus molestie nunc non blandit massa. Convallis aenean et tortor at risus viverra. Velit ut tortor pretium viverra suspendisse potenti nullam. Et magnis dis parturient montes nascetur ridiculus mus mauris vitae. Luctus accumsan tortor posuere ac ut consequat semper viverra nam. Ac orci phasellus egestas tellus rutrum. Amet mattis vulputate enim nulla aliquet porttitor lacus. Integer quis auctor elit sed vulputate mi. Nisi lacus sed viverra tellus in hac habitasse platea. Odio morbi quis commodo odio aenean sed.

Nibh venenatis cras sed felis eget. Nulla facilisi nullam vehicula ipsum a arcu cursus vitae congue. Tristique senectus et netus et malesuada. Semper eget duis at tellus at. Ut morbi tincidunt augue interdum velit euismod in pellentesque. Sed adipiscing diam donec adipiscing tristique risus. Consequat mauris nunc congue nisi vitae. Sed libero enim sed faucibus turpis in eu mi. Enim praesent elementum facilisis leo. Lacus laoreet non curabitur gravida arcu ac tortor dignissim. Nulla facilisi nullam vehicula ipsum a arcu. Accumsan lacus vel facilisis volutpat est velit. Nulla at volutpat diam ut venenatis. Sollicitudin aliquam ultrices sagittis orci a scelerisque purus.

Vestibulum lorem sed risus ultricies tristique nulla aliquet enim. Neque vitae tempus quam pellentesque nec nam aliquam sem. Consectetur libero id faucibus nisl tincidunt. At elementum eu facilisis sed odio morbi quis commodo odio. Ullamcorper eget nulla facilisi etiam dignissim diam quis enim lobortis. Sed libero enim sed faucibus turpis in. Ut sem viverra aliquet eget sit amet tellus cras adipiscing. Faucibus et molestie ac feugiat sed lectus vestibulum. Orci eu lobortis elementum nibh tellus molestie nunc. Est placerat in egestas erat imperdiet sed euismod nisi. Cursus sit amet dictum sit amet justo. Sed faucibus turpis in eu mi bibendum neque. Odio facilisis mauris sit amet massa vitae tortor condimentum lacinia. Pharetra diam sit amet nisl suscipit adipiscing bibendum est. Adipiscing elit ut aliquam purus. Integer quis auctor elit sed vulputate mi sit. Orci a scelerisque purus semper eget duis. Nibh venenatis cras sed felis eget velit aliquet sagittis. Donec ac odio tempor orci dapibus ultrices in iaculis nunc. Velit ut tortor pretium viverra.`;

  const colors = [
    "121 93 147",
    "229 59 161",
    "84 163 53",
    "74 71 89",
    "63 89 82",
    "32 35 43",
    "49 29 66",
    "198 229 59",
    "120 93 147",
    "35 124 175",
    "224 188 166",
    "57 109 140",
    "55 58 58",
    "48 168 140",
    "50 114 28",
  ];
  //#endregion

  interface Card {
    title: string;
    description: string;
    color?: string;
    svgPath?: string;
    cardRoom?: number;
  }
  const blogCards: Card[] = Array.from(Array(6), (_, i) => {
    const start = Math.floor((Math.random() * lorem.length) / 2);
    const titleLen = 15 + Math.floor(Math.random() * 35);
    const descLen = 100 + Math.floor(Math.random() * 150);
    const color = colors[Math.floor(Math.random() * colors.length)];
    return {
      title: lorem.slice(start, start + titleLen),
      description: lorem.slice(start, start + descLen),
      color,
    };
  });

  const cardBumps: {
    room: number;
    height: number;
    translate: number;
    width?: number;
  }[] = $state(
    Array.from(Array(blogCards.length), () => {
      return { room: 0, height: 0, translate: 0 };
    }),
  );

  watch(
    () => cardBumps.map((card) => card.room),
    () => {
      setTimeout(() => {
        for (const card of cardBumps) {
          card.translate = Math.random() * (card.room - card.height);
          card.width = 380 + Math.random() * 40;
        }
      });
    },
    {
      once: true,
    },
  );

  function showMore() {}
</script>

<svelte:body class="bg-background" />
<h1 class="text-center text-5xl text-stone-600 font-bold font-serif py-14">
  Guidance Documents
</h1>
<div
  class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 justify-items-center gap-5 px-5"
>
  {#each blogCards as card, i}
    <div bind:clientHeight={cardBumps[i].room}>
      <BlogCard
        title={card.title}
        description={card.description}
        svgPath="M 0 0 L 2 -2 L 3 -2 L 3 2 L 1 4 L 0 4 L 0 0 L 1 0 L 1 4 L 1 4 L 1 0 M 3 -2 L 1 0 M -2 3 L -3 1 L -2 0 L -1 1 L -2 3 M -2 3 L -2.273 1.39 L -3 1 M -2.273 1.388 L -1 1 M -2.273 1.389 L -2 0"
        color={card.color}
        bind:clientHeight={cardBumps[i].height}
        style="transform: translateY({cardBumps[i]
          .translate}px); max-width: {cardBumps[i].width}px"
      />
    </div>
  {/each}
</div>
<div class="py-10 text-center">
  <a
    onclick={preventDefault(showMore)}
    href="/documents/all"
    class="inline-block px-4 py-2 border-2 rounded border-stone-600 text-text text-xl bg-stone-100 underline hover:no-underline hover:bg-stone-200 active:bg-stone-300"
    >See All</a
  >
</div>

<style>
  :global(body) {
    background-color: var(--background);
  }
</style>
