<script lang="ts">
  import { watch } from "runed";
  import { doc } from "./store.svelte";
  import FitContentWrapTextarea from "/shared/components/FitContentWrapTextarea.svelte";
  import { TagsEditor } from "./components/ComponentMetaEdit.svelte";
  import { fade } from "svelte/transition";
  import { untrack } from "svelte";

  type PossibleKeys = "title" | "description" | "accent" | "thumbnail";

  // class InputState {
  //   keyName: PossibleKeys;
  //   keyVal: string;
  //   inputVal: string | null = $state(null);
  //   inputErr: string | null;
  //   lastValidInputVal: string | null = null;

  //   constructor(
  //     keyName: PossibleKeys,
  //     validateVal: (val: string) => string | null,
  //   ) {
  //     this.keyName = keyName;
  //     this.keyVal = $derived(doc.info?.[this.keyName] ?? "");
  //     this.inputErr = $derived(
  //       this.inputVal !== null ? validateVal(this.inputVal) : null,
  //     );
  //     this.inputVal = doc.info?.[this.keyName] ?? "";

  //     watch([() => this.inputVal, () => this.inputErr], () => {
  //       if (!this.inputErr && this.inputVal !== null)
  //         this.lastValidInputVal = this.inputVal;
  //     });

  //     watch(
  //       () => this.inputVal,
  //       () => {
  //         console.log(`Changed value of ${this.keyName} to ${this.inputVal}`);
  //       },
  //     );
  //   }
  // }

  // const titleState = new InputState("title", (val) => {
  //   // Validate name
  //   if (val.length === 0) return "Title required";
  //   if (val.length > 128) return "Title should be less then 129 characters";
  //   return null;
  // });

  function validateTitle(title: string) {
    if (title.length === 0) return "Title required";
    if (title.length > 128) return "Title should be less then 129 characters";
    return null;
  }

  function validateDescription(description: string) {
    return null;
  }

  // const syncTagsChange = (tags: string[]) => {
  //   doc.info.tags = tags;
  // }

  let tagsEditorEl: HTMLElement | null = $state(null);
  const tagsEditor = new TagsEditor(
    (tag: string) => {
      let exists = false;
      // if (allComponentTags.includes(tag)) exists = true;

      let msg = "";
      if (tag.length === 0) msg = "Missing tag";
      // if (/^[0-9]/.test(tag)) msg = "Tag cannot start with numeral";
      // if (/[\-_]$/.test(tag)) msg = "Tag cannot end with '-' or '_'";
      // if (/[, ]/.test(tag)) msg = "Tag cannot contain ',' or ' '";

      return [exists, msg !== "", msg];
    },
    (tags) => {
      doc.info.tags = tags;
    },
    ["+"],
  );

  $effect(() => {
    if (!tagsEditorEl) return;
    untrack(() => {
      console.log("SET TAGS");
      tagsEditor.setTags(doc.info.tags, tagsEditorEl!);
    });
  });
</script>

<svelte:document
  onselectionchange={() => {
    if (!tagsEditorEl) return;
    tagsEditor.onSelectionChange(tagsEditorEl);
  }}
/>

<div class="my-4 text-xl text-rock-800 italic text-center">
  View/Edit the document's metadata
</div>

<div>
  <div class="flex items-stretch text-lg px-4 max-w-5xl mx-auto">
    <label for="edit-title" class="text-rock-700 flex items-center text-2xl"
      >Title:</label
    >
    <div class="relative grow mx-3">
      <input
        class="px-3 py-1.5 border-b-2 border-rock-300 font-mono rounded bg-background w-full text-rock-600 inset-shadow-none inset-shadow-rock-200 outline-none focus:bg-white focus:ring-4 ring-steel-200 [.error]:border-red-300 [.error]:focus:ring-red-200"
        class:error={validateTitle(doc.info.title)}
        type="text"
        name="edit-title"
        id="edit-title"
        placeholder="Guidance Document Title"
        bind:value={doc.info.title}
      />
      {#if validateTitle(doc.info.title)}
        <div
          class="absolute text-red-400 font-bold text-sm bottom-2 translate-y-full ml-3"
        >
          <span class="bg-white px-1">{validateTitle(doc.info.title)}</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="flex items-stretch px-4 w-3xl mx-auto mt-12">
    <label
      for="edit-description"
      class="text-rock-700 flex items-center text-2xl">Description:</label
    >
    <div class="relative grow mx-3 flex">
      <FitContentWrapTextarea
        class="{validateDescription(doc.info.description)
          ? 'error'
          : ''} box-content grow px-3 py-1.5 border-b-2 border-rock-300 font-mono rounded bg-background w-full text-rock-600 inset-shadow-none inset-shadow-rock-200 outline-none focus:bg-white focus:ring-4 ring-steel-200 [.error]:border-red-300 [.error]:focus:ring-red-200 resize-none"
        dontModifyWidth
        name="edit-description"
        id="edit-description"
        placeholder="Brief description of guidance document."
        bind:value={doc.info.description}
      />
      {#if validateDescription(doc.info.description)}
        <div
          class="absolute text-red-400 font-bold text-sm bottom-2 translate-y-full ml-3"
        >
          <span class="bg-white px-1"
            >{validateDescription(doc.info.description)}</span
          >
        </div>
      {/if}
    </div>
  </div>

  <div class="flex px-4 mt-5 w-3xl mx-auto">
    <label for="edit-tags" class="text-rock-700 text-2xl flex items-center"
      >Tags:</label
    >
    <div
      role="application"
      spellcheck="false"
      contenteditable="true"
      id="edit-tags-doc"
      bind:this={tagsEditorEl}
      oninput={(e) => tagsEditorEl && tagsEditor.onInput(tagsEditorEl)}
      onkeydown={(e) => tagsEditor.onKeydown(e)}
      class="mx-3 text-rock-600 font-mono outline-none flex flex-wrap min-w-60 relative"
    ></div>
  </div>
</div>
<div class="text-base italic text-rock-400 w-3xl mx-auto pl-8 mt-1">
  Press "+" while editing to add new tags
</div>

<style>
  @reference "../../shared/tailwindinit.css";

  :global {
    #edit-tags-doc span.space {
      @apply text-2xl;
    }
    #edit-tags-doc span:not(.space) {
      @apply rounded border-2 border-rock-300 p-0.5 bg-background my-2 block;
    }
    #edit-tags-doc span.new {
      @apply border-dashed;
    }
    #edit-tags-doc span.error {
      @apply border-red-300;
    }
    #edit-tags-doc span.error::before {
      @apply absolute text-sm text-red-400 inline-block translate-y-[calc(100%+(--spacing(1)))] text-nowrap font-sans font-bold not-italic bg-white;
      content: var(--errormsg);
    }
    #edit-tags-doc:focus span.focused {
      @apply ring-4 ring-steel-200 bg-white;
    }

    /* Make the "placeholder" for when there are no tags (the field is empty) */

    #edit-tags-doc span.error[style*="Missing tag"]:only-child {
      @apply opacity-0;
    }
    #edit-tags-doc:has(span.error[style*="Missing tag"]:only-child)::before {
      content: "Tag Guidance Document";
      @apply absolute rounded border-b-2 border-rock-300 p-0.5 bg-background my-2 -z-10 text-nowrap text-rock-600/50;
    }
    #edit-tags-doc:focus::before {
      @apply ring-4 ring-steel-200 bg-white!;
    }
    /*#edit-tags span.error:only-child {
      display: none:
    }*/
  }
</style>
