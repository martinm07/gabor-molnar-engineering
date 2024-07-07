<script lang="ts">
  import { getContext } from "svelte";
  import {
    storageListAdd,
    storageListRemove,
    storageListCheck,
    type Doc,
  } from "./App.svelte";
  import { on } from "svelte/events";

  interface Props {
    doc: Doc;
  }
  let { doc }: Props = $props();

  let bookmarked = $state(storageListCheck(doc.id, "saved"));
  $effect(() => {
    bookmarked = storageListCheck(doc.id, "saved");
  });

  let infoEl: HTMLElement;
  function showInfoShow() {
    infoEl.style.display = "block";
    requestAnimationFrame(() => {
      infoEl.style.opacity = "1";
      infoEl.style.transform = "translate(50%, -100%)";
    });
  }
  function showInfoHide() {
    infoEl.style.opacity = "0";
    infoEl.style.transform = "translate(50%, calc(6px - 100%))";
    setTimeout(() => {
      if (infoEl.style.opacity !== "1") infoEl.style.display = "none";
    }, 150);
  }
  on(window, "keydown", (e) => {
    const event = e as KeyboardEvent;
    if (event.key === "Escape") showInfoHide();
  });

  const bbuttonClasses = getContext("bbuttonClasses");
</script>

<div
  class:bookmarked
  class="inline-block relative m-4 w-[177px] [&.bookmarked]:w-[219px] transition-[width]"
>
  <button
    onclick={() => {
      bookmarked = !bookmarked;
      bookmarked
        ? storageListAdd(doc.id, "saved")
        : storageListRemove(doc.id, "saved");
    }}
    class="w-full h-full overflow-hidden flex items-center {bbuttonClasses}"
  >
    <ion-icon
      class="mr-4 text-lg"
      class:hidden={bookmarked}
      style="--ionicon-stroke-width: 48px;"
      name="bookmark-outline"
    ></ion-icon><ion-icon
      class:hidden={!bookmarked}
      class="mr-4 text-lg"
      name="bookmark"
    ></ion-icon>{bookmarked ? "Remove from" : "Save to"} Library
  </button>
  <ion-icon
    role="img"
    aria-describedby="libraryinfo"
    onmouseenter={showInfoShow}
    onmouseleave={showInfoHide}
    onfocusin={showInfoShow}
    onfocusout={showInfoHide}
    class="ml-1 text-xl absolute top-0 -right-0 translate-x-full text-rock-700"
    name="information-circle-outline"
  ></ion-icon>
  <div
    id="libraryinfo"
    role="definition"
    onmouseenter={showInfoShow}
    onmouseleave={showInfoHide}
    bind:this={infoEl}
    class="hidden absolute -top-3 -right-0 translate-x-1/2 w-48 bg-rock-800 rounded text-rock-50 font-normal p-2 text-sm transition-[opacity,transform] opacity-0 translate-y-[calc(6px_-_100%)]"
  >
    Save this document to your personal library, for easy future access. Your
    library can be found on the guidance documents home page.
    <div
      class="absolute left-1/2 w-5 h-3 bg-rock-800 bottom-0 translate-y-full"
      style="clip-path: polygon(100% 0, 0 0, 50% 100%);"
    ></div>
  </div>
</div>
