<script context="module" lang="ts">
  export interface Card {
    title: string;
    description: string;
    color?: string;
    svgPath?: string;
    cardRoom?: number;
  }
</script>

<script lang="ts">
  import BlogCard from "./BlogCard.svelte";

  interface Props {
    cards: Card[];
  }
  let { cards }: Props = $props();

  let cardRooms: { [key: number]: number } = $state({});
</script>

<div
  class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 justify-items-center gap-5 px-5"
>
  {#each cards as card, i}
    <div bind:clientHeight={cardRooms[i]} class="w-full flex justify-center">
      <BlogCard
        title={card.title}
        description={card.description}
        svgPath="M 0 0 L 2 -2 L 3 -2 L 3 2 L 1 4 L 0 4 L 0 0 L 1 0 L 1 4 L 1 4 L 1 0 M 3 -2 L 1 0 M -2 3 L -3 1 L -2 0 L -1 1 L -2 3 M -2 3 L -2.273 1.39 L -3 1 M -2.273 1.388 L -1 1 M -2.273 1.389 L -2 0"
        color={card.color}
        room={cardRooms[i]}
      />
    </div>
  {/each}
</div>
