<script module lang="ts">
  export interface IAttributesEditor {
    startAttributeUsage(
      name: string,
      value?: string | null,
      elements?: Element[],
    ): [
      endAttributeUsage: () => void,
      updateUsedAttribute: (value?: string | null) => void,
    ];
    changeElementInMasks(oldEl: Element, newEl: Element): void;
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
  import { watch, FiniteStateMachine } from "runed";
  import tagAttributes from "./tag_attributes.json";
  import FitContentInput from "/shared/components/FitContentInput.svelte";
  import {
    autocompleteSuggestions,
    nodesSelection,
    savedComponents,
  } from "../../store";
  import {
    changeElToComp,
    componentNameValid,
  } from "../../components/component";

  const updateHighlight: () => void = getContext("updateHighlight");

  interface Props {
    selected: Element[];
    disabled: boolean;
    attributes?: Attribute[];
  }
  let { selected, disabled, attributes = $bindable([]) }: Props = $props();

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
  export function changeElementInMasks(oldEl: Element, newEl: Element) {
    for (const mask of maskedAttributes) {
      mask.affectedEls.forEach((elVal, i) => {
        if (elVal[0] === oldEl) elVal[0] = newEl;
      });
    }
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
      prevAttributes = $state.snapshot(attributes);
      for (const target of selected) {
        // console.log(removeAttrs, attributes);
        removeAttrs.forEach((attr) => {
          if (attr.name === "data-component") dataComponent.send("reset");
          if (!attributeMasked(target, attr.name))
            target.removeAttribute(attr.name);
        });
        attributes.forEach((attr) => {
          if (target.getAttribute(attr.name) === attr.value) {
            if (attr.name === "data-component") dataComponent.send("reset");
            return;
          }
          if (attr.name === "data-component") {
            dataComponent.send("diff");
            if (componentNameValid(attr.value)) dataComponent.send("valid");
            else dataComponent.send("novalid");
            return;
          }
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
      dataComponent.send("reset");
      // TODO: What we're doing with attribute masking and the 'draggable' attribute could also be done
      //        with contenteditable, instead of this check here
      prevAttributes = attributesIntersection(selected).filter(
        (el) => el.name !== "style" && el.name !== "contenteditable",
      );
      attributes = [...prevAttributes];
    },
  );

  function allAvailableAttributes() {
    if (selected.length === 0) return [];

    const globalAttrs =
      tagAttributes.find((tag_) => tag_.tag === "GLOBAL")?.attributes ?? [];

    const getTagAttrs = (el: Element) =>
      tagAttributes.find((tag) => tag.tag === el.tagName.toLowerCase())
        ?.attributes ?? [];
    let sharedTagAttrs = getTagAttrs(selected[0]);
    for (let i = 1; i < selected.length; i++) {
      const tagAttrs = getTagAttrs(selected[i]);
      sharedTagAttrs = sharedTagAttrs.filter((attr) =>
        tagAttrs.some((attr_) => attr_.name === attr.name),
      );
    }

    return [...sharedTagAttrs, ...globalAttrs].filter(
      (attr) => attr.name !== "style",
    );
  }
  function returnValidURL(
    attr: string,
    allAvailable: { name: string | null; url: string }[],
  ) {
    for (const { name, url } of allAvailable) {
      if (!name) continue;
      if (name === "data-*" && attr.startsWith("data-")) return url;
      else if (attr === name) return url;
    }
    return null;
  }

  // Determine validity & add MDN url when attribute names change
  // NOTE: Be careful, even updates that don't actually change the watch value
  //        (e.g. splicing an entry then reinserting it in the same place) will
  //        trigger the callback, giving potential for infinite loops
  watch(
    () => [attributes.map((attr) => attr.name), selected],
    () => {
      const allAvailable = allAvailableAttributes();
      attributes.forEach((attr, i) => {
        const url = returnValidURL(attr.name, allAvailable);
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

      const dataComponentI = attributes.findIndex(
        (attr) => attr.name === "data-component",
      );
      if (dataComponentI > 0) {
        const dataComponent = attributes.splice(dataComponentI, 1)[0];
        attributes.unshift(dataComponent);
      }

      handleAutocomplete(allAvailable);
    },
  );

  function handleAutocomplete(
    allAvailable: { name: string | null; url: string }[],
  ) {
    const selection = getSelection();
    if (!selection || !selection.focusNode) return;
    const node = selection.focusNode;
    if (
      node instanceof HTMLInputElement &&
      node.classList.contains("attrname-input")
    ) {
      $autocompleteSuggestions = (
        allAvailable
          .map(({ name }) => name)
          .filter((name) => name?.startsWith(node.value)) as string[]
      ).toSorted((a, b) => a.length - b.length);
    } else {
      $autocompleteSuggestions = [];
    }
  }
  function handleComponentAutocomplete(target: EventTarget | null) {
    if (!(target instanceof HTMLInputElement)) return;
    const value = target.value;
    const names = $savedComponents.filter(({ name }) =>
      name.startsWith(value.replace(/-\[?(\d+,)*\d*\]?$/g, "")),
    );
    if (names.length === 1)
      $autocompleteSuggestions = names[0].parts
        .map((part) => `${names[0].name}-[${part}]`)
        .filter((name) => name.startsWith(value))
        .toSorted((a, b) => a.length - b.length);
    else
      $autocompleteSuggestions = names
        .map(({ name }) => name)
        .toSorted((a, b) => a.length - b.length);
  }

  type DataComponentStates = "valid" | "modaldiff" | "modaldiffvalid" | "diff";
  type DataComponentEvents = "reset" | "valid" | "novalid" | "diff";
  const dataComponent = new FiniteStateMachine<
    DataComponentStates,
    DataComponentEvents
  >("valid", {
    valid: {
      diff: "diff",
    },
    modaldiff: {
      valid: "modaldiffvalid",
    },
    modaldiffvalid: {
      novalid: "modaldiff",
    },
    diff: {
      valid: "modaldiffvalid",
    },
    "*": {
      reset: "valid",
      valid: () => undefined,
      novalid: () => undefined,
      diff: () => undefined,
    },
  });
</script>

<ul class="mt-10 attributes-display">
  {#each attributes as attr, i (attr.id)}
    <li
      class:invalid={attr.name && !attr.valid}
      class:disabled={disabled && attr.name !== "data-component"}
      class="group font-mono text-rock-700 text-sm text-balance text-center pb-2 mb-2 border-b-[1px] border-rock-300 last-of-type:border-0"
    >
      <FitContentInput
        class="attrname-input bg-steel-100 font-bold focus:outline-none max-w-[calc(100%_-_8px)] p-1 rounded box-content group-[.invalid]:text-rock-500 group-[.invalid]:underline decoration-wavy decoration-red-700 disabled:opacity-50"
        bind:value={attr.name}
        placeholder="attribute"
        {disabled}
      />
      <FitContentInput
        class="bg-steel-100 focus:outline-none max-w-[calc(100%_-_8px)] p-1 rounded box-content disabled:opacity-50 [&.unsynced]:underline decoration-dotted decoration-2 decoration-blue-400 [&.invalid]:text-rock-500 {attr.name ===
          'data-component' && dataComponent.current.includes('diff')
          ? 'unsynced'
          : ''} {attr.name === 'data-component' &&
        !dataComponent.current.includes('valid')
          ? 'invalid'
          : ''} {attr.name === 'data-component'
          ? 'data-component-val-input'
          : ''}"
        bind:value={attr.value}
        placeholder="value"
        disabled={disabled && attr.name !== "data-component"}
        oninput={(e) =>
          attr.name === "data-component" &&
          handleComponentAutocomplete(e.target)}
      />
      <div
        class="inline-flex translate-y-[6px] [&.disabled]:opacity-50 [&.disabled]:pointer-events-none"
        class:disabled
      >
        <a
          class="text-xl inline-flex items-center justify-center hover:opacity-60 [&.disabled]:pointer-events-none [&.disabled]:opacity-45"
          class:disabled={!attr.valid}
          href={attr.referenceUrl}
          target="_blank"
          aria-disabled={!attr.valid || disabled}
          tabindex={!attr.valid || disabled ? -1 : 0}
        >
          <ion-icon name="help-circle-outline"></ion-icon>
        </a>
        <button
          type="button"
          class="text-xl text-red-700 inline-flex items-center justify-center hover:opacity-60"
          onclick={() => attributes.splice(i, 1)}
          aria-disabled={disabled}
          tabindex={disabled ? -1 : 0}
          ><ion-icon name="close-circle-outline"></ion-icon></button
        >
      </div>
      {#if dataComponent.current.includes("modal") && attr.name === "data-component"}
        <div
          class="font-sans bg-blue-200 border-2 border-blue-400 rounded-lg bg-opacity-50 border-opacity-50 p-2 text-blue-500 mt-1"
        >
          Are you sure you wish to change the component inheritance of this
          node?
          <span class="text-[11px] leading-[1.3] inline-block mt-0.5 italic"
            ><b>Note:&nbsp;</b>Doing this will not affect any of the descendents
            (including text).</span
          >
          <form
            class="text-rock-600 font-mono mt-1"
            onsubmit={(e) => {
              e.preventDefault();
              if (e.submitter?.classList.contains("cancel")) {
                const sharedVal = selected
                  .map((el) => el.getAttribute("data-component"))
                  .reduce((p, c) => (p === c ? c : null));
                if (sharedVal === null) {
                  attributes.splice(
                    attributes.findIndex(
                      (attr) => attr.name === "data-component",
                    ),
                    1,
                  );
                } else {
                  const componentAttr = attributes.find(
                    (attr) => attr.name === "data-component",
                  );
                  if (componentAttr) componentAttr.value = sharedVal;
                }
              } else if (e.submitter?.classList.contains("confirm")) {
                const componentVal = attributes.find(
                  (attr) => attr.name === "data-component",
                )?.value;
                // At the moment componentVal will never be null, because it's only possible to
                //  add or edit data-component (the remove button is disabled on components), but
                //  maybe for the future...
                if (typeof componentVal !== "string")
                  selected.forEach((el) =>
                    el.removeAttribute("data-component"),
                  );
                else
                  selected.forEach((el) => {
                    changeElToComp(el, componentVal);
                  });
                dataComponent.send("reset");
                $nodesSelection = $nodesSelection;
              }
            }}
          >
            <button
              type="submit"
              class="cancel border-2 border-blue-400 border-opacity-50 bg-background px-1 rounded-lg mr-2 hover:bg-rock-100"
              >Cancel</button
            ><button
              type="submit"
              class="confirm border-2 border-blue-400 border-opacity-50 bg-background px-1 rounded-lg hover:bg-rock-100 disabled:opacity-50"
              disabled={!dataComponent.current.includes("valid")}
              >Confirm</button
            >
          </form>
        </div>
      {/if}
    </li>
  {/each}
</ul>
<div
  class="h-[1px] w-full bg-rock-300 text-center [&.disabled]:pointer-events-none [&.disabled]:opacity-50"
  class:disabled
>
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
