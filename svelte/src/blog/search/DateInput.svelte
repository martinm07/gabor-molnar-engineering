<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  interface Props extends HTMLInputAttributes {
    startDate: string;
    defaultDate?: string;
    date: string;
  }
  let {
    startDate,
    defaultDate = "01-01",
    date = $bindable(),
    ...props
  }: Props = $props();

  date = startDate;
  let prevDate: string = startDate;
  $effect(() => {
    date && (prevDate = date);
  });

  let prevWas0: boolean = false;
  function fixDates(e: KeyboardEvent) {
    console.log(e.key);
    if (e.key === "Shift") return;
    if (e.key === "0" && !prevWas0) prevWas0 = true;
    else if (e.key !== "Tab") prevWas0 = false;
    if (e.key === "Tab") consume0();
  }

  function consume0() {
    if (prevWas0 && !date) date = prevDate.split("-")[0] + "-" + defaultDate;
    prevWas0 = false;
  }
</script>

<input
  bind:value={date}
  onfocusout={(e) => {
    consume0();
    if (!date) date = prevDate;
  }}
  onclick={consume0}
  onkeydown={fixDates}
  {...props}
/>

<!-- <label
    for={props.id}
    class="absolute left-[10px] top-0 h-full flex items-center">unset</label
  > -->

<style>
  /* input {
    color: var(--background);
  }
  input::after {
    content: "unset";
    color: var(--rock-700);
  } */
</style>
