<script lang="ts">
  import Color from "color";
  import { typesenseHitToCard } from "../search/store.svelte";
  import { type TypesenseHit } from "/shared/types";
  import { convertAccent, htmlToTextContent } from "/shared/helper";
  import ClockIcon from "phosphor-svelte/lib/ClockIcon";

  interface Props {
    info: TypesenseHit;
    active?: boolean;
  }

  let { info, active }: Props = $props();

  const card = $derived(typesenseHitToCard(info));
</script>

<a
  href="/documents/read/{encodeURI(
    htmlToTextContent(card.title.replaceAll(' ', '-')),
  )}"
  class="card block relative z-0 p-6 m-2 border-rock-300 border-b last-of-type:border-b-0 group"
  class:active
  onfocusin={(e) => console.log("Focused in", e.target)}
>
  <div
    class="absolute h-[calc(100%-2em)] w-[calc(100%-2em)] top-4 left-4 rounded-xl -z-10 group-hover:bg-stone-200/70 group-[.active]:bg-stone-200/70"
  ></div>
  <div
    class="text-2xl font-serif text-rock-700 underline group-hover:no-underline group-[.active]:no-underline pr-6"
  >
    {@html card.title}
  </div>
  <div class="text-lg text-rock-700 italic mt-2">
    {@html card.description}
  </div>
  <div class="mt-1 text-rock-700">
    {#each card.tags as tag}
      <span class="bg-rock-50 border rounded border-rock-300 mx-0.5 px-1"
        >{@html tag}</span
      >&nbsp;
    {/each}
  </div>
  <div
    class="absolute bottom-2 right-2 flex items-center text-rock-600 font-mono"
  >
    <ClockIcon class="mr-1" />{card.dateUpdated.toLocaleString()}
  </div>
</a>
