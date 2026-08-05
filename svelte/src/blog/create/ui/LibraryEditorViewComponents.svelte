<script lang="ts">
  import ComponentTray from "../components/ComponentTray.svelte";

  import TrashIcon from "phosphor-svelte/lib/TrashIcon";
  import ArrowsCounterClockwiseIcon from "phosphor-svelte/lib/ArrowsCounterClockwiseIcon";
  import {
    comps,
    updateCompRemove,
    updateCompRestore,
  } from "../components/libraryeditor.svelte";
  import {
    mode,
    type SavedComponent,
    type SavedComponentWithEdit,
  } from "../store.svelte";
  import { changePage, editorState } from "../url.svelte";

  function selectComponentEdit(comp: SavedComponent) {
    if (editorState.mode !== "component") return;
    changePage("component", comp.identName, editorState.documentRedirect);
  }

  function handleComponentRemoveOrRestore(comp: SavedComponentWithEdit) {
    if (comp.state === "removed") updateCompRestore(comp.identName);
    else updateCompRemove(comp.identName);
  }

  $inspect(comps.lib);
  $inspect(comps.current);
</script>

{#if editorState.mode === "component"}
  <div class:hidden={mode.sidebar !== "viewcomponent"}>
    <ComponentTray
      comps={comps.lib}
      mainAction={selectComponentEdit}
      mainActionTag="a"
      generateHref={(comp) => `/documents/edit/component/${comp.identName}`}
      secondaryAction={handleComponentRemoveOrRestore}
      secondaryActionTag="button"
      secondaryActionLabel="Remove/restore component"
    >
      {#snippet secondaryActionContent(comp)}
        {#if comp.state === "removed"}
          <ArrowsCounterClockwiseIcon />
        {:else}
          <TrashIcon />
        {/if}
      {/snippet}
    </ComponentTray>
  </div>
{/if}
