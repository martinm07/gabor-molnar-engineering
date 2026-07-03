<script lang="ts">
  import FilePlusIcon from "phosphor-svelte/lib/FilePlusIcon";
  import ArrowRightIcon from "phosphor-svelte/lib/ArrowRightIcon";
  import XCircleIcon from "phosphor-svelte/lib/XCircleIcon";
  import XIcon from "phosphor-svelte/lib/XIcon";
  import { prefixBytesVal, xhr_ } from "/shared/helper";

  let files: FileList | null = $state(null);
  // let file: File | null = $derived(files ? files[0] : null);

  class FileState {
    status: "idle" | "uploading" | "failed" | "success" = $state("idle");
    errMsg: string = $state("");
    progress: string = $state("");
    file: File | null = $derived(files ? files[0] : null);
  }
  const fileState = new FileState();

  let title = $state("");

  function onSubmit(e: SubmitEvent) {
    console.log("SUBMITTED");
    e.preventDefault();

    const formData = new FormData();
    if (fileState.file) formData.append("file", fileState.file);
    formData.set("title", title);

    fileState.status = "uploading";
    const { xhr, promise } = xhr_("/documents/add_media_file", {
      method: "POST",
      body: formData,
      onUploadProgress: (e) => {
        if (e.lengthComputable) {
          const progressVal = (e.loaded / e.total) * 100;
          fileState.progress = progressVal.toPrecision(3);
        } else {
          fileState.progress = "";
        }
      },
    });

    promise
      .then((resp) => {
        if (resp.status < 200 || resp.status >= 300) {
          console.error(`Upload failed: ${resp.status} "${resp.responseText}"`);
          fileState.status = "failed";
          fileState.errMsg = resp.responseText;
        } else {
          fileState.status = "success";
        }
      })
      .catch(() => (fileState.status = "failed"));

    return () => xhr.abort();
  }

  // fileState.status = "error";
  // fileState.errMsg = "File had an invalid extension.";
</script>

<div class="flex mb-4">
  <div class="ml-auto mr-6">
    <button
      class="flex items-center text-xl px-3 py-1 border-2 border-steel-300 rounded text-steel-700 bg-background hover:bg-steel-100 active:bg-steel-200 active:translate-y-1 active:ring-4 ring-steel-100 active:text-steel-800"
      command="show-modal"
      commandfor="new-guidance-document"
      {@attach (node) => {
        node.click();
      }}
      ><FilePlusIcon weight="fill" class="mr-1 text-3xl text-green-700" /> New Guidance
      Document</button
    >
  </div>
</div>

<dialog
  id="new-guidance-document"
  class="bg-red m-auto w-4/5 h-4/5 rounded fixed hidden open:flex flex-col"
>
  <button
    command="close"
    commandfor="new-guidance-document"
    class="absolute top-4 right-4"
    ><XIcon
      class="text-4xl text-rock-700 hover:rotate-90 transition-transform"
    /></button
  >
  <form class="m-auto w-4/5" onsubmit={(e) => onSubmit(e)}>
    <h2
      class="text-4xl font-serif text-center mb-12 text-rock-600 underline decoration-dotted underline-offset-4"
    >
      Create New Guidance Document
    </h2>
    <div class="flex items-center">
      <label for="add-title" class="text-2xl text-rock-700 mr-2">Title:</label>
      <input
        id="add-title"
        type="text"
        class="grow border-2 rounded border-rock-300 text-xl py-2 px-4 outline-none focus:ring-4 ring-steel-100 text-rock-700 bg-rock-50 focus:bg-white"
        placeholder="Title of New Guidance Document"
        bind:value={title}
      />
    </div>
    <div class="italic text-rock-600 p-4 max-w-1/2">
      Note that the title of guidance documents should be unique, and that they
      should rarely be changed, as links to guidance documents are based on
      titles.
    </div>
    <div class="flex items-center mt-5">
      <label for="add-import-upload" class="text-2xl text-rock-700 mr-4"
        >Import Document:</label
      >
      <input
        class="w-28 text-white file:w-28 file:rounded-full file:bg-rock-50 file:py-1 file:text-rock-600 file:font-semibold file:text-lg file:font-mono file:border-2 file:border-rock-300 hover:file:bg-rock-200 hover:file:text-rock-800 file:cursor-pointer disabled:opacity-50 disabled:pointer-events-none mr-4"
        bind:files
        id="add-import-upload"
        name="add-import-upload"
        multiple
        type="file"
        disabled={fileState.status === "uploading"}
      />
      <!-- {#if fileState.status === "failed"}
        <div aria-live="polite" class="text-red-700 font-bold ml-4 text-lg">
          {fileState.errMsg}
        </div>
      {/if} -->

      {#if fileState.file}
        <span
          class="mr-1 text-rock-700 font-mono bg-rock-50 p-1 rounded-lg"
          class:hidden={fileState.errMsg}>{fileState.file.name}</span
        >
        {#if fileState.status === "idle"}
          <span class="text-rock-600"
            >({prefixBytesVal(fileState.file.size)})</span
          >
          <button
            class="ml-2 text-lg text-steel-600 hover:text-steel-500"
            type="button"
            onclick={() => {
              fileState.file = null;
            }}><XCircleIcon class="text-2xl" /></button
          >
        {:else if fileState.status === "uploading"}
          <span class="not-italic text-rock-700"
            >({fileState.progress
              ? fileState.progress + "%"
              : "uploading..."})</span
          >
        {:else if fileState.status === "failed"}
          {#if fileState.errMsg}
            <span class="w-full" aria-hidden="true"></span>
            <span class="text-red-700 mb-2 -mt-0.5">“{fileState.errMsg}”</span>
          {:else}
            <span class="error not-italic text-red-700">failed</span>
          {/if}
        {:else if fileState.status === "success"}
          <span class="text-green-700">(done)</span>
        {/if}
      {/if}
    </div>
    <div class="italic text-rock-600 p-4 max-w-1/2">
      Extracts the content and document structure, from a <a
        target="_blank"
        class="underline hover:no-underline text-rock-700"
        href="https://pandoc.org/MANUAL.html#general-options"
        >variety of file formats</a
      >.<br />
      Don't upload anything for a blank document.
    </div>
    <div class="mt-5 flex items-center justify-center">
      <button
        class="text-xl font-mono border-2 border-steel-200 bg-steel-50 px-4 py-2 rounded-lg text-steel-800 hover:bg-steel-100 active:translate-y-1 active:bg-steel-200 focus:ring-4 ring-steel-100"
        >Create<ArrowRightIcon class="inline-block ml-2 text-2xl" /></button
      >
    </div>
  </form>
</dialog>
