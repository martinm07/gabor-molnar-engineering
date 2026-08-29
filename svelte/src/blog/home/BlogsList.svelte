<script lang="ts">
  import { type Card } from "./store.svelte";
  import Color from "color";
  import ClockIcon from "phosphor-svelte/lib/ClockIcon";
  import {
    convertAccent,
    htmlToTextContent,
    remToPixels,
  } from "/shared/helper";
  import { onDestroy } from "svelte";
  import { watch } from "runed";

  interface Props {
    cards: Card[];
    showLoading?: boolean;
  }

  let { showLoading, cards }: Props = $props();

  let cardElsContainer: HTMLElement | undefined = $state();
  const cardEls: (HTMLElement | null)[] = [];

  let screenMidStart: number = -1;
  let screenMidEnd: number = -1;

  function calculateScreenMidBounds() {
    if (!cardElsContainer) return;

    const distanceFromStart = cardElsContainer.offsetTop;
    if (distanceFromStart < window.innerHeight / 2)
      screenMidStart = window.innerHeight / 2;
    else screenMidStart = distanceFromStart;

    const distanceFromEnd =
      document.body.offsetHeight -
      (cardElsContainer.offsetTop + cardElsContainer.offsetHeight);
    if (distanceFromEnd < window.innerHeight / 2) {
      screenMidEnd = document.body.offsetHeight - window.innerHeight / 2;
      // console.log(
      //   `document.body.offsetHeight - window.innerHeight / 2, ${document.body.offsetHeight} - ${window.innerHeight / 2} = ${screenMidEnd}`,
      // );
    } else {
      screenMidEnd = cardElsContainer.offsetTop + cardElsContainer.offsetHeight;
      // console.log(
      //   `cardElsContainer.offsetTop + cardElsContainer.offsetHeight, ${cardElsContainer.offsetTop} + ${cardElsContainer.offsetHeight} = ${screenMidEnd}`,
      // );
    }

    // console.log(screenMidStart);
    // console.log(screenMidEnd);
  }

  watch([() => cardElsContainer, () => $state.snapshot(cards)], () => {
    // We require the setTimeout, to potentially allow time for document.body.offsetHeight to update.
    setTimeout(calculateScreenMidBounds);
  });

  // let isMobile = $state(false);

  const isMobile = () => {
    // Check if the new API is supported
    if ((navigator as any).userAgentData) {
      return (navigator as any).userAgentDat.mobile;
    }

    // Fallback for Safari/Firefox (see Solution 3)
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  };

  let containerWidth = $state(-1);
  watch(
    () => containerWidth,
    () => {
      if (containerWidth === -1) return;
      setTimeout(calculateScreenMidBounds);

      // if (containerWidth <= remToPixels(55)) isMobile = true;
      // else isMobile = false;
    },
  );
</script>

