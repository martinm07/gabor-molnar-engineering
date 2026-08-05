<script module lang="ts">
  export interface IDocMeta {
    informMetaUpdate: (mutations: TempMutationRecord[]) => void;
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
  import { type TempMutationRecord } from "./docsyncing";

  interface Props {
    docEl: HTMLElement;
    docSaver: SaveDoc;
  }
  let { docEl, docSaver }: Props = $props();

  $inspect(doc.info.id);

  function updateStateForMetaEl(metaContainer: HTMLElement) {
    const field_ = metaContainer.dataset.field; // i.e. attribute "data-field"
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

        doc.info.tags = tags;
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

  export function informMetaUpdate(mutations: TempMutationRecord[]) {
    // if (!doc.infoFetched) return;
    // return;
    for (const mutation of mutations) {
      // We can rule out all attributes mutations, as there many only be characterData or childList for tags
      if (mutation.type === "attributes") continue;

      const target =
        mutation.type === "childList"
          ? (mutation.addedNode ?? mutation.target)
          : mutation.target;

      const parentEl = !(target instanceof Element)
        ? target.parentElement
        : target;
      const metaEl = parentEl?.closest(".document-meta-data");
      const targetIsMetaContainer =
        target instanceof HTMLElement && target.classList.contains("doc-meta");

      if (doc.info && parentEl && metaEl instanceof HTMLElement) {
        console.log("Doing update for ", metaEl);
        updateStateForMetaEl(metaEl);
      } else if (doc.info && targetIsMetaContainer) {
        Array.from(target.children).forEach((metaEl) => {
          if (!(metaEl instanceof HTMLElement)) return;
          updateStateForMetaEl(metaEl);
        });
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

<div class="doc-meta history-not-body">
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

  <div
    class="document-meta-data"
    data-field="tags"
    {@attach (container) => {
      if (!doc.info.tags) return;
      if (container.childElementCount > doc.info.tags.length) {
        // If there are more child <span>s than tags, we must remove the excess
        Array.from(container.children)
          .slice(doc.info.tags.length)
          .forEach((child) => child.remove());
      } else if (container.childElementCount < doc.info.tags.length) {
        // If there are more tags than child <span>s, we must add new <span>s to make up the difference
        doc.info.tags.slice(container.childElementCount).forEach((tag) => {
          const newSpan = document.createElement("span");
          newSpan.textContent = tag;
          container.appendChild(newSpan);
        });
      }
      // Now that there's exactly one <span> child for every tag in doc.info.tags, we can go through them and make sure the textContents are correct
      Array.from(container.children).forEach((child, i) => {
        const tag = doc.info.tags[i];
        if (child.textContent !== tag) child.textContent = tag;
      });
    }}
  ></div>
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
