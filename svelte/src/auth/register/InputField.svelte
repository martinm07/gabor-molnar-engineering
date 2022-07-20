<svelte:options accessors />

<script>
  import { tada, setWarning } from "./Helper";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { onMount } from "svelte";
  import "intl-tel-input/build/css/intlTelInput.css";
  import intlTelInput from "intl-tel-input";
  // import flags from "./assets/flags.png";
  // import flags2x from "./assets/flags@2x.png";

  const marginBottom = tweened(17, {
    duration: 250,
    easing: cubicOut,
  });

  const autoGenerateLabel = (name) =>
    name
      .split("-")
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(" ") + ":";
  const setMargin = () => {
    const getHeight = () =>
      info ? Math.floor(+getComputedStyle(info)["height"].slice(0, -2)) : 0;
    setTimeout(() => {
      getHeight() !== 0
        ? marginBottom.set(getHeight() + 3)
        : marginBottom.set(17);
    }, 0);
  };

  const clearInfo = () => {
    input.setCustomValidity("");
    setWarning(input, "");
    input = input;
  };

  export const updateInput = () => (input = input);

  export let validateInput,
    name,
    label = undefined,
    type = "text",
    autocomplete = true,
    passwordVisibleToggle = true,
    selectPairs = {};
  label ??= autoGenerateLabel(name);

  export let info = undefined,
    input = undefined,
    value = "",
    disabled = false;

  $: input ? setMargin() : undefined;

  let iti;
  onMount(() => {
    if (type === "number") {
      iti = intlTelInput(document.querySelector("#" + name), {
        utilsScript:
          "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
      });
    } else if (type === "select") {
      input.children[0].selected = true;
      value = input.value;
    }
  });
  // Fix bug with intl-tel-input where elements disorganize (...?) if component is remounted
  //  but not calling onMount (i.e. onDestroy is never called because transition out never
  //  manages to finish).
  $: {
    if (group && type === "number" && group.querySelector(":scope > input")) {
      try {
        group.children[0].appendChild(group.children[2]);
        group.prepend(group.children[1]);
      } catch (err) {
        setTimeout(() => {
          iti = intlTelInput(document.querySelector("#" + name), {
            utilsScript:
              "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
          });
        }, 400);
      }
    }
  }
  let group;

  // Put the value to the input whenever it changes, unless change was due to user typing it in
  let isInput = false;
  $: {
    if (iti && !isInput) iti.setNumber(value);
    isInput = false;
  }

  // "Show password" functionality
  let passwordVisible = false;
  $: if (input && type === "password" && passwordVisibleToggle)
    passwordVisible ? (input.type = "text") : (input.type = "password");

  $: {
    if (info) {
      const inputRect = input.getBoundingClientRect();
      const groupRect = group.getBoundingClientRect();
      info.style.left = inputRect.x - groupRect.x + "px";
      info.style.top = inputRect.height + inputRect.y - groupRect.y + "px";
    }
  }
</script>

<div
  class="group group-{name}"
  class:disabled
  style="margin-bottom: {$marginBottom}px;"
  bind:this={group}
