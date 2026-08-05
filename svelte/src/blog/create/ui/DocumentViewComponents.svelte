<script lang="ts">
  import ComponentTray from "../components/ComponentTray.svelte";

  import WrenchIcon from "phosphor-svelte/lib/WrenchIcon";
  import {
    mode,
    savedComponents,
    type SavedComponentWithEdit,
  } from "../store.svelte";
  import { changePage, editorState } from "../url.svelte";

  function selectComponentEdit(comp: SavedComponentWithEdit) {
    if (editorState.mode !== "document") return;
    changePage("component", comp.identName, editorState.resourceName);
  }
</script>

{#if editorState.mode === "document" && mode.sidebar === "viewcomponent"}
  <ComponentTray
    comps={savedComponents}
    mainActionTag="none"
    secondaryAction={selectComponentEdit}
    secondaryActionTag="a"
    generateHref={(comp) => `/documents/edit/component/${comp.identName}`}
    secondaryActionLabel="Edit component"
  >
    {#snippet secondaryActionContent()}
      <WrenchIcon />
    {/snippet}
  </ComponentTray>
{/if}
