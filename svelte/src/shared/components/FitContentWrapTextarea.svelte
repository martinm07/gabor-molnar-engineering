<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import { watch } from "runed";

  interface Props extends HTMLTextareaAttributes {
    dontModifyWidth?: boolean;
  }

  let {
    dontModifyWidth,
    value = $bindable(),
    oninput,
    ...props
  }: Props = $props();

  let el: HTMLTextAreaElement;

  function getPaddingY() {
    const computed = getComputedStyle(el);
    let paddingY: number;

    if (computed.boxSizing === "border-box") {
      paddingY =
        Number.parseFloat(computed.paddingTop) +
        Number.parseFloat(computed.paddingBottom);
      paddingY +=
        Number.parseFloat(computed.borderTopWidth) +
        Number.parseFloat(computed.borderBottomWidth);
    } else {
      paddingY =
        Number.parseFloat(computed.paddingTop) +
        Number.parseFloat(computed.paddingBottom);
    }
    return paddingY;
  }

  watch(
    () => value,
    () => {
      if (!dontModifyWidth) {
        el.style.width = `${el.value.length || el.placeholder.length}ch`;
      }

      el.style.height = "0px";
      // This calls getComputedStyle() which should force a style calculation, thus letting
      //  the above 0px height assignment take effect to calculate the true scrollHeight
      const paddingY = getPaddingY();

      el.style.height = `${el.scrollHeight - paddingY}px`;
      if (el.scrollWidth > el.offsetWidth) {
        console.log(
          `Text content seems to have exceeded max width. scrollWidth: ${el.scrollWidth}  offsetWidth: ${el.offsetWidth}`,
        );
      }
    },
  );
</script>

<!-- This element should be styled to have text-wrap: wrap; and some value for max-width
     to activate the wrapping (otherwise, the textarea width will just grow infinitely). -->
<textarea bind:this={el} {oninput} bind:value {...props}></textarea>
