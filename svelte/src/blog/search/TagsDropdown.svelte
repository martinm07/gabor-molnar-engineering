<script lang="ts">
  import { flip } from "svelte/animate";
  import { crossfade } from "svelte/transition";
  import Dropdown, { type IDropdown } from "./Dropdown.svelte";
  import { fadeColor, darkenColor, fetch_ } from "/shared/helper";
  import { getContext, type Snippet } from "svelte";

  interface Props {
    tags: { [key: string]: any }[];
  }
  let { tags = $bindable() }: Props = $props();

  let tagDropdown: IDropdown;
  const divider: Snippet = getContext("divider");

  export const [send, receive] = crossfade({
    duration: (d) => Math.sqrt(d * 200),
  });

  type Dict = { [key: string]: any };
  function reset() {
    fetch_("/documents/get_tagnames")
      .then((resp) => resp.json())
      .then((data) => {
        tags = data.map(({ color, name }: Dict) => {
          return {
            color,
            value: name,
            highlighted: name,
            selected: false,
          };
        });
      });
  }
</script>

<Dropdown label="Filter by Tag" bind:this={tagDropdown}>
  {#snippet content()}
    {@render divider()}
    <div class="py-3 bg-rock-100 text-center">
      {#if tags.find((tag) => tag.selected)}
        <div class="text-right px-4 -mt-2">
          <button
            class="text-rock-700 underline hover:no-underline"
            onclick={reset}
          >
            Reset
          </button>
        </div>
      {/if}
      {#if tags}
        {#each tags.filter((tag) => tag.selected) as tag (tag.value)}
          {@const colorLight = fadeColor(tag.color, 0.2)}
          {@const colorMed = fadeColor(tag.color, 0.4)}
          {@const colorDark = darkenColor(tag.color, 0.7)}
          <div
            bind:this={tag.el}
            in:receive={{ key: tag.value }}
            out:send={{ key: tag.value }}
            animate:flip={{ duration: 200 }}
            style="--accent: rgb({tag.color}); --accent-light: rgb({colorLight}); --accent-med: rgb({colorMed}); --accent-dark: rgb({colorDark});"
            class="item px-3 py-1 border-2 rounded border-rock-500 text-rock-600 font-bold bg-rock-100 m-1 focus:outline-none transition-shadow inline-flex cursor-default opacity-70 ring-4 ring-rock-200 relative pr-8"
          >
            <button
              onclick={() => {
                tagDropdown.updateHeight(() => (tag.selected = false));
              }}
              type="button"
              class="inline-flex items-center hover:bg-rock-300 hover:text-rock-700 rounded p-1 absolute right-1 top-0 h-[calc(100%_-_6px)] z-0 my-[3px]"
              ><ion-icon
                style="--ionicon-stroke-width: 48px;"
                class="text-xl"
                name="close-outline"
              ></ion-icon></button
            >
            <span class="z-10">{tag.value}</span>
          </div>
        {/each}
        {#if tags.filter((tag) => tag.selected).length === 0}
          <div class="h-3 italic text-rock-600">
            Select tags to filter results!
          </div>
        {/if}
        <br />
        {#each tags.filter((tag) => !tag.selected) as tag (tag.value)}
          {@const colorLight = fadeColor(tag.color, 0.2)}
          {@const colorMed = fadeColor(tag.color, 0.4)}
          {@const colorDark = darkenColor(tag.color, 0.7)}
          <button
            bind:this={tag.el}
            in:receive={{ key: tag.value }}
            out:send={{ key: tag.value }}
            animate:flip={{ duration: 200 }}
            onclick={() => {
              tagDropdown.updateHeight(() => (tag.selected = true));
            }}
            type="button"
            style="--accent: rgb({tag.color}); --accent-light: rgb({colorLight}); --accent-med: rgb({colorMed}); --accent-dark: rgb({colorDark});"
            class="item px-3 py-1 border-2 rounded border-[--accent] text-[--accent] font-bold bg-[--accent-light] m-1 focus:outline-none transition-shadow hover:bg-[--accent-med]"
            >{tag.value}</button
          >
        {/each}
      {/if}
    </div>
  {/snippet}
</Dropdown>
