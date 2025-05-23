<script module lang="ts">
  export async function validateName(
    name: string,
  ): Promise<ValidationResponse> {
    const name_ = name.trim();
    if (name_.length === 0) return { result: -1, code: "UNM" };
    if (name_.length < 3) return { result: -1, code: "UNS" };
    return { result: 1 };
  }

  export async function setName({
    name,
  }: {
    name?: string;
  }): Promise<ValidationResponse> {
    if (typeof name === "undefined") return { result: -1, code: "UNM" };
    if (name === get(state_).name) return { result: 1 };

    let resp;
    try {
      if (!get(state_).name) {
        await fetch_("/register/set_loginmode", {
          method: "POST",
          body: "password",
          headers: { "Content-Type": "text/plain" },
        });
      }
      resp = await fetch_("/register/add_username", {
        method: "POST",
        body: name,
        headers: { "Content-Type": "text/plain" },
      });
    } catch (err) {
      return { result: -1 };
    }
    const result: { result: boolean; code?: string } = await resp.json();
    return { result: result.result ? 1 : -1, code: result.code };
  }
</script>

<script lang="ts">
  import Form, { type IForm } from "/shared/components/Form.svelte";
  import { statusCodeNameMsg } from "./App.svelte";
  import { onMount } from "svelte";
  import { fetch_, snapStylesOnActive } from "/shared/helper";
  import { state_ } from "./store";
  import "/shared/tailwindinit.css";
  import type { ValidationResponse } from "/shared/types";
  import { get } from "svelte/store";

  $effect(() => {
    form.setValue("name", $state_.name ?? "");
  });
  onMount(() => {
    snapStylesOnActive(document.querySelector(".snap-press")!, [
      "margin-right",
      "width",
    ]);
  });

  interface Props {
    transitionpage: (name: string) => void;
  }
  let { transitionpage }: Props = $props();

  let form: IForm;
  let leaving: boolean = $state(false);
  function onSuccess() {
    $state_.name = form.getValue("name");
    leaving = true;
    transitionpage("emailpass");
  }
</script>

{#snippet oauth(name: string, iconname: string, url: string)}
  <div class="my-1 flex justify-center">
    <a
      href={urlRoot + url}
      class="py-1 px-3 border-2 bg-rock-200 border-rock-800 text-dark font-bold text-lg rounded inline-flex items-center justify-center hover:bg-rock-300 active:bg-rock-400"
    >
      <ion-icon name={iconname} class="mr-2 text-xl"></ion-icon>{name}
    </a>
  </div>
{/snippet}

<h2 class="text-center shrink text-dark" data-transition-delay="0">
  Already have an account? <a
    class="text-blue-400 underline hover:no-underline"
    href={urlRoot + "login"}>Log in</a
  >.
</h2>
<div
  class="grow flex items-center justify-center relative"
  data-transition-delay="250"
>
  <div
    class="absolute w-full h-full bg-steel-100 z-0"
    style="clip-path: polygon(0 75%, 100% 0, 100% 31%, 0% 100%);"
  ></div>
  <div class="flex z-10">
    <Form
      bind:this={form}
      inputs={[
        {
          name: "name",
          inputAttrs: {
            placeholder: "your-username",
            class:
              "w-64 shadow-[inset_-7px_-7px_var(--steel-100)] focus:shadow-[inset_-7px_-7px_var(--steel-100),0_0_0_3px_var(--background),0_0_0_7px_var(--steel-200)] focus:ring-0 transition-shadow duration-100",
            autocomplete: "name",
          },
          statusclass: "bg-steel-100 -mt-[9px]",
          validateFunc: validateName,
        },
      ]}
      {statusCodeNameMsg}
      submitFunc={setName}
      formclass="block sm:flex"
      onsuccess={onSuccess}
    >
      {#snippet submitBtn()}
        <button
          type="submit"
          class="snap-press border-2 border-rock-800 bg-rock-400 p-3 rounded relative flex items-center justify-end shadow-[inset_-7px_-7px] shadow-steel-200 group transition-[margin-right] hover:-mr-4 hover:bg-rock-500 hover:shadow-rock-500 active:mr-0 active:bg-rock-600 active:shadow-rock-600 h-14 mt-3 ml-auto sm:ml-2 sm:mt-0"
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
      {/snippet}
    </Form>
  </div>
</div>
<div class="text-center" data-transition-delay="500">
  <h2 class="text-2xl mb-3">Or, sign up with...</h2>
  <div>
    {@render oauth("Google", "logo-google", "register/oauth/google")}
    {@render oauth("GitHub", "logo-github", "register/oauth/github")}
    {@render oauth("LinkedIn", "logo-linkedin", "register/oauth/linkedin")}
  </div>
</div>
{#if $state_.name && !leaving}
  <button
    type="button"
    data-transition-delay="100"
    onclick={() => transitionpage("emailpass")}
    class="absolute bottom-0 right-0 px-4 py-2 flex items-center text-lg hover:underline active:no-underline text-text active:text-text-600"
    >Go forward<ion-icon name="arrow-forward" class="text-xl ml-1"
    ></ion-icon></button
  >
{/if}
