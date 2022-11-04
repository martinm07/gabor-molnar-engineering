<script>
  // @ts-nocheck
  import Footer from "./../../shared/lib/Footer.svelte";
  import NameSection from "./NameSection.svelte";
  import PossessionSection from "./PossessionSection.svelte";
  import VerifySection from "./VerifySection.svelte";
  import { stageStore, stages } from "./Helper";

  let isNameSec, isPossessionSec, isVerifySec;
  $: isNameAlone = !isPossessionSec && !isVerifySec;
  $: isPossessionAlone = !isNameSec && !isVerifySec;
  $: isVerifyAlone = !isNameSec && !isPossessionSec;
  // `true` if 1 or less sections "exist" - PROBABLY DOESN'T WORK BECAUSE IT'S ALSO
  // REACTIVE WITH THE SECTION WE'RE TRYING TO INTRODUCE, CAUSING UNSTABLE BEHAVIOUR
  // $: isNoOtherSec =
  //   [isNameSec, isPossessionSec, isVerifySec].reduce(
  //     (prev, curr) => (prev || 0) + (curr || 0)
  //   ) <= 1;
  // $: console.log(isNoOtherSec);
</script>

<div class="background-dec1" />
<main>
  <div class="card">
    <h1 class="title">Registration</h1>
    {#if $stageStore === "name" && isNameAlone}
      <NameSection bind:exists={isNameSec} />
    {:else if $stageStore === "possession" && isPossessionAlone}
      <PossessionSection bind:exists={isPossessionSec} />
    {:else if $stageStore === "verify" && isVerifyAlone}
      <VerifySection bind:exists={isVerifySec} />
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
    box-shadow: 2px 2px 2px #a4a4a4, 4px 4px 16px #dcdcdc;
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

  .card :global(.validation) {
    position: absolute;
    z-index: 2;
    left: 10px;
    margin-top: -6px;
    pointer-events: none;
    margin-right: 10px;
  }
  .card :global(.validation::after) {
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
    text-align: justify;
  }
  .card :global(.error input) {
    border: 1px solid rgb(173, 0, 35);
  }
  .card :global(.error input:focus) {
    outline: 3px solid #b8191929;
  }
  .card :global(.error .validation::after) {
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
