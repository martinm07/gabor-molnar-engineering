<script lang="ts">
  import { preventDefault } from "/shared/helper";
  import "/shared/tailwindinit.css";

  // For some reason it needs a reference in the script on the dev server, or else
  //  it doesn't keep it in the bundle?s
  // console.log(preventDefault);
  function onSubmit(e: SubmitEvent) {
    console.log("HELLO WORLD");
  }
</script>

<form method="POST" onsubmit={preventDefault(onSubmit)} class="p-5 text-center">
  <div>
    <label for="name">Name:</label>
    <input
      class="border-2 border-stone-500 invalid:ring-red-500"
      type="text"
      name="name"
    />
  </div>
  <div>
    <label for="email">Email:</label>
    <input
      type="email"
      class="border-2 border-stone-500 invalid:ring-red-500"
    />
  </div>
  <input type="submit" value="Submit" />
</form>
