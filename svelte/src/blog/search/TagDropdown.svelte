<script lang="ts">
  import Color from "color";

  import CaretDownIcon from "phosphor-svelte/lib/CaretDownIcon";
  import CaretRightIcon from "phosphor-svelte/lib/CaretRightIcon";
  import { docTags, type Tag, query } from "./store.svelte";
  import { convertAccent } from "/shared/helper";
  import { onMount } from "svelte";
  import { getTags } from "../home/store.svelte";
  import { flip } from "svelte/animate";

  onMount(() => getTags(docTags));

  let dropdownActive = $state(true);

  type DisplayTag = Tag & { selected: boolean };
  const displayTags: DisplayTag[] = $derived.by(() => {
    const final: DisplayTag[] = docTags.map((tag) => {
      return {
        name: tag.name,
        description: tag.description,
        accent: tag.accent,
        selected: query.selectedTags.includes(tag.name),
      };
    });
    return final.toSorted((a, b) => {
      if (a.selected && !b.selected) return -1;
      if (!a.selected && b.selected) return 1;
      return 0;
    });
  });
</script>

<button
  class="flex items-center text-base text-rock-700 md:mt-6 hover:text-rock-500"
  type="button"
  onclick={() => (dropdownActive = !dropdownActive)}
>
  Filter by tags
  {#if dropdownActive}
    <CaretDownIcon class="ml-1 text-xl" weight="regular" />
  {:else}
    <CaretRightIcon class="ml-1 text-xl" weight="regular" />
  {/if}
</button>
{#if dropdownActive}
  <div class="mt-2">
    {#each displayTags as tag (tag.name)}
      {const accent = Color(convertAccent(tag.accent))}
      <button
        class="inline-flex items-center text-rock-800 text-base border rounded border-rock-300 m-1.5 px-1.5 font-mono bg-rock-50 tracking-tight hover:bg-rock-100 [.active.isdark]:text-rock-50 [.active]:bg-(--color) transition-colors"
        type="button"
        class:active={tag.selected}
        class:isdark={accent.isDark()}
        style="word-spacing: -0.25rem; --color: {accent.toString()}"
        animate:flip={{ duration: 200 }}
        onclick={() => {
          let tagI;
          if ((tagI = query.selectedTags.indexOf(tag.name)) !== -1)
            query.selectedTags.splice(tagI, 1);
          else query.selectedTags.push(tag.name);
        }}
      >
        <span class="w-3 h-3 rounded-sm bg-(--color) mr-1"></span>
        {tag.name}
      </button>
    {/each}
  </div>
{/if}
