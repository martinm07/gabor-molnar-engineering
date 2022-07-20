<script>
  import "./form-style.css";
  import {
    newPageIn,
    turnPage,
    setWarning,
    focusInput,
    postData,
    validateFields,
    clearErrors,
    stageStore,
    specialError,
  } from "./Helper";
  import InputField from "./InputField.svelte";
  import SubmitButton from "./SubmitButton.svelte";
  import { createEventDispatcher, onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { parsePhoneNumber } from "awesome-phonenumber";

  const dispatch = createEventDispatcher();

  export let doTransition;

  let email, phonenumber, recovermethod;
  const state = {
    promise: undefined,
  };
  let dataType = "number",
    disabled = false,
    recoveries = [],
    moveOnTime = -1;

  function recoverySubmit() {
    state.promise = undefined;
    let field = dataType === "number" ? phonenumber : email;
    clearErrors([field]);
    setTimeout(() => {
      if (!validateFields(validateInput, [field])) return;
      state.promise = recoveryPost();
      disabled = true;
      state.promise
        .then((data) => {
          recoveries = [
            ...recoveries,
            { data: data["data"], method: data["method"], id: data["id"] },
          ];
          if (email) email.input.value = "";
          if (phonenumber) phonenumber.input.value = "";
          state.promise = undefined;
        })
        .finally(() => (disabled = false));
    }, 0);
  }

  const recoveryPost = () => {
    return postData(
      "register_recovery",
      () => {
        return {
          recovermethod,
          phonenumber: phonenumber?.value ?? "",
          email: email?.value ?? "",
        };
      },
      {
        "[email_inuse]": specialError.bind(
          state,
          email,
          "You wouldn't recover your account using the email that you would've lost!"
        ),
        "[number_inuse]": specialError.bind(
          state,
          phonenumber,
          "You wouldn't recover your account using the phone number that you'd have lost!"
        ),
        "[invalid_phone]": specialError.bind(
          state,
          phonenumber,
          "Invalid phone number."
        ),
      }
    );
  };
  function deleteOption(e) {
    const el = e.target.closest(".recovery-delete");
    const deleteID = Number.parseInt(el.dataset.id);
    postData(
      "delete_recovery",
      () => {
        return { id: deleteID };
      },
      null
    );
    recoveries = recoveries.filter((opt) => opt.id !== deleteID);
  }
  async function finishRecovery() {
    await postData("finish_registration");
    dispatch("success");
  }
  async function isUsed(field, name) {
    const data = await postData(
      `is_inuse/${name}/${field.value || "_"}`,
      null,
      null,
      true
    );
    return data["is_inuse"];
  }

  const validateInput = function (
    key,
    ignoreMissing = false,
    nowarn = false,
    noasync = false
  ) {
    switch (key) {
      case "email": {
        email.updateInput();

        if (email.value === "") {
          if (!ignoreMissing) {
            email.input.setCustomValidity("Enter an email address.");
            focusInput(email.input);
          } else {
            email.input.setCustomValidity("");
          }
          break;
        }
        if (
          !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
            email.value
          )
        ) {
          email.input.setCustomValidity("Invalid email address");
          break;
        }
        isUsed(email, "email").then((used) => {
          if (used) {
            email.input.setCustomValidity(
              "You wouldn't recover your account using the email that you would've lost!"
            );
            email.updateInput();
          }
        });

        email.input.setCustomValidity("");
        setWarning(email.input, "");
        break;
      }
      case "phonenumber": {
        phonenumber.updateInput();

        if (phonenumber.value === "") {
          if (!ignoreMissing) {
            phonenumber.input.setCustomValidity("Enter a phone number.");
            focusInput(phonenumber.input);
          } else {
            phonenumber.input.setCustomValidity("");
          }
          break;
        }
        isUsed(phonenumber, "number").then((used) => {
          if (used) {
            phonenumber.updateInput();
            phonenumber.input.setCustomValidity(
              "You wouldn't recover your account using the phone number that you'd have lost!"
            );
          }
        });

        phonenumber.input.setCustomValidity("");
        break;
      }
      default:
        break;
    }
  };

  function waitMoveOn() {
    moveOnTime = 10;
    const waitMoveOnInterval = setInterval(() => {
      moveOnTime--;
      if (moveOnTime < 0) clearInterval(waitMoveOnInterval);
    }, 1000);
  }

  let tabParent, resizeObs;
  let tabHeight = 100;
  function refreshObserver() {
    setTimeout(() => {
      resizeObs.disconnect();
      resizeObs.observe(tabParent.children[tabParent.childElementCount - 1]);
    }, 0);
  }
  $: if (dataType) refreshObserver();

  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";

  const lineWidth = tweened(100, {
    duration: 300,
    easing: cubicOut,
  });
  const lineOffset = tweened(0, {
    duration: 300,
    easing: cubicOut,
  });
  let lineParent;
  function changeType(e) {
    if (disabled) return;
    const choice =
      e.target.closest(".choice-number") ?? e.target.closest(".choice-email");
    if (!choice) return;
    lineOffset.set(
      e.target.getBoundingClientRect().x - lineParent.getBoundingClientRect().x
    );
    lineWidth.set(e.target.getBoundingClientRect().width);
    dataType = choice.dataset.choice;
  }

  let numberMethod, emailMethod;
  $: if (numberMethod && emailMethod)
    recovermethod = dataType === "number" ? numberMethod : emailMethod;

  onMount(() => {
    resizeObs = new ResizeObserver((entries) => {
      tabHeight = entries[0].target.clientHeight;
    });
    changeType({ target: lineParent.children[0] });
    recovermethod = dataType === "number" ? numberMethod : emailMethod;

    postData(
      "register_get_recovery",
      null,
      {
        FORBIDDEN: () => {
          doTransition = false;
          stageStore.set("details");
        },
      },
      true
    ).then((data) => {
      recoveries = data.map((opt) => {
        if (["sms", "voice"].includes(opt.method))
          opt.data = parsePhoneNumber(opt.data).getNumber("national");
        return opt;
      });
      if (recoveries.length === 0) waitMoveOn();
    });
  });
