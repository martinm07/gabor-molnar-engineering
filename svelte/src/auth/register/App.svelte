<script context="module" lang="ts">
  export function statusCodeNameMsg(code: string): {
    input: string | null;
    msg: string;
  } {
    switch (code) {
      case "GER":
        return {
          input: null,
          msg: "An unexpected error has occured. Please try again later.",
        };
      case "UNM":
        return { input: "name", msg: "Username is required" };
      case "UNS":
        return {
          input: "name",
          msg: "Username must be more<br />than 2 characters",
        };
      case "UNT":
        return { input: "name", msg: "Username is already taken" };
      case "UNP":
        return { input: "name", msg: "Username was detected as profane" };
      default:
        return { input: null, msg: code };
    }
  }
</script>

<script lang="ts">
  import Card from "./Card.svelte";
  import UsernameCard from "./UsernameCard.svelte";
  import EmailPasswordCard from "./EmailPasswordCard.svelte";
  import { fade } from "svelte/transition";
  import { state, changePage } from "./store";
  import "./style.css";
  interface State {
    page: string;
  }

  const startPage: string = "name";

  // let state: State = $state({ page: startPage });
  // document.addEventListener("keydown", (e) => {
  //   if (e.key === "ArrowLeft") state.page = "name";
  //   else if (e.key === "ArrowRight") state.page = "emailpass";
  // });
</script>

<!-- <Card> -->
<!-- {#snippet card()} -->
{#if $state.page === "name"}
  <Card card={UsernameCard} onsuccess={() => changePage("emailpass", true)}>
    <!-- {#snippet card()}
      <UsernameCard onsuccess={() => (state.page = "emailpass")} />
    {/snippet} -->
  </Card>
{:else if $state.page === "emailpass"}
  <Card card={EmailPasswordCard} onsuccess={() => changePage("name", true)}>
    <!-- {#snippet card()}
      <EmailPasswordCard onsuccess={() => (state.page = "name")} />
    {/snippet} -->
  </Card>
{/if}
<!-- {/snippet} -->
<!-- </Card> -->

<!-- {#if state.page === "name"}
  <Card>
    {#snippet card()}
      Hello world!
    {/snippet}
  </Card>
{:else if state.page === "emailpass"}
  <Card>
    {#snippet card()}
      Hello world at the Email/Password page!
    {/snippet}
  </Card>
{/if} -->

<!-- {#if state.page === "name"}
  <Card />
{:else}
  <Card />
{/if} -->

<!-- {#if state.page === "name"}
  <div class="absolute w-screen h-screen bg-background-200 -z-10"></div>
  <div
    class="absolute w-screen h-screen flex items-center justify-center"
    transition:fade|global={{ duration: 1000 }}
  >
    <div
      class="absolute flex flex-col md:w-1/2 w-5/6 h-4/5 bg-background rounded-md p-4"
    >
      <h1 class="shrink text-center font-serif text-dark text-4xl">
        Registration
      </h1>
      Hello world!
    </div>
  </div>
{:else if state.page === "emailpass"}
  <div class="absolute w-screen h-screen bg-background-200 -z-10"></div>
  <div
    class="absolute w-screen h-screen flex items-center justify-center"
    transition:fade|global={{ duration: 1000 }}
  >
    <div
      class="absolute flex flex-col md:w-1/2 w-5/6 h-4/5 bg-background rounded-md p-4"
    >
      <h1 class="shrink text-center font-serif text-dark text-4xl">
        Registration
      </h1>
      Hello world at the Email/Password page!
    </div>
  </div>
{/if} -->
