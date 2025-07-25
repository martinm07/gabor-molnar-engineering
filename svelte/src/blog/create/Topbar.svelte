<script lang="ts">
  import { circInOut } from "svelte/easing";
  import { compLibVer, editorState, mode } from "./store.svelte";
  import ComponentMetaEdit from "./components/ComponentMetaEdit.svelte";
  import TreeView from "phosphor-svelte/lib/TreeView";
  import SquaresFour from "phosphor-svelte/lib/SquaresFour";

  // interface Props {
  //   compLibVerCurrent: string | null;
  //   compLibVerLatest: string | null;
  // }

  // let { compLibVerCurrent, compLibVerLatest }: Props = $props();

  type DropdownState = "libver" | "compmetaedit" | "none";
  let dropdown: DropdownState = $state("none");

  function dropdownExpandTransition(
    node: HTMLElement,
    params: { endHeight: number; duration?: number; expandAmount?: number },
  ) {
    return {
      delay: 0,
      duration: params.duration ?? 150,
      easing: circInOut,
      css: (t: number, u: number) => {
        const startHeight = params.endHeight - (params.expandAmount ?? 100);
        return `
          height: ${startHeight * u + params.endHeight * t}px;
          opacity: ${t};
        `;
      },
    };
  }
</script>

<svelte:body
  onclick={(e) => {
    if (!(e.target instanceof HTMLElement && e.target.closest(".topbar")))
      dropdown = "none";
  }}
/>
<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape") dropdown = "none";
  }}
/>

<div class="p-1.5 bg-rock-100/70 border-r-2 border-rock-300 flex">
  <button
    class="complib-btn relative aspect-square rounded hover:bg-rock-200/70 h-full flex items-center justify-center text-2xl text-rock-800 [.active]:border-[1px] border-rock-300 [.active]:bg-background [.active]:hover:bg-rock-200/70 mr-0.5"
    aria-label="View component library"
    class:active={mode.sidebar === "viewcomponent"}
    class:warn={compLibVer.isVersFetched && !compLibVer.isLibUpToDate}
    onclick={() => {
      if (mode.sidebar === "viewcomponent") mode.sidebar = "edit";
      else mode.sidebar = "viewcomponent";
    }}><SquaresFour /></button
  >
  <button
    class="aspect-square rounded hover:bg-rock-200/70 h-full flex items-center justify-center text-2xl text-rock-800 [.active]:border-[1px] border-rock-300 [.active]:bg-background [.active]:hover:bg-rock-200/70"
    aria-label="View node hierarchy"
    class:active={mode.sidebar === "viewer"}
    onclick={() => {
      if (mode.sidebar === "viewer") mode.sidebar = "edit";
      else mode.sidebar = "viewer";
    }}><TreeView /></button
  >
</div>

<div class="ml-auto flex mr-2">
  {#if editorState.mode === "component"}
    <button
      class="aspect-square m-1.5 rounded flex items-center justify-center text-3xl text-rock-700 hover:bg-rock-100 cursor-pointer"
      class:bg-rock-100={dropdown === "compmetaedit"}
      aria-label="Configure component metadata"
      onclick={() => {
        if (dropdown === "compmetaedit") dropdown = "none";
        else dropdown = "compmetaedit";
      }}><ion-icon name="options"></ion-icon></button
    >
  {/if}
  <!-- {#if compLibVer.isVersFetched && !compLibVer.isLibUpToDate}
    <button
      class="aspect-square bg-white m-1.5 rounded text-yellow-400 flex items-center justify-center text-3xl cursor-pointer hover:bg-rock-50 hover:border-2 hover:text-yellow-500 border-rock-300"
      class:bg-rock-50={dropdown === "libver"}
      aria-label="Outdated component library version"
      onclick={() => {
        if (dropdown === "libver") dropdown = "none";
        else dropdown = "libver";
      }}
    >
      <ion-icon name="alert"></ion-icon>
    </button>
  {/if} -->
</div>

{#if dropdown !== "none"}
  <div
    transition:dropdownExpandTransition={{ endHeight: 288 }}
    class="absolute w-[90%] left-[5%] h-72 bg-background/95 z-10 top-12 border-2 border-t-0 rounded-b-lg border-rock-300 overflow-y-scroll"
  >
    {#if dropdown === "libver"}
      <div class="h-screen"></div>
      Boo
    {:else if dropdown === "compmetaedit"}
      <ComponentMetaEdit />
    {/if}
  </div>
{/if}

<style>
  @reference "../../shared/tailwindinit.css";

  .complib-btn.warn::after {
    content: "!";
    @apply absolute -right-[3px] -bottom-[3px] bg-rock-100/70 text-yellow-500 font-bold text-3xl leading-[0.9];
  }
  .complib-btn.warn.active::after {
    @apply bg-background;
  }
  .complib-btn.warn:hover::after {
    @apply bg-rock-200/70;
  }
</style>
