<script lang="ts">
  import { isInSveltePreview } from "../App.svelte";
  import { closestAttribute } from "../helper";
  import { savedComponents, selection } from "../store.svelte";

  import WarningDiamondIcon from "phosphor-svelte/lib/WarningDiamondIcon";
  import CaretRightIcon from "phosphor-svelte/lib/CaretRightIcon";
  import CaretDownIcon from "phosphor-svelte/lib/CaretDownIcon";
  import ArrowClockwiseIcon from "phosphor-svelte/lib/ArrowClockwiseIcon";
  import TrashIcon from "phosphor-svelte/lib/TrashIcon";
  import EyeIcon from "phosphor-svelte/lib/EyeIcon";
  import EyeClosedIcon from "phosphor-svelte/lib/EyeClosedIcon";
  import { EditorView } from "@codemirror/view";
  import { svelte } from "@replit/codemirror-lang-svelte";
  import { espresso } from "thememirror";
  import { EditorState } from "@codemirror/state";
  import type { Attribute } from "../editors/attributes/AttributesEditor.svelte";

  interface Props {
    currentAttrs: Attribute[];
  }
  let { currentAttrs }: Props = $props();

  const showWarning = $derived.by(() =>
    selection.selected.some((el) => isInSveltePreview(el)),
  );

  const findSvelteSourceEl = (el: Element) => {
    let sourceEl = closestAttribute(el, "data-sveltecomp-source");

    if (!sourceEl && isInSveltePreview(el)) {
      let currentNode: Node | null | undefined = el;
      while (
        !(currentNode instanceof Comment) ||
        currentNode.textContent !== "!<SVELTECOMP-PREVIEW>"
      ) {
        currentNode = currentNode?.previousSibling ?? currentNode?.parentNode;
      }
      const startMarker = currentNode;

      const sourceEl_ = startMarker.previousSibling;
      if (
        !(sourceEl_ instanceof Element) ||
        !sourceEl_.hasAttribute("data-sveltecomp-source")
      )
        return null;
      sourceEl = sourceEl_;
    }

    return sourceEl ?? null;
  };

  const svelteSourceCode = $derived.by(() => {
    if (selection.main === null) return "";

    return selection.main
      .map((el) => {
        const sourceEl = findSvelteSourceEl(el);
        if (!sourceEl) return "";
        return (
          Array.from(sourceEl.children).find((child) =>
            child.hasAttribute("data-sveltecomp-code"),
          )?.textContent ?? ""
        );
      })
      .reduce((p, c) => (p === c ? c : ""));
  });

  const sourceElVisible = $derived.by(() => {
    currentAttrs.length;
    if (selection.main === null) return true;
    return selection.main
      .map((el) => {
        const sourceEl = findSvelteSourceEl(el);
        if (!sourceEl) return true;
        return !sourceEl.hasAttribute("data-sveltecomp-sourcehidden");
      })
      .reduce((p, c) => p || c);
  });

  const selectedSvelteComp = $derived.by(() => {
    currentAttrs.length;
    if (selection.main.length === 0) return null;
    const name = selection.main
      .map((el) => {
        const sourceEl = findSvelteSourceEl(el);
        if (!sourceEl) return null;

        const compName = sourceEl.getAttribute("data-sveltecomp-compname");
        return compName ?? "";
      })
      .reduce((p, c) => (p === null ? null : c === p ? c : ""));

    return name;
  });

  const compDescription = $derived.by(() => {
    if (!selectedSvelteComp) return "";
    const comp = savedComponents.find(
      (comp) => comp.name === selectedSvelteComp,
    );
    if (!comp) return "";
    else return comp.description ?? "";
  });

  const compTags = $derived.by(() => {
    if (!selectedSvelteComp) return [];
    const comp = savedComponents.find(
      (comp) => comp.name === selectedSvelteComp,
    );
    if (!comp || !comp.tags) return [];
    else return comp.tags?.split(",") ?? [];
  });

  const selectedPropEl = $derived.by(() => {
    if (selection.main.length === 0) return null;
    return selection.main
      .map((el) => {
        const propEl = closestAttribute(el, "data-sveltecomp-propname");
        if (!propEl) return null;
        else return propEl.getAttribute("data-sveltecomp-propname");
      })
      .reduce((p, c) => (p === null ? null : p === c ? c : ""));
  });

  //////////////////////////////////////

  function removeSelectedSvelteComps() {
    selection.main.forEach((el) => {
      const sourceEl = findSvelteSourceEl(el);
      if (sourceEl) {
        sourceEl.remove();
      }
    });
    selection.selected = [];
  }

  function reloadSelectedSvelteComps() {
    selection.main.forEach((el) => {
      const sourceEl = findSvelteSourceEl(el);
      if (!sourceEl) return;
      const previewMarker = sourceEl.nextSibling;
      if (
        previewMarker?.nodeType === Node.COMMENT_NODE &&
        previewMarker.textContent === "!<SVELTECOMP-PREVIEW>"
      ) {
        previewMarker.remove();
      }
    });
  }

  function toggleSelectedSourceElsVisibility() {
    selection.main.forEach((el) => {
      const sourceEl = findSvelteSourceEl(el);
      if (!sourceEl) return;
      if (sourceEl.hasAttribute("data-sveltecomp-sourcehidden")) {
        sourceEl.removeAttribute("data-sveltecomp-sourcehidden");
      } else {
        sourceEl.setAttribute("data-sveltecomp-sourcehidden", "");
      }
    });
  }
