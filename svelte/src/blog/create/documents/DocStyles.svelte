<script module lang="ts">
  export interface IDocStyles {
    informStyleUpdate: (mutations: TempMutationRecord[]) => void;
  }
</script>

<script lang="ts">
  import { watch } from "runed";

  import { doc } from "../store.svelte";
  import { type TempMutationRecord } from "./docsyncing";
  import { type SaveDoc } from "./docsaving.svelte";

  interface Props {
    docSaver: SaveDoc;
  }
  let { docSaver }: Props = $props();

  export function informStyleUpdate(mutations: TempMutationRecord[]) {
    for (const mutation of mutations) {
      if (mutation.type === "attributes") continue;

      const target =
        mutation.type === "childList"
          ? (mutation.addedNode ?? mutation.target)
          : mutation.target;

      const parentEl = !(target instanceof Element)
        ? target.parentElement
        : target;

      if (!parentEl?.classList.contains("doc-styles")) continue;

      doc.styles = parentEl.textContent;
    }
  }

  // Server sync
  watch(
    () => doc.styles,
    (curr, prev) => {
      if (curr !== prev) {
        docSaver.syncDocStylesDebounce(curr);
      }
    },
  );
</script>

<pre class="doc-styles history-not-body">{doc.styles}</pre>

<style>
  .doc-styles {
    background: lightgoldenrodyellow;
  }
</style>
