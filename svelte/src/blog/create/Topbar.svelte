<script lang="ts">
  import { circInOut } from "svelte/easing";
  import { compLibVer, mode } from "./store.svelte";
  import { editorState } from "./url.svelte";

  import ComponentMetaEdit, {
    dClassComponentMetaEdit,
  } from "./components/ComponentMetaEdit.svelte";
  import DocMetaEdit, { dClassDocMetaEdit } from "./DocMetaEdit.svelte";
  import MediaTray, { dClassMediaTray } from "./MediaTray.svelte";

  import TreeView from "phosphor-svelte/lib/TreeViewIcon";
  import SquaresFour from "phosphor-svelte/lib/SquaresFourIcon";
  import ListIcon from "phosphor-svelte/lib/ListIcon";
  import XIcon from "phosphor-svelte/lib/XIcon";
  import ImagesSquareIcon from "phosphor-svelte/lib/ImagesSquareIcon";

  // interface Props {
  // }

  // let {  }: Props = $props();

  type DropdownState = "docmetaedit" | "compmetaedit" | "mediatray" | "none";
  let dropdown: DropdownState = $state("none");

  const dropdownContainerClass = $derived.by(() => {
    switch (dropdown) {
      case "compmetaedit":
        return dClassComponentMetaEdit;
      case "docmetaedit":
        return dClassDocMetaEdit;
      case "mediatray":
        return dClassMediaTray;
      default:
        return "";
    }
  });

  function dropdownExpandTransition(
    node: HTMLElement,
    params: { duration?: number; expandAmount?: number },
  ) {
    // The element exists at this time, which is why this works
    const height = node.getBoundingClientRect().height;

    return {
      delay: 0,
      duration: params.duration ?? 150,
      easing: circInOut,
      css: (t: number, u: number) => {
        const startHeight = height - (params.expandAmount ?? 100);
        return `
          height: ${startHeight * u + height * t}px;
          opacity: ${t};
        `;
      },
    };
  }
</script>

<svelte:body
  onclick={(e) => {
    // Note, <svg> is NOT considered a HTMLElement, but is considered an Element
    if (
      !(
        e.target instanceof Element &&
        (e.target.closest(".topbar") || !e.target.isConnected)
      )
    )
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
    class="complib-btn relative aspect-square rounded hover:bg-rock-200/70 h-full flex items-center justify-center text-2xl text-rock-800 [.active]:border border-rock-300 [.active]:bg-background [.active]:hover:bg-rock-200/70 mr-0.5"
    aria-label="View component library"
    class:active={mode.sidebar === "viewcomponent"}
    class:warn={compLibVer.isVersFetched && !compLibVer.isLibUpToDate}
    onclick={() => {
      if (mode.sidebar === "viewcomponent") mode.sidebar = "edit";
      else mode.sidebar = "viewcomponent";
    }}><SquaresFour /></button
  >
  <button
    class="aspect-square rounded hover:bg-rock-200/70 h-full flex items-center justify-center text-2xl text-rock-800 [.active]:border border-rock-300 [.active]:bg-background [.active]:hover:bg-rock-200/70"
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
      }}><ListIcon /></button
    >
  {:else if editorState.mode === "document"}
    <button
      class="aspect-square m-1.5 rounded flex items-center justify-center text-3xl text-rock-700 hover:bg-rock-100 cursor-pointer"
      class:bg-rock-100={dropdown === "mediatray"}
      aria-label="Configure component metadata"
      onclick={() => {
        if (dropdown === "mediatray") dropdown = "none";
        else dropdown = "mediatray";
      }}
    >
      <ImagesSquareIcon class={dropdown === "mediatray" ? "hidden" : ""} />
      <XIcon class={dropdown === "mediatray" ? "" : "hidden"} />
    </button>

    <button
      class="aspect-square m-1.5 rounded flex items-center justify-center text-3xl text-rock-700 hover:bg-rock-100 cursor-pointer"
      class:bg-rock-100={dropdown === "docmetaedit"}
      aria-label="Configure component metadata"
      onclick={() => {
        if (dropdown === "docmetaedit") dropdown = "none";
        else dropdown = "docmetaedit";
      }}
    >
      <ListIcon class={dropdown === "docmetaedit" ? "hidden" : ""} />
      <XIcon class={dropdown === "docmetaedit" ? "" : "hidden"} />
    </button>
  {/if}
</div>

{#if dropdown !== "none"}
  <div
    transition:dropdownExpandTransition={{ expandAmount: 500, duration: 100 }}
    class={dropdownContainerClass}
  >
    {#if dropdown === "docmetaedit"}
      <!-- <div class="h-screen"></div> -->
      <DocMetaEdit />
    {:else if dropdown === "compmetaedit"}
      <ComponentMetaEdit />
    {:else if dropdown === "mediatray"}
      <MediaTray />
    {/if}
  </div>
{/if}

<style>
  @reference "../../shared/tailwindinit.css";

  .complib-btn.warn::after {
    content: "!";
    @apply absolute right-[-3px] bottom-[-3px] bg-rock-100/70 text-yellow-500 font-bold text-3xl leading-[0.9];
  }
  .complib-btn.warn.active::after {
    @apply bg-background;
  }
  .complib-btn.warn:hover::after {
    @apply bg-rock-200/70;
  }
</style>
