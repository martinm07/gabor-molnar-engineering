<script lang="ts">
  import { onMount } from "svelte";
  import "/shared/tailwindinit.css";
  import { gsap } from "gsap";
  onMount(() => {
    const box = document.querySelector(".box")!;
    box.addEventListener("mouseenter", () => {
      gsap.to(".box", { x: 100 });
    });
    box.addEventListener("mouseleave", () => {
      gsap.to(".box", { x: 0 });
    });
  });
</script>

<div class="w-screen h-screen flex items-center justify-center bg-fuchsia-50">
  <div class="box h-10 w-10 bg-red-500 relative">
    <div class="absolute"></div>
  </div>
</div>
