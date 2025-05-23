<script lang="ts">
  import "/shared/tailwindinit.css";
  import { useMutationObserver } from "runed";

  let container: HTMLElement;

  const mutationsStack: string[] = [];

  useMutationObserver(
    () => container,
    (mutations) => {
      for (const mutation of mutations) {
        console.log(mutationsStack.pop());
      }
    },
    {
      childList: true,
    },
  );

  function runExpensiveMutation() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 10000; i++) {
      const div = document.createElement("div");
      div.textContent = `Item ${i}`;
      fragment.appendChild(div);
    }
    container.appendChild(fragment);
  }
  function runCheapMutation() {
    const div = document.createElement("div");
    div.textContent = "Cheap item";
    container.appendChild(div);
  }

  function runTest() {
    mutationsStack.unshift("EXPENSIVE");
    runExpensiveMutation();
    mutationsStack.unshift("CHEAP");
    runCheapMutation();
    setTimeout(() => {
      console.log(`Test finished. mutationsStack: ${mutationsStack}`);
    });
  }
</script>

<button type="button" onclick={runTest}>Run Test</button>

<div id="container" bind:this={container}></div>
