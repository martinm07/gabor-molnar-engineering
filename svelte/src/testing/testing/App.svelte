<script lang="ts">
  import Form from "/shared/components/Form.svelte";
  import { setName, validateName } from "/shared/components/form";

  export function statusCodeNameMsg(code: string): {
    input: string | null;
    msg: string;
  } {
    switch (code) {
      case "UNM":
        return { input: "name", msg: "Username is required" };
      case "UNS":
        return {
          input: "name",
          msg: "Username must be more than 2 characters",
        };
      case "UNT":
        return { input: "name", msg: "Username is already taken" };
      case "UNP":
        return { input: "name", msg: "Username was detected as profane" };
      default:
        return { input: null, msg: code };
    }
  }
</script>

<Form
  inputs={[
    {
      name: "name",
      label: "Name:",
      inputAttrs: { placeholder: "your-username" },
      validateFunc: validateName,
    },
    {
      name: "name2",
      inputAttrs: { placeholder: "your-second-username" },
      validateFunc: validateName,
    },
  ]}
  {statusCodeNameMsg}
  submitFunc={setName}
/>
