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

  let validEl;
  let nameValue = regState.username ?? "";
  let showValidation = false;
  let tadaDisabled = true;
  let validType = "valid";
  // Goals for validation of user input:
  // - Does not pester user about empty input unless they attempt to submit it
  // - It validates as the user types
  // - The validation message only shows if the field is focused
  async function validateName(doTada = false) {
    const updateMsg = async function (message, validType_, tada = doTada) {
      if (tada && showValidation) {
        showValidation = false;
        tadaDisabled = false;
        await timeoutPromise(0);
      } else tadaDisabled = !tada;
      if (!showValidation) {
        showValidation = true;
        await timeoutPromise(0);
      }
      const msgEl = document.querySelector(".validation");
      msgEl.dataset.msg = message;
      validType = validType_;
    };

    finishValidation: if (regState.username === nameValue) {
      validType = "valid";
      showValidation = false;
      await timeoutPromise(0);
    } else if (nameValue === "") {
      await updateMsg("Missing name", "error");
    } else if (nameValue.includes(" ")) {
      await updateMsg("Name cannot include spaces", "error");
    } else if (nameValue.length <= 2) {
      await updateMsg("Name must be at least three letters long", "error");
    } else if (nameValue.length > 32) {
      await updateMsg("Name must be less than 33 characeters", "error");
    } else {
      if (doTada) await updateMsg("Checking availability...", "stall", false);
      else {
        validType = "valid";
        showValidation = false;
      }
      // prettier-ignore
      const result = await postData({url: "is_name_taken", data: () => nameValue, plainText: true});
      if (result["is_taken"]) {
        await updateMsg("Name taken", "error");
        break finishValidation;
      }

      validType = "valid";
      showValidation = false;
      await timeoutPromise(0);
    }
    validEl && updateValidWidth(validEl);
  }
  $: ((...args) => {
    if (!nameValue) {
      validType = "valid";
      showValidation = false;
      return;
    }
    validateName();
  })(nameValue);

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

  let formPromise, formPromiseState;
  $: ((...args) => {
    if (!formPromise) return;
    formPromiseState = "pending";
    formPromise
      .then(() => (formPromiseState = "success"))
      .catch(() => (formPromiseState = "failure"));
  })(formPromise);

  async function formSubmit() {
    await validateName(true);
    if (validType !== "valid") return;
    const getData = () => {
      return {
        username: nameValue,
      };
    };
    formPromise = postData({ url: "set_name", data: getData });
    document.activeElement.blur();
    await formPromise;
    regState.username = nameValue;
    await timeoutPromise(0.5);
    stageStore.set("possession");
  }

  export let exists = true;
  onMount(() => (exists = true));
  function bringNextSection() {
    exists = false;
  }
</script>

<h2 class="sub-title" in:fly={flyIn(0)} out:fly={flyOut(0)}>
  First, give yourself a name.
</h2>
<p class="text" in:fly={flyIn(1)} out:fly={flyOut(1)}>
  This is the sole thing people will refer to you with. It must be unique and
  cannot include spaces (use hyphens "-" or underscores "_" instead).
</p>
<form
  on:submit|preventDefault={formSubmit}
  in:fly={flyIn(2)}
  out:fly={flyOut(2)}
>
  <span style="position: relative;" class={validType}>
    <input
      placeholder="your-name"
      type="text"
      bind:value={nameValue}
      on:focusin={() => {
        if (nameValue) {
          validateName();
        }
      }}
      on:focusout={() => (showValidation = false)}
      disabled={formPromiseState === "pending" ||
        formPromiseState === "success"}
    />
    {#if showValidation}
      <div
        class="validation"
        in:tada={{ duration: 400, disable: tadaDisabled }}
        data-msg=""
        bind:this={validEl}
      />
    {/if}
  </span>

  <button
    class:active={submitBtnIsActive}
    on:mousedown={submitBtnActivate}
    on:mouseup={submitBtnUnactivate}
    on:mouseleave={submitBtnUnactivate}
    class={formPromiseState}
    type="submit"
  >
    {#if formPromiseState === "pending"}
      <div class="spinner" />
    {:else if formPromiseState === "success"}
      <ion-icon name="checkmark" />
    {:else}
      <div name="arrow-extension" class="arrow-extension" />
      <ion-icon class="arrow" name="arrow-forward" />
    {/if}
    {#await formPromise}{""}{:catch error}
      <div class="form-error">An error has occured.</div>
    {/await}
  </button>
</form>
<div
  class="bottom-text"
  in:fly={flyIn(3)}
  out:fly={flyOut(3)}
  on:outroend={bringNextSection}
>
  <p>Already have an account? <a href="#/">Sign In</a></p>
</div>

<style>
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

  button[type="submit"].pending {
    pointer-events: none;
    padding: 0%;
    background: #fff;
    overflow: hidden;
    outline: none !important;
  }
  button[type="submit"].pending .spinner {
    width: 20px;
    height: 20px;
    border: 3px solid #654c44;
    border-radius: 50%;
    animation-name: rotate;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    animation-duration: 2s;
    position: relative;
  }
  button[type="submit"].pending .spinner::after {
    content: "";
    position: absolute;
    right: 0;
    z-index: 100;
    width: 13px;
    height: 13px;
    background: #fff;
    transform: translate(3px, -3px);
  }
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  button[type="submit"].success {
    pointer-events: none;
    color: rgb(48, 92, 35);
    --ionicon-stroke-width: 60px;
    padding: 0;
    font-size: 140%;
  }
  .form-error {
    position: absolute;
    font-size: 75%;
    bottom: 0;
    transform: translate(calc(30px - 100%), 100%);
    left: 0;
    max-width: 200px;
    width: max-content;
    color: #671818;
  }
</style>
