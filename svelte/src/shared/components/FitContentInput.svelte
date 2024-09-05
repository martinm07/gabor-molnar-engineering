<script lang="ts">
  import { watch } from "runed";
  import { onMount } from "svelte";
  import type { FormEventHandler, HTMLInputAttributes } from "svelte/elements";

  interface Props extends HTMLInputAttributes {}

  let { value = $bindable(), oninput, ...props }: Props = $props();

  let el: HTMLInputElement;

  onMount(() => {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    onInput();
  });

  function onInput(e?: Parameters<FormEventHandler<HTMLInputElement>>[0]) {
    el.style.width = `${el.value.length || el.placeholder.length}ch`;
    if (e) oninput?.(e);
  }
  watch(() => value, onInput);
</script>

<input oninput={onInput} bind:this={el} bind:value {...props} />
