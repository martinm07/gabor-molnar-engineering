<script lang="ts">
  import AttributesEditor from "./editors/attributes/AttributesEditor.svelte";
  import CssEditor from "./editors/css/CSSEditor.svelte";
  import TagNameEditor from "./editors/tag/TagNameEditor.svelte";
  import { nodeHoverTarget, nodesSelection } from "./store";

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
  <AttributesEditor {selected} />
</div>
