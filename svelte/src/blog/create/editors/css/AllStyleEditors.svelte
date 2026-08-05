<script lang="ts" module>
  export interface IAllStyleEditors {
    syncElementInlineStyles: (nodes: Node[]) => void;
  }

  export function syncDataStyleAttrs(
    el: Element,
    dataStyles: DynamicStylesheet<string>,
    modifiedAttribute?: string,
  ) {
    // console.log("Syncing data-style-* attributes of element", el);
    const elID = el.getAttribute("data-id");
    if (elID === null) {
      console.error(
        "Wasn't able to set data-style-* of element, as it lacked the data-id-* attribute",
      );
      return;
    }

    const handleAttribute = (attributeName: string) => {
      if (!attributeName.startsWith("data-style-")) return;

      const pseudoClass = attributeName.slice("data-style-".length);
      const key = `${elID}_${pseudoClass}`;
      const value = el.getAttribute(attributeName);
      if (value !== null) {
        const rule = `[data-id="${elID}"]:${pseudoClass} { ${value} }`;
        dataStyles.setRule(rule, key);
      } else {
        dataStyles.removeRule(key);
      }
    };

    if (modifiedAttribute) {
      handleAttribute(modifiedAttribute);
    } else {
      Array.from(el.attributes).forEach((attr) => handleAttribute(attr.name));
    }
  }

  type StyleCacheValue = [k: string, v: string][];

  export class StyleCache {
    // private cache: WeakMap<Element, Map<string, StyleCacheValue>> = $state(new WeakMap());
    private cache: WeakMap<Element, Map<string, StyleCacheValue>> =
      new WeakMap();

    set(el: Element, styleType: string, value: StyleCacheValue) {
      let inner = this.cache.get(el);
      if (!inner) {
        inner = new Map();
        this.cache.set(el, inner);
      }
      inner.set(styleType, value);
    }

    get(el: Element, styleType: string) {
      return this.cache.get(el)?.get(styleType);
    }

    has(el: Element, styleType: string) {
      return Boolean(this.cache.get(el)?.has(styleType));
    }

    remove(el: Element, styleType: string) {
      let inner = this.cache.get(el);
      if (!inner) {
        console.error(
          "Tried removing entry from StyleCache that did not exist; element has no top-level entry",
          el,
        );
        return;
      }
      const existed = inner.delete(styleType);
      if (!existed)
        console.error(
          `Tried removing entry from StyleCache that did not exist; element did not have an entry of styleType "${styleType}"`,
          el,
        );
    }
  }

  export function attrNameToStatesToForce(
    attrName: string,
  ): ReadonlySet<string> {
    if (!attrName.startsWith("data-style-")) return new Set();
    return new Set([attrName.slice("data-style-".length)]);
  }

  export function getElStyleAttrs(el: Element) {
    type ReturnRecord = {
      statesToForce: ReadonlySet<string>;
      inlineStyleAttribute: string;
    };
    const final: ReturnRecord[] = [];

    Array.from(el.attributes).forEach((attr) => {
      if (attr.name === "style") {
        final.push({
          statesToForce: new Set(),
          inlineStyleAttribute: "style",
        });
      } else if (attr.name.startsWith("data-style-")) {
        final.push({
          statesToForce: attrNameToStatesToForce(attr.name),
          inlineStyleAttribute: attr.name,
        });
      }
    });

    return final;
  }
</script>

