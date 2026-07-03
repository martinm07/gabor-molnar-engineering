<script lang="ts">
  import Color from "color";
  import { type Doc } from "./store.svelte";
  import { convertAccent } from "/shared/helper";

  import HeartIcon from "phosphor-svelte/lib/HeartIcon";
  import PencilIcon from "phosphor-svelte/lib/PencilIcon";
  import TrashIcon from "phosphor-svelte/lib/TrashIcon";
  import CalendarDotsIcon from "phosphor-svelte/lib/CalendarDotsIcon";
  import ClockCounterClockwiseIcon from "phosphor-svelte/lib/ClockCounterClockwiseIcon";
  import ArrowSquareOutIcon from "phosphor-svelte/lib/ArrowSquareOutIcon";

  interface Props {
    doc: Doc;
  }
  let { doc }: Props = $props();
</script>

{const color = $derived(Color(convertAccent(doc.accent)))}
{const colorLight = $derived(color.lightness(95))}

<div
  style="--accentSaved: {color.hex()}; --accentLightSaved: {colorLight.hex()}"
  class="card transition-all duration-500 h-fit relative w-[calc(100%-1em)] md:w-[calc(50%-1em)] xl:w-[calc(33.3%-1em)] 2xl:w-[calc(25%-1em)] my-3 border-2 border-rock-300 rounded-lg p-4"
>
  <a
    class="title font-serif text-2xl border-b border-steel-700 hover:border-b-0"
    href="/documents/{encodeURI(doc.title.replaceAll(' ', '-'))}"
    target="_blank"
    >{doc.title}<ArrowSquareOutIcon
      class="text-steel-700 inline ml-3 mb-1.5 text-xl"
      weight="regular"
    /></a
  ><br />
  <span class="text-rock-700">
    {doc.description}
  </span>
  <div class="mt-2 border-b pb-3 border-rock-300">
    {#each doc.tags as tag}
      {const color = $derived(Color(convertAccent(tag.accent)))}
      <!-- {const colorLightest = $derived(color.lightness(95))} -->
      {const colorLight = $derived(color.lightness(90))}
      {const colorText = $derived(color.lightness(20))}
      <span
        style="--color-lightSaved: {colorLight.hex()}; --color-textSaved: {colorText.hex()};"
        class="tag bg-(--color-light) text-(--color-text) mx-1 py-0.5 px-1 rounded"
        >{tag.name}</span
      >&nbsp;
    {/each}
  </div>
  <div class="mt-2 flex">
    <div class="text-rock-700">
      Status: <em>{doc.status}</em>

      <div class="mt-2 flex items-center">
        <button
          class="p-2 bg-red-100 hover:bg-red-200 text-red-800 text-xl rounded mr-2 active:translate-y-1 active:bg-red-300"
        >
          <TrashIcon />
        </button>
        <a
          href="/documents/edit/{doc.id}"
          class="inline-block p-2 bg-steel-100 hover:bg-steel-200 text-steel-800 text-xl rounded active:translate-y-1 active:bg-steel-300"
        >
          <PencilIcon />
        </a>
      </div>
    </div>
    <div class="ml-auto flex flex-col">
      <div
        class="flex items-center justify-end text-red-900 font-bold font-mono"
      >
        <HeartIcon
          weight="fill"
          class="text-xl text-red-700 mr-1"
        />{doc.hearts}
      </div>
      <div class="flex items-center justify-end text-rock-700 text-sm mt-auto">
        <CalendarDotsIcon
          class="mr-1 text-base"
        />{doc.dateCreated.toLocaleString()}
      </div>
      <div class="flex items-center justify-end text-rock-700 text-sm">
        <ClockCounterClockwiseIcon
          class="mr-1 text-base"
        />{doc.dateUpdated.toLocaleString()}
      </div>
    </div>
  </div>
  <div class="absolute left-1 bottom-1"></div>
</div>

<style>
  .title {
    background: linear-gradient(
      312deg,
      var(--color-steel-700) 0%,
      var(--color-steel-700) 25%,
      var(--accent) 100%
    );
    background-clip: text;
    color: transparent;
  }

  .card {
    --accent: var(--color-steel-700);
    --accentLight: var(--color-background);

    --transparency: 0%;
    --color-with-transparency: color-mix(
      in srgb,
      var(--accent) var(--transparency, 100%),
      transparent
    );

    background-color: var(--accentLight);
    box-shadow: inset -0.75em -0.75em 10px 0px var(--color-with-transparency);
  }

  .card:hover {
    --accent: var(--accentSaved);
    --accentLight: var(--accentLightSaved);
    --transparency: 10%;
  }

  .tag {
    --color-light: var(--steel-100);
    --color-text: var(--steel-700);
  }
  .card:hover .tag {
    --color-light: var(--color-lightSaved);
    --color-text: var(--color-textSaved);
  }
</style>
