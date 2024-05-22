<script>
  // @ts-nocheck

  import { createEventDispatcher } from "svelte";
  import { tada, timeoutPromise, postData, regState } from "./Helper";

  const dispatch = createEventDispatcher();
  function close() {
    dispatch("close");
  }

  let is2FA = regState.is2FA;
  let is2FA_firstCall = true;
  $: is2FA_firstCall // svelte does NOT react to the assignment made in the reactive statement, which makes this possible
    ? (is2FA_firstCall = false)
    : postData({ url: "set_is2fa", data: () => is2FA, plainText: true }).then(
        () => (regState.is2FA = is2FA)
      );

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

  let formPromise, formPromiseState;
  $: ((...args) => {
    if (!formPromise) return;
    formPromiseState = "pending";
    formPromise
      .then(() => (formPromiseState = "success"))
      .catch(() => (formPromiseState = "failure"));
  })(formPromise);
  // formPromiseState = "success";
  if (regState.isPassword) formPromise = Promise.resolve();

  async function submit() {
    passwordShowValidation = false;
    await timeoutPromise(0);
    passwordShowValidation = true;
    await timeoutPromise(0);
    validatePassword();
    if (passwordValidType !== "valid") return;
    // formPromise = timeoutPromise(2, null, false); // "/set_password"
    const getData = () => {
      return {
        password: passwordVal,
      };
    };
    formPromise = postData({ url: "set_password", data: getData });
    document.activeElement.blur();
    formPromise.then(() => {
      passwordVal = "";
      repasswordVal = "";
      regState.isPassword = true;
    });
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
          disabled={formPromiseState === "pending" ||
            formPromiseState === "success"}
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
          disabled={formPromiseState === "pending" ||
            formPromiseState === "success"}
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
      on:mouseleave={submitBtnUnactivate}
      class={formPromiseState}
      disabled={formPromiseState && formPromiseState !== "failure"}
    >
      {#if formPromiseState === "pending"}
        Please wait...
      {:else}
        Add Password
      {/if}
      {#if formPromiseState === "success"}
        <div class="success-wrapper"><ion-icon name="checkmark" /></div>
      {/if}
    </button>
    {#await formPromise}{""}{:catch error}
      <div class="form-error">An error has occured.</div>
    {/await}
  </form>
  <div class="is2fa-group">
    <label for="is2fa">2Factor Authentication enabled:</label>
    <input type="checkbox" name="is2fa" id="is2fa" bind:checked={is2FA} />
  </div>
</main>

<style>
  .hidden {
    display: none;
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
</style>
