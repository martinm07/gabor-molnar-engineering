<script lang="ts">
  import type { TypesenseHit } from "/shared/types";

  interface Props {
    info: TypesenseHit;
  }

  let { info }: Props = $props();

  function snipText(text: string, cutoff: number = 30) {
    if (text.split(" ").length <= cutoff) return text;
    return text.slice(0, cutoff).trimEnd() + " [...]";
  }
  function processSnippet(snippet: string, fullField: string) {
    if (!snippet) return snippet;
    const snippetRaw = snippet.replace(/(<mark>)|(<\/mark>)/g, "");
    if (snippetRaw === fullField) return snippet;
    return "[...] " + snippet.trim() + " [...]";
  }

  const matchSnippet =
    processSnippet(
      info.highlight.description?.snippet,
      info.document.description,
    ) ??
    processSnippet(info.highlight.body?.snippet, info.document.body) ??
    snipText(info.document.description);
</script>

<a
  href="/read/article"
  class="search-result border-b-2 last-of-type:border-b-0 border-rock-400 p-3 relative group hover:bg-rock-100 block"
>
  <h3 class="font-serif text-xl text-rock-700">
    {@html info.highlight.title?.snippet ?? info.document.title}
  </h3>
  <ul class="mb-3">
    {#each (info.highlight.tags)?.map((el: any) => el.snippet) ?? info.document.tags as tagName}
      <li
        class="inline-block w-fit px-1 border-2 border-rock-300 rounded text-xs font-bold mx-1 text-rock-500"
      >
        {@html tagName}
      </li>
    {/each}
  </ul>
  <p class="px-3 text-stone-600 text-center pb-5">
    {@html matchSnippet}
  </p>
  <div
    style="--accent: rgb({info.document.accent});"
    class="absolute bottom-1 right-3 font-bold underline group-hover:no-underline text-stone-500"
  >
    Read document
  </div>
</a>

<style>
  :global(.search-result mark) {
    background-color: var(--rock-100);
    color: inherit;
  }
  :global(.search-result:hover mark) {
    background-color: var(--rock-200);
  }
</style>