</script>

{#if selectedSvelteComp !== null}
  <div class="my-2 text-rock-800 text-xl relative w-full">
    <span class="bg-rock-100 rounded px-3 py-1.5"
      >{selectedSvelteComp || "[multiple svelte-type components]"}</span
    >
  </div>
  <div
    class="text-rock-700 text-lg italic mb-1"
    class:hidden={compDescription === null}
  >
    {compDescription}
  </div>
  <div
    class="text-rock-700 text-lg/9 italic"
    class:hidden={compTags.length === 0}
  >
    {#each compTags as tag}
      <span class="bg-rock-50 border border-rock-200 rounded px-1 py-0.5"
        >{tag}</span
      >
      &nbsp;
    {/each}
  </div>

  <div class="text-left my-3">
    {let isExpanded = $state(false)}
    <button
      class="inline-flex gap-1 items-center text-lg text-rock-700 hover:text-rock-600"
      onclick={() => (isExpanded = !isExpanded)}
    >
      View Svelte source
      {#if isExpanded}
        <CaretDownIcon />
      {:else}
        <CaretRightIcon />
      {/if}
    </button>
    {#if isExpanded}
      <div
        class="w-full bg-white"
        {@attach (el) => {
          const view = new EditorView({
            parent: el,
            doc: "",
            extensions: [
              svelte(),
              espresso,
              EditorState.readOnly.of(true),
              EditorView.editable.of(false),
              EditorView.contentAttributes.of({ tabindex: "0" }),
            ],
          });

          $effect(() => {
            view.dispatch({
              changes: {
                from: 0,
                to: view.state.doc.length,
                insert: svelteSourceCode,
              },
            });
          });
        }}
      ></div>
    {/if}
  </div>

  <div class="flex flex-wrap justify-center gap-4 text-xl text-rock-700">
    <button
      onclick={removeSelectedSvelteComps}
      class="p-2 rounded bg-red-100 hover:bg-red-200 text-red-700"
      ><TrashIcon weight="bold" /></button
    >
    <button
      onclick={reloadSelectedSvelteComps}
      class="p-2 rounded bg-steel-100 hover:bg-steel-200"
      ><ArrowClockwiseIcon weight="bold" /></button
    >
    <button
      onclick={toggleSelectedSourceElsVisibility}
      class="p-2 rounded bg-steel-100 hover:bg-steel-200"
    >
      {#if sourceElVisible}
        <EyeIcon weight="bold" />
      {:else}
        <EyeClosedIcon weight="bold" />
      {/if}
    </button>
  </div>

  {#if selectedPropEl !== null}
    <div class="h-0.5 bg-rock-200 my-3"></div>

    <div class="text-rock-700 italic">
      {#if selectedPropEl}
        ✨ Edits will be passed to the <span
          class="inline-block p-1 bg-rock-100 rounded font-mono"
          >{selectedPropEl}</span
        > property
      {:else}
        ✨ Edits will be passed to various properties
      {/if}
    </div>
    <div class="h-3"></div>
  {:else}
    <div class="h-8"></div>
  {/if}

  <div class="h-0.5 bg-rock-200 mb-8"></div>
{/if}

{#if showWarning}
  <div
    class="bg-yellow-50 rounded border-2 border-yellow-300 flex items-center justify-around text-lg text-yellow-700 mb-3 p-1.5"
  >
    <WarningDiamondIcon class="shrink-0" /><span
      >(some) selected elements will not keep their edits<br /><span
        class="text-sm italic"
        >...because they are in the previews of svelte-type components</span
      ></span
    ><WarningDiamondIcon class="shrink-0" />
  </div>
{/if}