</script>

<div
  class="page"
  in:newPageIn={{ duration: 400, delay: 200, doTransition }}
  out:turnPage={{ duration: 400, degrees: -5, doTransition }}
>
  <h1>Don't Lose Your Account</h1>
  <form on:submit|preventDefault={recoverySubmit} novalidate>
    <div>
      <div
        class="type-choose"
        on:click={changeType}
        bind:this={lineParent}
        class:disabled
      >
        <div class="choice choice-number" data-choice="number">
          Phone number
        </div>
        <div class="choice choice-email" data-choice="email">Email</div>
        <div
          class="choice-line"
          style="width: {$lineWidth}px; left: {$lineOffset}px;"
        />
      </div>
    </div>

    <div
      class="type-parent"
      bind:this={tabParent}
      style="height: {tabHeight}px;"
    >
      {#if dataType === "number"}
        <div class="type-tab" transition:fly={{ y: -10 }}>
          <InputField
            {validateInput}
            {disabled}
            name="phonenumber"
            type="number"
            label="Phone number:"
            bind:this={phonenumber}
          />
          <InputField
            {validateInput}
            {disabled}
            name="recovermethod-number"
            label="Method of Contact:"
            type="select"
            selectPairs={{ sms: "SMS text message", voice: "Voice call" }}
            bind:value={numberMethod}
          />
        </div>
      {:else if dataType === "email"}
        <div class="type-tab" transition:fly={{ y: -10 }}>
          <InputField
            {validateInput}
            {disabled}
            name="email"
            type="email"
            label="Email:"
            bind:this={email}
          />
          <InputField
            {validateInput}
            {disabled}
            name="recovermethod-email"
            label="Method of Contact:"
            type="select"
            selectPairs={{ email: "Email" }}
            bind:value={emailMethod}
          />
        </div>
      {/if}
    </div>
    <div class="group-submit">
      <SubmitButton text="Add Recovery Option" {disabled} />
      <form
        class="finish"
        on:submit|preventDefault={finishRecovery}
        class:hidden={state.promise}
      >
        <SubmitButton
          text={`Finish${moveOnTime >= 0 ? " (" + moveOnTime + " secs)" : ""}`}
          disabled={moveOnTime >= 0}
        />
      </form>

      {#if state.promise}
        {#await state.promise}
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
            </svg>
          </span>
        {:catch error}
          <span class="status error">{error.message}</span>
        {/await}
      {/if}
    </div>
  </form>
  <div class="recovery-list">
    {#each recoveries as { data, method, id } (id)}
      <div class="recovery-option">
        <span class="recovery-data">{data}</span>
        <span class="recovery-method">{method}</span>
        <span class="recovery-delete" data-id={id} on:click={deleteOption}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="512"
            height="512"
            ><g id="_01_align_center" data-name="01 align center"
              ><path
                d="M22,4H17V2a2,2,0,0,0-2-2H9A2,2,0,0,0,7,2V4H2V6H4V21a3,3,0,0,0,3,3H17a3,3,0,0,0,3-3V6h2ZM9,2h6V4H9Zm9,19a1,1,0,0,1-1,1H7a1,1,0,0,1-1-1V6H18Z"
              /><rect x="9" y="10" width="2" height="8" /><rect
                x="13"
                y="10"
                width="2"
                height="8"
              /></g
            ></svg
          >
        </span>
      </div>
    {/each}
  </div>
</div>

<style>
  h1 {
    margin-left: 30px;
    color: rgb(54, 54, 54);
  }

  .type-choose {
    position: relative;
    display: flex;
    width: 50%;
    justify-content: space-evenly;
    border-bottom: 2px solid #ebebeb;
  }
  .choice {
    padding: 5px 10px;
    font-family: monospace;
    font-size: 140%;
    font-weight: bold;
    color: #5f5f5f;
    cursor: pointer;
  }
  .choice-line {
    position: absolute;
    height: 3px;
    background-color: #000;
    bottom: 0;

    width: 100px;
    left: 36px;
  }
  .type-choose.disabled {
    opacity: 0.5;
    cursor: default !important;
  }

  .type-parent {
    position: relative;
    margin-top: 20px;
    height: 100px;
  }
  .type-tab {
    position: absolute;
    width: 100%;
  }

  .finish {
    display: inline-block;
    margin-left: 15px;
  }
  .finish.hidden {
    display: none;
  }

  :global(.iti) {
    width: auto;
  }

  .recovery-list {
    width: 70%;
    margin-left: 30px;
    border-left: 2px solid #7b7b7b;
    padding-left: 15px;
    box-sizing: border-box;
  }
  .recovery-option {
    display: flex;
    width: 100%;
    justify-content: space-between;
    font-family: monospace;
    color: #4e4e4e;
    border-bottom: 1px solid #cdcdcd;
  }
  .recovery-method {
    margin-left: auto;
    margin-right: 20px;
    text-transform: uppercase;
  }
  .recovery-delete {
    cursor: pointer;
    padding: 5px;
  }
  .recovery-delete svg {
    width: 15px;
    height: 15px;
    fill: #b60d0d;
  }
  .recovery-option span {
    display: flex;
    align-items: center;
  }
  .recovery-option:last-of-type {
    border-bottom: none;
  }
</style>
