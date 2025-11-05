<script lang="ts">
  import { getContext } from "svelte";
  import ComponentTray from "./components/ComponentTray.svelte";
  import AttributesEditor, {
    type Attribute,
    type IAttributesEditor,
  } from "./editors/attributes/AttributesEditor.svelte";
  import CssEditor, { type ICSSEditor } from "./editors/css/CSSEditor.svelte";
  import TagNameEditor from "./editors/tag/TagNameEditor.svelte";
  import {
    nodeHoverTarget,
    nodesSelection,
    mode,
    compLibVer,
  } from "./store.svelte";
  import { watch } from "runed";
  import { request2AnimationFrames } from "/shared/helper";
  import { editorState } from "./store.svelte";
  import UpdateDocLib from "./components/UpdateDocLib.svelte";

  const updateHighlight: () => void = getContext("updateHighlight");
  const removeFromSelection: (nodes?: Node[] | Node) => void = getContext(
    "removeFromSelection",
  );

  interface Props {
    attributesEditor?: IAttributesEditor;
    cssEditor?: ICSSEditor;
  }

  let { attributesEditor = $bindable(), cssEditor = $bindable() }: Props =
    $props();

  let selected = $derived(
    $nodesSelection.length === 0
      ? $nodeHoverTarget
        ? [$nodeHoverTarget]
        : []
      : $nodesSelection,
  );
  let disabled = $derived(
    editorState.mode === "document" &&
      selected.some((el) => el.getAttribute("data-component")),
  );

  watch(
    () => selected,
    () => {
      // It seems that we have to wait for the DOM to update with the new "highlight" elements
      //  before trying to update the highlight, hence the animation frame callback.
      requestAnimationFrame(updateHighlight);
    },
  );

  // When the selection changes while we are adding a new node,
  //  OR when the sidebar mode changes (without the temp-added being replaced as
  //   happens when actually clicking "Create Empty Node" or clicking a component).
  //  cancel the adding of that node
  watch(
    [() => $nodesSelection, () => mode.sidebar],
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

  let createEmptyBtnFocused = $state(false);

  let editorAttrs: Attribute[] = $state([]);
</script>

<!-- SIDEBAR MODE: edit -->
<div
  class:hidden={selected.length === 0 || mode.sidebar !== "edit"}
  class="text-center"
>
  <TagNameEditor {selected} {disabled} />
</div>
<div
  class:hidden={selected.length === 0 || mode.sidebar !== "edit"}
  class="w-full h-fit p-2 text-center mt-8"
>
  <CssEditor {selected} {disabled} bind:this={cssEditor} />
</div>
<div class:hidden={selected.length === 0 || mode.sidebar !== "edit"}>
  <AttributesEditor
    {selected}
    {disabled}
    bind:this={attributesEditor}
    bind:attributes={editorAttrs}
  />
</div>
<!-- SIDEBAR MODE: component -->

{#if compLibVer.isVersFetched && !compLibVer.isLibUpToDate && mode.sidebar.includes("component")}
  <UpdateDocLib />
{/if}

<div
  class="text-center mt-3 mb-8"
  class:hidden={mode.sidebar !== "addcomponent"}
>
  <button
    type="button"
    class="create-empty-node border-2 border-rock-400 rounded text-lg text-rock-600 px-3 py-2 bg-rock-100 shadow-inner shadow-white hover:bg-rock-200 ring-rock-200 focus:ring-4 focus:outline-none relative"
    onclick={() => {
      // There should only be one selected element, nonetheless we use forEach for reliability's sake
      selected.forEach((el) => {
        el.classList.remove("temp-added");
        el.removeAttribute("class");
      });
      // We want to trigger the AttributeEditor to refetch the attributes
      //  of the newly added element after removing its class, which it does
      //  whenever the selection changes - and so we artifically trigger a change
      //  this way (NOTE: Svelte is being smart and doesn't trigger updates to the $derived
      //                  `selection` unless a change actually happens, so we need to actually
      //                  change the selection for a frame).
      // TODO: In general, the CSS editor and attributes editor don't update on DOM mutations
      //        to the selected elements, which means the user view of what attributes and styles
      //        are on the selection could easily become outdated if there is JavaScript manipulating
      //        the document in some way. It would be a good idea to have them listen for DOM `attributes`
      //        mutations on the currently selected elements for refetches.
      const selTemp = $nodesSelection;
      $nodesSelection = [];
      requestAnimationFrame(() => {
        $nodesSelection = selTemp;
      });

      mode.sidebar = "edit";
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
<div class:hidden={mode.sidebar !== "viewer"}>
  TODO: The document DOM viewer (/headings viewer for easier navigation?)
</div>
