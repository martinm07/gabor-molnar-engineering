<script>
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { stageStore } from "./Helper";

  let submitBtnIsActive = false;
  function submitBtnActivate() {
    this.style.transition = "width 0s, margin-left 0s, transform 0s";
    this.children.namedItem("arrow-extension").style.transition =
      "transform 0s";
    setTimeout(() => (submitBtnIsActive = true), 0);
  }
  function submitBtnUnactivate() {
    submitBtnIsActive = false;
    setTimeout(() => {
      this.style.removeProperty("transition");
      this.children
        .namedItem("arrow-extension")
        .style.removeProperty("transition");
    }, 0);
  }

  function formSubmit() {
    stageStore.set("possession");
    // console.log("Submitted form!");
  }

  const flyIn = (step) => {
    return { delay: step * 100, duration: 500, x: 30 };
  };
  const flyOut = (step) => {
    return { delay: step * 100, duration: 500, x: -30 };
  };

  export let exists = true;
  onMount(() => (exists = true));
  function bringNextSection() {
    exists = false;
  }
</script>

<h2 class="sub-title" in:fly={flyIn(0)} out:fly={flyOut(0)}>
  First, give yourself a name.
</h2>
<p class="text" in:fly={flyIn(1)} out:fly={flyOut(1)}>
  This is the sole thing people will refer to you with. It must be unique and
  cannot include spaces (use hyphens "-" or underscores "_" instead).
</p>
<form
  on:submit|preventDefault={formSubmit}
  in:fly={flyIn(2)}
  out:fly={flyOut(2)}
>
  <input placeholder="your-name" type="text" />
  <button
    class={submitBtnIsActive ? "active" : ""}
    on:mousedown={submitBtnActivate}
    on:mouseup={submitBtnUnactivate}
    on:mouseleave={submitBtnUnactivate}
    type="submit"
  >
    <div name="arrow-extension" class="arrow-extension" />
    <ion-icon name="arrow-forward" />
  </button>
</form>
<div
  class="bottom-text"
  in:fly={flyIn(3)}
  out:fly={flyOut(3)}
  on:outroend={bringNextSection}
>
  <p>Already have an account? <a href="#/">Sign In</a></p>
</div>

<style>
  button[type="submit"] {
    width: 30px;
    border: 1px solid #000;
    border-left: 0;
    border-bottom-right-radius: 3px;
    border-top-right-radius: 3px;
    font-size: 120%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgb(244, 244, 244);
    color: rgb(71, 71, 71);
    position: relative;
    cursor: pointer;
    z-index: 0;
    transition: width 0.2s cubic-bezier(0.22, 0.61, 0.36, 1),
      margin-left 0.2s cubic-bezier(0.22, 0.61, 0.36, 1),
      transform 0.2s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  .arrow-extension {
    position: absolute;
    width: 10px;
    height: 2px;
    background-color: rgb(82, 82, 82);
    transition: transform 0.2s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  button[type="submit"]:hover {
    width: 40px;
    transform: translateX(10px);
    margin-left: -10px;
    background-color: rgb(236, 236, 236);
  }
  button[type="submit"]:hover .arrow-extension {
    transform: translateX(-7px);
  }
  button[type="submit"].active {
    width: 30px;
    background-color: rgb(208, 208, 208);
    transform: translateX(0px);
    margin-left: 0;
  }
</style>
