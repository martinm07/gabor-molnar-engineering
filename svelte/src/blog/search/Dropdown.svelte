<script context="module" lang="ts">
  export interface IDropdown {
    updateHeight: (callback: () => any) => void;
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { request2AnimationFrames } from "/shared/helper";

  interface Props {
    label: string;
    content: Snippet;
  }
  let { label, content }: Props = $props();

  let sectionEl: HTMLElement;
  let sectionActive: boolean = $state(false);

  export function updateHeight(callback: () => any) {
    sectionEl.style.height = `${sectionEl.clientHeight}px`;
    callback();

    request2AnimationFrames(() => {
      const totalHeight = Array(...sectionEl.children)
        .map((el) => (el instanceof HTMLElement ? el.offsetHeight : 0))
        .reduce((p, c) => p + c);
      sectionEl.style.height = `${totalHeight}px`;
      setTimeout(() => sectionActive && (sectionEl.style.height = "auto"), 100);
    });
  }
</script>

<button
  onclick={() => {
    if (sectionActive) {
      sectionActive = false;
      if (sectionEl.style.height === "auto") {
        sectionEl.style.height = `${sectionEl.clientHeight}px`;
        request2AnimationFrames(() => (sectionEl.style.height = "0px"));
      } else sectionEl.style.height = "0px";
    } else {
      sectionActive = true;
      sectionEl.style.height = `${sectionEl.scrollHeight}px`;
      setTimeout(() => sectionActive && (sectionEl.style.height = "auto"), 100);
    }
  }}
  type="button"
  class:active={sectionActive}
  class="group w-full bg-background flex items-center py-3 text-lg px-5 text-rock-700 hover:bg-background-100"
>
  {label}
  <ion-icon
    class="ml-auto text-2xl group-[.active]:hidden"
    name="chevron-expand-outline"
  ></ion-icon><ion-icon
    class="ml-auto text-2xl hidden group-[.active]:block"
    name="chevron-collapse-outline"
  ></ion-icon>
</button>
<div
  bind:this={sectionEl}
  class="transition-all h-0 overflow-hidden bg-rock-100"
>
  {@render content()}
</div>
