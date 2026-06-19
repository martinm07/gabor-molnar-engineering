<script lang="ts">
  import { fly } from "svelte/transition";
  import { compLibEdits } from "../store.svelte";
  import { editorState } from "../url.svelte";
  import { saveLibChanges, discardLibChanges } from "./component.svelte";
  import { tada } from "/shared/helper";
  import TrashIcon from "phosphor-svelte/lib/TrashIcon";

  let showFullModal = $state(false);
  let btnTempDisabled = $state(false);
  const BTN_TEMP_DISABLED_TIMEOUT = 1000;

  let commitMsg: string = $state("");
  let commitDesc: string = $state("");

  let commitMsgError: string | null = $state(null);
  let commitMsgInput: HTMLInputElement | null = $state(null);
  let submitBtn: HTMLButtonElement | null = $state(null);
  function saveChangesSubmit(e?: Event) {
    if (e) e.preventDefault();
    if (!commitMsg) {
      commitMsgError = "Missing message";
      if (commitMsgInput) commitMsgInput.focus();
      return;
    }

    saveLibChanges(commitMsg, commitDesc, submitBtn);
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape") showFullModal = false;
  }}
/>

{#if showFullModal && editorState.mode === "component" && compLibEdits.current.length > 0}
  <div
    transition:fly={{ y: 48 }}
    class="fixed bottom-6 w-1/2 ml-[25%] h-[40%] bg-background border-2 rounded-lg border-rock-300"
  >
    <form
      class="overflow-y-auto w-full max-h-full px-3 pt-6 pb-20"
      method="post"
      onsubmit={(e) => saveChangesSubmit(e)}
    >
      <div class="flex items-center justify-center">
        <label for="lib-change-msg" class="text-lg text-rock-700 mr-2.5"
          >Message:</label
        >
        <div class="relative grow max-w-96">
          <input
            type="text"
            name="lib-change-msg"
            id="lib-change-msg"
            placeholder="Briefly describing intent of changes"
            class="border-2 rounded border-rock-300 w-full bg-white text-rock-800 px-3 py-1.5 outline-none focus:ring-4 ring-steel-200"
            bind:value={commitMsg}
            bind:this={commitMsgInput}
            oninput={() => {
              commitMsgError = null;
            }}
          />
          {#if commitMsgError !== null}
            <div
              class="absolute text-red-400 font-bold text-sm bottom-2 translate-y-full ml-3"
              in:tada={{ duration: 400 }}
            >
              <span class="bg-background px-1">{commitMsgError}</span>
            </div>
          {/if}
        </div>
      </div>
      <div class="flex items-center justify-center mt-6">
        <label for="lib-change-desc" class="text-lg text-rock-700 mr-2.5"
          >Description:</label
        >
        <textarea
          name="lib-change-desc"
          id="lib-change-desc"
          placeholder="More complete description of changes and their intents (Optional)"
          class="border-2 rounded border-rock-300 grow max-w-96 bg-white text-rock-800 px-3 py-1.5 outline-none focus:ring-4 ring-steel-200"
          bind:value={commitDesc}
        ></textarea>
      </div>
    </form>
    <button
      class="absolute top-2 right-2 text-3xl text-rock-700 hover:rotate-90 transition-transform flex items-center justify-center"
      aria-label="Close"
      onclick={() => (showFullModal = false)}
    >
      <ion-icon name="close"></ion-icon>
    </button>
  </div>
{/if}
{#if editorState.mode === "component" && compLibEdits.current.length > 0}
  <div
    transition:fly={{ y: 48 }}
    class="fixed bottom-6 ml-[50%] -translate-x-1/2 shadow-lg shadow-rock-300 rounded-md hover:-translate-y-1 hover:active:translate-y-0 transition-all duration-300 [.inmodal]:bottom-9 [.inmodal]:shadow-none"
    class:inmodal={showFullModal}
  >
    <button
      class="px-4 py-2 rounded-lg border-2 border-green-700 bg-green-500 text-white text-lg font-bold shadow-inner shadow-green-100 text-shadow-xs text-shadow-green-700 hover:bg-green-600 hover:active:bg-green-700 hover:active:cursor-default focus:ring-4 ring-green-700/30 disabled:opacity-40 disabled:pointer-events-none [.inmodal]:bg-green-50 [.inmodal]:text-green-600 [.inmodal]:text-shadow-none [.inmodal]:shadow-none [.inmodal]:hover:active:text-white transition-colors"
      type="button"
      class:inmodal={showFullModal}
      disabled={btnTempDisabled}
      onclick={() => {
        if (showFullModal) saveChangesSubmit();
        // if (showFullModal) showFullModal = false;
        else {
          showFullModal = true;
          btnTempDisabled = true;
          setTimeout(
            () => (btnTempDisabled = false),
            BTN_TEMP_DISABLED_TIMEOUT,
          );
        }
      }}>{showFullModal ? "Save changes" : "Finalise changes"}</button
    >
    {#if showFullModal}
      <button
        class="absolute -right-7 translate-x-full p-3 rounded-lg border-2 border-red-700 text-red-700 text-xl font-bold shadow-inner shadow-red-100 text-shadow-xs text-shadow-red-700 hover:bg-red-600 hover:text-red-50 hover:active:bg-red-700 hover:active:cursor-default focus:ring-4 ring-red-700/30 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        type="button"
        disabled={btnTempDisabled}
        onclick={() => {
          discardLibChanges();
        }}
      >
        <TrashIcon />
      </button>
    {/if}
  </div>
{/if}
