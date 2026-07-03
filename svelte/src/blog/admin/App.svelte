<script lang="ts">
  import "/shared/tailwindinit.css";
  import { fetch_ } from "/shared/helper";
  import { type IncomingData, type Doc, docs } from "./store.svelte";
  import DocCard from "./DocCard.svelte";
  import AddNew from "./AddNew.svelte";

  // fetch_("/documents/list_all_documents")
  //   .then((resp) => resp.json())
  //   .then((data) => {
  //     console.log(data);
  //   });

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
    fetch_("/documents/list_all_documents")
      .then((resp) => resp.json())
      .then((data: IncomingData[]) => {
        loadData(data);
      });
  }
</script>

<h1
  class="font-serif text-6xl text-rock-700 text-center pb-4 pt-12 decoration-dotted underline underline-offset-8"
>
  Manage Guidance Documents
</h1>

<AddNew />

<div class="flex flex-wrap justify-between mx-5">
  {#each docs as doc}
    <DocCard {doc} />
  {/each}
</div>
