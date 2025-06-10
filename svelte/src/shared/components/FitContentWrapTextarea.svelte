<script lang="ts">
  import { onMount } from "svelte";
  import type {
    FormEventHandler,
    HTMLTextareaAttributes,
  } from "svelte/elements";

  interface Props extends HTMLTextareaAttributes {}

  let { value = $bindable(), oninput, ...props }: Props = $props();

  let el: HTMLTextAreaElement;
  let paddingY: number;

  function getPaddingY() {
    const computed = getComputedStyle(el);
    let paddingY =
      Number.parseFloat(computed.paddingTop) +
      Number.parseFloat(computed.paddingBottom);
    paddingY +=
      Number.parseFloat(computed.borderTopWidth) +
      Number.parseFloat(computed.borderBottomWidth);
    return paddingY;
  }

  onMount(() => {
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  function oninputModified(
    e: Parameters<FormEventHandler<HTMLTextAreaElement>>[0],
  ) {
    el.style.width = `${el.value.length || el.placeholder.length}ch`;

    el.style.height = "0px";
    // This calls getComputedStyle() which should force a style calculation, thus letting
    //  the above 0px height assignment take effect to calculate the true scrollHeighr
    const paddingY = getPaddingY();

    el.style.height = `${el.scrollHeight - paddingY}px`;
    if (el.scrollWidth > el.offsetWidth) {
      console.log(
        `Text content seems to have exceeded max width. scrollWidth: ${el.scrollWidth}  offsetWidth: ${el.offsetWidth}`,
      );
    }
    if (e) oninput?.(e);
  }
</script>

<textarea bind:this={el} oninput={oninputModified} bind:value {...props}
></textarea>
