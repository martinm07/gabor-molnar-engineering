<script context="module" lang="ts">
  import type { ValidationResponse } from "/shared/types";

  export function statusCodeNameMsg(code: string): {
    input: string | null;
    msg: string;
  } {
    switch (code) {
      case "GER":
        return {
          input: null,
          msg: "An unexpected error has occured. Please try again later.",
        };
      case "UNM":
        return { input: "name", msg: "Username is required" };
      case "UNS":
        return {
          input: "name",
          msg: "Username must be more<br />than 2 characters",
        };
      case "UNT":
        return { input: "name", msg: "Username is already taken" };
      case "UNP":
        return { input: "name", msg: "Username was detected as profane" };
      default:
        return { input: null, msg: code };
    }
  }

  export async function validateName(
    name: string,
  ): Promise<ValidationResponse> {
    const name_ = name.trim();
    if (name_.length === 0) return { result: -1, code: "UNM" };
    if (name_.length < 3) return { result: -1, code: "UNS" };
    return { result: 1 };
  }

  export async function setName({
    name,
  }: {
    name?: string;
  }): Promise<ValidationResponse> {
    if (typeof name === "undefined") return { result: -1, code: "UNM" };

    let resp;
    try {
      resp = await fetch_("/register/add_username", {
        method: "POST",
        body: name,
        headers: { "Content-Type": "text/plain" },
      });
    } catch (err) {
      return { result: -1 };
    }
    const result: { result: boolean; code?: string } = await resp.json();
    return { result: result.result ? 1 : -1, code: result.code };
  }
</script>

<script lang="ts">
  import Card from "./Card.svelte";
  import UsernameCard from "./UsernameCard.svelte";
  import EmailPasswordCard from "./EmailPasswordCard.svelte";
  import { state, changePage } from "./store";
  import { fetch_ } from "/shared/helper";
  import "/shared/tailwindinit.css";
</script>

{#if $state.page === "name"}
  <Card card={UsernameCard} onsuccess={() => changePage("emailpass", true)} />
{:else if $state.page === "emailpass"}
  <Card card={EmailPasswordCard} onsuccess={() => changePage("name", true)} />
{/if}
