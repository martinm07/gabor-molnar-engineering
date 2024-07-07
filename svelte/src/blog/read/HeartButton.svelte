<script lang="ts">
  import { getContext } from "svelte";
  import {
    storageListAdd,
    storageListRemove,
    storageListCheck,
    type Doc,
  } from "./App.svelte";
  import { fetch_ } from "/shared/helper";
  import { on } from "svelte/events";

  interface Props {
    doc: Doc;
  }
  let { doc }: Props = $props();

  let hearted = $state(storageListCheck(doc.id, "hearted"));
  $effect(() => {
    hearted = storageListCheck(doc.id, "hearted");
  });

  function heartSubmit() {
    const hearted_ = hearted;
    fetch_("/documents/heart", {
      method: "POST",
      body: JSON.stringify({
        id: doc.id,
        value: hearted_ ? 1 : -1,
      }),
    }).then(() => {
      hearted_
        ? storageListAdd(doc.id, "hearted")
        : storageListRemove(doc.id, "hearted");
    });
  }

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
  class:hearted
  class="inline-block relative m-4 w-[173px] [&.hearted]:w-[54px] transition-[width]"
>
  <button
    onclick={() => {
      hearted = !hearted;
      heartSubmit();
    }}
    class="w-full h-full overflow-hidden flex items-center {bbuttonClasses}"
  >
    <ion-icon
      class="mr-4 text-lg text-red-500 shrink-0"
      class:hidden={hearted}
      style="--ionicon-stroke-width: 48px;"
      name="heart-outline"
    ></ion-icon><ion-icon
      class:hidden={!hearted}
      class="mr-4 text-lg text-red-500 shrink-0"
      name="heart"
    ></ion-icon>More Like This
  </button>
  <ion-icon
    role="img"
    aria-describedby="heartinfo"
    onmouseenter={showInfoShow}
    onmouseleave={showInfoHide}
    onfocusin={showInfoShow}
    onfocusout={showInfoHide}
    class="ml-1 text-xl absolute top-0 -right-0 translate-x-full text-rock-700"
    name="information-circle-outline"
  ></ion-icon>
  <div
    id="heartinfo"
    role="definition"
    onmouseenter={showInfoShow}
    onmouseleave={showInfoHide}
    bind:this={infoEl}
    class="hidden absolute -top-3 -right-0 translate-x-1/2 w-48 bg-rock-800 rounded text-rock-50 font-normal p-2 text-sm transition-[opacity,transform] opacity-0 translate-y-[calc(6px_-_100%)]"
  >
    All this does is privately notify us that you liked this document, and wish
    to see more on this subject/area.
    <div
      class="absolute left-1/2 w-5 h-3 bg-rock-800 bottom-0 translate-y-full"
      style="clip-path: polygon(100% 0, 0 0, 50% 100%);"
    ></div>
  </div>
</div>
