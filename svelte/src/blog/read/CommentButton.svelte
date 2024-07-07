<script lang="ts">
  import { getContext } from "svelte";
  import { type Doc } from "./App.svelte";
  import { fetch_, preventDefault } from "/shared/helper";

  interface Props {
    doc: Doc;
  }
  let { doc }: Props = $props();

  let questionDialog: HTMLDialogElement;
  let submitPromise: Promise<any> | undefined = $state();
  let feedbackSent = $state(false);
  function questionSubmit() {
    submitPromise = fetch_("/documents/sendfeedback", {
      method: "POST",
      body: JSON.stringify({
        id: doc.id,
        comment: (<HTMLInputElement>document.querySelector("#comment"))?.value,
        email: (<HTMLInputElement>document.querySelector("#email"))?.value,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then(() => (feedbackSent = true));
  }

  const bbuttonClasses = getContext("bbuttonClasses");
</script>

<button
  onclick={() => questionDialog.showModal()}
  class="opendialog m-4 {bbuttonClasses}"
  ><ion-icon class="mr-4 text-lg" name="help"
  ></ion-icon>Comment/Question</button
>
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={questionDialog}
  onclick={() => questionDialog.close()}
  class="bg-background"
>
  <div
    class="w-full h-full p-4 pt-8 rounded border-2 border-rock-500"
    onclick={(e) => e.stopPropagation()}
    aria-hidden="true"
  >
    <button
      onclick={() => questionDialog.close()}
      class="text-2xl absolute top-2 left-2 text-rock-600"
      ><ion-icon name="close"></ion-icon></button
    >
    <div class="grid place-content-center">
      <p class="text-rock-700 max-w-96 text-balance">
        {#if submitPromise}
          {#await submitPromise}
            Sending...
          {:then}
            Submission was successful! Thank you for taking your time to
            respond.
          {:catch}
            <span class="text-red-700"
              >Unfortunately, something went wrong. Please try again later.</span
            >
          {/await}
        {:else}
          Privately send a comment or question to us. If you want us to respond,
          then fill in your email address as well.
        {/if}
      </p>
    </div>
    <form action="post" onsubmit={preventDefault(questionSubmit)} class="mt-5">
      <textarea
        name="comment"
        id="comment"
        required
        rows="5"
        placeholder="Feedback? Questions? Spill the beans"
        disabled={feedbackSent}
        class="block w-[70vw] border-2 border-rock-600 rounded focus:outline-none focus:ring-4 ring-rock-200 p-2 max-h-72 placeholder:italic disabled:opacity-40 disabled:pointer-events-none"
      ></textarea>
      <input
        type="email"
        name="email"
        id="email"
        placeholder="Email address (optional)"
        disabled={feedbackSent}
        class="border-2 border-rock-600 rounded w-full my-4 px-4 py-1 focus:outline-none focus:ring-4 ring-rock-200 placeholder:font-sans placeholder:italic font-mono disabled:opacity-40 disabled:pointer-events-none"
      />
      <button
        type="submit"
        disabled={feedbackSent}
        class="px-4 py-1 border-2 border-rock-600 rounded text-rock-700 snap-style shadow-[inset_5px_5px_var(--rock-100)] hover:px-6 transition-[padding] hover:bg-rock-100 active:bg-rock-200 active:shadow-none active:text-rock-800 focus:ring-4 ring-rock-200 disabled:opacity-40 disabled:pointer-events-none"
        >Submit</button
      >
    </form>
  </div>
</dialog>
