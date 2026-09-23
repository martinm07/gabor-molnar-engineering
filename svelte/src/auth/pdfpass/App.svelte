<script lang="ts">
  import "/shared/tailwindinit.css";
  import { fade, fly, scale } from "svelte/transition";

  import { extractSeed } from "./extract_seed";

  import ArrowRightIcon from "phosphor-svelte/lib/ArrowRightIcon";
  import CopyIcon from "phosphor-svelte/lib/CopyIcon";
  import { fetch_, tada } from "/shared/helper";
  import { pdfpassInfo } from "./url.svelte";
  import { watch, FiniteStateMachine } from "runed";
  import TermsOfUse from "./TermsOfUse.svelte";
  import Spinner from "./Spinner.svelte";
  import { backOut, bounceIn } from "svelte/easing";

  type PageStates =
    "confirmingtou" | "selectingpdf" | "gettingpassword" | "finished";
  type PageEvents = "confirmtou" | "getseed" | "getpassword";

  const f = new FiniteStateMachine<PageStates, PageEvents>("confirmingtou", {
    confirmingtou: {
      confirmtou: () => {
        if (pdfpassInfo.seed) return "gettingpassword";
        else return "selectingpdf";
      },
    },
    selectingpdf: {
      _enter: () => {
        if (pdfpassInfo.seed) processSeed(pdfpassInfo.seed);
      },

      getseed: "gettingpassword",

      // Do we want this?
      getpassword: "finished",
    },
    gettingpassword: {
      _enter: () => {
        if (pdfpassInfo.seed) processSeed(pdfpassInfo.seed);
      },

      getpassword: "finished",
    },
    finished: {},
  });

  $inspect(f.current);

  let touReachedEnd = $state(false);

  let dropZoneEl: HTMLLabelElement | undefined = $state();

  interface PDFSelectState {
    state: "idle" | "processing" | "error" | "success";
    message: string | null;
  }
  const pdfSelectState: PDFSelectState = $state({
    state: "idle",
    message: null,
  });

  function handleFiles(files: (File | null)[]) {
    pdfSelectState.state = "processing";
    pdfSelectState.message = null;

    if (files.length === 0 || files[0] === null) {
      pdfSelectState.state = "error";
      pdfSelectState.message = "No PDF file was selected.";
      return;
    }

    extractSeed(files[0], "GABMOLENG").then((data) => {
      if (data.kind === "not-a-pdf") {
        pdfSelectState.state = "error";
        pdfSelectState.message =
          "We were not able to process this file as a PDF; the file may be malformed or corrupted.";
        return;
      } else if (!data.encrypted) {
        pdfSelectState.state = "error";
        pdfSelectState.message =
          "We did not detect password encryption on this PDF; you should be able to open this file without a password.";
      } else if (data.kind === "no-seed") {
        pdfSelectState.state = "error";
        pdfSelectState.message =
          "Unfortunately, we could not detect this PDF to be one authored by Gabor Molnar Engineering. If you believe this is a mistake, please contact <a href='mailto:info@structural-design.eu' class='underline hover:no-underline'>info@structural-design.eu</a> and we will respond promptly.";
        return;
      } else {
        pdfSelectState.state = "success";
        // processSeed(data.seed);
        pdfpassInfo.seed = data.seed;
        f.send("getseed");
      }
    });
  }

  // let seedRetrieved: boolean = $state(false);
  let password = $state("");
  let passwordFetch: Promise<Response> | undefined = $state();

  async function processSeed(seed: string) {
    const params = new URLSearchParams([["seed", seed]]);
    passwordFetch = fetch_(`/api/pdfpass_get_password?${params.toString()}`);
    const resp = await passwordFetch;

    if (resp.ok) {
      const data = await resp.text();
      password = data;
      f.send("getpassword");
    } else {
      console.error(await resp.text());
    }
  }

  // watch(
  //   () => pdfpassInfo.seed,
  //   (seed) => {
  //     if (f.current !== "selectingpdf" && f.current !== "gettingpassword")
  //       return;

  //     if (seed) processSeed(seed);
  //   },
  // );
</script>

