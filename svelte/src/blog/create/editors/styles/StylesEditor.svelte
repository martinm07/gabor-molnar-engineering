<script lang="ts">
    import { watch } from "runed";
  import { doc } from "../../store.svelte";
  import CSSEditor from "../css/CSSEditor.svelte";
  import FitContentInput from "/shared/components/FitContentInput.svelte";

  function parseStyles(styleStr: string) {}

  // const
  const stylesheeet = new CSSStyleSheet();

  interface ProcessedRule {
    selector: string;
    rules: string;
  }
  const processed: ProcessedRule[] = $state([]);

  watch(() => doc.styles, () => {
    stylesheeet.replaceSync(doc.styles);
    for (let i = 0; i < stylesheeet.cssRules.length; i++) {
      const rule = stylesheeet.cssRules[i];
      rule
    }
  });
  // stylesheeet.cssRules
</script>

<div class="flex flex-col items-center">
  <FitContentInput
    type="text"
    class="bg-steel-100 px-1.5 py-1 rounded font-mono text-steel-800 box-content"
    placeholder="CSS rule selector"
  />
  <!-- <CSSEditor /> -->
</div>
