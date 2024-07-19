<script lang="ts">
  import CssEditor from "./css/CSSEditor.svelte";

  interface Props {
    nodeHoverTarget: Element | undefined;
  }

  let { nodeHoverTarget }: Props = $props();
</script>

{#if nodeHoverTarget}
  <div class="text-center font-mono text-lg font-bold text-rock-700">
    <span class="bg-steel-100 p-2 rounded">
      &#60;{nodeHoverTarget.tagName.toLowerCase()}&#62;
    </span>
  </div>
{/if}
<div class:hidden={!nodeHoverTarget} class="w-full h-fit p-2 text-center mt-8">
  <CssEditor {nodeHoverTarget} />
</div>
