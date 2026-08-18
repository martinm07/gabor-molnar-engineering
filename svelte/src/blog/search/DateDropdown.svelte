<script lang="ts">
  import CaretDownIcon from "phosphor-svelte/lib/CaretDownIcon";
  import CaretRightIcon from "phosphor-svelte/lib/CaretRightIcon";
  import { query } from "./store.svelte";

  let dropdownActive = $state(true);

  // query.fromDate
  type DateMode = "off" | "both" | "from" | "to";
  const dateMode: DateMode = $derived.by(() => {
    if (query.fromDate !== null && query.toDate !== null) return "both";
    if (query.fromDate !== null) return "from";
    if (query.toDate !== null) return "to";
    return "off";
  });

  let fromDateValue = $state("");
  let toDateValue = $state("");

  $inspect(fromDateValue);
</script>

<button
  class="flex items-center text-base text-rock-700 mt-3 md:mt-9 hover:text-rock-500"
  type="button"
  onclick={() => (dropdownActive = !dropdownActive)}
>
  Filter by date
  {#if dropdownActive}
    <CaretDownIcon class="ml-1 text-xl" weight="regular" />
  {:else}
    <CaretRightIcon class="ml-1 text-xl" weight="regular" />
  {/if}
</button>
{#if dropdownActive}
  <div
    class="mt-2 flex justify-around text-rock-800 tracking-tight border-y border-rock-300 py-2"
  >
    <form>
      <input
        class=""
        type="date"
        name="fromdate"
        id="fromdate"
        oninput={(e) => {
          console.log((e.target as HTMLInputElement).value);
        }}
        bind:value={
          () => fromDateValue,
          (v) => {
            fromDateValue = v;
            if (query.fromDate !== null) query.fromDate = v;
          }
        }
        class:invisible={dateMode === "off" || dateMode === "to"}
      />
    </form>
    <span>&mdash;</span>
    <form>
      <input
        class=""
        type="date"
        name="todate"
        id="todate"
        bind:value={
          () => toDateValue,
          (v) => {
            toDateValue = v;
            if (query.toDate !== null) query.toDate = v;
          }
        }
        class:invisible={dateMode === "off" || dateMode === "from"}
      />
    </form>
  </div>
  <div class="grid grid-cols-3 font-mono text-rock-700 leading-tight mt-1">
    <button
      class="py-1 mx-0.5 rounded bg-rock-50 border border-rock-300 transition-colors hover:bg-rock-100 [.active]:bg-rock-200 [.active]:text-rock-800"
      type="button"
      onclick={() => {
        if (dateMode === "from") {
          query.fromDate = null;
          query.toDate = null;
        } else if (dateMode === "both") {
          query.toDate = null;
        } else if (dateMode === "to") {
          query.fromDate = fromDateValue;
          query.toDate = null;
        } else {
          query.fromDate = fromDateValue;
        }
      }}
      class:active={dateMode === "from"}>Only from</button
    >
    <button
      class="py-1 mx-0.5 rounded bg-rock-50 border border-rock-300 transition-colors hover:bg-rock-100 [.active]:bg-rock-200 [.active]:text-rock-800"
      type="button"
      onclick={() => {
        if (dateMode === "both") {
          query.fromDate = null;
          query.toDate = null;
        } else if (dateMode === "from") {
          query.toDate = toDateValue;
        } else if (dateMode === "to") {
          query.fromDate = fromDateValue;
        } else {
          query.fromDate = fromDateValue;
          query.toDate = toDateValue;
        }
      }}
      class:active={dateMode === "both"}>Both</button
    >
    <button
      class="py-1 mx-0.5 rounded bg-rock-50 border border-rock-300 transition-colors hover:bg-rock-100 [.active]:bg-rock-200 [.active]:text-rock-800"
      type="button"
      onclick={() => {
        if (dateMode === "to") {
          query.fromDate = null;
          query.toDate = null;
        } else if (dateMode === "both") {
          query.fromDate = null;
        } else if (dateMode === "from") {
          query.toDate = toDateValue;
          query.fromDate = null;
        } else {
          query.toDate = toDateValue;
        }
      }}
      class:active={dateMode === "to"}>Only until</button
    >
  </div>
{/if}
