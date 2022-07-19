<script>
  import "./form-style.css";
  import {
    focusInput,
    setWarning,
    newPageIn,
    turnPage,
    stageStore,
    postData,
    specialError,
    clearErrors,
    validateFields,
  } from "./Helper";
  import InputField from "./InputField.svelte";
  import SubmitButton from "./SubmitButton.svelte";
  import { createEventDispatcher, onMount } from "svelte";

  const dispath = createEventDispatcher();

  export let doTransition;

  let password, confirmpassword;
  const secureState = {
    promise: undefined,
    disabled: false,
    complete: false,
  };
  let token, secondfactor;
  const tokenState = {
    promise: undefined,
    checkDisabled: true,
    disabled: false,
    complete: false,
    resendToken: 0,
    noFactor: false,
  };

  const startResendCountdown = (startTime) => {
    tokenState.resendToken = startTime;
    const resendBuffer = setInterval(() => {
      tokenState.resendToken--;
      if (tokenState.resendToken < 0) clearInterval(resendBuffer);
    }, 1000);
  };

  const secureSubmit = function () {
    secureState.promise = undefined;
    clearErrors([password, confirmpassword]);
    setTimeout(() => {
      if (!validateFields(validateInput, [password, confirmpassword])) return;
      secureState.promise = securePost();
      secureState.disabled = true;
      secureState.promise
        .then(() => {
          password.value = "";
          confirmpassword.value = "";
          secureState.complete = true;
        })
        .catch(() => (secureState.disabled = false));
    }, 0);
  };
  const tokenSubmit = function () {
    clearErrors([token]);
    setTimeout(() => {
      if (tokenState.checkDisabled) {
        if (tokenState.noFactor) {
          tokenState.complete = true;
          tokenState.disabled = true;
          tokenState.checkDisabled = true;
          tokenState.promise = Promise.resolve();
          postData("send_token_nothing", null, null);
          return;
        }
        tokenState.promise = tokenPost();
        tokenState.disabled = true;
        tokenState.promise
          .then(() => {
            tokenState.checkDisabled = false;
            tokenState.disabled = false;
          })
          .catch(() => (tokenState.disabled = false));
      } else {
        if (!validateFields(validateInput, [token])) return;
        const promise = checkTokenPost();
        tokenState.disabled = true;
        promise
          .then(() => {
            tokenState.checkDisabled = true;
            tokenState.complete = true;
          })
          .catch(() => (tokenState.disabled = false));
      }
    }, 0);
  };

  const securePost = postData.bind(null, "register_add_password", () => {
    return { password: password.value };
  });
  const tokenPost = function () {
    const returnData = postData(
      `send_token_${secondfactor.input.value}`,
      null,
      {}
    );
    returnData
      .then((data) => startResendCountdown(data["buffer_penalty"]))
      .catch(() => {});
    return returnData;
  };
  let checkTokenPost;
  onMount(() => {
    // prettier-ignore
    checkTokenPost = postData.bind(null, "check_token", () => {
      return { token: token.value };
    }, {
      "[incorrect_token]": specialError.bind(null, token, "Incorrect token!")
    });
  });

  function validateInput(
    key,
    ignoreMissing = false,
    nowarn = false,
    noasync = false
  ) {
    switch (key) {
      case "password": {
        password.updateInput();

        if (!ignoreMissing && password.value === "") {
          password.input.setCustomValidity("Enter a password.");
          focusInput(password.input);
          break;
        }
        if (!nowarn && password.value.length > 0 && password.value.length < 5) {
          setWarning(
            password.input,
            "Password is weak! We recommend passwords contain more than 5 characters."
          );
          break;
        }

        setWarning(password.input, "");
        password.input.setCustomValidity("");
        break;
      }
      case "confirmpassword": {
        confirmpassword.updateInput();

        // If password has been entered and "password" and "confirm password" dont match...
        if (password.value !== "" && password.value !== confirmpassword.value) {
          password.updateInput();
          password.input.setCustomValidity("Passwords need to match.");
          confirmpassword.input.setCustomValidity("Passwords need to match.");
          break;
        }

        confirmpassword.input.setCustomValidity("");
        console.log(password.value ? true : false);
        if (
          (ignoreMissing || password.value) &&
          password.value === confirmpassword.value
        ) {
          password.updateInput();
          password.input.setCustomValidity("");
        }
        break;
      }
      case "token": {
        token.updateInput();
        token.input.setCustomValidity("");
        break;
      }
      case "secondfactor": {
        secondfactor.updateInput();
        if (secondfactor.input.value === "nothing") {
          setWarning(secondfactor.input, "Are you sure?");
          tokenState.noFactor = true;
          break;
        } else {
          tokenState.noFactor = false;
        }

        setWarning(secondfactor.input, "");
        secondfactor.input.setCustomValidity("");
        break;
      }
      default:
        break;
    }
  }

  onMount(() => {
    postData(
      "register_get_secure",
      null,
      {
        FORBIDDEN: () => {
          doTransition = false;
          stageStore.set("details");
        },
      },
      true
    ).then((data) => {
      if (data["is_password_made"]) {
        secureState.disabled = true;
        secureState.promise = Promise.resolve();
        secureState.complete = true;
      }
      if (data["is_token_sent"]) {
        tokenState.checkDisabled = false;
        tokenState.promise = Promise.resolve({
          twofa_data: data["twofa_data"],
          twofa_method: data["twofa_method"],
        });
        secondfactor.input.value = data["twofa_method"];
        startResendCountdown(data["retry_buffer"]);
      }
      if (data["is_2fa_made"]) {
        tokenState.disabled = true;
        tokenState.checkDisabled = true;
        tokenState.promise = Promise.resolve();
        tokenState.complete = true;
        secondfactor.input.value = data["twofa_method"];
      }
    });
  });

  $: if (secureState.complete && tokenState.complete) dispath("success");
