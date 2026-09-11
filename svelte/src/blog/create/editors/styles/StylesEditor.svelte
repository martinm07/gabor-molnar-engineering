<script lang="ts">
  import { doc, type DocCSSRule } from "../../store.svelte";
  import CSSEditor from "../css/CSSEditor.svelte";
  import FitContentInput from "/shared/components/FitContentInput.svelte";
  import * as csstree from "css-tree";
  import { setContext } from "svelte";
  import { StyleCache } from "../css/AllStyleEditors.svelte";
  import DotsSixVerticalIcon from "phosphor-svelte/lib/DotsSixVerticalIcon";

  const styleCache = new StyleCache();
  setContext("styleCache", styleCache);

  let dragSource = $state(-1);
  let draggingRule = false;
</script>

<ul>
  {#each doc.styles as rule, i}
    <!-- TODO: Make sure this doesn't do weird stuff when other random things are dragged around -->
    <li
      class="doccssrule-drag-item flex flex-col items-center py-3 [.ghost-item]:opacity-70 [.dropzone-active]:bg-rock-100/50 [.dropzone-active-up]:border-t-4 [.dropzone-active-down]:border-b-4 border-steel-300"
      class:drag-target={dragSource >= 0}
      data-i={i}
      ondragstart={(e) => {
        if (
          e.target instanceof Element &&
          e.target.classList.contains("doccssrule-drag-item")
        )
          draggingRule = true;

        e.dataTransfer?.setData("text/plain", `${i}`);
        dragSource = i;
      }}
      ondragover={(e) => {
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";

        if (draggingRule) e.preventDefault();
      }}
      ondragenter={(e) => {
        if (!draggingRule) return;
        // console.log("Entered", e.target);
        if (e.target instanceof Element) {
          const target = e.target.closest(".doccssrule-drag-item");
          if (dragSource !== i) target?.classList.add("dropzone-active");
          if (i < dragSource) target?.classList.add("dropzone-active-up");
          if (i > dragSource) target?.classList.add("dropzone-active-down");
        }
      }}
      ondragleave={(e) => {
        if (!draggingRule) return;
        // console.log("Left", e.target);
        if (e.target instanceof Element) {
          const target = e.target.closest(".doccssrule-drag-item");

          target?.classList.remove("dropzone-active");
          target?.classList.remove("dropzone-active-up");
          target?.classList.remove("dropzone-active-down");
        }
      }}
      ondrop={(e) => {
        e.preventDefault();
        const data = e.dataTransfer?.getData("text/plain");
        let oldI: number;
        if (!data || dragSource < 0) return;
        try {
          oldI = Number.parseInt(data);
        } catch {
          console.warn("Couldn't parse ", data, " into an integer.");
          return;
        }
        // console.log(e.target);
        if (e.target instanceof Element) {
          const target = e.target.closest(".doccssrule-drag-item");
          target?.classList.remove("dropzone-active");
          target?.classList.remove("dropzone-active-up");
          target?.classList.remove("dropzone-active-down");
        }

        // console.log(oldI, i);

        // Perform the actual operation of moving the rule
        const item = doc.styles.splice(oldI, 1)[0];
        doc.styles.splice(i, 0, item);
      }}
      ondragend={(e) => {
        dragSource = -1;
        draggingRule = false;
        // This is necessary as it is seems the onmouseup on the handler doesn't tend to work, perhaps due to drag events which are cancelled
        // Luckily, e.target always refers to the top element we're actually dragging (the one with draggable='true'), and not any of its children or anything.
        if (e.target instanceof Element)
          e.target.setAttribute("draggable", "false");
      }}
    >
      <div class="mb-2 flex gap-2 max-w-full">
        <FitContentInput
          type="text"
          class="bg-steel-100 px-1.5 py-1 rounded font-mono text-steel-800 box-content focus:outline-none focus:ring-2 ring-steel-300/50"
          placeholder="CSS rule selector"
          bind:value={rule.selector}
        />
        <button
          class="hover:text-rock-700 move-glyph"
          onmousedown={(e) => {
            if (e.target instanceof Element) {
              e.target
                .closest(".doccssrule-drag-item")
                ?.setAttribute("draggable", "true");
            }
          }}
          onmouseup={(e) => {
            if (e.target instanceof Element) {
              e.target
                .closest(".doccssrule-drag-item")
                ?.setAttribute("draggable", "false");
            }
          }}><DotsSixVerticalIcon /></button
        >
        <button
          type="button"
          class="text-xl text-red-700 inline-flex items-center justify-center hover:opacity-60"
          onclick={() => {
            doc.styles.splice(i, 1);
          }}
          aria-label="Remove attribute"
          ><ion-icon name="close-circle-outline"></ion-icon></button
        >
      </div>
      <CSSEditor syncAttrName="style" bind:value={rule.declarations} />
      <!-- {rule.rules} -->
    </li>
    <span class="block h-px last-of-type:h-0 bg-rock-300"></span>
  {/each}
</ul>
<div class="h-px w-full bg-rock-300 text-center mt-6">
  <button
    class="inline-block bg-background text-rock-400 text-xl -translate-y-1/2 px-2 hover:text-rock-200"
    onclick={() =>
      doc.styles.push({
        selector: "",
        declarations: ":;",
        compInheritance: null,
      })}>+</button
  >
</div>

<style>
  /* It is necessary to set the pointer-events to none so that dragenter and dragleave events aren't fired when
     mousing through the children of the element being dragged, which makes knowing when to show and hide the drag visual much harder */
  /* Also note that this needs to be :global, due to Svelte not recognising the CSSEditor in some way causing it to fail to match (seems like a bug) */
  :global(.drag-target div) {
    pointer-events: none !important;
  }
</style>
