<script lang="ts">
  import { cursorMode } from "../store";
  import { getContext } from "svelte";

  const resetHoverTarget: () => void = getContext("resetHoverTarget");

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "s" && $cursorMode === "select") {
      $cursorMode = "editprops";
    } else if (e.key === "Escape" && $cursorMode === "editprops") {
      resetHoverTarget();
      $cursorMode = "select";
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />
