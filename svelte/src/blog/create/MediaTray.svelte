<script module lang="ts">
  export const dClassMediaTray =
    "absolute w-[60%] xl:w-[35%] right-[2%] h-[calc(50vh-4rem)] bg-white z-10 top-12 border-2 border-t-0 rounded-b-lg border-rock-300 flex flex-col"; //t
</script>

<script lang="ts">
  import UploadIcon from "phosphor-svelte/lib/UploadIcon";
  import XIcon from "phosphor-svelte/lib/XIcon";
  import XCircleIcon from "phosphor-svelte/lib/XCircleIcon";
  import ArrowCounterClockwiseIcon from "phosphor-svelte/lib/ArrowCounterClockwiseIcon";
  import { fetch_, xhr_, prefixBytesVal } from "/shared/helper";
  import { watch } from "runed";
  import {
    doc,
    fetchedMediaFiles,
    fileStates,
    mediaFiles,
  } from "./store.svelte";
  import { untrack } from "svelte";
  import { fly } from "svelte/transition";

  const MAX_CONCURRENT_UPLOADS = 4;

  //////////////// HANDLING LIST

  function updateList() {
    console.log(doc.info.id);
    fetch_(`/documents/get_media_files?id=${doc.info.id}`)
      .then((resp) => resp.json())
      .then((data) => {
        mediaFiles.splice(0, mediaFiles.length, ...data);
        fetchedMediaFiles.yes = true;
      });
  }

  $effect(() => {
    if (fetchedMediaFiles.yes || !doc.infoFetched) return;
    untrack(() => updateList());
  });

  // $inspect(mediaFiles);

  async function saveToClipboard(filename: string) {
    try {
      let fpath: string;
      if (globalThis.jinjaParsed) {
        fpath = `/documents/media/${doc.info.id}/${filename}`;
      } else {
        fpath =
          import.meta.env.VITE_DEV_FLASK_SERVER +
          `/documents/media/${doc.info.id}/${filename}`;
      }

      navigator.clipboard.writeText(fpath);
      return "";
    } catch (error) {
      return (error as DOMException).message;
    }
  }

  async function removeMediaFile(filename: string) {
    try {
      const resp = await fetch_("/documents/remove_media_file", {
        method: "post",
        body: JSON.stringify({
          id: doc.info.id,
          path: filename,
        }),
      });
      if (resp.ok) {
        const fileIndex = mediaFiles.indexOf(filename);
        if (fileIndex !== -1) {
          mediaFiles.splice(fileIndex, 1);
        } else {
          console.error(
            `"filename" (${filename}) isn't in mediaFiles:`,
            mediaFiles,
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  //////////////// HANDLING UPLOAD

  let uploadErrMsg: string = $state("");
  let files: FileList | null = $state(null);
  watch(
    () => files,
    () => {
      if (!files) return;
      uploadErrMsg = "";
      fileStates.splice(0, fileStates.length);
      Array.from(files).forEach((file) => {
        fileStates.push({
          file,
          status: "idle",
          progress: "",
          errMessage: null,
        });
      });
    },
  );

  function onSubmit(e: SubmitEvent): () => void {
    e.preventDefault();
    console.log("SUBMITTED");
    if (!fileStates || fileStates.length === 0) {
      uploadErrMsg = "No files selected.";
      return () => undefined;
    }

    const uploadQueue: Function[] = [];
    const cancellables: XMLHttpRequest[] = [];
    let N = MAX_CONCURRENT_UPLOADS;

    for (const fileState of fileStates) {
      const formData = new FormData();
      formData.append("file", fileState.file);
      formData.set("id", doc.info.id);
      console.log(doc.info.id);

      uploadQueue.push(() => {
        if (N <= 0) {
          console.error("N is 0 or less");
          return;
        }
        N -= 1;

        fileState.status = "uploading";
        const { xhr, promise } = xhr_("/documents/add_media_file", {
          method: "POST",
          body: formData,
          onUploadProgress: (e) => {
            if (e.lengthComputable) {
              const progressVal = (e.loaded / e.total) * 100;
              fileState.progress = progressVal.toPrecision(3);

              // console.log(`${(e.loaded / e.total) * 100}%`);
            } else {
              fileState.progress = "";
            }
          },
        });

        promise
          .then((resp) => {
            if (resp.status < 200 || resp.status >= 300) {
              console.error(
                `Upload failed: ${resp.status} "${resp.responseText}"`,
              );
              fileState.status = "failed";
              fileState.errMessage = resp.responseText;
            } else {
              fileState.status = "completed";
            }
          })
          .catch(() => (fileState.status = "failed"))
          .finally(() => {
            N += 1;
          });

        cancellables.push(xhr);
      });

      fileState.status = "queued";
    }

    const uploadQueueInterval = setInterval(() => {
      if (N <= 0) return;
      if (uploadQueue.length === 0) {
        clearInterval(uploadQueueInterval);
        console.log("FINISHED ALL UPLOADS");
        return;
      }

      const nextUpload = uploadQueue.shift();
      nextUpload?.();
    });

    return () => {
      uploadQueue.splice(0, uploadQueue.length);
      clearInterval(uploadQueueInterval);
      cancellables.forEach((xhr) => xhr.abort());
    };
  }

  let cancelUpload: () => void = () => undefined;

  function refresh() {
    console.log("REFRESHED");
    fileStates.splice(0, fileStates.length);

    updateList();
  }
</script>

<div class="grow bg-background relative overflow-hidden">
  {let showPopup = $state(false)}
  {let showPopupTransition: NodeJS.Timeout | undefined}
  {let popupEl: HTMLElement | undefined}
  {let error: string = $state("")}
  <div class="overflow-y-scroll h-full py-4">
    {#each mediaFiles as filename, i}
      <div class="flex">
        <button
          class="block grow text-start text-rock-800 font-mono text-lg p-1.5 ml-5 mr-2 border-rock-200 hover:bg-rock-100 rounded transition-transform duration-75 active:scale-95 active:bg-rock-200 break-all"
          onclick={async () => {
            error = await saveToClipboard(filename);

            showPopup = true;
            clearTimeout(showPopupTransition);
            showPopupTransition = setTimeout(() => (showPopup = false), 3000);
            if (popupEl) {
              popupEl.animate(
                [
                  { transform: "scale(100%)" },
                  { transform: "scale(110%)" },
                  { transform: "scale(100%)" },
                ],
                {
                  duration: 250,
                  iterations: 1,
                },
              );
            }
          }}
        >
          {filename}
        </button>
        <button
          class="text-2xl mr-6 px-2 rounded hover:bg-rock-100 text-steel-700 active:bg-rock-200"
          onclick={() => removeMediaFile(filename)}><XCircleIcon /></button
        >
      </div>
      <div
        class="h-0.5 my-0.5 bg-rock-200 mx-6"
        class:hidden={i === mediaFiles.length - 1}
      ></div>
    {/each}
  </div>
  {#if showPopup}
    <div
      bind:this={popupEl}
      transition:fly={{ y: 50 }}
      class="absolute bottom-3 bg-steel-700 rounded-lg text-steel-50 px-4 py-1 text-lg font-bold pointer-events-none ml-[50%] -translate-x-1/2 [.error]:bg-red-700 [.error]:text-red-50"
      class:error
    >
      {#if !error}
        Copied path to clipboard!
      {:else}
        Error copying to clipboard:<br />
        {error}
      {/if}
    </div>
  {/if}
</div>
<form
  class="border-t-2 border-rock-200 bg-white max-h-10/12"
  onsubmit={(e) => (cancelUpload = onSubmit(e))}
>
  <div class="overflow-y-scroll h-full py-3">
    <div class="flex justify-center items-center">
      <!-- <label class="text-xl text-rock-700 mr-4" for="media-upload">Add media:</label
      > -->
      <input
        class="w-28 text-white file:w-28 file:rounded-full file:bg-steel-200 file:py-1 file:text-steel-700 file:font-semibold file:text-lg file:font-mono file:border-2 file:border-steel-300 hover:file:bg-steel-300 hover:file:text-steel-800 file:cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        bind:files
        id="media-upload"
        name="media-upload"
        multiple
        type="file"
        disabled={fileStates.some(
          ({ status }) => status === "queued" || status === "uploading",
        )}
      />
      {#if fileStates.every(({ status }) => status === "idle")}
        <button
          class="ml-4 text-steel-800 text-xl bg-steel-50 hover:bg-steel-100 hover:text-steel-900 border-2 border-steel-300 rounded-lg p-2 active:translate-y-1 active:bg-steel-200"
          type="submit"><UploadIcon /></button
        >
      {:else if fileStates.some(({ status }) => status === "queued" || status === "uploading")}
        <button
          class="ml-4 text-steel-800 text-xl bg-steel-50 hover:bg-steel-100 hover:text-steel-900 border-2 border-steel-300 rounded-lg p-2 active:translate-y-1 active:bg-steel-200"
          type="button"
          onclick={() => cancelUpload()}><XIcon /></button
        >
      {:else}
        <button
          class="ml-4 text-steel-800 text-xl bg-steel-50 hover:bg-steel-100 hover:text-steel-900 border-2 border-steel-300 rounded-lg p-2 active:translate-y-1 active:bg-steel-200"
          type="button"
          onclick={() => refresh()}><ArrowCounterClockwiseIcon /></button
        >
      {/if}
    </div>

    {#if uploadErrMsg}
      <div class="text-red-700 text-center mt-3">{uploadErrMsg}</div>
    {/if}
    {#if fileStates.length > 0}
      <div class="text-center text-rock-800 mt-3 text-base/4">
        {#each fileStates as { file, status, progress, errMessage }, i}
          {#if file}
            <p
              class="flex items-center justify-center flex-wrap my-2"
              class:italic={status !== "completed"}
            >
              <span class="mr-2">{file.name}</span>
              {#if status === "idle"}
                <span class="text-rock-600">({prefixBytesVal(file.size)})</span>
                <button
                  class="ml-2 text-lg text-steel-600 hover:text-steel-500"
                  type="button"
                  onclick={() => {
                    fileStates.splice(i, 1);
                  }}><XCircleIcon /></button
                >
              {:else if status === "queued"}
                <span class="not-italic text-rock-600">(queued)</span>
              {:else if status === "uploading"}
                <span class="not-italic text-rock-700"
                  >({progress ? progress + "%" : "uploading..."})</span
                >
              {:else if status === "failed"}
                <span class="error not-italic text-red-700">failed</span>
                {#if errMessage}
                  <span class="w-full" aria-hidden="true"></span>
                  <span class="text-red-700 mb-2 -mt-0.5">“{errMessage}”</span>
                {/if}
              {:else if status === "completed"}
                <span class="text-green-700">(done)</span>
              {/if}
            </p>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</form>
