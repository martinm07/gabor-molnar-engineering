<script module lang="ts">
  import UploadIcon from "phosphor-svelte/lib/UploadIcon";
  import XIcon from "phosphor-svelte/lib/XIcon";
  import XCircleIcon from "phosphor-svelte/lib/XCircleIcon";
  import ArrowCounterClockwiseIcon from "phosphor-svelte/lib/ArrowCounterClockwiseIcon";
  import { xhr_ } from "/shared/helper";
  import { watch } from "runed";
  import { doc, fileStates } from "./store.svelte";

  export const dClassMediaTray =
    "absolute w-[60%] xl:w-[35%] right-[2%] h-[calc(50vh-4rem)] bg-white z-10 top-12 border-2 border-t-0 rounded-b-lg border-rock-300 flex flex-col"; //t
</script>

<script lang="ts">
  const MAX_CONCURRENT_UPLOADS = 4;

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

  const bytePrefixMap = new Map([
    [1, "bytes"],
    [1_000, "KB"],
    [1_000_000, "MB"],
    [1_000_000_000, "GB"],
  ]);
  function prefixBytesVal(bytes: number) {
    let bestVal: number = bytes;
    let bestPrefix: string = "bytes";
    bytePrefixMap.forEach((prefixStr, key) => {
      const val = bytes / key;
      if (val > 1 && val < bestVal) {
        bestVal = val;
        bestPrefix = prefixStr;
      }
    });

    return bestVal.toPrecision(3) + " " + bestPrefix;
  }

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

    // TODO: Refresh the list
  }
</script>

<div class="grow bg-background overflow-y-scroll"></div>
<form
  class="border-t-2 border-rock-200 py-3 bg-white max-h-10/12 overflow-y-scroll"
  onsubmit={(e) => (cancelUpload = onSubmit(e))}
>
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
          <p class="italic flex items-center justify-center flex-wrap my-2">
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
              <span class="text-rock-700">(done)</span>
            {/if}
          </p>
        {/if}
      {/each}
    </div>
  {/if}
</form>