>
  <label for={name}>{label}</label>
  {#if type === "text"}
    <input
      type="text"
      {name}
      id={name}
      autocomplete={autocomplete ? "on" : "off"}
      {disabled}
      bind:this={input}
      bind:value
      on:blur={validateInput.bind(null, name, true, false, false)}
      on:input={clearInfo}
    />
  {:else if type === "email"}
    <input
      type="email"
      {name}
      id={name}
      autocomplete={autocomplete ? "on" : "off"}
      {disabled}
      bind:this={input}
      bind:value
      on:blur={validateInput.bind(null, name, true, false, false)}
      on:input={clearInfo}
    />
  {:else if type === "password"}
    {#if passwordVisibleToggle}
      <input
        type="password"
        {name}
        id={name}
        {disabled}
        bind:this={input}
        bind:value
        on:blur={validateInput.bind(null, name, true, false, false)}
        on:input={clearInfo}
        style="padding-right: 30px;"
      />
      <div class="password-visible-btn" class:disabled>
        {#if passwordVisible}
          <svg
            on:click={() => (!disabled ? (passwordVisible = false) : null)}
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            version="1.1"
            id="Capa_1"
            x="0px"
            y="0px"
            viewBox="0 0 509.319 509.319"
            style="enable-background:new 0 0 509.319 509.319;"
            xml:space="preserve"
            width="512"
            height="512"
          >
            <g>
              <path
                d="M488.942,188.222L488.942,188.222c-16.507-24.031-36.159-45.743-58.432-64.555l60.096-60.075   c12.135-12.848,11.558-33.101-1.29-45.236c-12.346-11.661-31.65-11.647-43.979,0.031l-69.248,69.269   c-37.697-18.837-79.311-28.5-121.451-28.203C159.882,60.36,71.893,108.716,20.334,188.222c-27.112,39.874-27.112,92.264,0,132.139   c16.507,24.031,36.159,45.743,58.432,64.555L18.67,445.054c-12.501,12.501-12.501,32.769,0,45.269   c12.501,12.501,32.769,12.501,45.269,0l69.248-69.269c37.697,18.837,79.311,28.5,121.451,28.203   c94.756-0.905,182.745-49.262,234.304-128.768C516.112,280.586,516.112,228.125,488.942,188.222z M73.113,284.222   c-12.285-18.016-12.285-41.717,0-59.733C112.451,162.079,180.866,124,254.638,123.454c24.861-0.121,49.543,4.215,72.875,12.8   l-39.552,39.531c-43.381-18.416-93.478,1.823-111.893,45.204c-9.046,21.309-9.046,45.38,0,66.689l-51.989,52.011   C104.466,323.794,87.295,305.106,73.113,284.222z M436.163,284.222c-39.339,62.41-107.754,100.489-181.525,101.035   c-24.861,0.121-49.543-4.215-72.875-12.8l39.552-39.552c43.381,18.416,93.478-1.823,111.893-45.204   c9.046-21.309,9.046-45.38,0-66.689l51.989-51.989c19.612,15.895,36.783,34.583,50.965,55.467   C448.448,242.505,448.448,266.206,436.163,284.222L436.163,284.222z"
              />
            </g>
          </svg>
        {:else}
          <svg
            on:click={() => (!disabled ? (passwordVisible = true) : null)}
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            version="1.1"
            id="Capa_1"
            x="0px"
            y="0px"
            viewBox="0 0 509.348 509.348"
            style="enable-background:new 0 0 509.348 509.348;"
            xml:space="preserve"
            width="512"
            height="512"
          >
            <g>
              <path
                d="M488.935,188.541C437.397,109.024,349.407,60.662,254.652,59.773C159.898,60.662,71.908,109.024,20.37,188.541   c-27.16,39.859-27.16,92.279,0,132.139c51.509,79.566,139.504,127.978,234.283,128.896   c94.754-0.889,182.744-49.251,234.283-128.768C516.153,280.919,516.153,228.429,488.935,188.541z M436.199,284.541   c-39.348,62.411-107.769,100.488-181.547,101.035c-73.777-0.546-142.198-38.624-181.547-101.035   c-12.267-18.022-12.267-41.712,0-59.733c39.348-62.411,107.769-100.488,181.547-101.035   c73.777,0.546,142.198,38.624,181.547,101.035C448.466,242.829,448.466,266.519,436.199,284.541z"
              />
              <circle cx="254.652" cy="254.674" r="85.333" />
            </g>
          </svg>
        {/if}
      </div>
    {:else}
      <input
        type="password"
        {name}
        id={name}
        {disabled}
        bind:this={input}
        bind:value
        on:blur={validateInput.bind(null, name, true, false, false)}
        on:input={clearInfo}
      />
    {/if}
  {:else if type === "number"}
    <input
      type="text"
      data-isphone
      {name}
      id={name}
      {disabled}
      bind:this={input}
      on:blur={validateInput.bind(null, name, true, false, false)}
      on:input={() => {
        clearInfo();
        value = iti.getNumber();
        isInput = true;
      }}
    />
  {:else if type === "select"}
    <select
      name="recovermethod"
      id="recovermethod"
      bind:this={input}
      on:change={() => {
        value = input.value;
        validateInput(name, true, false, false);
      }}
      {disabled}
    >
      {#each Object.entries(selectPairs) as pair, i}
        <option value={pair[0]}>{pair[1]}</option>
      {/each}
    </select>
  {/if}
  {#if input && input.validity.customError}
    <span class="info error" in:tada={{ duration: 400 }} bind:this={info}
      >{input.validationMessage}</span
    >
  {:else if input && input.dataset.warning === "true"}
    <span class="info warning" bind:this={info}
      >{input.dataset.warningMessage}</span
    >
  {/if}
</div>

<style>
  .group {
    --input-width: 225px;
    display: flex;
    position: relative;
    align-items: center;
    margin: 5px 30px;
    margin-bottom: 17px;
    font-family: monospace;
    font-size: 115%;
    color: #3b3b3b;
  }
  .group label {
    display: inline-block;
  }
  .group input {
    display: inline-block;
    box-sizing: border-box;
    border: 1px solid #838383;
    padding: 4px 5px;
    border-radius: 3px;
    max-width: var(--input-width);
    width: 100vw;
    margin-left: auto;
    font-weight: bold;
    color: rgb(71, 71, 71);
    transition: box-shadow 0.3s cubic-bezier(0.64, 0.28, 0, 2.32);
  }
  .group:nth-of-type(1) input,
  .group:nth-of-type(1) .password-visible-btn svg {
    margin-right: 60px;
  }
  .group:nth-of-type(2) input,
  .group:nth-of-type(2) .password-visible-btn svg {
    margin-right: 30px;
  }
  .group input:focus {
    box-shadow: inset 2px 2px 6px 0 #d9d9d9, 0 0 0 3px #00000024;
    outline: none;
  }
  .group.disabled {
    opacity: 0.5;
  }

  .group select {
    background: #fff;
    border: 1px solid #838383;
    padding: 4px 5px;
    border-radius: 3px;
    margin-left: 30px;
  }
  .group select:hover {
    background: rgb(235, 235, 235);
  }
  .group select:disabled {
    background: #fff;
  }

  .info {
    position: absolute;
    font-size: 80%;
    font-weight: bold;
    margin-left: 6px;
    margin-top: -3px;
    width: 225px;
  }
  .info.error {
    color: #cd0e0e;
  }
  .info.warning {
    color: #e67f11;
  }

  :global(.iti__country) {
    width: 400px;
    white-space: initial;
  }
  :global(.iti) {
    margin-left: auto;
    /* position: absolute; */
    right: 0;
    width: 235px;
  }
  .fakeInput {
    opacity: 0;
  }
  input[data-isphone] {
    padding-left: 50px !important;
    /* max-width: calc(var(--input-width) - 45px); */
  }
  :global(.iti__selected-flag) {
    border-right: 1px solid #838383;
  }
  :global(.iti__country-list) {
    transform: translateX(calc(-100% + var(--input-width)));
    border-radius: 4px;
    border: 1px solid #838383;
    box-shadow: none;
  }
  :global(.iti__divider) {
    border-bottom: 1px solid #838383;
  }
  :global(.iti__country.iti__highlight) {
    background-color: rgba(0, 0, 0, 0.04);
  }
  input::placeholder {
    font-weight: lighter;
    color: #b4b4b4;
    letter-spacing: 1px;
    opacity: 1;
  }
  .iti__flag {
    background-image: url("./assets/flags.png");
  }
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    .iti__flag {
      background-image: url("./assets/flags@2x.png");
    }
  }

  .password-visible-btn {
    position: absolute;
    height: 20px;
    width: auto;
    right: 0;
  }
  .password-visible-btn svg {
    height: 100%;
    width: auto;
    position: absolute;
    right: 5px;
    fill: #616161;
    padding: 5px;
    transform: translate(5px, -5px);
  }
  .password-visible-btn svg:hover {
    fill: #949494;
    cursor: pointer;
  }
  .password-visible-btn.disabled svg {
    cursor: default;
    fill: #616161;
  }
</style>
