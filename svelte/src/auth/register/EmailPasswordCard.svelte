<script context="module" lang="ts">
  export async function validateEmail(
    email: string,
  ): Promise<ValidationResponse> {
    return { result: 1 };
  }
  export async function validatePassword(
    password: string,
  ): Promise<ValidationResponse> {
    return { result: 1 };
  }

  export async function setEmailPassword({
    email,
    password,
  }: {
    email?: string;
    password?: string;
  }): Promise<ValidationResponse> {
    if (typeof email === "undefined") return { result: -1, code: "EMM" };

    let resp;
    try {
      resp = await fetch_("/register/add_email_password", {
        method: "POST",
        body: JSON.stringify({ email: email, password: password }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      return { result: -1 };
    }
    const result: { result: boolean; code?: string } = await resp.json();
    return { result: result.result ? 1 : -1, code: result.code };
  }
</script>

<script lang="ts">
  import { state } from "./store";
  import type { IForm } from "/shared/components/Form.svelte";
  import Form from "/shared/components/Form.svelte";
  import type { ValidationResponse } from "/shared/types";
  import { statusCodeNameMsg, inputclass } from "./App.svelte";
  import { onMount } from "svelte";
  import { fetch_, snapStylesOnActive } from "/shared/helper";
  import "/shared/tailwindinit.css";

  interface Props {
    onsuccess: Function;
  }
  let { onsuccess }: Props = $props();

  let form: IForm;
  function onSuccess() {
    $state.email = form.getValue("email");
    $state.password = form.getValue("password");
    onsuccess();
  }

  onMount(() => {
    snapStylesOnActive(document.querySelector(".snap-press")!, [
      "margin-right",
      "width",
    ]);
  });
  // 1234567890abcdefghijklmnopqr
</script>

<!-- <div data-transition-delay="100">
  Hello, {$state.page}!
  <button onclick={() => onsuccess()}>Go back</button>
</div> -->
<h2 class="text-2xl ml-10 mt-10 text-text" data-transition-delay="0">
  Hello, {$state.name || "anonymous"}!
</h2>
<div class="grow flex items-center justify-center relative">
  <div
    class="absolute w-full h-full bg-steel-100 z-0"
    style="clip-path: polygon(6% 0, 37% 0, 95% 94%, 91% 100%, 65% 100%, 3% 4%); background: linear-gradient(162deg, var(--background) 0%, var(--background) 10%, var(--steel-100) 50%, var(--steel-100) 100%);"
  ></div>
  <Form
    bind:this={form}
    inputs={[
      {
        name: "email",
        inputAttrs: {
          placeholder: "example@domain.reg",
          class: "w-80 " + inputclass,
          wrapperclass: "mb-8",
          type: "email",
        },
        label: "Email:",
        validateFunc: validateEmail,
        statusclass: "bg-steel-100 -mt-[9px]",
      },
      {
        name: "password",
        inputAttrs: {
          placeholder: "password",
          class: "w-80 " + inputclass,
          type: "password",
        },
        label: "Password:",
        validateFunc: validatePassword,
        statusclass: "bg-steel-100 -mt-[9px]",
      },
    ]}
    {statusCodeNameMsg}
    submitFunc={setEmailPassword}
    onsuccess={onSuccess}
  >
    {#snippet submitBtn()}
      <div class="flex justify-center mt-8 h-14">
        <button
          type="submit"
          class="snap-press border-2 border-rock-800 bg-rock-400 ml-2 px-6 py-3 rounded relative flex items-center justify-end shadow-[inset_-7px_-7px] shadow-steel-200 group transition-[margin-right] hover:-mr-4 hover:bg-rock-500 hover:shadow-rock-500 active:mr-0 active:bg-rock-600 active:shadow-rock-600"
        >
          <div
            class="h-1 w-6 bg-rock-800 rounded-xl group-hover:w-10 transition-[width] group-hover:bg-rock-950 group-active:w-6 group-active:bg-rock-950"
          ></div>
          <div class="absolute -mr-1">
            <div
              class="rotate-45 h-1 w-4 bg-rock-800 mb-1.5 group-hover:bg-rock-950 group-active:bg-rock-950"
            ></div>
            <div
              class="-rotate-45 h-1 w-4 bg-rock-800 group-hover:bg-rock-950 group-active:bg-rock-950"
            ></div>
          </div>
        </button>
      </div>
    {/snippet}
  </Form>
</div>
<button class="absolute bottom-0 left-0 px-4 py-2 flex items-center text-lg"
  ><ion-icon name="arrow-back-outline" class="text-xl mr-1"></ion-icon>Go back</button
>
