<script module lang="ts">
  export const dClassDocMetaEdit =
    "absolute w-[96%] left-[2%] h-[calc(100vh-4rem)] bg-white z-10 top-12 border-2 border-t-0 rounded-b-lg border-rock-300 overflow-y-scroll shadow-[0_30px_5px_20px_var(--background-50)]"; //t
</script>

<script lang="ts">
  import { watch } from "runed";
  import {
    allDocumentTags,
    autocompleteSuggestions,
    doc,
  } from "../store.svelte";
  import FitContentWrapTextarea from "/shared/components/FitContentWrapTextarea.svelte";
  import { TagsEditor } from "../components/ComponentMetaEdit.svelte";
  import { fetch_ } from "/shared/helper";
  import { deepEqual } from "../helper";

  function validateTitle(title: string) {
    if (title.length === 0) return "Title required";
    if (title.length > 128) return "Title should be less then 129 characters";
    return null;
  }

  function validateDescription(description: string) {
    return null;
  }

  let tagsEditorEl: HTMLElement | null = $state(null);
  let didEditorSync: boolean = false;
  const tagsEditor = new TagsEditor(
    (index, tags) => {
      const tag = tags[index];
      let msg = "";

      if (tags.slice(0, index).includes(tag)) msg = "Added already";

      if (!allDocumentTags.some((existingTag) => existingTag.name === tag))
        msg = "Nonexistent tag";

      if (tag.length === 0) msg = "Missing tag";

      const exists = msg === "";
      return [exists, msg !== "", msg];
    },
    (tags) => {
      doc.info.tags = tags;
      didEditorSync = true;
      setTimeout(() => (didEditorSync = false));
    },
    ["+"],
  );

  watch(
    () => doc.info.tags,
    (curr, prev) => {
      if (didEditorSync) {
        console.log("SKIPPED");
        didEditorSync = false;
        return;
      }
      if (!deepEqual(curr, prev) && tagsEditorEl)
        tagsEditor.setTags(curr, tagsEditorEl);
    },
  );

  function handleTagsAutocomplete() {
    const caret = getSelection();
    if (!caret || !caret.focusNode) return;
    const node = caret.focusNode;
    if (
      (node instanceof HTMLElement &&
        node.closest("#edit-tags-doc span:not(.space)")) ||
      node.parentElement?.closest("#edit-tags-doc span:not(.space)")
    ) {
      $autocompleteSuggestions = allDocumentTags
        .map(({ name }) => name)
        .filter((name) => node.textContent && name.startsWith(node.textContent))
        .toSorted((a, b) => a.length - b.length);
    } else {
      $autocompleteSuggestions = [];
    }
  }

  let confirmPublish = $state(false);
  let publishResp: Promise<Response> | null = $state(null);
  let disablePublishBtn = $state(false);

  async function publishChanges() {
    console.log("PUBLISHING CHANGES.");
    disablePublishBtn = true;
    publishResp = fetch_("/documents/publish_development_document", {
      method: "post",
      body: JSON.stringify({
        id: doc.info.id,
      }),
    });
    publishResp.finally(() => (disablePublishBtn = false));
  }
</script>

<svelte:document
  onselectionchange={() => {
    if (!tagsEditorEl) return;
    tagsEditor.onSelectionChange(tagsEditorEl);
  }}
/>

<div class="my-4 text-xl text-rock-800 italic text-center">
  View/Edit the document's metadata
</div>

