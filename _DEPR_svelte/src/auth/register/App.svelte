<script>
  // @ts-nocheck
  import Footer from "./../../shared/lib/Footer.svelte";
  import NameSection from "./NameSection.svelte";
  import PossessionSection from "./PossessionSection.svelte";
  import VerifySection from "./VerifySection.svelte";
  import { stageStore, stages } from "./Helper";
  import PasswordPopup from "./PasswordPopup.svelte";
  import RecoveryPopup from "./RecoveryPopup.svelte";
  import CongratsSection from "./CongratsSection.svelte";

  let isNameSec, isPossessionSec, isVerifySec, isCongratsSec;
  $: isNameAlone = !isPossessionSec && !isVerifySec && !isCongratsSec;
  $: isPossessionAlone = !isNameSec && !isVerifySec && !isCongratsSec;
  $: isVerifyAlone = !isNameSec && !isPossessionSec && !isCongratsSec;
  $: isCongratsAlone = !isNameSec && !isPossessionSec && !isVerifySec;
  // `true` if 1 or less sections "exist" - PROBABLY DOESN'T WORK BECAUSE IT'S ALSO
  // REACTIVE WITH THE SECTION WE'RE TRYING TO INTRODUCE, CAUSING UNSTABLE BEHAVIOUR
  // $: isNoOtherSec =
  //   [isNameSec, isPossessionSec, isVerifySec].reduce(
  //     (prev, curr) => (prev || 0) + (curr || 0)
  //   ) <= 1;
  // $: console.log(isNoOtherSec);

  let isLayover = false;
  let popupName;
  const layover = (e) => {
    isLayover = true;
    popupName = e.detail.name;
    document.querySelector("body").style.overflowY = "hidden";
    document.querySelector("#app").style.overflowY = "scroll";
  };
  const closeLayover = (e) => {
    if (e instanceof KeyboardEvent) {
      if (e.isComposing || e.keyCode === 229) return; // Ignore keyboard events that are "part of composition", probably useless though
      if (e.key !== "Escape") return;
    }
    isLayover = false;
    document.querySelector("body").style.overflowY = "scroll";
    document.querySelector("#app").style.overflowY = "hidden";
  };
  window.addEventListener("keydown", closeLayover, true);

  $: finishPopupInertLogic: {
    const footer = document.getElementById("footer");
    if (!footer) break finishPopupInertLogic;

    const main = document.querySelector(":not(.popup) > main");
    footer.inert = isLayover;
    main.inert = isLayover;
    document.activeElement.blur();
  }
</script>