<svelte:window
  onscroll={() => {
    if (
      !cardElsContainer ||
      cardEls.length === 0 ||
      screenMidStart === -1 ||
      screenMidEnd === -1 ||
      !isMobile()
    ) {
      cardEls.forEach((el) => el?.classList.remove("active"));
      return;
    }
    const cardEls_ = cardEls.filter((el) => el) as HTMLElement[];

    const MARGIN = 50;

    ///////////////////////////////
    // Take the "percentage scrolled" through the list as the position of an imaginary horizontal line passing through the middle of the screen
    //  clamped to the document body's bounds (in case they make it impossible to scroll the imaginary horizontal line all the way from 0% to 100% through the list).

    const bodyRect = document.body.getBoundingClientRect();
    const screenMid = -bodyRect.y + window.innerHeight / 2;

    if (
      screenMid < screenMidStart - MARGIN ||
      screenMid > screenMidEnd + MARGIN
    ) {
      cardEls_.forEach((cardEl) => cardEl.classList.remove("active"));
      return;
    }

    if (screenMid < screenMidStart || screenMid >= screenMidEnd) {
      // console.log(
      //   "Skipping highlighting card because we're too far from mid-screen.",
      // );
      return;
    }

    // (screenMidStart, screenMidEnd) -> (0, 1)
    const percent =
      (screenMid - screenMidStart) / (screenMidEnd - screenMidStart);
    // console.log(percent);

    const activeI = Math.floor(percent * cardEls_.length);
    cardEls_.forEach((cardEl) => cardEl.classList.remove("active"));
    if (activeI >= 0 && activeI < cardEls_.length)
      cardEls_[activeI].classList.add("active");

    ///////////////////////////////
    // Take the "percentage scrolled" through the list, and highlight the element closest to that percentage through the items

    // const rect = cardElsContainer.getBoundingClientRect();
    // if (rect.height > window.innerHeight) {
    //   // rect.y has values in the range [-TOP_MARGIN, rect.height - window.innerHeight] that should be transformed to the range [0, 1).
    //   const percentUnclamped =
    //     (-rect.y + TOP_MARGIN) /
    //     (rect.height - window.innerHeight + TOP_MARGIN);
    //   // console.log(percent);
    //   const percent = Math.min(Math.max(percentUnclamped, 0), 0.999);

    //   // console.log(cardEls);

    //   const activeI = Math.floor(percent * cardEls_.length);
    //   cardEls_.forEach((cardEl) => cardEl.classList.remove("active"));
    //   cardEls_[activeI].classList.add("active");
    // } else {
    //   cardElsContainer.offsetTop;
    //   document.body.offsetHeight;
    //   rect.top;
    // }

    ///////////////////////////////
    // Find the "middle-most" card on the screen and make it active

    // cardEls.map((el) => {
    // let smallestDistance = Infinity;
    // let closestCardEl: HTMLElement | undefined;
    // for (const cardEl of cardEls) {
    //   const rect = cardEl.getBoundingClientRect();
    //   const cardMiddle = rect.y + rect.height / 2;
    //   const screenMiddle = window.innerHeight / 2;
    //   const distance = Math.abs(cardMiddle - screenMiddle);
    //   if (distance < smallestDistance) {
    //     smallestDistance = distance;
    //     closestCardEl = cardEl;
    //   }
    // }

    // if (!closestCardEl) return;
    // if (smallestDistance > window.innerHeight / 4) {
    //   console.log(
    //     "Not lighting up element because the closest is too far from mid-screen",
    //   );
    //   return;
    // }

    // cardEls.forEach((cardEl) => cardEl.classList.remove("active"));
    // closestCardEl.classList.add("active");
    // });
  }}
  onresize={calculateScreenMidBounds}
/>

