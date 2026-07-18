<script lang="ts" module>
  export interface IAllStyleEditors {
    syncElementInlineStyles: (nodes: Node[]) => void;
  }

  type StyleCacheValue = [k: string, v: string][];

  export class StyleCache {
    // private cache: WeakMap<Element, Map<string, StyleCacheValue>> = $state(new WeakMap());
    private cache: WeakMap<Element, Map<string, StyleCacheValue>> = new WeakMap();

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
  }
</script>

<script lang="ts">
  import { setContext } from "svelte";

  import { selection } from "../../store.svelte";
  import { editorState } from "../../url.svelte";
  import CSSEditor, { type ICSSEditor } from "./CSSEditor.svelte";

  let disabled = $derived(
    editorState.mode === "document" &&
      selection.main.some((el) => el.getAttribute("data-component")),
  );

  let cssEditors: ICSSEditor[] = $state([]);

  const styleCache = new StyleCache();
  setContext("styleCache", styleCache);

  export function syncElementInlineStyles(nodes: Node[]) {
    cssEditors.forEach((cssEditor) => cssEditor.syncElementInlineStyles(nodes));
  }
</script>

<CSSEditor syncAttrName="style" selected={selection.main} {disabled} bind:this={cssEditors[0]} />

<br />

Hello world
