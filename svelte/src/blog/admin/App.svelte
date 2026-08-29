<script lang="ts">
  import "/shared/tailwindinit.css";
  import { fetch_ } from "/shared/helper";
  import { type IncomingData, type Doc, docs } from "./store.svelte";
  import DocCard from "./DocCard.svelte";
  import AddNew from "./AddNew.svelte";

  function loadData(data: IncomingData[]) {
    console.log(data);
    const final: Doc[] = [];

    for (const doc of data) {
      final.push({
        id: `${doc.id}`,
        title: doc.title,
        description: doc.description,
        tags: doc.tags,
        accent: doc.accent,
        thumbnail: doc.thumbnail,
        dateCreated: Temporal.PlainDate.from(doc.date_created),
        dateUpdated: Temporal.PlainDate.from(doc.date_updated),
        hearts: doc.hearts,
        status: doc.status,
      });
    }

    docs.splice(0, docs.length, ...final);
  }

  if (globalThis.jinjaParsed) {
    loadData(globalThis.allDocs);
  } else {
    fetch_("/documents/api/list_all_documents")
      .then((resp) => resp.json())
      .then((data: IncomingData[]) => {
        loadData(data);
      });
  }

  function logout(e: Event) {
    if (e.target instanceof HTMLButtonElement) {
      e.target.textContent = "Logging out...";
      e.target.disabled = true;
    }

    fetch_("/logout", {
      method: "post",
    }).then(async (resp) => {
      if (resp.ok) {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        console.error(await resp.text());
      }
    });
  }

  function logoutAll(e: Event) {
    if (e.target instanceof HTMLButtonElement) {
      e.target.textContent = "Logging out...";
      e.target.disabled = true;
    }

    fetch_("/logout_all", {
      method: "post",
    }).then(async (resp) => {
      if (resp.ok) {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        console.error(await resp.text());
      }
    });
  }
</script>

<div class="text-lg text-rock-800 p-3">
  <button
    onclick={(e) => logout(e)}
    class="underline hover:no-underline hover:text-rock-700 disabled:opacity-70 disabled:pointer-events-none disabled:no-underline"
  >
    Log out of admin account
  </button>
  <br />
  <button
    onclick={(e) => logoutAll(e)}
    class="underline hover:no-underline hover:text-rock-700 mt-2 disabled:opacity-70 disabled:pointer-events-none disabled:no-underline"
  >
    Log out of admin account on ALL devices
  </button>
</div>
<div class="flex justify-center">
  <div class="flex flex-col items-center w-fit">
    <h1
      class="font-serif text-6xl text-rock-700 text-center pb-4 pt-12 decoration-dotted underline underline-offset-8"
    >
      Manage Guidance Documents
    </h1>
    <div class="text-2xl text-rock-600 inline-block ml-auto">
      Or <a
        href="/documents/tags"
        class="text-rock-700 underline hover:no-underline"
        >manage guidance document tags</a
      >.
    </div>
  </div>
</div>

<AddNew />

<div class="flex flex-wrap justify-between mx-5">
  {#each docs as doc (doc.id)}
    <DocCard {doc} />
  {/each}
</div>