<div>
  <div class="flex items-stretch text-lg px-4 max-w-5xl mx-auto">
    <label for="edit-title" class="text-rock-700 flex items-center text-2xl"
      >Title:</label
    >
    <div class="relative grow mx-3">
      <input
        class="px-3 py-1.5 border-b-2 border-rock-300 font-mono rounded bg-background w-full text-rock-600 inset-shadow-none inset-shadow-rock-200 outline-none focus:bg-white focus:ring-4 ring-steel-200 [.error]:border-red-300 [.error]:focus:ring-red-200"
        class:error={validateTitle(doc.info.title)}
        type="text"
        name="edit-title"
        id="edit-title"
        placeholder="Guidance Document Title"
        spellcheck="true"
        bind:value={doc.info.title}
      />
      {#if validateTitle(doc.info.title)}
        <div
          class="absolute text-red-400 font-bold text-sm bottom-2 translate-y-full ml-3"
        >
          <span class="bg-white px-1">{validateTitle(doc.info.title)}</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="flex items-stretch px-4 max-w-3xl mx-auto mt-12">
    <label
      for="edit-description"
      class="text-rock-700 flex items-center text-2xl">Description:</label
    >
    <div class="relative grow mx-3 flex">
      <FitContentWrapTextarea
        class="{validateDescription(doc.info.description)
          ? 'error'
          : ''} box-content grow px-3 py-1.5 border-b-2 border-rock-300 font-mono rounded bg-background w-full text-rock-600 inset-shadow-none inset-shadow-rock-200 outline-none focus:bg-white focus:ring-4 ring-steel-200 [.error]:border-red-300 [.error]:focus:ring-red-200 resize-none"
        dontModifyWidth
        name="edit-description"
        id="edit-description"
        placeholder="Brief description of guidance document."
        bind:value={doc.info.description}
      />
      {#if validateDescription(doc.info.description)}
        <div
          class="absolute text-red-400 font-bold text-sm bottom-2 translate-y-full ml-3"
        >
          <span class="bg-white px-1"
            >{validateDescription(doc.info.description)}</span
          >
        </div>
      {/if}
    </div>
  </div>

  <div class="flex px-4 mt-5 max-w-3xl mx-auto">
    <label
      for="edit-tags-doc"
      class="text-rock-700 text-2xl flex items-center"
      id="edit-tags-doc-label">Tags:</label
    >
    <div
      role="application"
      aria-labelledby="edit-tags-doc-label"
      spellcheck="false"
      contenteditable="true"
      id="edit-tags-doc"
      bind:this={tagsEditorEl}
      oninput={(e) => {
        if (tagsEditorEl) {
          tagsEditor.onInput(tagsEditorEl);
          handleTagsAutocomplete();
        }
      }}
      onkeydown={(e) => tagsEditor.onKeydown(e)}
      class="mx-3 text-rock-600 font-mono outline-none flex flex-wrap min-w-60 relative"
    ></div>
  </div>
</div>
<div class="text-base italic text-rock-500 max-w-3xl mx-auto pl-8 mt-1">
  Press "+" while editing to add new tags. <a
    class="underline text-steel-600 text-lg ml-1 hover:no-underline"
    href="/documents/tags"
    target="_blank">Manage tags</a
  >
</div>

<div class="flex px-4 mt-5 max-w-3xl mx-auto">
  <label class="text-rock-700 text-2xl flex items-center mr-3" for="edit-accent"
    >Accent:</label
  >
  <input
    bind:value={doc.info.accent}
    class="rounded border-rock-300 border-2 p-1 bg-background"
    id="edit-accent"
    type="color"
  />
</div>

<div class="flex px-4 mt-7 max-w-3xl mx-auto">
  <label
    class="text-rock-700 text-2xl flex items-center mr-3"
    for="edit-thumbnail">Thumbnail:</label
  >
  <textarea
    class="border-2 border-rock-300 rounded grow h-28 p-1 bg-background focus:bg-white outline-none focus:ring-4 ring-steel-200 text-rock-600 font-mono"
    name="edit-thumbnail"
    id="edit-thumbnail"
    bind:value={doc.info.thumbnail}></textarea>
</div>

<div class="flex px-4 mt-5 max-w-3xl mx-auto">
  <label class="text-rock-700 text-2xl flex items-center mr-3" for="edit-status"
    >Status:</label
  >
  <select
    class="text-lg text-rock-600 font-mono bg-background border-b-2 rounded border-rock-300 px-4 py-2 focus:ring-4 ring-steel-200 font-bold"
    id="edit-status"
    bind:value={doc.info.status}
  >
    <option value="private">Private</option>
    <option value="unlisted">Unlisted</option>
    <option value="public">Public</option>
    <option value="featured">Featured</option>
  </select>
</div>

<div class="flex items-center flex-col mt-18">
  {#if confirmPublish}
    <div
      class="bg-yellow-100 text-yellow-700 text-lg p-2 rounded max-w-1/2 mb-4"
    >
      Please note; this makes ALL changes made to the document PUBLIC, and that
      <br />THIS ACTION CANNOT BE UNDONE. <br />Click "Publish Changes" again if
      you wish to proceed.
    </div>
  {/if}
  <button
    class="text-xl border-2 border-steel-300 text-steel-600 px-4 py-1 rounded bg-steel-50 hover:bg-white hover:ring-4 ring-steel-100 font-bold active:translate-y-1 active:bg-steel-100 disabled:opacity-50 disabled:pointer-events-none"
    type="button"
    onclick={() =>
      !confirmPublish ? (confirmPublish = true) : publishChanges()}
    disabled={disablePublishBtn}>Publish Changes</button
  >
  {#if publishResp}
    {#await publishResp}
      <div class="italic text-rock-700">Processing...</div>
    {:then resp}
      {#if resp.ok}
        <div class="text-green-700 font-bold">Success!</div>
      {:else}
        {let respText = $state("")}
        {const _ = resp.text().then((text) => (respText = text))}
        <div class="text-red-700 font-bold">
          ({resp.status}) Something went wrong. Message:<br /><span
            class="font-normal">{respText}</span
          >
        </div>
      {/if}
    {:catch}
      <div class="text-red-700 font-bold">Something went wrong.</div>
    {/await}
  {/if}
</div>

<style>
  @reference "/shared/tailwindinit.css";

  :global {
    #edit-tags-doc span.space {
      @apply text-2xl;
    }
    #edit-tags-doc span:not(.space) {
      @apply rounded border-2 border-rock-300 p-0.5 bg-background my-2 block;
    }
    #edit-tags-doc span.new {
      @apply border-dashed;
    }
    #edit-tags-doc span.error {
      @apply border-red-300;
    }
    #edit-tags-doc span.error::before {
      @apply absolute text-sm text-red-400 inline-block translate-y-[calc(100%+(--spacing(1)))] text-nowrap font-sans font-bold not-italic bg-white;
      content: var(--errormsg);
    }
    #edit-tags-doc:focus span.focused {
      @apply ring-4 ring-steel-200 bg-white;
    }

    /* Make the "placeholder" for when there are no tags (the field is empty) */

    #edit-tags-doc span.error[style*="Missing tag"]:only-child {
      @apply opacity-0;
    }
    #edit-tags-doc:has(span.error[style*="Missing tag"]:only-child)::before {
      content: "Tag Guidance Document";
      @apply absolute rounded border-b-2 border-rock-300 p-0.5 bg-background my-2 -z-10 text-nowrap text-rock-600/50;
    }
    #edit-tags-doc:focus::before {
      @apply ring-4 ring-steel-200 bg-white!;
    }
    /*#edit-tags span.error:only-child {
      display: none:
    }*/
  }
</style>
