<script lang="ts">
  import "/shared/tailwindinit.css";

  interface Props {
    title: string;
    description: string;
    color?: string;
    svgPath?: string;
    clientHeight: number;
    style?: string;
  }

  let {
    title,
    description,
    color = "235 69 17",
    svgPath = "",
    clientHeight = $bindable(),
    style,
  }: Props = $props();

  console.log(color);
  let ALPHA = $state(0.2);
  let fadedColor = $derived.by(() => {
    const color_ = color.split(" ").map((str) => Number.parseInt(str));
    return color_.map((c) => ALPHA * c + (1 - ALPHA) * 255).join(" ");
  });
</script>

<div
  bind:clientHeight
  style="--accent: {color}; --accent-light: {fadedColor}; {style}"
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

<style>
  .card-root {
    --border-color: var(--rock-500);
    --push-up: 1rem;
    --push-down: 2rem;
    --side-halfwidth: 1rem;
    --top-height: 1rem;
  }
</style>
