import { crossfade } from "svelte/transition";

export const [send, receive] = crossfade({
  duration: (d) => Math.sqrt(d * 200),
});
