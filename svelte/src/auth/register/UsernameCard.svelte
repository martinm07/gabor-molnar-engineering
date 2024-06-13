<script lang="ts">
  import Form from "/shared/components/Form.svelte";
  // import Card from "./Card.svelte";
  import { statusCodeNameMsg } from "./App.svelte";
  import { setName, validateName } from "./App.svelte";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { snapStylesOnActive } from "/shared/helper";
  import "/shared/tailwindinit.css";

  const urlRoot = globalThis.jinjaParsed
    ? ""
    : import.meta.env.VITE_DEV_FLASK_SERVER;

  onMount(() => {
    snapStylesOnActive(document.querySelector(".snap-press")!, [
      "margin-right",
      "width",
    ]);
  });

  interface Props {
    onsuccess: Function;
  }
  let { onsuccess }: Props = $props();
</script>

{#snippet oauth(name, iconname, url)}
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
    href={urlRoot + "/login"}>Log in</a
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
      inputs={[
        {
          name: "name",
          inputAttrs: {
            placeholder: "your-username",
            class:
              "w-64 shadow-[inset_-7px_-7px_var(--steel-100)] focus:shadow-[inset_-7px_-7px_var(--steel-100),0_0_0_3px_var(--background),0_0_0_7px_var(--steel-200)] focus:ring-0 transition-shadow duration-100",
          },
          statusclass: "bg-steel-100 -mt-[9px]",
          validateFunc: validateName,
        },
      ]}
      {statusCodeNameMsg}
      submitFunc={setName}
      formclass="flex"
      {onsuccess}
    >
      {#snippet submitBtn()}
        <button
          type="submit"
          class="snap-press border-2 border-rock-800 bg-rock-400 ml-2 p-3 rounded relative flex items-center justify-end shadow-[inset_-7px_-7px] shadow-steel-200 group transition-[margin-right] hover:-mr-4 hover:bg-rock-500 hover:shadow-rock-500 active:mr-0 active:bg-rock-600 active:shadow-rock-600"
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
    {@render oauth("Google", "logo-google", "/register/oauth/google")}
    {@render oauth("GitHub", "logo-github", "/register/oauth/github")}
    {@render oauth("LinkedIn", "logo-linkedin", "/register/oauth/linkedin")}
  </div>
</div>