</script>

<div
  class="page"
  in:newPageIn={{ duration: 400, delay: 200, doTransition }}
  out:turnPage={{ duration: 400, degrees: -5, doTransition }}
>
  <h1>Secure your Account</h1>
  <h2>Make a Password</h2>
  <form on:submit|preventDefault={secureSubmit} novalidate>
    <InputField
      {validateInput}
      name="password"
      type="password"
      bind:this={password}
      disabled={secureState.disabled}
    />
    <InputField
      {validateInput}
      name="confirmpassword"
      label="Confirm Password:"
      type="password"
      bind:this={confirmpassword}
      disabled={secureState.disabled}
      passwordVisibleToggle={false}
    />
    <div class="group-submit">
      <SubmitButton text="Set password" disabled={secureState.disabled} />
      {#if secureState.promise}
        {#await secureState.promise}
          <div class="spinner">
            <div class="circsec circ1" />
            <div class="circsec circ2" />
            <div class="circsec circ3" />
          </div>
          <span class="status waiting">Please wait...</span>
        {:then data}
          <span class="status success">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              version="1.1"
              id="Capa_1"
              x="0px"
              y="0px"
              viewBox="0 0 507.506 507.506"
              style="enable-background: new 0 0 507.506 507.506"
              xml:space="preserve"
              width="512"
              height="512"
            >
              <g>
                <path
                  style="fill: rgb(47, 112, 28)"
                  d="M163.865,436.934c-14.406,0.006-28.222-5.72-38.4-15.915L9.369,304.966c-12.492-12.496-12.492-32.752,0-45.248l0,0   c12.496-12.492,32.752-12.492,45.248,0l109.248,109.248L452.889,79.942c12.496-12.492,32.752-12.492,45.248,0l0,0   c12.492,12.496,12.492,32.752,0,45.248L202.265,421.019C192.087,431.214,178.271,436.94,163.865,436.934z"
                />
              </g>
            </svg></span
          >
        {:catch error}
          <span class="status error">{error.message}</span>
        {/await}
      {/if}
    </div>
  </form>
  <h2>Verify Second Factor</h2>
  <form on:submit|preventDefault={tokenSubmit} novalidate>
    <InputField
      {validateInput}
      name="secondfactor"
      label="What will you use to prove you are you?"
      bind:this={secondfactor}
      disabled={tokenState.disabled || !tokenState.checkDisabled}
      type="select"
      selectPairs={{
        sms: "Phone SMS text message",
        voice: "Phone Voice call",
        email: "Email",
        nothing: "Nothing, just a password",
      }}
    />
    <InputField
      {validateInput}
      name="token"
      bind:this={token}
      disabled={tokenState.disabled || tokenState.checkDisabled}
    />
    <div class="group-submit">
      {#if tokenState.checkDisabled}
        <SubmitButton
          text={tokenState.noFactor ? "Confirm nothing" : "Send token"}
          disabled={tokenState.disabled}
        />
      {:else}
        <SubmitButton text="Verify" disabled={tokenState.disabled} />
      {/if}
      {#if tokenState.promise}
        {#await tokenState.promise}
          <div class="spinner">
            <div class="circsec circ1" />
            <div class="circsec circ2" />
            <div class="circsec circ3" />
          </div>
          <span class="status waiting">Please wait...</span>
        {:then data}
          {#if !tokenState.checkDisabled}
            <span class="status">
              {data["twofa_method"] === "sms"
                ? "7-digit code"
                : data["twofa_method"] === "voice"
                ? "Voice call"
                : "Email"}
              sent to&nbsp;<a href="#/details"
                >{data["twofa_data"]}<svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="512"
                  height="512"
                  ><g id="_01_align_center" data-name="01 align center"
                    ><path
                      d="M22.94,1.06a3.626,3.626,0,0,0-5.124,0L0,18.876V24H5.124L22.94,6.184A3.627,3.627,0,0,0,22.94,1.06ZM4.3,22H2V19.7L15.31,6.4l2.3,2.3ZM21.526,4.77,19.019,7.277l-2.295-2.3L19.23,2.474a1.624,1.624,0,0,1,2.3,2.3Z"
                    /></g
                  >
                </svg></a
              >.&nbsp;

              <button
                class="retry-token"
                class:enabled={tokenState.resendToken < 0}
                disabled={tokenState.resendToken >= 0}
                on:click={() => {
                  if (tokenState.resendToken >= 0) return;
                  tokenState.disabled = true;
                  tokenState.checkDisabled = true;
                  tokenState.promise = tokenPost();
                  tokenState.promise
                    .then(() => {
                      tokenState.disabled = false;
                      tokenState.checkDisabled = false;
                    })
                    .catch(() => (tokenState.disabled = false));
                }}
              >
                Resend code?&nbsp;{#if tokenState.resendToken >= 0}
                  <span>({tokenState.resendToken} secs)</span>
                {/if}
              </button>
            </span>
          {:else}
            <span class="status success">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                version="1.1"
                id="Capa_1"
                x="0px"
                y="0px"
                viewBox="0 0 507.506 507.506"
                style="enable-background: new 0 0 507.506 507.506"
                xml:space="preserve"
                width="512"
                height="512"
              >
                <g>
                  <path
                    style="fill: rgb(47, 112, 28)"
                    d="M163.865,436.934c-14.406,0.006-28.222-5.72-38.4-15.915L9.369,304.966c-12.492-12.496-12.492-32.752,0-45.248l0,0   c12.496-12.492,32.752-12.492,45.248,0l109.248,109.248L452.889,79.942c12.496-12.492,32.752-12.492,45.248,0l0,0   c12.492,12.496,12.492,32.752,0,45.248L202.265,421.019C192.087,431.214,178.271,436.94,163.865,436.934z"
                  />
                </g>
              </svg></span
            >
          {/if}
        {:catch error}
          {#if error.message.includes("[no_phone]")}
            <span class="status error">
              No phone number was provided!&nbsp;<a href="#/details"
                >Add number</a
              >.
            </span>
          {:else if error.message.includes("[no_email]")}
            <span class="status error">
              No email was provided!&nbsp;<a href="#/details">Add email</a>.
            </span>
          {:else}
            <span class="status error">{error.message}</span>
          {/if}
        {/await}
      {/if}
    </div>
  </form>
</div>

<style>
  h1 {
    margin-left: 30px;
    color: rgb(54, 54, 54);
  }

  :global(form:first-of-type .group-submit) {
    padding-bottom: 20px;
  }

  .status a {
    display: flex;
    align-items: center;
  }
  .status a svg {
    height: 12px;
    fill: currentColor;
  }

  .retry-token {
    outline: none;
    background-color: #0000;
    border: none;
    color: rgb(58, 58, 58);
    text-decoration: underline;
  }
  .retry-token:hover {
    color: darkslateblue;
  }
  .retry-token.enabled:hover {
    text-decoration: none;
  }
  /* TODO: Make sure hover isn't needed to see buffer time on mobile devices... */
  .retry-token span {
    display: none;
  }
  .retry-token:hover span {
    display: inline-block;
  }
  .retry-token.enabled {
    cursor: pointer;
  }
  .retry-token.enabled span {
    display: none !important;
  }
</style>
