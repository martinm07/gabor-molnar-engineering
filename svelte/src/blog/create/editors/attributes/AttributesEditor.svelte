<script lang="ts">
  import { getContext } from "svelte";
  import { watch } from "runed";
  import { nodeHoverTarget } from "../../store";
  import tagAttributes from "./tag_attributes.json";
  import FitContentInput from "/shared/components/FitContentInput.svelte";

  const updateHighlight: () => void = getContext("updateHighlight");

  interface Attribute {
    name: string;
    value: string;
    referenceUrl: string;
    valid: boolean;
    id: number;
  }

  let attributeID: number = 0;
  let attributes: Attribute[] = $state([]);

  // Sync updates to the 'attributes' state to the DOM
  watch(
    () =>
      attributes.map((el) => {
        return { name: el.name, value: el.value, valid: el.valid };
      }),
    (current, prev) => {
      if (!$nodeHoverTarget) return;
      if (prev)
        // Remove attributes that are no longer part of the list
        prev.forEach((attr) => {
          if (!current.some((el) => el.name === attr.name))
            $nodeHoverTarget.removeAttribute(attr.name);
        });
      current.forEach((attr) => {
        if (attr.valid) $nodeHoverTarget.setAttribute(attr.name, attr.value);
      });
      updateHighlight();
    },
  );
  // Refresh 'attributes' state when the element (i.e. nodeHoverTarget) changes
  watch(
    () => $nodeHoverTarget,
    () => {
      attributes = Array(...($nodeHoverTarget?.attributes ?? []))
        .map((attr) => {
          return {
            name: attr.nodeName,
            value: attr.nodeValue ?? "",
            referenceUrl: "",
            valid: true,
            id: attributeID++,
          };
        })
        .filter((el) => el.name !== "style");
    },
  );

  function attrURL(attribute: string) {
    if (!$nodeHoverTarget) return null;
    if (attribute === "style") return null;
    const tag = $nodeHoverTarget.tagName.toLowerCase();
    const tagAttrs =
      tagAttributes.find((tag_) => tag_.tag === tag)?.attributes ?? [];
    const globalAttrs =
      tagAttributes.find((tag_) => tag_.tag === "GLOBAL")?.attributes ?? [];
    const valid = [...tagAttrs, ...globalAttrs].find(
      (attr) => attr.name === attribute,
    );
    return valid?.url ?? null;
  }

  // Determine validity & add MDN url when attribute names change
  watch(
    () => [...attributes.map((attr) => attr.name), $nodeHoverTarget],
    () => {
      attributes.forEach((attr, i) => {
        const url = attrURL(attr.name);
        if (
          !url ||
          attributes.slice(0, i).some((el) => el.name === attr.name)
        ) {
          attr.valid = false;
          attr.referenceUrl = "";
        } else {
          attr.valid = true;
          attr.referenceUrl = url;
        }
      });
    },
  );
</script>

<ul class="mt-10">
  {#each attributes as attr, i (attr.id)}
    <li
      class:invalid={attr.name && !attr.valid}
      class="group font-mono text-rock-700 text-sm text-balance text-center pb-2 mb-2 border-b-[1px] border-rock-300 last-of-type:border-0"
    >
      <FitContentInput
        class="bg-steel-100 font-bold focus:outline-none max-w-[calc(100%_-_8px)] p-1 rounded box-content group-[.invalid]:text-rock-500 group-[.invalid]:underline decoration-wavy decoration-red-700"
        bind:value={attr.name}
        placeholder="attribute"
      />
      <FitContentInput
        class="bg-steel-100 focus:outline-none max-w-[calc(100%_-_8px)] p-1 rounded box-content"
        bind:value={attr.value}
        placeholder="value"
      />
      <div class="inline-flex translate-y-[6px]">
        <a
          class="text-xl inline-flex items-center justify-center hover:opacity-60 [&.disabled]:pointer-events-none [&.disabled]:opacity-45"
          class:disabled={!attr.valid}
          href={attr.referenceUrl}
          target="_blank"
          aria-disabled={!attr.valid}
        >
          <ion-icon name="help-circle-outline"></ion-icon>
        </a>
        <button
          type="button"
          class="text-xl text-red-700 inline-flex items-center justify-center hover:opacity-60"
          onclick={() => attributes.splice(i, 1)}
          ><ion-icon name="close-circle-outline"></ion-icon></button
        >
      </div>
    </li>
  {/each}
</ul>
<div class="h-[1px] w-full bg-rock-300 text-center">
  <button
    class="inline-block bg-background text-rock-400 text-xl -translate-y-1/2 px-2 hover:text-rock-200"
    onclick={() =>
      attributes.push({
        name: "",
        value: "",
        referenceUrl: "",
        valid: false,
        id: attributeID++,
      })}>+</button
  >
</div>
