<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface ParentProps extends HTMLAttributes<HTMLElement> {
    [key: string]: any;
  }
  interface Props extends ParentProps {
    tag?: string;
    spanProps?: HTMLAttributes<HTMLSpanElement>;
    spanContent: Snippet;
    afterSpanContent?: Snippet;
  }
  let {
    tag = "div",
    spanProps,
    spanContent,
    afterSpanContent,
    ...parentProps
  }: Props = $props();

  let parent: HTMLElement;
  let parentWidth: number | null = $state(null);
  // BUG: offsetWidth doesn't update on inline span
  let spanWidth: number | null = $state(null);

  $effect(() => {
    if (!parentWidth || !spanWidth) return;
    parent.style.paddingLeft = `${(parentWidth - spanWidth) / 2}px`;
  });
</script>

<svelte:element
  this={tag}
  bind:this={parent}
  bind:clientWidth={parentWidth}
  {...parentProps}
>
  <span bind:offsetWidth={spanWidth} {...spanProps}>
    {@render spanContent()}
  </span>
  {#if afterSpanContent}
    {@render afterSpanContent()}
  {/if}
</svelte:element>
