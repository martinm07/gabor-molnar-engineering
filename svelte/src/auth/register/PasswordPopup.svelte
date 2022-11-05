<script>
  // @ts-nocheck

  import { createEventDispatcher } from "svelte";
  import { tada, stageStore } from "./Helper";

  const dispatch = createEventDispatcher();
  function close() {
    dispatch("close");
  }

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

  let passwordVal = "";
  let repasswordVal = "";
  let passwordValidType = "valid";
  let passwordShowValidation;
  function validatePassword() {
    const passwordMsgEl = document.querySelector(".password-group .validation");
    const repasswordMsgEl = document.querySelector(
      ".repassword-group .validation"
    );
    if (!passwordMsgEl || !repasswordMsgEl) return;
    passwordMsgEl.style.removeProperty("display");
    repasswordMsgEl.style.removeProperty("display");

    if (passwordVal === "") {
      passwordMsgEl.dataset.msg = "Missing password.";
      repasswordMsgEl.style.display = "none";
      passwordValidType = "error";
    } else if (passwordVal !== repasswordVal) {
      passwordMsgEl.dataset.msg = "Passwords don't match.";
      repasswordMsgEl.dataset.msg = "Passwords don't match.";
      passwordValidType = "error";
    } else {
      passwordMsgEl.dataset.msg = "";
      repasswordMsgEl.dataset.msg = "";
      passwordValidType = "valid";
      passwordMsgEl.style.display = "none";
      repasswordMsgEl.style.display = "none";
      return true;
    }
    repasswordVal = "";
    return false;
  }
  function clearValid() {
    passwordShowValidation = false;
    passwordValidType = "valid";
  }

  function submit() {
    passwordShowValidation = false;
    setTimeout(() => {
      passwordShowValidation = true;
      setTimeout(() => {
        validatePassword();
        if (passwordValidType === "valid") close();
      }, 0);
    }, 0);
  }
</script>

<main>
  <button class="close" on:click={close}><ion-icon name="close" /></button>
  <p class="text">
    <strong>
      This is an optional change to how you log into this account (in future).
      You may finish registration now, sticking with the recommended default.
    </strong><br />
    Add a password to make 2FA, or instead to have a quicker time logging in, using
    <i>just</i> the password (though note, in the modern day this may also be a security
    threat).
  </p>
  <form on:submit|preventDefault={submit}>
    <!-- For browser "save credentials" support. Dynamically change value. -->
    <input
      class="hidden"
      type="text"
      name="username"
      id="username"
      value="martinm07"
    />
    <div class="group password-group">
      <label for="password">Password:</label>
      <span style="position: relative;" class={passwordValidType}>
        <input
          type="password"
          id="password"
          name="password"
          autocomplete="new-password"
          on:input={clearValid}
          bind:value={passwordVal}
        />
        {#if passwordShowValidation}
          <div
            class="validation"
            in:tada={{ duration: 400 }}
            data-msg
            style="display: none;"
          />
        {/if}
      </span>
    </div>
    <div class="group repassword-group">
      <label for="repassword">Confirm Password:</label>
      <span style="position: relative;" class={passwordValidType}>
        <input
          type="password"
          id="repassword"
          on:input={clearValid}
          bind:value={repasswordVal}
        />
        {#if passwordShowValidation}
          <div
            class="validation"
            in:tada={{ duration: 400 }}
            data-msg
            style="display: none;"
          />
        {/if}
      </span>
    </div>
    <button
      type="submit"
      class:active={submitBtnIsActive}
      on:mousedown={submitBtnActivate}
      on:mouseup={submitBtnUnactivate}
      on:mouseleave={submitBtnUnactivate}>Add Password</button
    >
  </form>
  <div class="is2fa-group">
    <label for="is2fa">2Factor Authentication enabled:</label>
    <input type="checkbox" name="is2fa" id="is2fa" checked />
  </div>
</main>

<style>
  .hidden {
    display: none;
  }

  main {
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
    box-shadow: 2px 2px 2px #8d8d8d, 0 0 20px #adacac;
    flex-direction: column;
    box-sizing: border-box;
  }
  main::-webkit-scrollbar {
    border-bottom-right-radius: 7px;
    border-top-right-radius: 7px;
  }

  .text {
    width: 80%;
    margin-left: 10%;
    color: rgb(39, 39, 39);
    margin-top: 30px;
  }
  .text strong {
    color: #483939;
  }

  form {
    text-align: center;
  }
  .group {
    margin: 10px 0;
  }
  label {
    margin-right: 10px;
    color: rgb(39, 39, 39);
  }
  .group input {
    border: 1px solid #2a2a2a;
    padding: 5px 15px;
    border-radius: 3px;
    box-shadow: inset 1px 1px #e4e4e4;
    width: 150px;
  }
  input:focus {
    outline: 3px solid rgba(0, 0, 0, 0.17);
  }
  button[type="submit"] {
    margin-top: 10px;
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

  .is2fa-group {
    margin-top: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .is2fa-group label {
    user-select: none;
    font-family: "Source Code Pro", monospace;
    letter-spacing: -1px;
    word-spacing: -1px;
  }
  .is2fa-group input {
    height: 20px;
    width: 20px;
    accent-color: #6e6767;
  }

  .close {
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
  .close ion-icon {
    transition: transform 0.15s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  .close:hover ion-icon {
    transform: rotate(90deg);
  }
</style>
