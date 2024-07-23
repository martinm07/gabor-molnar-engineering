<script lang="ts">
  import { onMount } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";

  interface Props extends HTMLInputAttributes {}

  let { value = $bindable(), ...props }: Props = $props();

  let el: HTMLInputElement;

  onMount(() => {
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
</script>

<input
  oninput={() => {
    el.style.width = `${el.value.length || el.placeholder.length}ch`;
  }}
  bind:this={el}
  bind:value
  {...props}
/>
