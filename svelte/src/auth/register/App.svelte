<script>
  import { sineInOut } from "svelte/easing";
  import DetailsForm from "./DetailsForm.svelte";
  import SecureForm from "./SecureForm.svelte";
  import RecoveryForm from "./RecoveryForm.svelte";
  import { stageStore, stages } from "./Helper";

  $: window.location.hash = "/" + $stageStore;

  let doTransition = true;
  const changeStage = (newStage) => {
    stageStore.set(newStage);
    window.location.hash = "/" + newStage;
  };
  onhashchange = (e) => {
    if (stages.some((el) => window.location.hash.includes(el))) {
      doTransition = false;
      setTimeout(() => {
        stageStore.set(stages.find((el) => window.location.hash.includes(el)));
      }, 0);
    }
  };
</script>

<main>
  {#if $stageStore === "details"}
    <DetailsForm
      bind:doTransition
      on:success={changeStage.bind(null, "secure")}
    />
  {:else if $stageStore === "secure"}
    <SecureForm
      bind:doTransition
      on:success={changeStage.bind(null, "recovery")}
    />
  {:else if $stageStore === "recovery"}
    <RecoveryForm bind:doTransition />
  {/if}
</main>

<style>
  main {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.page) {
    width: 80%;
    max-width: 600px;
    height: 80%;
    overflow: auto;
    padding: 15px;
    border: 1px solid rgb(125, 125, 125);
    border-radius: 8px;
    box-shadow: 5px 5px 4px 1px #e8e8e8;
    position: absolute;
    overflow-y: scroll;
  }
</style>
