<script lang="ts">
  import { getContext } from "svelte";
  import AttributesEditor, {
    type Attribute,
    type IAttributesEditor,
  } from "../editors/attributes/AttributesEditor.svelte";
  import AllStyleEditors, {
    type IAllStyleEditors,
  } from "../editors/css/AllStyleEditors.svelte";
  import TagNameEditor from "../editors/tag/TagNameEditor.svelte";
  import { selection, mode, compLib } from "../store.svelte";
  import { watch } from "runed";
  import { changePage, editorState } from "../url.svelte";
  import UpdateDocLib from "../components/UpdateDocLib.svelte";
  import ArrowArcLeftIcon from "phosphor-svelte/lib/ArrowArcLeftIcon";
  import HouseIcon from "phosphor-svelte/lib/HouseIcon";
  import { deepEqual } from "../helper";
  import ComponentInfo from "../components/ComponentInfo.svelte";
  import LibraryEditorViewComponents from "./LibraryEditorViewComponents.svelte";
  import AddNodeMenu from "./AddNodeMenu.svelte";
  import DocumentViewComponents from "./DocumentViewComponents.svelte";
  import ChangeToComponent from "./ChangeToComponent.svelte";

  const updateHighlight: () => void = getContext("updateHighlight");

  interface Props {
    attributesEditor?: IAttributesEditor;
    cssEditor?: IAllStyleEditors;
  }

  let { attributesEditor = $bindable(), cssEditor = $bindable() }: Props =
    $props();

  let selectionHasComponents = $derived.by(() => {
    currentAttrs.length;
    return (
      editorState.mode === "document" &&
      selection.main.some((el) => el.getAttribute("data-component"))
    );
  });

  watch(
    () => selection.main,
    () => {
      // It seems that we have to wait for the DOM to update with the new "highlight" elements
      //  before trying to update the highlight, hence the animation frame callback.
      requestAnimationFrame(updateHighlight);
    },
  );

  let currentAttrs: Attribute[] = $state([]);
  // $inspect(editorAttrs);
  // watch(
  //   () => $state.snapshot(editorAttrs),
  //   (curr, prev) => {
  //     if (!deepEqual(curr, prev) && curr.length > 0)
  //       console.log(
  //         curr.map((attr) => attr.name),
  //         curr,
  //       );
  //   },
  // );
</script>

{#if editorState.documentRedirect && mode.sidebar === "edit"}
  <button
    aria-label="Return to document"
    class="absolute z-10 aspect-square text-2xl p-2 top-2 left-2 rounded-lg border-2 border-rock-100 text-rock-600 bg-background hover:bg-rock-100 hover:active:bg-rock-200 hover:active:text-rock-700 hover:active:border-rock-200 hover:active:translate-y-1"
    onclick={() => {
      changePage(
        editorState.mode === "component" ? "document" : "component",
        editorState.documentRedirect!,
        null,
      );
    }}
  >
    <ArrowArcLeftIcon weight="bold" />
  </button>
{:else if mode.sidebar === "edit"}
  <a
    aria-label="Go to documents admin view"
    class="absolute z-10 aspect-square text-2xl p-2 top-2 left-2 rounded-lg border-2 border-rock-100 text-rock-600 bg-background hover:bg-rock-100 hover:active:bg-rock-200 hover:active:text-rock-700 hover:active:border-rock-200 hover:active:translate-y-1"
    href="/documents/admin"
  >
    <HouseIcon weight="bold" />
  </a>
{/if}

<!-- SIDEBAR MODE: edit -->
<div class="text-center">
  <ComponentInfo {currentAttrs} />
</div>
<div
  class:hidden={selection.main.length === 0 ||
    mode.sidebar !== "edit" ||
    selectionHasComponents}
  class="text-center"
>
  <TagNameEditor selected={selection.main} />
</div>
<div
  class:hidden={selection.main.length === 0 || mode.sidebar !== "edit"}
  class="w-full h-fit p-2 text-center mt-8"
>
  <AllStyleEditors {currentAttrs} bind:this={cssEditor} />
</div>
<div class:hidden={selection.main.length === 0 || mode.sidebar !== "edit"}>
  <AttributesEditor
    selected={selection.main}
    bind:this={attributesEditor}
    bind:currentAttrs
  />
</div>
<!-- SIDEBAR MODE: component -->

{#if mode.inCompLibUpgrade || (compLib.isVersFetched && !compLib.isLibUpToDate)}
  <UpdateDocLib />
{/if}

<LibraryEditorViewComponents />
<DocumentViewComponents />

<AddNodeMenu />
<ChangeToComponent />

<!-- SIDEBAR MODE: viewer -->
<div class:hidden={mode.sidebar !== "viewer"}>
  TODO: The document DOM viewer (/headings viewer for easier navigation?)
</div>
