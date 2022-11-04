<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { flyIn, flyOut, stageStore, tada } from "./Helper";
  import "intl-tel-input/build/css/intlTelInput.css";
  import intlTelInput from "intl-tel-input";

  let emailVal = "",
    phoneVal = "";
  let activeInput = "email";
  // Clear any input field when it's hidden
  $: activeInput &&
    (() => {
      if (!(emailVal || phoneVal)) return;
      if (activeInput === "email") phoneVal = "";
      else if (activeInput === "phone") emailVal = "";
    })();

  let emailShowValidation, phoneShowValidation;
  let emailValidType, phoneValidType;
  let tadaDisabled = false;
  function validateEmail() {
    const validationMsgEl = document.querySelector(
      ".email-input + .validation"
    );
    if (!validationMsgEl) return;
    validationMsgEl.style.removeProperty("display");

    if (emailVal === "") {
      validationMsgEl.dataset.msg = "Missing email.";
      emailValidType = "error";
    } else if (
      !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
        emailVal
      )
    ) {
      validationMsgEl.dataset.msg = "Invalid email.";
      emailValidType = "error";
    } else {
      validationMsgEl.dataset.msg = "";
      emailValidType = "valid";
      validationMsgEl.style.display = "none";
    }
  }
  function validatePhone() {
    const validationMsgEl = document.querySelector(".phone-group .validation");
    if (!validationMsgEl) return;
    validationMsgEl.style.removeProperty("display");

    if (phoneVal === "") {
      validationMsgEl.dataset.msg = "Missing phone number.";
      phoneValidType = "error";
    } // replace this
    else if (phoneVal.length < 5) {
      validationMsgEl.dataset.msg = "Invalid number.";
      phoneValidType = "error";
    } else {
      validationMsgEl.dataset.msg = "";
      phoneValidType = "valid";
      validationMsgEl.style.display = "none";
    }
  }
  const emailUpdateValid = function () {
    if (!emailVal) emailValidType = "valid";
    emailShowValidation = Boolean(emailVal);
    setTimeout(validateEmail, 0);
  };
  const phoneUpdateValid = function () {
    if (!phoneVal) phoneValidType = "valid";
    phoneShowValidation = Boolean(phoneVal);
    setTimeout(validatePhone, 0);
  };

  const updateValidOnActiveFieldChange = function () {
    emailShowValidation = activeInput === "email";
    phoneShowValidation = activeInput === "phone";
    if (!emailShowValidation) emailValidType = "valid";
    if (!phoneShowValidation) phoneValidType = "valid";
  };
  $: activeInput && updateValidOnActiveFieldChange();

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
    if (activeInput === "email") {
      emailShowValidation = false;
      setTimeout(() => {
        emailShowValidation = true;
        setTimeout(() => {
          validateEmail();
          if (emailValidType === "valid") stageStore.set("verify");
        }, 0);
      }, 0);
    } else {
      phoneShowValidation = false;
      setTimeout(() => {
        phoneShowValidation = true;
        setTimeout(() => {
          validatePhone();
          if (phoneValidType === "valid") stageStore.set("verify");
        }, 0);
      }, 0);
    }
  }

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

    <span style="position: relative;" class="{emailValidType} email-group">
      <input
        placeholder="youremail@gmail.com"
        class="info-input email-input"
        type="text"
        bind:value={emailVal}
        class:hidden={activeInput !== "email"}
        on:focusout={emailUpdateValid}
        on:input={() => {
          emailShowValidation = false;
          emailValidType = "valid";
        }}
      />
      {#if emailShowValidation}
        <div
          class="validation"
          in:tada={{ duration: 400, disable: tadaDisabled }}
          data-msg
          style="display: none;"
        />
      {/if}
    </span>
    <span style="position: relative;" class="{phoneValidType} phone-group">
      <input
        class="info-input phone-input"
        type="text"
        bind:value={phoneVal}
        class:hidden={activeInput !== "phone"}
        on:focusout={phoneUpdateValid}
        on:input={() => {
          phoneShowValidation = false;
          phoneValidType = "valid";
        }}
      />
      {#if phoneShowValidation}
        <div
          class="validation"
          in:tada={{ duration: 400, disable: tadaDisabled }}
          data-msg
          style="display: none;"
        />
      {/if}
    </span>
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
    cursor: default;
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
    z-index: 3;
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
</style>
