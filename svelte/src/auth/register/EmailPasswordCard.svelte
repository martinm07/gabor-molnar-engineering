<script lang="ts">
  import { fade } from "svelte/transition";

  interface Props {
    onsuccess: Function;
  }
  let { onsuccess }: Props = $props();
</script>

<div data-transition-delay="100">
  Hello Email/Password Card!
  <button onclick={() => onsuccess()}>Go back</button>
</div>
