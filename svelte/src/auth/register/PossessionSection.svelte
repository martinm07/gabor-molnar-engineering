<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import {
    flyIn,
    flyOut,
    postData,
    stageStore,
    tada,
    timeoutPromise,
    updateValidWidth,
    regState,
  } from "./Helper";
  import "intl-tel-input/build/css/intlTelInput.css";
  import intlTelInput from "intl-tel-input";

  let emailValidEl, phoneValidEl;
  let emailVal = regState.possessionType === "email" ? regState.possession : "",
    phoneVal = regState.possessionType === "phone" ? regState.possession : "";
  let activeInput = regState.possessionType ?? "email";
  // Clear any input field when it's hidden
  $: activeInput &&
    (() => {
      if (!(emailVal || phoneVal)) return;
      if (activeInput === "email")
        phoneVal =
          regState.possessionType === "phone" ? regState.possession : "";
      else if (activeInput === "phone")
        emailVal =
          regState.possessionType === "email" ? regState.possession : "";
    })();

  const email = {
    showValidation: false,
    validType: "valid",
  };
  const phone = {
    showValidation: false,
    validType: "valid",
  };
  let tadaDisabled = false;
  async function validateEmail(doAsync = false) {
    const updateMsg = async function (message, validType, tada = true) {
      if (tada && email.showValidation) {
        email.showValidation = false;
        tadaDisabled = false;
        await timeoutPromise(0);
      } else tadaDisabled = !tada;
      if (!email.showValidation) {
        email.showValidation = true;
        await timeoutPromise(0);
      }
      const validationMsgEl = document.querySelector(
        ".email-input + .validation"
      );
      validationMsgEl.dataset.msg = message;
      email.validType = validType;
    };

    await updateMsg("...", "stall", false);
    finishValidation: if (regState.possession === emailVal) {
      email.validType = "valid";
      email.showValidation = false;
      await timeoutPromise(0);
    } else if (emailVal === "") {
      await updateMsg("Missing email.", "error");
    } else if (
      !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
        emailVal
      )
    ) {
      await updateMsg("Invalid email.", "error");
    } else {
      if (doAsync) {
        await updateMsg("Checking duplicity...", "stall", false);
        // prettier-ignore
        const is_taken = await postData({url: "is_email_taken", data: () => emailVal, plainText: true});
        if (is_taken["is_taken"]) {
          await updateMsg("Email already in use.", "error");
          break finishValidation;
        }

        await updateMsg("Thoroughly confirming validity...", "stall", false);
        // prettier-ignore
        const is_really_valid = await postData({url: "is_valid_email", data: () => emailVal, plainText: true});
        if (!is_really_valid["is_valid"]) {
          await updateMsg("Invalid email.", "error");
          break finishValidation;
        }
      }

      email.validType = "valid";
      email.showValidation = false;
      await timeoutPromise(0);
    }
    emailValidEl && updateValidWidth(emailValidEl);
  }
  async function validatePhone(doAsync = false) {
    const updateMsg = async function (message, validType, tada = true) {
      if (tada && phone.showValidation) {
        phone.showValidation = false;
        tadaDisabled = false;
        await timeoutPromise(0);
      } else tadaDisabled = !tada;
      if (!phone.showValidation) {
        phone.showValidation = true;
        await timeoutPromise(0);
      }
      const validationMsgEl = document.querySelector(
        ".phone-group .validation"
      );
      validationMsgEl.dataset.msg = message;
      phone.validType = validType;
    };

    await updateMsg("...", "stall", false);
    finishValidation: if (regState.possession === phoneVal) {
      phone.validType = "valid";
      phone.showValidation = false;
      await timeoutPromise(0);
    } else if (phoneVal === "") {
      await updateMsg("Missing phone number.", "error");
    } else if (!/^(?:(?:\(\d+\)[\d -]+)|[\d -]+)$/.test(phoneVal)) {
      await updateMsg("Invalid number.", "error");
    } else {
      if (doAsync) {
        await updateMsg("Checking duplicity...", "stall", false);
        // prettier-ignore
        const is_taken = await postData({url: "is_phone_taken", data: () => phoneVal, plainText: true});
        if (is_taken["is_taken"]) {
          await updateMsg("Phone already in use.", "error");
          break finishValidation;
        }

        await updateMsg("Confirming validity...", "stall", false);
        // prettier-ignore
        const is_really_valid = await postData({url: "is_valid_phone_number", data: () => iti.getNumber(), plainText: true});
        if (!is_really_valid) {
          await updateMsg("Invalid number.", "error");
          break finishValidation;
        }
      }

      phone.validType = "valid";
      phone.showValidation = false;
      await timeoutPromise(0);
    }
    phoneValidEl && updateValidWidth(phoneValidEl);
  }
  const emailUpdateValid = function () {
    if (!emailVal) {
      email.validType = "valid";
      email.showValidation = false;
      return;
    }
    validateEmail(false);
  };
  const phoneUpdateValid = function () {
    if (!phoneVal) {
      phone.validType = "valid";
      phone.showValidation = false;
      return;
    }
    validatePhone(true);
  };

  const updateValidOnActiveFieldChange = function () {
    email.showValidation &&= activeInput === "email";
    phone.showValidation &&= activeInput === "phone";
    if (!email.showValidation) email.validType = "valid";
    if (!phone.showValidation) phone.validType = "valid";
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

  let formPromise, formPromiseState;
  $: ((...args) => {
    if (!formPromise) return;
    formPromiseState = "pending";
    formPromise
      .then(() => (formPromiseState = "success"))
      .catch(() => (formPromiseState = "failure"));
  })(formPromise);

  async function formSubmit() {
    let getData;
    if (activeInput === "email") {
      email.showValidation = false;
      await timeoutPromise(0);
      await validateEmail(true);
      if (email.validType !== "valid") return;
      getData = () => {
        return {
          type: "email",
          data: emailVal,
        };
      };
    } else {
      phone.showValidation = false;
      await timeoutPromise(0);
      await validatePhone(true);
      if (phone.validType !== "valid") return;
      getData = () => {
        return {
          type: "phone",
          data: iti.getNumber(),
        };
      };
    }
    formPromise = postData({ url: "set_info", data: getData });
    document.activeElement.blur();
    await formPromise;
    regState.possession = getData().data;
    regState.possessionType = getData().type;
    await timeoutPromise(0.5);
    stageStore.set("verify");
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
      <button
        type="button"
        class="info-option"
        class:active={activeInput === "email"}
        name="email"
        on:click={() => (activeInput = "email")}
      >
        Email Address<ion-icon name="chevron-forward" />
      </button>
      <button
        type="button"
        class="info-option"
        class:active={activeInput === "phone"}
        name="phone"
        on:click={() => (activeInput = "phone")}
      >
        Phone Number<ion-icon name="chevron-forward" />
      </button>
    </div>

    <span style="position: relative;" class="{email.validType} email-group">
      <input
        placeholder="youremail@gmail.com"
        class="info-input email-input"
        type="text"
        bind:value={emailVal}
        class:hidden={activeInput !== "email"}
        on:focusout={emailUpdateValid.bind(null, false)}
        on:input={() => {
          email.showValidation = false;
          email.validType = "valid";
        }}
        disabled={formPromiseState === "pending" ||
          formPromiseState === "success"}
      />
      {#if email.showValidation}
        <div
          class="validation"
          in:tada={{ duration: 400, disable: tadaDisabled }}
          data-msg
          bind:this={emailValidEl}
        />
      {/if}
    </span>
    <span style="position: relative;" class="{phone.validType} phone-group">
      <input
        class="info-input phone-input"
        type="text"
        bind:value={phoneVal}
        class:hidden={activeInput !== "phone"}
        on:focusout={phoneUpdateValid.bind(null, false)}
        on:input={() => {
          phone.showValidation = false;
          phone.validType = "valid";
        }}
        disabled={formPromiseState === "pending" ||
          formPromiseState === "success"}
      />
      {#if phone.showValidation}
        <div
          class="validation"
          in:tada={{ duration: 400, disable: tadaDisabled }}
          data-msg
          bind:this={phoneValidEl}
        />
      {/if}
    </span>
  </div>
  <div class="submit-wrapper">
    <button
      type="submit"
      class:active={submitBtnIsActive}
      on:mousedown={submitBtnActivate}
      on:mouseup={submitBtnUnactivate}
      on:mouseleave={submitBtnUnactivate}
      class={formPromiseState}
    >
      {#if formPromiseState === "pending"}
        Please wait...
      {:else}
        Continue
      {/if}
      {#if formPromiseState === "success"}
        <div class="success-wrapper"><ion-icon name="checkmark" /></div>
      {/if}
    </button>
    {#await formPromise}{""}{:catch error}
      <div class="form-error">An error has occured.</div>
    {/await}
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
    border: none;
    background: none;
    font-size: 100%;
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
    text-align: center;
    width: 80%;
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

  button[type="submit"].pending,
  button[type="submit"].success {
    pointer-events: none;
  }
  button[type="submit"].success {
    position: relative;
  }
  button[type="submit"].success::after {
    content: "";
    position: absolute;
    width: calc(100% + 4px);
    height: calc(100% + 4px);
    left: -2px;
    top: -2px;
    background: rgba(255, 255, 255, 0.5);
  }
  .success-wrapper {
    position: absolute;
    top: 0;
    height: 100%;
    display: flex;
    align-items: center;
    right: -10px;
    transform: translateX(100%);
    font-size: 200%;
    opacity: 2;
  }
  .success-wrapper ion-icon {
    --ionicon-stroke-width: 50px;
    color: rgb(48, 92, 35);
  }
  .form-error {
    color: #671818;
  }

  .bottom-text {
    display: flex;
  }
</style>
