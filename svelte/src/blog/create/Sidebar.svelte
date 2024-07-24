<script lang="ts">
  import AttributesEditor from "./editors/attributes/AttributesEditor.svelte";
  import CssEditor from "./editors/css/CSSEditor.svelte";
  import TagNameEditor from "./editors/tag/TagNameEditor.svelte";
  import { nodeHoverTarget } from "./store";
</script>

<div class:hidden={!$nodeHoverTarget} class="text-center">
  <TagNameEditor />
</div>
<div class:hidden={!$nodeHoverTarget} class="w-full h-fit p-2 text-center mt-8">
  <CssEditor />
</div>
<div class:hidden={!$nodeHoverTarget}>
  <AttributesEditor />
</div>