<svelte:window
  ondragover={(e) => {
    if (!e.dataTransfer) return;
    const fileItems = [...e.dataTransfer.items].filter(
      (item) => item.kind === "file",
    );
    if (fileItems.length > 0) {
      e.preventDefault();
      if (!(e.target instanceof Node) || !dropZoneEl?.contains(e.target)) {
        e.dataTransfer.dropEffect = "none";
      }
    }
  }}
  ondrop={(e) => {
    if (!e.dataTransfer) return;
    if ([...e.dataTransfer.items].some((item) => item.kind === "file")) {
      e.preventDefault();
    }
  }}
/>

<main
  class="max-w-4xl mx-auto px-2 py-3 border-x border-rock-300 min-h-screen relative"
>
  <div class="font-serif text-center text-rock-700 text-3xl/12 text-balance">
    Retrieve password for PDF file authored by <a
      class="text-rock-800 underline hover:no-underline"
      href="/">Gabor Molnar Engineering</a
    >
  </div>
  <div class="text-center mt-4 text-lg text-rock-800">
    By proceeding you agree to the following terms of usage of the PDF password
    and PDF contents:
  </div>

  <div
    class="tou-container h-[85vh] max-h-fit relative my-4 sm:mx-4 rounded overflow-hidden"
    class:reached-end={touReachedEnd}
  >
    <div
      class="tou p-4 border border-rock-300 h-full overflow-y-auto text-text rounded bg-background-50"
      onscroll={(e) => {
        if (!(e.target instanceof Element)) return;
        if (
          e.target.scrollTop + e.target.clientHeight >=
          e.target.scrollHeight - 24
        ) {
          touReachedEnd = true;
        } else touReachedEnd = false;
      }}
    >
      <TermsOfUse />
    </div>
  </div>

  <div class="text-center min-h-[35vh] mt-8">
    <!-- <button
      class="text-xl text-rock-700 bg-rock-50 hover:bg-rock-100 hover:active:translate-y-0.5 hover:active:ring-4 ring-rock-300/50 p-3 border-2 border-rock-600 rounded-lg font-bold inline-flex items-center gap-2 transition-colors"
      >I have read and agreed to the terms described above <ArrowRightIcon
        class="text-2xl"
        weight="bold"
      /></button
    > -->
    <!-- <button
      class="text-xl text-rock-800 underline hover:no-underline underline-offset-2 inline-flex items-center gap-2"
      >I have read and agreed to the terms described above <ArrowRightIcon
      /></button
    > -->
    <button
      class="text-xl text-rock-800 hover:text-rock-600 border-rock-300 active:hover:translate-y-0.5 border-2 rounded box-content px-3 py-1.5 inline-flex items-center gap-2 disabled:pointer-events-none disabled:opacity-35 transition-opacity text-balance mx-4"
      disabled={f.current !== "confirmingtou"}
      onclick={() => {
        f.send("confirmtou");

        // f.send("getpassword");
      }}
      >I have read and agreed to the terms described above <ArrowRightIcon
        class="shrink-0"
      /></button
    >

    {#if f.current === "gettingpassword" && passwordFetch}
      {#snippet errorMsg()}
        <div class="text-red-700 text-lg px-6" in:tada={{ duration: 400 }}>
          Something went wrong on our end.<br />We apologise for the
          inconvenience; please try again later or contact
          <a
            href="mailto:info@structural-design.eu"
            class="underline hover:no-underline">info@structural-design.eu</a
          >
        </div>
      {/snippet}

      {#await passwordFetch}
        <div
          class="absolute w-full flex items-center justify-center text-rock-700"
          in:fade={{ duration: 100, delay: 50 }}
        >
          <Spinner class="scale-50" /><span class="text-lg"
            >Getting password...</span
          >
        </div>
      {:then resp}
        {#if !resp.ok}
          {@render errorMsg()}
        {/if}
      {:catch}
        {@render errorMsg()}
      {/await}
    {/if}

    {#if f.current === "finished"}
      {let showClipboardMsg: boolean = $state(false)}
      {let hideTimeout: number | null = null}

      <div in:fade={{ duration: 200 }} class="text-xl text-rock-700 mt-4">
        Password retrieved:
      </div>
      <div
        class="m-4 font-mono p-4 border border-rock-300 rounded text-xl text-rock-800 flex items-center justify-center flex-wrap gap-1.5 bg-background-50"
        in:scale={{ easing: backOut, start: 0.85, duration: 200 }}
        {@attach (el) => {
          // const childNodes = Array.from(el.childNodes)
          const selection = document.getSelection();
          // selection?.setBaseAndExtent(childNodes.at(0), 0)
          selection?.setBaseAndExtent(el, 0, el, 1);
        }}
      >
        {password}<button
          class="p-1.5 rounded hover:bg-rock-100 hover:active:scale-95 hover:active:bg-rock-200 text-2xl transition-transform"
          aria-label="Copy password to clipboard"
          onclick={() => {
            navigator.clipboard.writeText(password).then(() => {
              showClipboardMsg = true;
            });
          }}><CopyIcon /></button
        >
      </div>
      {#if showClipboardMsg}
        <div
          class="text-rock-700 font-mono text-base mt-2 italic"
          transition:fly={{ duration: 150, y: -10 }}
          {@attach () => {
            showClipboardMsg;

            if (hideTimeout !== null) clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => (showClipboardMsg = false), 1500);

            return () => hideTimeout !== null && clearTimeout(hideTimeout);
          }}
        >
          password copied to clipboard
        </div>
      {/if}
    {/if}

    {#if f.current === "selectingpdf"}
      <label
        in:fly={{ duration: 300, y: -10 }}
        id="drop-zone"
        class="flex items-center justify-center min-h-32 m-4 rounded p-4 text-rock-700 font-mono bg-background-50 border border-rock-300 hover:bg-rock-100 [.dragvalid]:bg-rock-100 relative"
        bind:this={dropZoneEl}
        ondragover={(e) => {
          if (!e.dataTransfer) return;
          const fileItems = [...e.dataTransfer.items].filter(
            (item) => item.kind === "file",
          );
          if (fileItems.length > 0) {
            e.preventDefault();
            dropZoneEl?.classList.remove("dragvalid");
            if (fileItems.some((item) => item.type === "application/pdf")) {
              console.log("dragging pdf");
              e.dataTransfer.dropEffect = "copy";
              dropZoneEl?.classList.add("dragvalid");
            } else {
              e.dataTransfer.dropEffect = "none";
            }
          }
        }}
        ondragleave={(e) => {
          dropZoneEl?.classList.remove("dragvalid");
        }}
        ondrop={(e) => {
          if (!e.dataTransfer) return;
          e.preventDefault();
          dropZoneEl?.classList.remove("dragvalid");

          const files = [...e.dataTransfer.items]
            .map((item) => item.getAsFile())
            .filter((file) => file && file.type === "application/pdf");

          // console.log("DROPPED IN FILES:", files);
          handleFiles(files);
        }}
      >
        Drop PDF here, or click to select.
        <input
          class="absolute top-0 left-0 w-full h-full file:hidden text-transparent"
          type="file"
          id="file-input"
          accept="application/pdf"
          oninput={(e) => {
            if (!(e.target instanceof HTMLInputElement)) return;
            const files = Array.from(e.target.files ?? []);
            console.log(files);
            handleFiles(files);
          }}
        />
      </label>
      {#if pdfSelectState.state === "processing"}
        <div class="font-mono text-rock-700 italic">Processing...</div>
      {:else if pdfSelectState.state === "error"}
        <div class="text-red-700 text-lg px-6" in:tada={{ duration: 400 }}>
          {@html pdfSelectState.message ??
            "Unfortunately, something went wrong. Please try again."}
        </div>
      {/if}
    {/if}
  </div>

  <div class="text-center text-rock-800 text-lg">
    For questions/support, contact <a
      class="text-rock-900 underline hover:no-underline text-nowrap"
      href="mailto:info@structural-design.eu">info@structural-design.eu</a
    >
  </div>
</main>

<style>
  .tou-container::after {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 200px;
    background: linear-gradient(180deg, transparent, var(--color-stone-100));
    content: "";
    pointer-events: none;
    transition: background 0.5s;
    background-repeat: no-repeat;
  }
  .tou-container.reached-end::after {
    /* have a smooth transition getting rid of the fade, by shifting the background-position down by the height of the fade */
    background-position-y: 200px;
  }

  #drop-zone:has(input:focus) {
    outline: initial;
  }
</style>
