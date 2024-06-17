<script lang="ts">
  import { state_ } from "./store";
  import { onMount } from "svelte";
  import "./style.css";
  import { get } from "svelte/store";
  interface Props {
    transitionpage: (name: string) => void;
  }
  let { transitionpage }: Props = $props();

  const urlRoot = globalThis.jinjaParsed
    ? ""
    : import.meta.env.VITE_DEV_FLASK_SERVER;

  onMount(() => {
    const canvas = <HTMLCanvasElement>document.getElementById("name");
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    canvas.width *= window.devicePixelRatio;

    const username = get(state_).name || "anonymous";
    const FONT = "32px 'Indie Flower'";
    const ANGLE = (-8 * Math.PI) / 180;

    ctx.font = FONT;

    const metrics = ctx.measureText(username);

    const heightUp =
      (Math.abs(Math.sin(ANGLE)) * metrics.width) / 2 +
      Math.cos(ANGLE) * metrics.actualBoundingBoxAscent;
    const heightDown =
      (Math.abs(Math.sin(ANGLE)) * metrics.width) / 2 +
      Math.cos(ANGLE) * metrics.actualBoundingBoxDescent;

    canvas.height = Math.ceil(heightUp + heightDown);
    ctx.font = FONT;
    ctx.translate(canvas.width / 2, canvas.height - heightDown);
    ctx.rotate(ANGLE);
    ctx.fillText(username, -metrics.width / 2, 0);
  });
</script>

<div class="grow flex flex-col justify-center" data-transition-delay="500">
  <img
    class="h-fit"
    alt="Congratulations!"
    src="./handwritten-congrats-removebg-preview.png"
  />
  <canvas id="name" class="-translate-y-1/2">{$state_.name}</canvas>
</div>
<div class="mb-5 px-5 text-text" data-transition-delay="1500">
  We have sent an email to your address. Open it within a week and click the
  link to verify your account. Thank you!
</div>
<a
  data-transition-delay="1500"
  href={urlRoot + "account/recovery"}
  class="text-right text-sm text-stone-700 underline w-1/2 ml-auto text-balance hover:no-underline"
  >Prevent this account getting stranded by adding recovery options</a
>
