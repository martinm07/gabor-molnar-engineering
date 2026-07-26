<script module lang="ts">
  export interface IDocMeta {
    informMetaUpdate: (mutations: MutationRecord[]) => void;
  }
</script>

<script lang="ts">
  import { watch } from "runed";
  import {
    doc,
    docMetaFields,
    type DocumentInfo,
    type TDocMetaFields,
  } from "../store.svelte";
  import type { SaveDoc } from "./docsaving.svelte";
  import { deepEqual } from "../helper";

  interface Props {
    docEl: HTMLElement;
    docSaver: SaveDoc;
  }
  let { docEl, docSaver }: Props = $props();

  export function informMetaUpdate(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      // if (mutation.type !== "characterData") continue;
      // We can rule out all attributes mutations, as there many only be characterData or childList for tags
      if (mutation.type === "attributes") continue;

      const parentEl = !(mutation.target instanceof Element)
        ? mutation.target.parentElement
        : mutation.target;
      const metaContainer = parentEl?.closest(".document-meta-data");

      if (doc.info && parentEl && metaContainer instanceof HTMLElement) {
        const field_ = metaContainer.dataset.field; // IMP: "data-field"
        if (field_ && docMetaFields.includes(field_)) {
          const field = field_ as TDocMetaFields;

          updateDocInfo: if (field === "tags") {
            const oldTags = doc.info["tags"];
            const tags = Array.from(metaContainer.children).map(
              (child) => child.textContent,
            );

            // If the tags haven't changed, then DON'T make an assignment to doc.info
            if (
              oldTags.length === tags.length &&
              oldTags.every((oldTag, i) => oldTag === tags[i])
            )
              break updateDocInfo;

            doc.info["tags"] = tags;
          } else if (doc.info[field] !== metaContainer.textContent) {
            // If the content hasn't changed, DON'T assign to doc.info
            doc.info[field] = metaContainer.textContent;
          }
        } else {
          console.error(
            `There is an element with the class 'document-meta-data' but not a 'data-field' attribute of a valid value: `,
            metaContainer,
          );
        }
      }
    }
  }

  // Server sync
  watch(
    () => $state.snapshot(doc.info),
    (curr, prev) => {
      if (deepEqual(curr, prev)) {
        // console.log("NOTHING CHANGED.");
      } else {
        // console.log("SENDING DEBOUNCED SERVER METADATA UPDATE");
        docSaver.syncDocMetadataDebounce(curr);
      }
    },
    {
      lazy: true,
    },
  );
</script>

<div class="doc-meta not-body">
  <div class="document-meta-data" data-field="id">
    {doc.info ? doc.info.id : ""}
  </div>
  <div class="document-meta-data" data-field="componentLibVer">
    {doc.info ? doc.info.componentLibVer : ""}
  </div>
  <div class="document-meta-data" data-field="status">
    {doc.info ? doc.info.status : ""}
  </div>

  <div class="document-meta-data" data-field="title">
    {doc.info ? doc.info.title : ""}
  </div>
  <div class="document-meta-data" data-field="description">
    {doc.info ? doc.info.description : ""}
  </div>
  <div class="document-meta-data" data-field="accent">
    {doc.info ? doc.info.accent : ""}
  </div>
  <div class="document-meta-data" data-field="thumbnail">
    {doc.info ? doc.info.thumbnail : ""}
  </div>

  <div class="document-meta-data" data-field="tags">
    {#each doc.info ? doc.info.tags : [] as tag}
      <span>{tag}</span>
    {/each}
  </div>
</div>

<style>
  .doc-meta {
    background: lightgoldenrodyellow;
    display: none;
    /*height: 100px;*/
  }

  .document-meta-data {
    /*display: hidden;*/
    /*display: block;*/
  }
</style>
