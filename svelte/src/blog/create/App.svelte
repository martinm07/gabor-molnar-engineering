<script lang="ts">
  import "/shared/tailwindinit.css";
  import starterPath from "./starter.txt";
  import NodeSelect from "./cursormodes/NodeSelect.svelte";
  import EditText from "./cursormodes/EditText.svelte";
  import Sidebar from "./Sidebar.svelte";
  import firefoxStylesPath from "./css/firefoxDefaultCSS.txt";
  import EditProps from "./cursormodes/EditProps.svelte";
  import { setContext } from "svelte";

  let document_: string = $state("");
  fetch(starterPath)
    .then((resp) => resp.text())
    .then((data) => (document_ = data));
  let docEl: HTMLElement | undefined = $state();

  let shiftPressed = $state(false);
  let nodeHoverTarget: Element | undefined = $state();

  // fetch_(
  //   "https://hg.mozilla.org/mozilla-central/raw-file/tip/layout/style/res/html.css",
  // )
  //   .then((resp) => resp.text())
  //   .then((data) => console.log(data));
  fetch(firefoxStylesPath)
    .then((resp) => resp.text())
    .then((data) => {
      const styleSheet = document.createElement("style");
      styleSheet.textContent = data;
      // Has to be prepended so that other stylesheets can override these defaults
      document.head.prepend(styleSheet);
    });

  setContext("resetHoverTarget", () => (nodeHoverTarget = undefined));
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Shift") shiftPressed = true;
  }}
  onkeyup={(e) => {
    if (e.key === "Shift") shiftPressed = false;
  }}
/>

<EditText {nodeHoverTarget} />
<EditProps />

<div class="grid grid-cols-[2fr_5fr] grid-rows-[48px_1fr] h-screen">
  <div class="row-span-2 border-r-2 border-rock-300 bg-background p-2">
    <Sidebar {nodeHoverTarget} />
  </div>
  <div class="border-b-2 border-rock-300 bg-rock-50 bg-opacity-85"></div>
  <div class="flex col-span-1 justify-center relative z-0 overflow-auto">
    {#if docEl}
      <NodeSelect {shiftPressed} doc={docEl} bind:target={nodeHoverTarget} />
    {/if}
    <div class="doc w-3/4 max-w-[600px]" bind:this={docEl}>
      <div id="default-styles"></div>
      {@html document_}
    </div>
  </div>
</div>
