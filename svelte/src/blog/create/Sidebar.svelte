<script lang="ts">
  import AttributesEditor, {
    type IAttributesEditor,
  } from "./editors/attributes/AttributesEditor.svelte";
  import CssEditor from "./editors/css/CSSEditor.svelte";
  import TagNameEditor from "./editors/tag/TagNameEditor.svelte";
  import { nodeHoverTarget, nodesSelection } from "./store";

  interface Props {
    attributesEditor?: IAttributesEditor;
  }
  // This variable is incorrectly classified as 'unused'
  // This is clearly a bug in the Svelte VSCode extension, not recognizing a compnent bind:this as a usage
  let { attributesEditor = $bindable() }: Props = $props();

  let selected = $derived(
    $nodesSelection.length === 0
      ? $nodeHoverTarget
        ? [$nodeHoverTarget]
        : []
      : $nodesSelection,
  );
</script>

<div class:hidden={selected.length === 0} class="text-center">
  <TagNameEditor {selected} />
</div>
<div
  class:hidden={selected.length === 0}
  class="w-full h-fit p-2 text-center mt-8"
>
  <CssEditor {selected} />
</div>
<div class:hidden={selected.length === 0}>
  <AttributesEditor {selected} bind:this={attributesEditor} />
</div>
