<script lang="ts">
  import "./style.css";

  interface Props {
    class?: string;
  }
  let { class: class_ = "" }: Props = $props();

  let cardWidth: number = $state(0);
  let cardHeight: number = $state(0);
  let crossLen: number = $derived(
    Math.sqrt(cardWidth ** 2 + cardHeight ** 2) / 2,
  );
</script>

<div
  bind:clientWidth={cardWidth}
  bind:clientHeight={cardHeight}
  class="w-full max-w-96 h-72 bg-rock-100 rounded relative overflow-hidden {class_}"
>
  <div
    style="
  --crossLen: {crossLen}px;
  transform: translate(-50%, -50%) rotate(-45deg) translate(0, 0);
  animation: slideacross 1s linear infinite, delay-animation 2s linear infinite;
  box-shadow: 0 0 50px 30px #fff;
  background-color: #fcfcfb;
  "
    class="absolute w-[300%] h-4 left-1/2 top-1/2"
  ></div>
</div>
