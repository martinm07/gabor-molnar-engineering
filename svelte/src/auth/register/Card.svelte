<script lang="ts">
  import { onMount, type Component } from "svelte";
  import { changePage, state_ } from "./store";
  import "/shared/tailwindinit.css";
  import { request2AnimationFrames } from "/shared/helper";

  interface Props {
    card: Component<{ transitionpage: (page: string) => void }>;
  }
  let { card }: Props = $props();

  const TRANSITION_DURATION = 500;
  let cardEl: HTMLElement;
  let transEls: HTMLElement[] = [];
  onMount(() => {
    for (const el of cardEl.querySelectorAll("[data-transition-delay]")) {
      if (!(el instanceof HTMLElement))
        throw new Error(`Only HTML elements can be transitions. Got ${el}`);
      transEls.push(el);
    }
    if ($state_.doTransition) {
      transEls.forEach((el) => (el.style.opacity = "0"));
      request2AnimationFrames(() => {
        for (const el of transEls) {
          const delay = Number.parseFloat(el.dataset.transitionDelay ?? "0");
          el.style.transitionDelay = `${delay}ms`;
          el.style.transitionDuration = `${TRANSITION_DURATION}ms`;
          el.style.transitionProperty = `opacity`;
          el.style.opacity = "1";
        }
      });
      $state_.doTransition = false;
    }
  });

  function onTransition(page: string) {
    let maxDelay = 0;
    for (const el of transEls) {
      const delay = Number.parseFloat(el.dataset.transitionDelay ?? "0");
      el.style.transitionDelay = `${delay}ms`;
      el.style.transitionDuration = `${TRANSITION_DURATION}ms`;
      el.style.transitionProperty = `opacity`;
      el.style.opacity = "0";
      if (delay > maxDelay) maxDelay = delay;
    }
    setTimeout(
      () => changePage(page, true),
      transEls.length > 0 ? maxDelay + TRANSITION_DURATION : 0,
    );
  }
</script>

<div class="absolute w-screen h-screen bg-background-200 -z-10"></div>
<div class="absolute w-screen h-screen flex items-center justify-center">
  <div
    class="absolute flex flex-col md:w-1/2 w-5/6 h-4/5 bg-background rounded-md p-4"
    bind:this={cardEl}
  >
    <h1 class="shrink text-center font-serif text-dark text-4xl">
      Registration
    </h1>
    <svelte:component this={card} transitionpage={onTransition} />
  </div>
</div>
