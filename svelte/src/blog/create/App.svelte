<script lang="ts">
  import "/shared/tailwindinit.css";
  import starterPath from "./starter.txt";
  import NodeSelect, {
    type INodeSelect,
  } from "./cursormodes/NodeSelect.svelte";
  import EditText from "./cursormodes/EditText.svelte";
  import Sidebar from "./Sidebar.svelte";
  import firefoxStylesPath from "./editors/css/firefoxDefaultCSS.txt";
  import EditProps from "./cursormodes/EditProps.svelte";
  import { setContext } from "svelte";
  import { nodeHoverTarget } from "./store";

  let document_: string = $state("");
  fetch(starterPath)
    .then((resp) => resp.text())
    .then((data) => (document_ = data));
  let docEl: HTMLElement | undefined = $state();

  let shiftPressed = $state(false);

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

  let nodeSelect: INodeSelect | undefined = $state();

  setContext("resetHoverTarget", () => ($nodeHoverTarget = undefined));
  setContext(
    "updateHighlight",
    () => nodeSelect && nodeSelect.updateHighlight(),
  );
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Shift") shiftPressed = true;
  }}
  onkeyup={(e) => {
    if (e.key === "Shift") shiftPressed = false;
  }}
/>

<EditText />
<EditProps />

<div class="grid grid-cols-[30%_1fr] grid-rows-[48px_1fr] h-screen">
  <div
    class="row-span-2 border-r-2 border-rock-300 bg-background p-2 overflow-y-scroll"
  >
    <Sidebar />
  </div>
  <div class="border-b-2 border-rock-300 bg-rock-50 bg-opacity-85"></div>
  <div class="flex col-span-1 justify-center relative z-0 overflow-auto">
    {#if docEl}
      <NodeSelect {shiftPressed} doc={docEl} bind:this={nodeSelect} />
    {/if}
    <div class="doc w-3/4 max-w-[600px]" bind:this={docEl}>
      <div id="default-styles"></div>
      {@html document_}
    </div>
  </div>
</div>