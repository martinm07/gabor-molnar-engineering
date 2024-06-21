<script lang="ts">
  import { fetch_ } from "/shared/helper";

  const tags = fetch_("documents/get_tagnames").then((resp) => resp.json());
</script>

<h1 class="text-3xl text-stone-600 font-sans p-8 pt-14 font-bold">
  View documents of a specific tag
</h1>
<div>
  {#await tags}
    loading
  {:then tags}
    {#each tags as tag}
      <button type="button">{tag}</button>
    {/each}
  {:catch}
    Something went wrong. Please try again later
  {/await}
</div>
