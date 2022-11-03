<script>
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { stageStore } from "./Helper";
  import "intl-tel-input/build/css/intlTelInput.css";
  import intlTelInput from "intl-tel-input";

  let emailVal, phoneVal;
  let activeInput = "email";
  // Clear any input field when it's hidden
  $: activeInput &&
    (() => {
      if (!(emailVal || phoneVal)) return;
      if (activeInput === "email") phoneVal = "";
      else if (activeInput === "phone") emailVal = "";
    })();

  let submitBtnIsActive = false;
  function submitBtnActivate() {
    this.style.transition = "padding-right 0s, margin-left 0s";
    setTimeout(() => (submitBtnIsActive = true), 0);
  }
  function submitBtnUnactivate() {
    submitBtnIsActive = false;
    setTimeout(() => {
      this.style.removeProperty("transition");
    }, 0);
  }

  let iti;
  onMount(() => {
    iti = intlTelInput(document.querySelector(".phone-input"), {
      utilsScript:
        "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
    });
  });

  function formSubmit() {
    // stageStore.set("verify");
    console.log("Form submitted!");
  }

  const flyIn = (step) => {
    return { delay: step * 100, duration: 500, x: 30 };
  };
  const flyOut = (step) => {
    return { delay: step * 100, duration: 500, x: -30 };
  };

  export let exists = true;
  onMount(() => (exists = true));
  function bringNextSection() {
    exists = false;
  }
</script>

<h2 class="sub-title" in:fly={flyIn(0)} out:fly={flyOut(0)}>
  Now, let's get your identity.
</h2>

<p class="text" in:fly={flyIn(1)} out:fly={flyOut(1)}>
  Provide either your email address or phone number (but not both). To log into
  this account will be to prove that this piece of information is yours.
</p>

<form
  on:submit|preventDefault={formSubmit}
  in:fly={flyIn(2)}
  out:fly={flyOut(2)}
>
  <div class="info-input-group" class:hide-intl={activeInput !== "phone"}>
    <div class="info-options">
      <span
        class="info-option"
        class:active={activeInput === "email"}
        name="email"
        on:click={() => (activeInput = "email")}
      >
        Email Address<ion-icon name="chevron-forward" />
      </span>
      <span
        class="info-option"
        class:active={activeInput === "phone"}
        name="phone"
        on:click={() => (activeInput = "phone")}
      >
        Phone Number<ion-icon name="chevron-forward" />
      </span>
    </div>
    <input
      placeholder="youremail@gmail.com"
      class="info-input email-input"
      type="email"
      bind:value={emailVal}
      class:hidden={activeInput !== "email"}
    />
    <input
      class="info-input phone-input"
      type="text"
      bind:value={phoneVal}
      class:hidden={activeInput !== "phone"}
    />
  </div>
  <div class="submit-wrapper">
    <button
      type="submit"
      class={submitBtnIsActive ? "active" : ""}
      on:mousedown={submitBtnActivate}
      on:mouseup={submitBtnUnactivate}
      on:mouseleave={submitBtnUnactivate}>Continue</button
    >
  </div>
</form>

<div
  class="bottom-text"
  in:fly={flyIn(3)}
  out:fly={flyOut(3)}
  on:outroend={bringNextSection}
>
  <button class="back" on:click={() => stageStore.set("name")}>
    <ion-icon name="chevron-back" />Go Back
  </button>
</div>

<style>
  form {
    flex-direction: column;
    align-items: center;
  }

  .info-input-group {
    display: flex;
    align-items: center;
  }
  .info-input {
    border-radius: 3px;
    width: 275px;
  }
  .info-input.hidden {
    display: none;
  }

  .info-options {
    display: flex;
    flex-direction: column;
    margin-right: 30px;
    align-items: end;
  }
  .info-option {
    text-decoration: underline;
    display: flex;
    align-items: center;
    margin: 3px 0;
    cursor: pointer;
  }
  .info-option ion-icon {
    font-size: 130%;
  }
  .info-option.active {
    font-weight: bold;
  }

  .phone-input {
    z-index: 0;
    padding-left: 50px;
  }
  .hide-intl :global(.iti__flag-container) {
    display: none;
  }
  :global(.iti__country) {
    width: 400px;
    white-space: initial;
  }
  :global(.iti__country-list) {
    transform: translateX(-100%);
    margin-left: 275px;
    border: 2px solid #d0c8c8;
    border-radius: 5px;
    box-shadow: 2px 2px 2px #919090, 0 20px 20px #e2e2e2;
  }
  :global(.iti__selected-flag) {
    border-right: 1px solid #000;
  }

  .submit-wrapper {
    margin-top: 15px;
  }
  button[type="submit"] {
    padding: 5px 10px;
    font-weight: bold;
    color: #624f4f;
    background: #fff;
    border: 2px solid #624f4f;
    border-radius: 5px;
    cursor: pointer;
    transition: padding-right 0.15s cubic-bezier(0.22, 0.61, 0.36, 1),
      margin-left 0.15s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  button[type="submit"]:hover {
    display: inline-block;
    padding-right: 20px;
    margin-left: 10px;
    background-color: rgb(246, 246, 246);
  }
  button[type="submit"].active {
    padding-right: 10px;
    margin-left: 20px;
    background-color: rgb(218, 210, 200);
    outline: 2px solid rgb(218, 210, 200);
  }

  .bottom-text {
    display: flex;
  }
  .back {
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
  .back ion-icon {
    font-size: 110%;
  }
  .back:hover {
    text-decoration: none;
    cursor: pointer;
  }
</style>