<div class="cards-supercontainer flex justify-center">
  <div
    class="cards-container grid max-w-7xl w-full"
    bind:this={cardElsContainer}
    bind:clientWidth={containerWidth}
  >
    {#each cards as card}
      {const color = $derived(Color(convertAccent(card.accent ?? "#eee")))}
      {const colorLight = $derived(color.lightness(90))}
      {const encodedSVG = encodeURIComponent(card.svgIcon ?? "")}

      <div
        style="--accentSaved: {color.hex()}; --accentLightSaved: {colorLight.hex()}"
        class="card relative p-8 border-rock-300 group duration-1000"
        onfocusin={(e) => console.log("Focused in", e.target)}
        {@attach (el) => {
          const i = cardEls.length;
          cardEls.push(el);
          return () => (cardEls[i] = null);
        }}
      >
        <div
          class="absolute h-[calc(100%-2em)] w-[calc(100%-2em)] top-4 left-4 rounded-xl group-hover:bg-(--accentLightSaved) group-[.active]:bg-(--accentLightSaved) -z-10 duration-1000"
        ></div>
        <div
          style="--icon-svg: url('data:image/svg+xml,{encodedSVG}')"
          class="svgicon absolute h-4/5 aspect-square top-1 right-1 -z-10 opacity-50 bg-stone-300 group-hover:bg-(--accentSaved) group-[.active]:bg-(--accentSaved) transition-colors duration-1000"
        ></div>
        <a
          href="/documents/read/{encodeURI(
            htmlToTextContent(card.title.replaceAll(' ', '-')),
          )}"
          class="text-2xl font-serif text-rock-700 underline hover:no-underline pr-6"
          >{@html card.title}</a
        >
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
      </div>
    {/each}
    {#if showLoading}
      {#if containerWidth >= remToPixels(77)}
        {@render dummycard()}
        {@render dummycard()}
        {@render dummycard()}
      {:else if containerWidth >= remToPixels(55) && containerWidth < remToPixels(77)}
        {@render dummycard()}
        {@render dummycard()}
      {:else if containerWidth < remToPixels(55)}
        {@render dummycard()}
      {/if}
      <!-- {#if window.matchMedia("screen and (min-width: 77rem)").matches}
        {@render dummycard()}
        {@render dummycard()}
        {@render dummycard()}
      {:else if window.matchMedia("screen and (max-width: 77rem) and (min-width: 55rem)").matches}
        {@render dummycard()}
        {@render dummycard()}
      {:else if window.matchMedia("screen and (max-width: 55rem)").matches}
        {@render dummycard()}
      {/if} -->
    {/if}
  </div>
</div>

{#snippet dummycard()}
  {let clientWidth: number = $state(0)}
  {let clientHeight: number = $state(0)}
  {let crossLen: number = $derived(
    Math.sqrt(clientWidth ** 2 + clientHeight ** 2) / 2,
  )}
  <div
    class="card h-56 border-rock-300 relative"
    bind:clientWidth
    bind:clientHeight
  >
    <div
      class="absolute overflow-hidden h-[calc(100%-2em)] w-[calc(100%-2em)] top-4 left-4 bg-rock-100 rounded-xl"
    >
      <div style="--crossLen: {crossLen}px;" class="dummycard-slider"></div>
    </div>
  </div>
{/snippet}

<style>
  @reference "/shared/tailwindinit.css";

  /* -------------------------------------------------------------------- */
  /*     Applying the thumbnail icon svg to the background element        */
  /* -------------------------------------------------------------------- */

  .svgicon {
    -webkit-mask-image: var(--icon-svg);
    mask-image: var(--icon-svg);
    -webkit-mask-size: contain;
    mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }

  /* -------------------------------------------------------------------- */
  /*      Changing number of columns in grid based on screen width        */
  /* -------------------------------------------------------------------- */

  .cards-container,
  .cards-supercontainer {
    container-type: inline-size;
  }

  @container (min-width: 77rem) {
    .cards-container {
      grid-template-columns: 1fr 1fr 1fr;
    }

    .card:not(*:nth-child(3n)) {
      border-right-width: 1px;
    }
    .card:not(*:nth-last-child(-n + 3)) {
      border-bottom-width: 1px;
    }
  }

  /*@media screen and (min-width: 77rem) {
    .cards-container {
      grid-template-columns: 1fr 1fr 1fr;
    }

    .card:not(*:nth-child(3n)) {
      border-right-width: 1px;
    }
    .card:not(*:nth-last-child(-n + 3)) {
      border-bottom-width: 1px;
    }
  }*/

  @container (max-width: 77rem) and (min-width: 55rem) {
    .cards-container {
      grid-template-columns: 1fr 1fr;
    }

    .card:not(*:nth-child(2n)) {
      border-right-width: 1px;
    }
    .card:not(*:nth-last-child(-n + 2)) {
      border-bottom-width: 1px;
    }
  }

  /*@media screen and (max-width: 77rem) and (min-width: 55rem) {
    .cards-container {
      grid-template-columns: 1fr 1fr;
    }

    .card:not(*:nth-child(2n)) {
      border-right-width: 1px;
    }
    .card:not(*:nth-last-child(-n + 2)) {
      border-bottom-width: 1px;
    }
  }*/

  @container (max-width: 55rem) {
    .cards-container {
      grid-template-columns: 1fr;
    }

    .card:not(*:nth-child(n)) {
      border-right-width: 1px;
    }
    .card:not(*:nth-last-child(-n + 1)) {
      border-bottom-width: 1px;
    }
  }

  /*@media screen and (max-width: 55rem) {
    .cards-container {
      grid-template-columns: 1fr;
    }

    .card:not(*:nth-child(n)) {
      border-right-width: 1px;
    }
    .card:not(*:nth-last-child(-n + 1)) {
      border-bottom-width: 1px;
    }
  }*/

  /* ------------------------------------------------------ */
  /*      Dummy cards (shown when loading cards) */
  /* ------------------------------------------------------ */

  .dummycard-slider {
    position: absolute;
    width: 300%;
    height: 64px;
    left: 50%;
    top: 50%;

    transform: translate(-50%, -50%) rotate(-45deg) translate(0, 0);
    animation:
      slideacross 0.8s linear infinite,
      delay-animation 1.6s linear infinite;
    box-shadow: 0 0 90px 50px #fff;
    background-color: #fefefe;
    /*opacity: 70%;*/
  }

  @keyframes slideacross {
    from {
      transform: translate(-50%, -100%) rotate(-45deg)
        translate(0, calc(-1 * var(--crossLen) - 55px));
    }
    to {
      transform: translate(-50%, 0%) rotate(-45deg)
        translate(0, calc(var(--crossLen) + 55px));
    }
  }

  @keyframes delay-animation {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 0.6;
    }
    50.01% {
      opacity: 0;
    }
    100% {
      opacity: 0;
    }
  }

  /* ------------------------------------------------------ */
  /*      Styling <mark>s used by search                    */
  /* ------------------------------------------------------ */

  :global(mark) {
    /*background-color: var(--color-steel-200);*/
    @apply bg-steel-200/70;
  }
</style>
