<script context="module" lang="ts">
  export async function validateEmail(
    email: string,
  ): Promise<ValidationResponse> {
    const email_ = email.trim().toLowerCase();
    if (email_.length === 0) return { result: -1, code: "EMM" };
    else if (
      !email_.match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      )
    )
      return { result: -1, code: "EMI" };
    return { result: 1 };
  }
  export async function validatePassword(
    password: string,
  ): Promise<ValidationResponse> {
    if (password.length === 0) return { result: -1, code: "PWM" };
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
  import { state, changePage } from "./store";
  import type { IForm } from "/shared/components/Form.svelte";
  import Form from "/shared/components/Form.svelte";
  import type { ValidationResponse } from "/shared/types";
  import { statusCodeNameMsg, inputclass } from "./App.svelte";
  import { onMount } from "svelte";
  import { fetch_, snapStylesOnActive } from "/shared/helper";
  import "/shared/tailwindinit.css";

  interface Props {
    transitionpage: (name: string) => void;
  }
  let { transitionpage }: Props = $props();

  let form: IForm;
  function onSuccess() {
    $state.email = form.getValue("email");
    $state.password = form.getValue("password");
    // onsuccess();
    transitionpage("name");
  }

  onMount(() => {
    snapStylesOnActive(document.querySelector(".snap-press")!, [
      "margin-right",
      "width",
    ]);
  });
</script>

<h2
  class="text-2xl ml-10 mt-6 text-steel-500 break-words"
  data-transition-delay="0"
>
  Hello, {$state.name || "anonymous"}!
</h2>
<div
  class="grow flex items-center justify-center relative"
  data-transition-delay="100"
>
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
          class: "w-72 text-base md:w-72 " + inputclass,
          wrapperclass: "mb-5",
          labelclass: "text-base ",
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
          class: "w-72 text-base md:w-72 " + inputclass,
          labelclass: "text-base ",
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
<button
  data-transition-delay="100"
  onclick={() => transitionpage("name")}
  class="absolute bottom-0 left-0 px-4 py-2 flex items-center text-lg hover:underline active:no-underline text-text active:text-text-600"
  ><ion-icon name="arrow-back-outline" class="text-xl mr-1"></ion-icon>Go back</button
>
