<script>
  import DetailsForm from "./DetailsForm.svelte";
  import SecureForm from "./SecureForm.svelte";
  import RecoveryForm from "./RecoveryForm.svelte";
  import { stageStore, stages, newPageIn, postData } from "./Helper";

  $: window.location.hash = "/" + $stageStore;

  let secureRedirect = "recovery";
  $: ((newStage) => {
    if (newStage === "details") secureRedirect = "recovery";
    else if (newStage === "recovery") secureRedirect = "details";
  })($stageStore);

  let doTransition = false;
  const changeStage = (newStage) => {
    doTransition = true;
    setTimeout(() => {
      stageStore.set(newStage);
    });
  };
  onhashchange = (e) => {
    if (
      !doTransition &&
      stages.some((el) => window.location.hash.includes(el))
    ) {
      setTimeout(() => {
        stageStore.set(stages.find((el) => window.location.hash.includes(el)));
      }, 0);
    }
    doTransition = false;
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
      on:success={async (e) => {
        await postData({ url: "finish_registration" });
        changeStage(e.detail.noFactor ? "congrats" : secureRedirect);
      }}
    />
  {:else if $stageStore === "recovery"}
    <RecoveryForm
      bind:doTransition
      on:success={changeStage.bind(null, "congrats")}
    />
  {:else if $stageStore === "congrats"}
    <div in:newPageIn={{ duration: 400, delay: 200, doTransition }}>
      Thank you for signing up!
    </div>
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