<div class="background-dec1" />
{#if isLayover}
  <!-- on:keydown here doesn't do anything but make A11y shut up -->
  <div class="layover" on:click={closeLayover} on:keydown={closeLayover} />
  <span class="popup">
    {#if popupName === "password"}
      <PasswordPopup on:close={closeLayover} />
    {:else if popupName === "recovery"}
      <RecoveryPopup on:close={closeLayover} />
    {/if}
  </span>
{/if}
<main>
  <div class="card">
    <h1 class="title">Registration</h1>
    {#if $stageStore === "name" && isNameAlone}
      <NameSection bind:exists={isNameSec} />
    {:else if $stageStore === "possession" && isPossessionAlone}
      <PossessionSection bind:exists={isPossessionSec} />
    {:else if $stageStore === "verify" && isVerifyAlone}
      <VerifySection
        bind:exists={isVerifySec}
        on:open-popup={layover}
        on:close-popup={closeLayover}
      />
    {:else if $stageStore === "congrats" && isCongratsAlone}
      <CongratsSection bind:exists={isCongratsAlone} />
    {/if}
  </div>
</main>
<Footer />

<style>
  .background-dec1 {
    position: absolute;
    clip-path: polygon(0 0, 0% 100%, 100% 0);
    width: 50%;
    height: 25%;
    background-color: #b29f98;
  }

  .layover {
    position: fixed;
    z-index: 100;
    width: 100%;
    height: 100%;
    background: #ffffff78;
    backdrop-filter: blur(1px);
  }
  :global(.popup main) {
    position: fixed;
    width: 65%;
    max-width: 550px;
    height: 80%;
    display: flex;
    left: 50%;
    z-index: 101;
    overflow-y: scroll;
    background: #fff;
    top: 50%;
    transform: translate(-50%, -50%);
    border: 2px solid #bababa;
    border-radius: 7px;
    box-shadow:
      2px 2px 2px #8d8d8d,
      0 0 20px #adacac;
    flex-direction: column;
    box-sizing: border-box;
  }
  :global(.popup main::-webkit-scrollbar) {
    border-bottom-right-radius: 7px;
    border-top-right-radius: 7px;
  }
  :global(.close) {
    position: absolute;
    top: 0;
    left: 0;
    font-size: 200%;
    border: none;
    background: none;
    color: rgb(48, 48, 48);
    padding: 10px;
    transform: translate(-5px, -5px);
    cursor: pointer;
  }
  :global(.close ion-icon) {
    transition: transform 0.15s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  :global(.close:hover ion-icon) {
    transform: rotate(90deg);
  }

  main {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(5px);
    background: rgba(255, 255, 255, 0.466);
  }
  .card {
    width: 70%;
    max-width: 600px;
    height: 90%;
    border: 2px solid rgb(195, 190, 190);
    box-shadow:
      2px 2px 2px #a4a4a4,
      4px 4px 16px #dcdcdc;
    border-radius: 7px;
    box-sizing: border-box;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }

  .title {
    font-family: "Merriweather", serif;
    color: #5b4f4d;
    font-size: 235%;
    margin-top: 13px;
    position: relative;
    display: inline-block;
    margin-left: 50%;
    transform: translateX(-50%);
    width: fit-content;
  }
  .title::before,
  .title::after {
    height: 3px;
    width: 30px;
    background-color: #c3c3c3;
    top: 50%;
    content: "";
    display: inline-block;
    position: absolute;
  }
  .title::before {
    transform: translate(-100%, -50%);
  }
  .title::after {
    transform: translate(100%, -50%);
    right: 0;
  }

  .card :global(.sub-title) {
    text-align: center;
    margin: 0;
    font-weight: 300;
    color: #3f3f3f;
    width: 80%;
    margin-left: 10%;
  }
  .card :global(.text) {
    color: #3f3f3f;
    font-weight: 300;
    width: 80%;
    margin-left: 10%;
    margin-top: 0;
  }

  .card :global(form) {
    display: flex;
    justify-content: center;
    position: relative;
    padding-top: 10px;
  }
  .card :global(input) {
    height: 30px;
    width: 225px;
    font-size: 100%;
    box-sizing: border-box;
    border: 1px solid #000;
    border-bottom-left-radius: 3px;
    border-top-left-radius: 3px;
    padding: 0 10px;
    position: relative;
    z-index: 1;
    font-family: "Source Code Pro", monospace;
  }
  .card :global(input:focus) {
    outline: 3px solid #00000029;
  }

  :global(.validation) {
    position: absolute;
    z-index: 2;
    left: 10px;
    margin-top: -6px;
    pointer-events: none;
    margin-right: 10px;
    --after-width: auto;
  }
  :global(.validation::after) {
    /* content: "After Alterna is a bonus level in Splatoon 3 singleplayer that only unlocks after you beat all other levels at least once"; */
    content: attr(data-msg);
    display: block;
    padding: 0 3px;
    font-size: 85%;
    background-color: #fff;
    background: linear-gradient(
      0deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.6551353817894345) 33%,
      rgba(255, 255, 255, 1) 33%,
      rgba(255, 255, 255, 1) 67%,
      rgba(0, 0, 0, 0) 67%,
      rgba(255, 255, 255, 0) 100%
    );
    font-weight: bold;
    color: #0000008f;
    height: 15px;
    line-height: 13px;
    width: var(--after-width);
  }
  :global(.error input) {
    border: 1px solid rgb(173, 0, 35) !important;
  }
  :global(.error input:focus) {
    outline: 3px solid #b8191929 !important;
  }
  :global(.error .validation::after) {
    color: rgb(173, 85, 110);
  }

  .card :global(.bottom-text) {
    margin-top: auto;
    text-align: center;
    font-style: italic;
    color: #2e2e2e;
  }
  .card :global(.back) {
    margin-bottom: 10px;
    margin-left: 20px;
    background: none;
    border: none;
    text-decoration: underline;
    font-size: 100%;
    color: #2e2e2e;
    display: flex;
    align-items: center;
  }
  .card :global(.back ion-icon) {
    font-size: 110%;
  }
  .card :global(.back:hover) {
    text-decoration: none;
    cursor: pointer;
  }
</style>
