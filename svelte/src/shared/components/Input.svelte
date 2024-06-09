<script context="module" lang="ts">
  export interface IInput {
    setValidState: (newValidState: ValidationResponse, doTada: boolean) => void;
    getValue: () => string;
    setInputToValid: () => void;
    focus: () => void;
  }
  export const allowedInputTypes = ["text", "date", "datetime-local", "email", "month", "number", "password", "search", "tel", "time", "url", "week"];
  export type AllowedInputTypes = "text" | "date" | "datetime-local" | "email" | "month" | "number" | "password" | "search" | "tel" | "time" | "url" | "week";
</script>

<script lang="ts">
  import type { Action } from "svelte/action";
  import type { ValidationResponse } from "./form";
  import { tada } from "/shared/helper";
  import "./input.css";
  import type { HTMLInputAttributes } from "svelte/elements";

  interface Props extends HTMLInputAttributes {
    inpId: string;
    statusCodeNameMsg: (code: string) => { input: string | null; msg: string };
    class?: string | null;
    label?: string;
  }
  let { inpId, statusCodeNameMsg, class: inpClass = "", label, ...rest }: Props = $props();

  if (rest["type"] && !allowedInputTypes.includes(rest["type"]))
    throw new Error(`Type of input is not allowed. Got ${rest["type"]}. Expected one of ${allowedInputTypes.map(str => "'" + str + "'").join(", ")}.`);
  
  let value = $state("");
  export const getValue = () => value;

  let validState: ValidationResponse = $state({ result: -2 });
  let tadaDisabled: boolean = $state(false);
  let reinstanceStatus: boolean = $state(false);

  export function setValidState(newValidState: ValidationResponse, doTada: boolean) {
    tadaDisabled = !doTada;
    if (doTada) reinstanceStatus = !reinstanceStatus;
    validState = newValidState;
  }

  const setToSpanWidth: Action = (node) => {
    const span = node.firstElementChild;
    if (!span || !(span instanceof HTMLElement)) throw new Error("Text needs to be contained in a span");
    node.style.width = `${span.offsetWidth + 1}px`;
    return {
      update: () => {
        node.style.removeProperty("width");
        node.style.width = `${span.offsetWidth + 1}px`;
      }
    }
  }

  let inputEl: HTMLInputElement;
  export const setInputToValid = () => inputEl.setCustomValidity("");
  export const focus = () => {
    setTimeout(() => inputEl.focus());
  }
  // This is to make sure the browser doesn't think on submit attempts that it successfully submitted
  const setValidityInvalid: Action = (node) => {
    if (!(node instanceof HTMLInputElement)) throw new Error("Element needs to be an input");
    node.setCustomValidity("bad");
    inputEl = node;
  }
</script>

<div class="mb-5 flex items-center">
  {#if label}
    <label for={inpId} class="inline-block mr-4 text-xl">{label}</label>
  {/if}
  <div class="relative inline-block">
    {#snippet statusMsg(classes, msg)}
      <label class="block cursor-text absolute bg-white -mt-3 mx-4 text-sm font-bold leading-tight text-balance px-1 box-content {classes}" use:setToSpanWidth={msg} for={inpId} in:tada|global={{ duration: 400, disable: tadaDisabled }}>
        <span>
          {@html msg}
        </span>
      </label>
    {/snippet}
    <input
      bind:value
      class="base-text-input {inpClass}"
      type={rest.type ?? "text"}
      name="name"
      id={inpId}
      disabled={validState.result === 0 || validState.result === 1}
      use:setValidityInvalid
      oninput={() => validState.result = -2}
      {...rest}
    />
    {#key reinstanceStatus}
      {@render statusMsg(
        validState.result === -1 ? "err text-red-500" : 
        (validState.result === 1 ? "succ text-green-500 !w-5 text-xl !cursor-default" : 
        (validState.result === 0 ? "pending text-stone-500" : 
        "")),
        validState.result === 1 ? "<ion-icon class=\"w-5\" name=\"checkmark-outline\"></ion-icon>" :
        (validState.result === -1 || validState.result === 0 ? statusCodeNameMsg(validState.code ?? "").msg : 
        "")
      )}
    {/key}
  </div>
</div>
