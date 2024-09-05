<script lang="ts">
  import ComponentTray from "./components/ComponentTray.svelte";
  import AttributesEditor, {
    type IAttributesEditor,
  } from "./editors/attributes/AttributesEditor.svelte";
  import CssEditor from "./editors/css/CSSEditor.svelte";
  import TagNameEditor from "./editors/tag/TagNameEditor.svelte";
  import { nodeHoverTarget, nodesSelection, sidebarMode } from "./store";

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
  let disabled = $derived(
    selected.some((el) => el.getAttribute("data-component")),
  );

  let createEmptyBtnFocused = $state(false);
</script>

<!-- SIDEBAR MODE: edit -->
<div
  class:hidden={selected.length === 0 || $sidebarMode !== "edit"}
  class="text-center"
>
  <TagNameEditor {selected} {disabled} />
</div>
<div
  class:hidden={selected.length === 0 || $sidebarMode !== "edit"}
  class="w-full h-fit p-2 text-center mt-8"
>
  <CssEditor {selected} {disabled} />
</div>
<div class:hidden={selected.length === 0 || $sidebarMode !== "edit"}>
  <AttributesEditor {selected} {disabled} bind:this={attributesEditor} />
</div>
<!-- SIDEBAR MODE: component -->
<div class="text-center mt-3 mb-8" class:hidden={$sidebarMode !== "component"}>
  <button
    type="button"
    class="create-empty-node border-2 border-rock-400 rounded text-lg text-rock-600 px-3 py-2 bg-rock-100 shadow-inner shadow-white hover:bg-rock-200 ring-rock-200 focus:ring-4 focus:outline-none relative"
    onclick={() => {
      $sidebarMode = "edit";
    }}
    onfocusin={() => (createEmptyBtnFocused = true)}
    onfocusout={() => (createEmptyBtnFocused = false)}
    >Create Empty Node<span
      class="absolute text-sm bottom-0 right-0 translate-y-full text-rock-400 italic"
      class:hidden={!createEmptyBtnFocused}>(press enter)</span
    ></button
  >
</div>
<ComponentTray />
<!-- SIDEBAR MODE: viewer -->
<div class:hidden={$sidebarMode !== "viewer"}>
  TODO: The document DOM viewer (/headings viewer for easier navigation?)
</div>
