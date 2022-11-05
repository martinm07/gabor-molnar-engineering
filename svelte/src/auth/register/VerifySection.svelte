<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { flyIn, flyOut, stageStore, tada } from "./Helper";

  // Send token to device when component is created (make sure it's only once though)

  let validType = "valid";
  let showValidation;
  let tadaDisabled = false;

  let submitBtnIsActive = false;
  function submitBtnActivate() {
    this.style.transition = "width 0s, margin-left 0s, transform 0s";
    this.children.namedItem("arrow-extension").style.transition =
      "transform 0s";
    setTimeout(() => (submitBtnIsActive = true), 0);
  }
  function submitBtnUnactivate() {
    submitBtnIsActive = false;
    setTimeout(() => {
      this.style.removeProperty("transition");
      this.children
        .namedItem("arrow-extension")
        .style.removeProperty("transition");
    }, 0);
  }

  function formSubmit() {}

  let isFinished = true;
  const dispatch = createEventDispatcher();

  export let exists = true;
  onMount(() => (exists = true));
  function bringNextSection() {
    exists = false;
  }
</script>

<h2 class="sub-title" in:fly={flyIn(0)} out:fly={flyOut(0)}>
  Finally, prove yourself.
</h2>
<p class="text" in:fly={flyIn(1)} out:fly={flyOut(1)}>
  Verify that you'd be able to log in with that information. Enter the code that
  we'll send below, reading from the destination you provided. Codes expire in 5
  minutes and can only be entered on the browser tab that sends them.
</p>

<form
  on:submit|preventDefault={formSubmit}
  in:fly={flyIn(2)}
  out:fly={flyOut(2)}
>
  <div class="sendtoken-info">
    <span>A 6-digit code was sent to </span>
  </div>
  <div class="input-field">
    <span style="position: relative;" class="{validType} token-group">
      <input type="text" placeholder="012345" />
      {#if showValidation}
        <div
          class="validation"
          in:tada={{ duration: 400, disable: tadaDisabled }}
          data-msg=""
          style="display: none;"
        />
      {/if}
    </span>
    <button
      class={submitBtnIsActive ? "active" : ""}
      on:mousedown={submitBtnActivate}
      on:mouseup={submitBtnUnactivate}
      on:mouseleave={submitBtnUnactivate}
      type="submit"
    >
      <div name="arrow-extension" class="arrow-extension" />
      <ion-icon name="arrow-forward" />
    </button>
  </div>
  <button class="finish" disabled={!isFinished}>Finish</button>
</form>

<div
  class="bottom-text"
  in:fly={flyIn(3)}
  out:fly={flyOut(3)}
  on:outroend={bringNextSection}
>
  <button class="back" on:click={() => stageStore.set("possession")}>
    <ion-icon name="chevron-back" />Go Back
  </button>
  <div class="extra-options" class:disabled={!isFinished}>
    <button
      class="extra-option addpassword-btn"
      on:click={() => dispatch("open-popup", { name: "password" })}
      >Password</button
    >
    <button
      class="extra-option addrecovery-btn"
      on:click={() => dispatch("open-popup", { name: "recovery" })}
      >Recovery</button
    >
  </div>
</div>

<style>
  .sendtoken-info {
    font-family: "Source Code Pro", monospace;
    font-size: 90%;
    letter-spacing: -1px;
    word-spacing: -1px;
    color: #292929;
    margin-bottom: 5px;
  }
  .input-field {
    display: flex;
  }
  form {
    flex-direction: column;
    align-items: center;
  }

  button[type="submit"] {
    width: 30px;
    border: 1px solid #000;
    border-left: 0;
    border-bottom-right-radius: 3px;
    border-top-right-radius: 3px;
    font-size: 120%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgb(244, 244, 244);
    color: rgb(71, 71, 71);
    position: relative;
    cursor: pointer;
    z-index: 0;
    transition: width 0.2s cubic-bezier(0.22, 0.61, 0.36, 1),
      margin-left 0.2s cubic-bezier(0.22, 0.61, 0.36, 1),
      transform 0.2s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  .arrow-extension {
    position: absolute;
    width: 10px;
    height: 2px;
    background-color: rgb(82, 82, 82);
    transition: transform 0.2s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  button[type="submit"]:hover {
    width: 40px;
    transform: translateX(10px);
    margin-left: -10px;
    background-color: rgb(236, 236, 236);
  }
  button[type="submit"]:hover .arrow-extension {
    transform: translateX(-7px);
  }
  button[type="submit"].active {
    width: 30px;
    background-color: rgb(208, 208, 208);
    transform: translateX(0px);
    margin-left: 0;
  }

  .finish {
    margin-top: 20px;
    background: #fff;
    border: 1px solid #000;
    padding: 7px 15px;
    border-radius: 3px;
    box-shadow: inset 5px 5px 6px -5px #b1b1b1, 2px 2px 3px #9a9a9a;
    font-size: 100%;
    letter-spacing: 1px;
    color: #454545;
    transition: transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1),
      box-shadow 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  .finish:hover {
    transform: translate(-3px, -3px);
    box-shadow: inset -5px -5px 6px -5px #b1b1b1, 4px 4px 3px #9a9a9a;
    cursor: pointer;
  }
  .finish:hover:active {
    background-color: rgb(211, 211, 211);
    transform: translate(0px, 0px);
    box-shadow: inset 0px 0px 6px -5px #b1b1b1, 2px 2px 3px #9a9a9a;
  }
  .finish:disabled {
    box-shadow: 0 0 !important;
    cursor: default;
    transform: translate(0px, 0px);
    background-color: #fff !important;
    opacity: 0.3;
  }

  .bottom-text {
    display: flex;
  }
  .extra-options {
    display: flex;
    margin-left: auto;
    margin-right: auto;
    background: #efefef;
    align-items: center;
    border-top-right-radius: 7px;
    border-top-left-radius: 7px;
  }
  .extra-option {
    font-style: normal;
    padding: 5px 10px;
    text-decoration: underline;
    color: #474747;
    background: none;
    border: none;
    font-size: 100%;
  }
  .extra-option:hover {
    cursor: pointer;
    text-decoration: none;
  }
  .extra-option:hover:active {
    cursor: pointer;
    text-decoration: none;
    padding-top: 7px;
    padding-bottom: 3px;
  }
  .extra-options.disabled {
    opacity: 0.3;
  }
  .extra-options.disabled .extra-option {
    cursor: default !important;
    text-decoration: underline !important;
    pointer-events: none;
  }
</style>
