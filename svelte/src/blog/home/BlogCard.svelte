<script context="module" lang="ts">
  export interface IBlogCard {
    recalculateBumps(): void;
  }
</script>

<script lang="ts">
  import "/shared/tailwindinit.css";

  interface Props {
    title: string;
    description: string;
    color?: string;
    svgPath?: string;
    clientWidth?: number;
    clientHeight?: number;
    style?: string;
    room?: [x: number, y: number];
    randomBump?: boolean;
  }

  let {
    title,
    description,
    color = "235 69 17",
    svgPath = "",
    clientWidth = $bindable(0),
    clientHeight = $bindable(0),
    style,
    randomBump = true,
    room,
  }: Props = $props();

  const PUSH_UP = 16;
  const PUSH_DOWN = 32;
  const SIDE_HALFWIDTH = 16;
  const TOP_HEIGHT = 16;
  let ALPHA = 0.2;

  let fadedColor = $derived.by(() => {
    const color_ = color.split(" ").map((str) => Number.parseInt(str));
    return color_.map((c) => ALPHA * c + (1 - ALPHA) * 255).join(" ");
  });

  const cardWidth = randomBump
    ? Math.round(380 + Math.random() * 40)
    : undefined;
  let cardBumpX: number | null = $state(null);
  let cardBumpY: number | null = $state(null);

  let bumpedX: boolean = $state(false);
  // Set a random x translation once, after we know how much `room` there is
  $effect(() => {
    if (!randomBump || !room?.[0] || bumpedX) return;
    // Since the cards are centered laterally, we take a positive or negative of half the value
    cardBumpX = Math.round(
      ((2 * Math.random() - 1) * Math.max(0, room[0] - clientWidth)) / 2,
    );
    bumpedX = true;
  });

  let bumpedY: boolean = $state(false);
  // Set a random y translation once, after we know how much `room` there is
  $effect(() => {
    if (!randomBump || !room?.[1] || bumpedY) return;
    cardBumpY = Math.round(
      // The TOP_HEIGHT is part of the margin of the card and not counted in clientHeight
      Math.random() * Math.max(0, room[1] - TOP_HEIGHT - clientHeight),
    );
    bumpedY = true;
  });

  export function recalculateBumps() {
    bumpedX = false;
    bumpedY = false;
  }
</script>

<div
  bind:clientWidth
  bind:clientHeight
  style="
  --border-color: var(--rock-500);
  --push-up: {PUSH_UP}px;
  --push-down: {PUSH_DOWN}px;
  --side-halfwidth: {SIDE_HALFWIDTH}px;
  --top-height: {TOP_HEIGHT}px;
  
  --accent: {color}; 
  --accent-light: {fadedColor}; 

  max-width: {cardWidth}px; 
  transform: translate({cardBumpX}px, {cardBumpY}px); 
  {style}"
  class="h-fit card-root max-w-96 relative flex items-center mt-[var(--top-height)] has-[a:hover]:-mt-[calc(var(--push-up)_-_var(--top-height))] transition-all"
>
  <a
    href="/read/article"
    class="peer group block cursor-pointer h-full w-[calc(100%_-_2_*_var(--side-halfwidth))] bg-rock-50 rounded-bl-[var(--side-halfwidth)] border-2 border-r-0 border-[var(--border-color)] p-4 transition-all hover:pb-[calc(1rem_+_var(--push-up))] z-20 relative"
  >
    <h1
      class="text-center text-3xl font-serif bg-[linear-gradient(-45deg,rgb(var(--accent))_0%,var(--rock-600)_50%)] text-transparent bg-clip-text"
    >
      {title}
    </h1>
    <p class="px-5 py-3 text-rock-700">
      {@html description}<br />
      <span
        class="underline group-hover:no-underline text-[rgb(var(--accent))] mt-2 inline-flex font-bold items-center"
        >Read document<ion-icon
          class="text-xl ml-1 group-hover:hidden"
          style="--ionicon-stroke-width: 48px;"
          name="arrow-redo-outline"
        ></ion-icon><ion-icon
          class="text-xl ml-1 hidden group-hover:inline-block"
          name="arrow-redo"
        ></ion-icon></span
      >
    </p>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-4 -3 8 8"
      class="absolute bottom-0 group-hover:bottom-[--push-up] group-hover:h-[calc(100%_-_var(--push-up))] transition-all w-full h-full opacity-15"
    >
      <path
        d={svgPath}
        class="stroke-steel-500"
        stroke-width="0.1"
        fill="none"
      />
    </svg>
  </a>
  <div
    class="absolute right-0 top-0 h-full w-[calc(2_*_var(--side-halfwidth))] bg-[rgb(var(--accent-light)/1)] rounded-b-[--side-halfwidth] border-2 border-t-0 border-[--border-color] peer-hover:h-[calc(100%_-_var(--push-down))] peer-hover:top-[--push-down] transition-all z-0"
  ></div>
  <div
    class="absolute w-[calc(2_*_var(--side-halfwidth))] h-[--side-halfwidth] bg-rock-50 bottom-0 right-0 -z-10 rounded-br-[--side-halfwidth] border-b-2 border-[--border-color] transition-all"
  ></div>
  <div
    class="absolute top-0 right-0 bg-[rgb(var(--accent-light)/1)] w-[calc(100%_-_2_*_var(--side-halfwidth))] -translate-y-full h-[--top-height] border-2 border-b-0 border-[--border-color] peer-hover:top-[--push-down] transition-all z-10"
  ></div>
  <div
    class="absolute z-30 w-0.5 bg-[--border-color] h-[--push-down] right-[calc(2_*_var(--side-halfwidth))] top-0 translate-x-full"
  ></div>
</div>
