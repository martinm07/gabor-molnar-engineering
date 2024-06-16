<script context="module" lang="ts">
  export interface IForm {
    getValue: (name: string) => string;
  }
</script>

<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import Input from "./Input.svelte";
  import type { IInput } from "./Input.svelte";
  import { type ValidationResponse } from "/shared/types";
  import { preventDefault, splitCodes } from "/shared/helper";
  import type { Snippet } from "svelte";
  import type { Action } from "svelte/action";

  interface InputAttrs extends HTMLInputAttributes {
    wrapperclass?: string;
    outerclass?: string;
    labelclass?: string;
  }

  interface Props {
    inputs: Array<{
      name: string;
      inputAttrs: InputAttrs;
      validateFunc: (value: any) => Promise<ValidationResponse>;
      label?: string;
      statusclass?: string;
    }>;
    statusCodeNameMsg: (code: string) => { input: string | null; msg: string };
    submitFunc: (values: Record<string, any>) => Promise<ValidationResponse>;
    submitBtn?: Snippet;
    onsuccess?: Function;
    formclass?: string;
  }
  let {
    inputs,
    submitFunc,
    statusCodeNameMsg,
    submitBtn,
    onsuccess,
    formclass = "",
  }: Props = $props();

  const allNames = inputs.map(({ name }) => name);
  if (new Set(allNames).size !== inputs.length)
    throw new Error(`All names must be unique. Got ${allNames}`);

  // On successful form submits, the browser still believes it's invalid, so we invoke a ghost click
  //  that doesn't do anything after setting the validity to valid.
  let ghostSubmit = false;
  // svelte-ignore non_reactive_update
  let ghostBtn: HTMLInputElement;
  async function onSubmit(e: SubmitEvent) {
    if (ghostSubmit) {
      ghostSubmit = false;
      return;
    }

    // Clear errors and state
    genericError = null;
    inputBinds.forEach((inp) =>
      inp.setValidState({ result: 0, code: "" }, false),
    );
    // Start validation of all inputs
    const failedIds: number[] = [];
    const promises = inputs.map(({ validateFunc }, i) =>
      validateFunc(inputBinds[i].getValue()).then((state) => {
        if (state.result === -1) {
          inputBinds[i].setValidState(state, true);
          failedIds.push(i);
        } else inputBinds[i].setValidState({ result: -2 }, false);
      }),
    );

    await Promise.all(promises);
    // Check if any validations failed, and focus the topmost failure
    if (failedIds.length > 0)
      inputBinds.find((_, i) => failedIds.includes(i))?.focus();
    // Otherwise, move onto attempting a submit to the server
    else {
      // Creates dictionary of input names associated with their values
      const submitVals: { [key: string]: any } = inputBinds.reduce(
        (p, c, i) => ({ ...p, [inputs[i].name]: c.getValue() }),
        {},
      );
      const resp = await submitFunc(submitVals);

      // If failure, attempt to report error to user
      if (resp.result === -1) {
        const failedIds: number[] = [];
        // The code sent by the server may be multiple codes concatenated together
        for (const code of splitCodes(resp.code ?? "GER")) {
          // The statusCodeNameMsg needs to associate codes to input names
          const { input: inputName, msg } = statusCodeNameMsg(code);
          const i = inputs.findIndex(({ name }) => inputName === name);
          // If no association is found, report the generic error
          if (i === -1) genericError = msg;
          else {
            inputBinds[i].setValidState({ result: -1, code: msg }, true);
            failedIds.push(i);
          }
        }
        // Focus the topmost input element which failed
        inputBinds.find((_, i) => failedIds.includes(i))?.focus();
        // Set inputs which didn't fail to 'neutral' state
        inputBinds.forEach(
          (inp, i) =>
            !failedIds.includes(i) && inp.setValidState({ result: -2 }, false),
        );
      } else if (resp.result === 1) {
        // Form submit success
        inputBinds.forEach((inp) => inp.setValidState({ result: 1 }, false));
        if (onsuccess) onsuccess();

        // This is to make sure the browser believes the form was submitted correctly
        setTimeout(() => {
          inputBinds.forEach((inp) => inp && inp.setInputToValid());
          ghostSubmit = true;
          ghostBtn.click();
        });
      }
    }
  }

  let inputBinds: IInput[] = Array(inputs.length);
  let genericError: string | null = $state(null);
  const getSubmitBtnEl: Action = (node) => {
    const btn = node.querySelector("[type=submit]");
    if (!btn)
      throw new Error(
        "submitBtn snippter must have a button/input of type 'submit'",
      );
    ghostBtn = <HTMLInputElement>btn;
  };

  export function getValue(name: string) {
    const i = inputs.findIndex((inp) => inp.name === name);
    if (i === -1)
      throw new Error(
        `Name not found. Expected one of ${inputs.map((inp) => "'" + inp.name + "'").join(", ")}. Got '${name}'`,
      );
    return inputBinds[i].getValue();
  }
</script>

<!-- svelte-ignore non_reactive_update -->
<form
  method="POST"
  class="relative max-w-full {formclass}"
  novalidate
  onsubmit={preventDefault(onSubmit)}
  use:getSubmitBtnEl
>
  {#each inputs as input, i}
    <Input
      bind:this={inputBinds[i]}
      inpId={input.name}
      label={input.label}
      {statusCodeNameMsg}
      statusclass={input.statusclass}
      {...input.inputAttrs}
    />
  {/each}
  {#if submitBtn}
    {@render submitBtn()}
  {:else}
    <input
      class="border-2 border-stone-500 px-4 py-2 rounded-lg text-stone-500 font-bold cursor-pointer mt-6"
      type="submit"
      value="Submit"
      bind:this={ghostBtn}
    />
  {/if}
  {#if genericError}
    <div
      class="text-red-500 text-center absolute bottom-0 translate-y-full text-balance"
    >
      {genericError}
    </div>
  {/if}
</form>
