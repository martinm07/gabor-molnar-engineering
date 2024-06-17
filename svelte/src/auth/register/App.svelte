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
      case "EMM":
        return { input: "email", msg: "Email is required" };
      case "EMI":
        return { input: "email", msg: "Invalid email" };
      case "EMT":
        return { input: "email", msg: "Email is already taken" };
      case "PWM":
        return { input: "password", msg: "Password is required" };
      case "CPM":
        return { input: "confirmpass", msg: "Password is required" };
      case "PDM":
        return { input: "confirmpass", msg: "Passwords don't match" };
      default:
        return { input: null, msg: code };
    }
  }

  export const inputclass =
    "shadow-[inset_-7px_-7px_var(--steel-100)] focus:shadow-[inset_-7px_-7px_var(--steel-100),0_0_0_3px_var(--background),0_0_0_7px_var(--steel-200)] focus:ring-0 transition-shadow duration-100";
</script>

<script lang="ts">
  import Card from "./Card.svelte";
  import UsernameCard from "./UsernameCard.svelte";
  import EmailPasswordCard from "./EmailPasswordCard.svelte";
  import { state_ } from "./store";
  import "/shared/tailwindinit.css";
  import ConfirmPasswordCard from "./ConfirmPasswordCard.svelte";
  import CongratsCard from "./CongratsCard.svelte";
</script>

{#if $state_.page === "name"}
  <Card card={UsernameCard} />
{:else if $state_.page === "emailpass"}
  <Card card={EmailPasswordCard} />
{:else if $state_.page === "passconfirm"}
  <Card card={ConfirmPasswordCard} />
{:else if $state_.page === "congrats"}
  <Card card={CongratsCard} />
{/if}
