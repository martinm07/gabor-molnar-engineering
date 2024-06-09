<script lang="ts">
  import { onMount } from "svelte";
  import { snapStylesOnActive } from "/shared/helper";
  import "./style.css";

  onMount(() => {
    snapStylesOnActive(document.querySelector(".snap-press")!, [
      "margin-right",
      "width",
    ]);
  });
</script>

{#snippet oauth(name, iconname)}
  <div class="my-1 flex justify-center">
    <a
      href="https://google.com"
      class="py-1 px-3 border-2 bg-stone-200 border-stone-800 text-stone-800 font-bold text-lg rounded inline-flex items-center justify-center hover:bg-stone-300 active:bg-stone-400"
    >
      <ion-icon name={iconname} class="mr-2 text-xl"></ion-icon>{name}
    </a>
  </div>
{/snippet}

<div class="absolute w-screen h-screen bg-stone-300"></div>
<div class="absolute w-screen h-screen flex items-center justify-center">
  <div class="flex flex-col md:w-1/2 w-5/6 h-4/5 bg-stone-100 rounded-md p-4">
    <h1 class="shrink text-center font-serif text-stone-800 text-4xl">
      Registration
    </h1>
    <h2 class="text-center shrink text-stone-800">
      Already have an account? <a
        class="text-blue-400 underline hover:no-underline"
        href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&pp=ygUjcmljayBhc3RsZXkgbmV2ZXIgZ29ubmEgZ2l2ZSB5b3UgdXA%3D"
        >Log in</a
      >.
    </h2>
    <div class="grow flex items-center justify-center relative">
      <div
        class="absolute w-full h-full bg-stone-50 z-0"
        style="clip-path: polygon(0 75%, 100% 0, 100% 31%, 0% 100%);"
      ></div>
      <div class="flex z-10">
        <input
          class="border-2 border-stone-800 rounded font-mono py-3 px-6 text-lg text-stone-800 shadow-[inset_-9px_-9px_#000] shadow-stone-100 focus:ring-4 focus:outline-none ring-stone-400"
          type="text"
          placeholder="your-username"
        />
        <button
          class="snap-press border-2 border-stone-800 bg-stone-300 ml-2 p-3 rounded relative flex items-center justify-end shadow-[inset_-9px_-9px_#000] shadow-stone-200 group transition-[margin-right] hover:-mr-4 hover:bg-stone-400 hover:shadow-stone-400 active:mr-0 active:bg-stone-500 active:shadow-stone-500"
        >
          <div
            class="h-1 w-6 bg-stone-800 rounded-xl group-hover:w-10 transition-[width] group-hover:bg-stone-950 group-active:w-6 group-active:bg-stone-950"
          ></div>
          <div class="absolute -mr-1">
            <div
              class="rotate-45 h-1 w-4 bg-stone-800 mb-1.5 group-hover:bg-stone-950 group-active:bg-stone-950"
            ></div>
            <div
              class="-rotate-45 h-1 w-4 bg-stone-800 group-hover:bg-stone-950 group-active:bg-stone-950"
            ></div>
          </div>
        </button>
      </div>
    </div>
    <div class="text-center">
      <h2 class="text-2xl mb-3">Or, sign up with...</h2>
      <div>
        {@render oauth("Google", "logo-google")}
        {@render oauth("GitHub", "logo-github")}
        {@render oauth("LinkedIn", "logo-linkedin")}
      </div>
    </div>
  </div>
</div>