<script lang="ts">
  import { setContext } from "svelte";
  import CaretRighticon from "phosphor-svelte/lib/CaretRightIcon";
  import CaretDownicon from "phosphor-svelte/lib/CaretDownIcon";

  import { selection } from "../../store.svelte";
  import { editorState } from "../../url.svelte";
  import CSSEditor, { type ICSSEditor } from "./CSSEditor.svelte";
  import { type Attribute } from "../attributes/AttributesEditor.svelte";
  import AddPseudoClassForm from "./AddPseudoClassForm.svelte";
  import MDNPseudoLinks from "./mdn_pseudo_links.json";
  import type { DynamicStylesheet } from "../../helper";

  interface Props {
    currentAttrs: Attribute[];
  }
  let { currentAttrs }: Props = $props();

  let selectionHasComponents = $derived(
    editorState.mode === "document" &&
      selection.main.some((el) => el.getAttribute("data-component")),
  );

  const cssEditors: ICSSEditor[] = $state([]);
  let pseudoStylesList = $derived(
    currentAttrs
      .filter((attr) => attr.name.startsWith("data-style-"))
      .map((attr) => {
        return {
          name: attr.name.slice("data-style-".length),
          value: attr.value,
        };
      }),
  );

  const styleCache = new StyleCache();
  setContext("styleCache", styleCache);

  export function syncElementInlineStyles(nodes: Node[]) {
    cssEditors.forEach(
      (cssEditor) => cssEditor && cssEditor.syncElementInlineStyles(nodes),
    );
  }

  let pseudoStylesListOpen = $state(false);
</script>

<CSSEditor
  syncAttrName="style"
  selected={selection.main}
  bind:this={cssEditors[0]}
/>

<br />

<button
  class="mt-4 text-lg text-rock-700 flex items-center justify-start hover:text-rock-600"
  onclick={() => (pseudoStylesListOpen = !pseudoStylesListOpen)}
>
  Styles by pseudo-class
  {#if pseudoStylesListOpen}
    <CaretDownicon class="ml-1 inline text-xl" />
  {:else}
    <CaretRighticon class="ml-1 inline text-xl" />
  {/if}
</button>

{#if pseudoStylesListOpen}
  {#each pseudoStylesList as attr, i}
    <div class="mb-3">
      <div
        class="font-mono text-lg text-rock-700 flex items-center justify-center"
      >
        {let referenceURL = MDNPseudoLinks.find(
          (item) => item.name === attr.name,
        )?.url}
        {attr.name}
        <!-- <button class="text-red-700 ml-1.5 mb-0.5"><XCircleIcon /></button> -->
        <a
          class="text-xl inline-flex items-center justify-center hover:opacity-60"
          href={referenceURL}
          target="_blank"
          aria-label="Open MDN docs"
        >
          <ion-icon name="help-circle-outline"></ion-icon>
        </a>
        <button
          type="button"
          class="text-xl text-red-700 inline-flex items-center justify-center hover:opacity-60"
          onclick={() => {
            const attrToRemove = `data-style-${attr.name}`;
            // console.log("REMOVING PSEUDO CLASS ATTRIBUTE.\nselection.main:", selection.main, "\nattrToRemove:", attrToRemove);
            selection.main.forEach((el) => {
              el.removeAttribute(attrToRemove);
              styleCache.remove(el, attrToRemove);
            });
          }}
          aria-label="Remove pseudo class styles"
          ><ion-icon name="close-circle-outline"></ion-icon></button
        >
      </div>
      <CSSEditor
        syncAttrName={`data-style-${attr.name}`}
        selected={selection.main}
        bind:this={cssEditors[i + 1]}
      />
    </div>

    {#if i < pseudoStylesList.length - 1}
      <div class="h-px w-full bg-rock-300 text-center"></div>
    {/if}
  {:else}
    <div class="text-xl text-rock-600 italic mt-3">
      No explicit pseudo-class styles yet.
    </div>
  {/each}
  {let showAddForm = $state(false)}
  {#if !showAddForm}
    <div class="h-px w-full bg-rock-300 text-center mt-6">
      <button
        class="inline-block bg-background text-rock-400 text-xl -translate-y-1/2 px-2 hover:text-rock-200"
        onclick={() => (showAddForm = true)}>+</button
      >
    </div>
  {:else}
    <div class="h-px w-full bg-rock-300 text-center"></div>
    <AddPseudoClassForm
      extraValidation={(value) =>
        pseudoStylesList.every((item) => item.name !== value)}
      onGoBack={() => (showAddForm = false)}
    />
  {/if}
{/if}
