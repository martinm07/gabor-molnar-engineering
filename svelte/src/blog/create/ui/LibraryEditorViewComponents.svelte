<script lang="ts">
  import ComponentTray from "../components/ComponentTray.svelte";

  import TrashIcon from "phosphor-svelte/lib/TrashIcon";
  import ArrowsCounterClockwiseIcon from "phosphor-svelte/lib/ArrowsCounterClockwiseIcon";
  import {
    comps,
    updateCompAdd,
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

  function selectComponentCreate() {
    let startName = 1;
    while (comps.lib.some((comp) => comp.name === `unnamed-${startName}`))
      startName++;
    const edit = updateCompAdd({
      name: `unnamed-${startName}`,
      content: `<div data-component="unnamed-${startName}-[1]">*initial*</div>`,
      parts: "1",
    });
    changePage(
      "component",
      edit.identName,
      editorState.mode === "document"
        ? editorState.resourceName
        : editorState.documentRedirect,
    );
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

<div
  class="p-2 flex items-center justify-center mt-4"
  class:hidden={!mode.sidebar.includes("component") ||
    editorState.mode !== "component"}
>
  <button
    class="px-3 py-1.5 border-steel-300 border-2 rounded bg-steel-100 text-steel-600 font-bold text-lg font-mono shadow-2xs inset-shadow-xs inset-shadow-rock-500 hover:shadow-md hover:inset-shadow-2xs hover:inset-shadow-steel-100 hover:px-3.5 transition-[padding,box-shadow] hover:active:bg-steel-200 hover:active:text-steel-700 hover:active:translate-y-1"
    onclick={selectComponentCreate}>New component</button
  >
</div>
