<script lang="ts">
  import { untrack } from "svelte";
  import { watch } from "runed";

  interface Props {
    page: number;
    perPage: number;
    total: number;
  }

  let { page = $bindable(1), perPage, total }: Props = $props();

  let numPages = $derived(Math.ceil(total / perPage));
  watch(
    () => numPages,
    () => {
      if (page < 1) page = 1;
      if (page > numPages) page = numPages;
    },
  );

  const MAX_DISPLAY = 5;
  const defaultNumBefore = Math.floor((MAX_DISPLAY - 1) / 2);
  const defaultNumAfter = Math.ceil((MAX_DISPLAY - 1) / 2);

  let displayStart = $derived.by(() => {
    const frontMissing = Math.max(0, defaultNumAfter - (numPages - page));
    const start = page - (defaultNumBefore + frontMissing);
    const startClamped = Math.max(1, start);
    return startClamped;
  });
  let displayEnd = $derived.by(() => {
    const backMissing = Math.max(0, defaultNumBefore - (page - 1));
    const end = page + (defaultNumAfter + backMissing);
    const endClamped = Math.min(numPages, end);
    return endClamped;
  });
  // $inspect("displayStart: ", displayStart);
  // $inspect("displayEnd: ", displayEnd);
  let pages: number[] = $derived.by(() => {
    // for (let i = displayStart; i <= displayEnd; i++) {

    // }
    return Array.from(
      Array(displayEnd - displayStart + 1),
      (_, i) => i + displayStart,
    );
  });
  // function createPages(num: number) {
  //   for (let i = 0; i < num; i++) pages.push({ number: i, active: false });
  // }
  // createPages(6);
</script>

<div
  class="bg-steel-100 p-5 font-mono text-xl text-steel-600 flex items-center justify-center"
>
  <button
    onclick={() => (page -= 1)}
    disabled={page <= 1}
    class="p-2 bg-background inline-flex items-center justify-center rounded mr-4 hover:bg-steel-200 active:bg-steel-300 active:text-steel-700 border-2 border-background-100 ring-rock-200 focus:ring-4 disabled:bg-background disabled:text-steel-600 disabled:opacity-40"
  >
    <ion-icon name="chevron-back"></ion-icon>
  </button>
  {#each pages as page_}
    <button
      class:active={page_ === page}
      class="mx-1 bg-background px-2 border-2 border-background-100 rounded [&.active]:bg-steel-200 ring-rock-200 [&.active]:ring-4 transition-all hover:bg-steel-200 [&.active]:cursor-default"
      onclick={() => (page = page_)}
    >
      {page_}
    </button>
  {/each}
  <button
    onclick={() => (page += 1)}
    disabled={page >= numPages}
    class="p-2 bg-background inline-flex items-center justify-center rounded ml-4 hover:bg-steel-200 active:bg-steel-300 active:text-steel-700 border-2 border-background-100 ring-rock-200 focus:ring-4 disabled:bg-background disabled:text-steel-600 disabled:opacity-40"
  >
    <ion-icon name="chevron-forward"></ion-icon>
  </button>
</div>
