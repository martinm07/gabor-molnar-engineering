<script lang="ts">
  import Dropdown from "./Dropdown.svelte";
  import DateInput from "./DateInput.svelte";
  import { getContext, type Snippet } from "svelte";

  const divider: Snippet = getContext("divider");
  function now() {
    const now = new Date();
    return `${now.getUTCFullYear()}-${`${now.getUTCMonth() + 1}`.padStart(2, "0")}-${`${now.getUTCDate()}`.padStart(2, "0")}`;
  }
  const START_DATE = "2024-01-01";
  const NOW = now();

  interface Props {
    fromDate?: string;
    toDate?: string;
  }
  let { fromDate = $bindable(START_DATE), toDate = $bindable(NOW) }: Props =
    $props();

  // let fromDate = $state(START_DATE);
  // let toDate = $state(NOW);
</script>

<Dropdown label="Filter by Date">
  {#snippet content()}
    {@render divider()}
    <div class="py-3 bg-rock-100 text-center">
      <div class="mb-3">
        <label for="fromdate" class="pr-2 text-rock-700">From:</label>
        <DateInput
          startDate={START_DATE}
          bind:date={fromDate}
          id="fromdate"
          type="date"
          class="has-[+_button]:text-rock-700 px-2 py-1 text-rock-400 bg-background border-2 border-rock-500 rounded focus:outline-none ring-rock-200 focus:ring-4"
        />
        {#if fromDate !== START_DATE}
          <button
            class="text-rock-700 underline hover:no-underline ml-2"
            onclick={() => (fromDate = START_DATE)}>Clear</button
          >
        {/if}
      </div>
      <div>
        <label for="todate" class="pr-2 text-rock-700">Until:</label>
        <DateInput
          startDate={NOW}
          defaultDate="12-31"
          bind:date={toDate}
          id="todate"
          type="date"
          class="has-[+_button]:text-rock-700 px-2 py-1 text-rock-400 bg-background border-2 border-rock-500 rounded focus:outline-none ring-rock-200 focus:ring-4"
        />
        {#if toDate !== NOW}
          <button
            class="text-rock-700 underline hover:no-underline ml-2"
            onclick={() => (toDate = NOW)}>Clear</button
          >
        {/if}
      </div>
    </div>
  {/snippet}
</Dropdown>
