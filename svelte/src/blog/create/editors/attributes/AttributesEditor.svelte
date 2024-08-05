<script context="module" lang="ts">
  export interface IAttributesEditor {
    startAttributeUsage(
      name: string,
      value?: string | null,
      elements?: Element[],
    ): [
      endAttributeUsage: () => void,
      updateUsedAttribute: (value?: string | null) => void,
    ];
  }

  export interface Attribute {
    name: string;
    value: string;
    referenceUrl: string;
    valid: boolean;
    id: number;
  }
</script>

<script lang="ts">
  import { getContext } from "svelte";
  import { watch } from "runed";
  import tagAttributes from "./tag_attributes.json";
  import FitContentInput from "/shared/components/FitContentInput.svelte";

  const updateHighlight: () => void = getContext("updateHighlight");

  interface Props {
    selected: Element[];
    attributes?: Attribute[];
  }
  let { selected, attributes = $bindable([]) }: Props = $props();

  let attributeID: number = 0;
  // let attributes: Attribute[] = $state([]);
  let prevAttributes: Attribute[];

  function setAttribute(el: Element, name: string, value?: string | null) {
    if (value) el.setAttribute(name, value);
    else el.removeAttribute(name);
  }

  interface MaskAttribute {
    name: string;
    value?: string | null;
    affectedEls: [Element, string | null | undefined][];
  }
  const maskedAttributes: MaskAttribute[] = [];

  export function startAttributeUsage(
    name: string,
    value?: string | null,
    elements?: Element[],
  ): [
    endAttributeUsage: () => void,
    updateUsedAttribute: (value?: string | null) => void,
  ] {
    // The attribute is no longer synced to the DOM
    // When the selection changes the elements of the previous selection that
    //  have stayed in the new one don't have this attribute read from the DOM,
    //  but keep the same user-facing value.
    const obj: MaskAttribute = {
      name,
      value,
      affectedEls: (elements ?? selected).map((el) => [
        el,
        el.attributes.getNamedItem(name)?.nodeValue,
      ]),
    };
    maskedAttributes.push(obj);
    (elements ?? selected).forEach((el) => setAttribute(el, name, value));
    return [
      () => {
        const i = maskedAttributes.findIndex((el) => obj === el);
        if (i === -1) return;
        maskedAttributes[i].affectedEls.forEach(([el, userVal]) =>
          setAttribute(el, maskedAttributes[i].name, userVal),
        );
        maskedAttributes.splice(i, 1);
      },
      (value?: string | null) => {
        obj.value = value;
        obj.affectedEls.forEach(([el]) => setAttribute(el, obj.name, value));
      },
    ];
  }

  function attributeMasked(el: Element, name: string) {
    return maskedAttributes
      .filter((mask) => mask.name === name)
      .some((mask) => mask.affectedEls.some(([el_]) => el === el_));
  }
  function getAttributes(el: Element): Attribute[] {
    const attrs = Array(...el.attributes);
    const maskedAttrVals: Map<string, string | null | undefined> = new Map();
    maskedAttributes
      .filter((mask) => mask.affectedEls.some(([el_]) => el === el_))
      .forEach((mask) =>
        maskedAttrVals.set(
          mask.name,
          mask.affectedEls.find(([el_]) => el === el_)?.[1],
        ),
      );

    const toAttribute = (name: string, value: string) => {
      return {
        name,
        value: value!,
        referenceUrl: "",
        valid: true,
        id: attributeID++,
      };
    };

    const maskedAttrValsEntries = Array(...maskedAttrVals.entries());
    const finalMasked: Attribute[] = maskedAttrValsEntries
      .filter(([_, value]) => typeof value === "string")
      .map(([name, value]) => toAttribute(name, value!));
    const finalNormal: Attribute[] = attrs
      .filter(
        (attr) =>
          typeof attr.nodeValue === "string" &&
          !maskedAttrValsEntries.some(([name]) => attr.nodeName === name),
      )
      .map((attr) => toAttribute(attr.nodeName, attr.nodeValue!));
    return [...finalMasked, ...finalNormal];
  }

  // Sync updates to the 'attributes' state to the DOM and user-facing values for attribute masks
  watch(
    () =>
      attributes.map((el) => {
        return { name: el.name, value: el.value, valid: el.valid };
      }),
    () => {
      const removeAttrs =
        prevAttributes?.filter(
          (attr) => !attributes.some((el) => el.name === attr.name),
        ) ?? [];

      // Sync the user-facing values of attribute masks
      const syncMaskedAttributes = (
        attrs: Attribute[],
        remove: boolean = false,
      ) =>
        attrs.forEach((attribute) => {
          const masks = maskedAttributes.filter(
            ({ name }) => name === attribute.name,
          );
          // For each element of each mask (that masks this attribute) that is part of the current selection,
          //  set that element's user-facing value in the maskedAttributes array.
          masks.forEach((mask) => {
            mask.affectedEls
              .filter(([el]) => selected.includes(el))
              .forEach((elval) => (elval[1] = remove ? null : attribute.value));
          });
        });
      syncMaskedAttributes(attributes);
      syncMaskedAttributes(removeAttrs, true);

      // Sync attributes to the DOM
      prevAttributes = [...attributes];
      for (const target of selected) {
        removeAttrs.forEach((attr) => {
          if (!attributeMasked(target, attr.name))
            target.removeAttribute(attr.name);
        });
        attributes.forEach((attr) => {
          if (attr.valid && !attributeMasked(target, attr.name))
            target.setAttribute(attr.name, attr.value);
        });
      }
      updateHighlight();
    },
  );

  function attributesIntersection(els: Element[]) {
    if (els.length === 0) return [];
    return els
      .map((el) => getAttributes(el))
      .reduce((p, c) =>
        c.filter((attr) =>
          p.some((a) => attr.name === a.name && attr.value === a.value),
        ),
      );
  }

  // Refresh 'attributes' state when the selection changes
  watch(
    () => selected,
    () => {
      // TODO: What we're doing with attribute masking and the 'draggable' attribute could also be done
      //        with contenteditable, instead of this check here
      prevAttributes = attributesIntersection(selected).filter(
        (el) => el.name !== "style" && el.name !== "contenteditable",
      );
      attributes = [...prevAttributes];
    },
  );

  function attrURL(attribute: string) {
    if (!selected) return null;
    if (attribute === "style") return null;

    const globalAttrs =
      tagAttributes.find((tag_) => tag_.tag === "GLOBAL")?.attributes ?? [];

    let finalURL: string | null = selected.length !== 0 ? "true" : null;
    // Only return a URL if every element of 'selected' considers the attribute valid
    for (const target of selected) {
      const tag = target.tagName.toLowerCase();
      const tagAttrs =
        tagAttributes.find((tag_) => tag_.tag === tag)?.attributes ?? [];
      const valid = [...tagAttrs, ...globalAttrs].find(
        (attr) => attr.name === attribute,
      );
      finalURL = finalURL && (valid?.url ?? null);
    }
    return finalURL;
  }

  // Determine validity & add MDN url when attribute names change
  watch(
    () => [...attributes.map((attr) => attr.name), selected],
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
