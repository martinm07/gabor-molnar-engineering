<script context="module" lang="ts">
  export interface Doc {
    id: string;
    title: string;
    description: string;
    body: string;
  }

  const stringify = (item: any) => JSON.stringify(item)?.replace(",", "");
  export function storageListAdd(item: any, key: string) {
    const current = window.localStorage.getItem(key);
    if (!current) window.localStorage.setItem(key, stringify(item));
    else window.localStorage.setItem(key, current + "," + stringify(item));
  }
  export function storageListRemove(item: any, key: string) {
    const current = window.localStorage.getItem(key);
    if (!current) return;
    window.localStorage.setItem(
      key,
      current
        .split(",")
        .filter((el) => el !== stringify(item))
        .join(","),
    );
  }
  export function storageListCheck(item: any, key: string) {
    const data = window.localStorage.getItem(key);
    if (!data) return false;
    return data.split(",").find((el) => el === stringify(item)) ? true : false;
  }
</script>

<script lang="ts">
  import { setContext } from "svelte";

  import CommentButton from "./CommentButton.svelte";
  import HeartButton from "./HeartButton.svelte";
  import LibraryButton from "./LibraryButton.svelte";
  import { fetch_ } from "/shared/helper";
  import "/shared/tailwindinit.css";

  let doc = $state({
    id: globalThis.blogreadID,
    title: globalThis.blogreadTitle,
    description: globalThis.blogreadDesc,
    body: globalThis.blogreadBody,
  });
  if (!globalThis.jinjaParsed) {
    const search = new URLSearchParams(window.location.search);
    const id = search.get("id") ?? 1;
    fetch_(`/documents/get?id=${id}`)
      .then((resp) => resp.json())
      .then(({ id, title, description, body }) => {
        document.title = title;
        doc = {
          id,
          title,
          description,
          body,
        };
      });
  }

  const bButtonclass =
    "relative px-4 py-1 border-2 border-rock-600 rounded inline-flex items-center bg-steel-50 text-rock-600 font-bold font-source hover:bg-steel-100 active:bg-steel-200 active:text-rock-700 focus:ring-4 ring-rock-100 text-nowrap";
  setContext("bbuttonClasses", bButtonclass);
</script>

{#if doc.title}
  <div
    class="absolute top-0 right-0 w-3/4 h-96 bg-rock-200 bg-opacity-50 -z-10"
    style="clip-path: polygon(100% 0, 0 0, 100% 100%);"
  ></div>
  <h1 class="font-bold font-serif text-4xl text-center p-6 text-rock-700 pt-8">
    {doc.title}
  </h1>
  {#if doc.description}
    <p
      class="font-source text-center text-rock-700 text-xl w-3/4 ml-[12.5%] text-balance mb-10"
    >
      {doc.description}
    </p>
  {/if}
{/if}

<div class="flex justify-center">
  <div
    class="w-5/6 md:w-3/4 text-text font-source text-lg leading-relaxed max-w-[700px]"
  >
    {@html doc.body}
  </div>
</div>
<div
  class="bg-rock-50 mt-20 p-5 border-t-2 border-rock-300 text-center relative"
>
  <div
    class="absolute h-full w-1/3 left-0 bottom-0 bg-rock-100"
    style="clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"
  ></div>
  <div
    class="absolute h-full w-1/6 right-0 bottom-0 bg-rock-100"
    style="clip-path: polygon(100% 0, 0% 100%, 100% 100%);"
  ></div>
  <LibraryButton {doc} />
  <HeartButton {doc} />
  <CommentButton {doc} />
</div>

<style>
  :global(body) {
    background-color: var(--background);
  }
</style>
