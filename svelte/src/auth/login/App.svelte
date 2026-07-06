<script lang="ts">
  import "/shared/tailwindinit.css";
  import { tada } from "/shared/helper";
  import ArrowRightIcon from "phosphor-svelte/lib/ArrowRightIcon";

  // globalThis.flashedMessages = ["Username and/or password incorrect."];

  let errMsg: string | null = $state(null);
  setTimeout(() => {
    errMsg = globalThis.flashedMessages.at(0) ?? null;
  }, 50);
</script>

<div
  class="grow max-w-3xl min-h-[50vh] mx-6 rounded-lg border-2 border-rock-300 p-4 pb-16 bg-background flex flex-col"
>
  <h1 class="text-4xl text-rock-700 font-merry text-center py-3">
    Log into <a href="/" class="text-rock-600 underline hover:no-underline"
      >structural-design.eu</a
    >
  </h1>
  <form
    method="post"
    class="text-xl text-rock-800 flex items-center flex-col my-auto"
  >
    <input type="hidden" name="csrf_token" value={globalThis.csrfToken} />
    <div class="flex items-center mb-6 max-md:flex-col max-md:items-start">
      <label for="username" class="mr-3 max-md:mb-1">Username:</label>
      <input
        class="border-2 border-rock-300 rounded bg-rock-100 px-3 py-1 focus:bg-white focus:ring-4 ring-steel-300/50 outline-none font-mono"
        type="text"
        name="username"
        id="username"
        placeholder="username"
        required
      />
    </div>
    <div
      class="flex items-center w-full md:px-8 max-md:flex-col max-md:items-start"
    >
      <label for="password" class="mr-3 max-md:mb-1">Password:</label>
      <input
        class="border-2 border-rock-300 rounded bg-rock-100 px-3 py-1 focus:bg-white focus:ring-4 ring-steel-300/50 outline-none font-mono grow max-md:w-full"
        type="password"
        name="password"
        id="password"
        placeholder="pa55w0rd"
        required
      />
    </div>
    <div class="mt-8 text-center">
      <button
        class="text-xl font-mono border-2 border-steel-200 bg-steel-50 px-4 py-2 rounded-lg text-steel-800 hover:bg-steel-100 active:translate-y-1 active:bg-steel-200 focus:ring-4 ring-steel-100 [word-spacing:-4px]"
        >Log in<ArrowRightIcon class="inline-block ml-2 text-2xl" /></button
      >
      {#if errMsg}
        <div
          class="text-red-700 font-bold text-lg absolute -translate-x-1/4 translate-y-2"
          in:tada={{ duration: 400 }}
          aria-live="polite"
        >
          {errMsg}
        </div>
      {/if}
    </div>
  </form>
</div>
