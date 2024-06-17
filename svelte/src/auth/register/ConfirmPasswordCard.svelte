<script context="module" lang="ts">
  import { fetch_, snapStylesOnActive } from "/shared/helper";
  import type { ValidationResponse } from "/shared/types";

  export async function validateConfirmPassword(
    confirmPassword: string,
  ): Promise<ValidationResponse> {
    if (!confirmPassword) return { result: -1, code: "CPM" };
    const password = get(state_).password;
    if (confirmPassword !== password) return { result: -1, code: "PDM" };
    return { result: 1 };
  }

  export async function setConfirmPassword(): Promise<ValidationResponse> {
    let resp;
    try {
      resp = await fetch_("/register/finish", {
        method: "POST",
      });
    } catch (err) {
      return { result: -1 };
    }
    const result: { result: boolean; code?: string } = await resp.json();
    return { result: result.result ? 1 : -1, code: result.code };
  }
</script>

<script lang="ts">
  import { state_ } from "./store";
  import Form from "/shared/components/Form.svelte";
  import { statusCodeNameMsg, inputclass } from "./App.svelte";
  import CenterLine from "/shared/components/CenterLine.svelte";
  import { onMount } from "svelte";
  import { get } from "svelte/store";

  interface Props {
    transitionpage: (name: string) => void;
  }
  let { transitionpage }: Props = $props();

  function onsuccess() {
    $state_.finished = true;
    transitionpage("congrats");
  }

  onMount(() => {
    snapStylesOnActive(document.querySelector(".snap-style")!, ["padding"]);
  });
</script>

<CenterLine
  tag="h2"
  class="text-lg mt-4 text-steel-500"
  data-transition-delay="0"
>
  {#snippet spanContent()}
    {$state_.name || "martinm07"}
    <span class="text-sm inline-block -translate-y-0.5"
      >&#60;{$state_.email || "martin.molnar07@gmail.com"}&#62;</span
    >
  {/snippet}
  {#snippet afterSpanContent()}
    <br />Finally,<br />Confirm password:
  {/snippet}
</CenterLine>
<div
  class="grow flex items-center justify-center relative"
  data-transition-delay="100"
>
  <div
    class="absolute w-full h-full bg-steel-100 z-0"
    style="clip-path: polygon(9% 25%, 100% 59%, 100% 80%, 87% 80%, 0 46%, 0 25%); background: linear-gradient(162deg, var(--background) 0%, var(--background) 10%, var(--steel-100) 50%, var(--steel-100) 100%);"
  ></div>
  <Form
    inputs={[
      {
        name: "confirmpass",
        inputAttrs: {
          type: "password",
          class: inputclass,
        },
        label: "Repeat Password:",
        validateFunc: validateConfirmPassword,
        statusclass: "bg-steel-100 -mt-[9px]",
      },
    ]}
    {statusCodeNameMsg}
    submitFunc={setConfirmPassword}
    {onsuccess}
    formclass="text-center"
  >
    {#snippet submitBtn()}
      <input
        class="snap-style shadow-[inset_5px_5px_var(--background)] border-2 border-stone-500 px-4 py-2 rounded-lg text-stone-500 font-bold cursor-pointer mt-6 transition-all hover:px-8 hover:ring-4 ring-stone-300 active:px-4 hover:bg-opacity-25 hover:bg-stone-400 active:bg-opacity-40 active:bg-stone-600 active:shadow-none active:text-stone-700"
        type="submit"
        value="Finish"
      />
    {/snippet}
  </Form>
</div>
<button
  data-transition-delay="100"
  onclick={() => transitionpage("emailpass")}
  class="absolute bottom-0 left-0 px-4 py-2 flex items-center text-lg hover:underline active:no-underline text-text active:text-text-600"
  ><ion-icon name="arrow-back-outline" class="text-xl mr-1"></ion-icon>Go back</button
>
