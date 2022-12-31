<script>
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { flyIn, flyOut } from "./Helper";

  export let exists = true;
  onMount(() => (exists = true));
  function bringNextSection() {
    exists = false;
  }
</script>

<h2 class="sub-title" in:fly={flyIn(0)} out:fly={flyOut(0)}>
  Thank you for signing up.
</h2>

<p class="text" in:fly={flyIn(1)} out:fly={flyOut(1)}>
  You have done something uncommon, signing up to a completely fresh community
  like this. Let's see to a place of information and consideration, a place for
  people to learn the intricacies of the engineering in structures. We at the
  very least hope you find use in the content we provide. There are even more
  exciting things on the horizon!
</p>

<div
  class="navigation"
  in:fly={flyIn(2)}
  out:fly={flyOut(2)}
  on:outroend={bringNextSection}
>
  <a href="/#">Guidance Documents</a>
  <a href="/#">Your Profile</a>
</div>

<style>
  .navigation {
    text-align: center;
  }
  .navigation a {
    padding: 0 15px;
    position: relative;
    display: inline-flex;
    align-items: center;
  }
  .navigation a::after {
    content: ">";
    text-decoration: underline #fff;
    font-size: 130%;
    position: absolute;
    transform: scaleY(1.5);
    right: 0px;
    transition: right 0.2s;
  }
  .navigation a:hover {
    text-decoration: none;
  }
  .navigation a:hover::after {
    right: -8px;
  }
  .navigation a::before {
    content: "-";
    position: absolute;
    right: 2px;
    transform: scaleY(1.5) scaleX(4);
    margin-top: -5px;
    opacity: 0;
    transition: opacity 0.2s, right 0.2s;
  }
  .navigation a:hover::before {
    opacity: 1;
    right: -1px;
  }
</style>
