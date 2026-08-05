<script lang="ts">
  import ComponentTray from "../components/ComponentTray.svelte";

  import WrenchIcon from "phosphor-svelte/lib/WrenchIcon";
  import {
    mode,
    savedComponents,
    selection,
    type SavedComponent,
    type SavedComponentWithEdit,
  } from "../store.svelte";
  import { changePage, editorState } from "../url.svelte";
  import { watch } from "runed";
  import { getContext } from "svelte";
  import { decodeComponentStr } from "../components/component.svelte";

  const removeFromSelection: (nodes?: Node[] | Node) => void = getContext(
    "removeFromSelection",
  );
  const setSelection: (nodes?: Node[] | Node) => void =
    getContext("setSelection");

  function addComponent(comp: SavedComponent) {
    if (editorState.mode !== "document") return;

    const componentFrag = decodeComponentStr(comp.content, "document");
    const topLevel = Array(...componentFrag.childNodes);

    selection.selected[0].replaceWith(componentFrag);
    setSelection(topLevel);
    mode.sidebar = "edit";
  }

  function selectComponentEdit(comp: SavedComponentWithEdit) {
    if (editorState.mode !== "document") return;
    changePage("component", comp.identName, editorState.resourceName);
  }

  // When the selection changes while we are adding a new node,
  //  OR when the sidebar mode changes (without the temp-added being replaced as
  //   happens when actually clicking "Create Empty Node" or clicking a component).
  //  cancel the adding of that node
  watch(
    [() => selection.selected, () => mode.sidebar],
    (_, [prevSelection, prevSidebar]) => {
      if (
        prevSidebar === "addcomponent" &&
        prevSelection // &&
        // selection.length !== 1
      ) {
        console.log("Now removing temp added node");
        prevSelection.forEach((el) => {
          if (el.classList.contains("temp-added")) {
            el.remove();
            removeFromSelection(el);
          }
        });
        // removeFromSelection(prevSelection);
        requestAnimationFrame(() => (mode.sidebar = "edit"));
      }
    },
  );
</script>

{#if editorState.mode === "document" && mode.sidebar === "addcomponent"}
  <div class="text-center mt-3 mb-8">
    {let createEmptyBtnFocused = $state(false)}
    <button
      type="button"
      class="create-empty-node border-2 border-rock-400 rounded text-lg text-rock-600 px-3 py-2 bg-rock-100 shadow-inner shadow-white hover:bg-rock-200 ring-rock-200 focus:ring-4 focus:outline-none relative"
      onclick={() => {
        // There should only be one selected element, nonetheless we use forEach for reliability's sake
        selection.main.forEach((el) => {
          el.classList.remove("temp-added");
          el.removeAttribute("class");
        });

        mode.sidebar = "edit";
      }}
      onfocusin={() => (createEmptyBtnFocused = true)}
      onfocusout={() => (createEmptyBtnFocused = false)}
      >Create Empty Node
      <span
        class="absolute text-sm bottom-0 right-0 translate-y-full text-rock-400 italic"
        class:hidden={!createEmptyBtnFocused}>(press enter)</span
      ></button
    >
  </div>

  <ComponentTray
    comps={savedComponents}
    mainAction={addComponent}
    mainActionTag="button"
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
