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
    syncElementAttributes(x: Node | Node[]): void;
  }

  export interface Attribute {
    name: string;
    value: string;
    referenceUrl: string;
    valid: boolean;
  }

  const HIDDEN_ATTRIBUTES = [
    "style",
    "contenteditable",
    "data-complibver",
    "data-componentname",
    "data-isCompContainer",
    "data-compPartBlacklist",
    "data-compDisinherited",
    "data-style-.*",
    "data-dummycompstyle.*",
    "data-override-.*",
    "data-id",
  ];

  const hiddenAttrsRegex = HIDDEN_ATTRIBUTES.map(
    (matchStr) => new RegExp("^" + matchStr + "$"),
  );

  export function isHiddenAttribute(attrName: string) {
    return hiddenAttrsRegex.some((regex) => regex.test(attrName));
  }

  export function getAttributesRespectingMasks(el: Element): PropsList {
    const domAttributes = Array.from(el.attributes);

    const applyingMasks = maskedAttributes
      .filter((mask) => mask.affectedEls.some(([el_]) => el === el_))
      .map(({ name, value, affectedEls }) => {
        return {
          name,
          realValue: value,
          editorValue: affectedEls.find(([el_]) => el === el_)![1],
        };
      });
    if (applyingMasks.length === 0)
      return domAttributes.map((attr) => [attr.name, attr.value]);

    const final: { name: string; value: string }[] = [];

    for (const attr of domAttributes) {
      const attrMask = applyingMasks.find((mask) => mask.name === attr.name);
      if (attrMask && typeof attrMask.editorValue === "string") {
        final.push({
          name: attr.name,
          value: attrMask.editorValue,
        });
      } else if (attrMask) {
        continue;
      } else {
        final.push({
          name: attr.name,
          value: attr.value,
        });
      }
    }

    applyingMasks.forEach((mask) => {
      if (typeof mask.realValue === "string") return;
      // This mask is for REMOVING an attribute that should otherwise be on the element.
      // That (should, assuming the mask is doing its job) mean that the attribute isn't on the element,
      //  and so we just append the editor value
      // (that should be sensible, as when the mask is removed it will do the same thing; append the attribute).
      if (!el.hasAttribute(mask.name) && typeof mask.editorValue === "string") {
        final.push({
          name: mask.name,
          value: mask.editorValue,
        });
      }
    });

    return final.map((attr) => [attr.name, attr.value]);
    // maskedAttributes.filter((mask) => !domAttributes.some((attr) => attr.name === mask.name) && mask.affectedEls.some((item) => item[0] === el))
  }
</script>

<script lang="ts">
  import { getContext } from "svelte";
  import { watch, FiniteStateMachine } from "runed";
  import tagAttributes from "./tag_attributes.json";
  import FitContentWrapTextarea from "/shared/components/FitContentWrapTextarea.svelte";
  import FitContentInput from "/shared/components/FitContentInput.svelte";
  import {
    autocompleteSuggestions,
    selection,
    savedComponents,
    maskedAttributes,
    type MaskAttribute,
    compPartToInheritedAttrs,
    type PropsList,
  } from "../../store.svelte";
  import { editorState } from "../../url.svelte";
  import {
    changeElToComp,
    componentNameValid,
  } from "../../components/component.svelte";
  import type { TempMutationRecord } from "../../documents/docsyncing";
  import { closest } from "../../helper";

  const updateHighlight: () => void = getContext("updateHighlight");
  const syncFakeMutation: (mutation: TempMutationRecord) => void =
    getContext("syncFakeMutation");

  const suggestCreateNewHistoryItem: () => void = getContext(
    "suggestCreateNewHistoryItem",
  );

  interface Props {
    selected: Element[];
    currentAttrs?: Attribute[];
  }
  let { selected, currentAttrs = $bindable([]) }: Props = $props();

  let attributes: Attribute[] = $state([]);
  let prevAttributes: Attribute[];

  let attributesEl: HTMLElement;

  function setAttribute(el: Element, name: string, value?: string | null) {
    if (value) el.setAttribute(name, value);
    else el.removeAttribute(name);
  }

  // TODO: maskedAttributes could be garbage collected

  /**
   * Starts tracking the usage of a specific attribute on a set of elements.
   *
   * This function masks the specified attribute on the provided elements (or the currently selected elements if none are provided),
   * setting it to the given value. It returns two functions:
   *
   * 1. `endAttributeUsage`: Restores the original attribute values on the affected elements and removes the mask.
   * 2. `updateUsedAttribute`: Updates the masked attribute value on all affected elements.
   *
   * @param name - The name of the attribute to mask and track.
   * @param value - The value to set for the attribute. If omitted, the attribute is removed.
   * @param elements - Optional array of elements to apply the attribute mask to. Defaults to the current selection.
   * @returns A tuple containing:
   *   - `endAttributeUsage`: A function to end the attribute usage and restore original values.
   *   - `updateUsedAttribute`: A function to update the masked attribute value on all affected elements.
   */
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

    const endAttributeUsage = () => {
      const i = maskedAttributes.findIndex((el) => obj === el);
      if (i === -1) return;
      maskedAttributes[i].affectedEls.forEach(([el, userVal]) =>
        setAttribute(el, maskedAttributes[i].name, userVal),
      );
      maskedAttributes.splice(i, 1);
    };

    const updateUsedAttribute = (value?: string | null) => {
      obj.value = value;
      obj.affectedEls.forEach(([el]) => {
        setAttribute(el, obj.name, value);
      });
    };

    return [endAttributeUsage, updateUsedAttribute];
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

  function attributesIntersection(
    els: Element[],
  ): [currentAttrs: Attribute[], editorAttrs: Attribute[]] {
    if (els.length === 0) return [[], []];

    const allAttrsCurrent: Attribute[][] = [];
    const allAttrsEditor: Attribute[][] = [];

    els.forEach((el) => {
      const attrs: Attribute[] = getAttributesRespectingMasks(el).map(
        ([name, value]) => {
          return {
            name,
            value,
            valid: true,
            referenceUrl: "",
          };
        },
      );
      let attrsEditor: Attribute[];

      let elDataComponent: string | null;
      let numInherited: number | undefined;
      if (
        (elDataComponent = el.getAttribute("data-component")) &&
        (numInherited = compPartToInheritedAttrs.get(elDataComponent)?.length)
      ) {
        attrsEditor = attrs
          .toSpliced(0, numInherited)
          .filter((attr) => !isHiddenAttribute(attr.name));
      } else {
        attrsEditor = attrs.filter((attr) => !isHiddenAttribute(attr.name));
      }

      allAttrsCurrent.push(attrs);
      allAttrsEditor.push(attrsEditor);
    });

    const reducedCurrentAttrs = allAttrsCurrent.reduce((prev, curr) =>
      prev.filter((attr) =>
        curr.some((a) => attr.name === a.name && attr.value === a.value),
      ),
    );
    const reducedEditorAttrs = allAttrsEditor.reduce((prev, curr) =>
      prev.filter((attr) =>
        curr.some((a) => attr.name === a.name && attr.value === a.value),
      ),
    );

    return [reducedCurrentAttrs, reducedEditorAttrs];
  }

  /**
   * This function is pretty much only for being called in App.svelte, in the
   *  MutationObserver whenever it sees a mutation to an element's inline styles.
   */
  export function syncElementAttributes(x: Node | Node[]): void {
    const syncAttributes = (el: Element) => {
      dataComponent.send("reset");

      [currentAttrs, prevAttributes] = attributesIntersection(selected);
      attributes = [...prevAttributes];
    };

    if (x instanceof Node) {
      if (!(x instanceof Element)) return;
      syncAttributes(x);
    } else {
      x.forEach((x_) => {
        if (!(x_ instanceof Element)) return;
        syncAttributes(x_);
      });
    }
  }

  // NOTE: The order of these 3 watch statements is important. If the validity watch triggers
  //        on a `selected` change and cause attribute object updates which are picked up the
  //        DOM sync watch, syncing the current attributes, BEFORE the `selected` watch triggers
  //        to find the appropriate attribute intersection, we may inadvertently "clone" attributes
  //        over to newly selected elements.

  // Refresh 'attributes' state when the selection changes
  watch(
    () => selected,
    () => {
      dataComponent.send("reset");
      // TODO: What we're doing with attribute masking and the 'draggable' attribute could also be done
      //        with contenteditable, instead of this check here
      // currentAttrs = attributesIntersection(selected);
      // prevAttributes = currentAttrs.filter(
      //   (attr) => !isHiddenAttribute(attr.name),
      // );
      [currentAttrs, prevAttributes] = attributesIntersection(selected);
      attributes = [...prevAttributes];
    },
  );

  // Determine validity & add MDN url when attribute names change
  // NOTE: Be careful, even updates that don't actually change the watch value
  //        (e.g. splicing an entry then reinserting it in the same place) will
  //        trigger the callback, giving potential for infinite loops
  // NOTE2: It's important to understand dependencies (https://svelte.dev/docs/svelte/$effect#Understanding-dependencies)
  //         to know when this watch will re-trigger. Essentially, if the getter
  //         was just `() => attributes`, that would run whenever `attributes` is
  //         reassigned and no time else. To run any time `attributes` is reassigned
  //         OR updated, we can use `() => $state.snapshot(attributes)`. For something
  //         in-between, we have `() => attributes.map((attr) => attr.name)`, which runs
  //         whenever `attributes` is reassigned OR whenevever objects are added or removed
  //         OR whenever a `name` of an object is *changed* (not merely reassigned), but not
  //         for any other property changes.
  //         See: https://svelte.dev/playground/8e68ac4df9a047cebdb69e99be47808c?version=5.35.5
  watch([() => attributes.map((attr) => attr.name), () => selected], () => {
    const allAvailable = allAvailableAttributes();
    attributes.forEach((attr, i) => {
      const url = returnValidURL(attr.name, allAvailable);
      if (!url || attributes.slice(0, i).some((el) => el.name === attr.name)) {
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
    if (
      dataComponentI > 0 ||
      (dataComponentI === 0 && editorState.mode !== "document")
    ) {
      const dataComponent = attributes.splice(dataComponentI, 1)[0];
      if (editorState.mode === "document") attributes.unshift(dataComponent);
    }

    handleAutocomplete(allAvailable);
  });

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
              .forEach((elval) => {
                elval[1] = remove ? null : attribute.value;
                syncFakeMutation({
                  type: "attributes",
                  target: elval[0],
                  attributeName: attribute.name,
                  addedNode: null,
                  removedNode: null,
                  previousSibling: elval[0].previousSibling,
                  oldValue: null,
                });
              });
          });
        });

      // console.log("Attributes:", $state.snapshot(attributes));
      // console.log("Removed attributes:", $state.snapshot(removeAttrs));
      // console.log("Attribute masks:", $state.snapshot(maskedAttributes));

      syncMaskedAttributes(attributes);
      syncMaskedAttributes(removeAttrs, true);

      prevAttributes = $state.snapshot(attributes);

      // Sync attributes to the DOM
      for (const target of selected) {
        // console.log(removeAttrs, attributes);
        removeAttrs.forEach((attr) => {
          if (attr.name === "data-component") dataComponent.send("reset");
          if (
            !attributeMasked(target, attr.name) &&
            target.hasAttribute(attr.name) &&
            !isHiddenAttribute(attr.name)
          ) {
            target.removeAttribute(attr.name);
          }
        });
        attributes.forEach((attr) => {
          if (
            isHiddenAttribute(attr.name) ||
            target.getAttribute(attr.name) === attr.value
          ) {
            if (attr.name === "data-component") dataComponent.send("reset");
            return;
          }
          if (attr.name === "data-component") {
            dataComponent.send("diff");
            if (componentNameValid(attr.value)) dataComponent.send("valid");
            else dataComponent.send("novalid");
            return;
          }
          if (attr.valid && !attributeMasked(target, attr.name)) {
            //
            const targetDataComponent = target.getAttribute("data-component");
            let numInherited: number | undefined;
            if (
              targetDataComponent &&
              (numInherited =
                compPartToInheritedAttrs.get(targetDataComponent)?.length)
            ) {
              const attrI = Array.from(target.attributes).findIndex(
                (a) => a.name === attr.name,
              );
              if (attrI !== -1 && attrI < numInherited)
                target.removeAttribute(attr.name);
            }

            target.setAttribute(attr.name, attr.value);
          }
        });
      }
      updateHighlight();
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

  function handleAutocomplete(
    allAvailable: { name: string | null; url: string }[],
  ) {
    const caret = getSelection();
    if (!caret || !caret.focusNode) return;
    if (!closest(caret.focusNode, attributesEl)) return;

    const node = caret.focusNode;
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
    if (!(target instanceof HTMLTextAreaElement)) return;
    const value = target.value;
    const names = savedComponents.filter(({ name }) =>
      name.startsWith(value.replace(/-\[?(\d+,)*\d*\]?$/g, "")),
    );
    if (names.length === 1)
      $autocompleteSuggestions = names[0].parts
        .split("|")
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

  // HANDLING THE CREATING OF NEW HISTORY ITEMS

  // Used by onselectionchange to suggest new history items when there's a selection change without an input
  //  (NOTE: the timing of events was tested that oninput does indeed get called before onselectionchange)
  let calledOnInput: boolean = false;

  let lastEditType: "back" | "forward" | "other" | null = null;
  function handleInputForHistory(e: Event) {
    if (!(e instanceof InputEvent)) return;

    let editType: typeof lastEditType;
    if (e.inputType.startsWith("insert")) editType = "forward";
    else if (e.inputType.startsWith("delete")) editType = "back";
    else editType = "other";

    if (lastEditType !== null && editType !== lastEditType) {
      suggestCreateNewHistoryItem();
    }
    lastEditType = editType;

    if (e.data === " ") suggestCreateNewHistoryItem();
  }
</script>

<svelte:document
  onselectionchange={() => {
    const caret = getSelection();
    if (!caret || !closest(caret.focusNode, attributesEl)) return;

    // console.log("AttributeEditor selection update! 💙");
    // Suggest new history items if the selection changed without an input event being fired
    //  (i.e. the user is using the arrow keys, or clicking around, or making a range selection)
    if (!calledOnInput) suggestCreateNewHistoryItem();
    calledOnInput = false;
  }}
/>

<ul class="mt-10 attributes-display" bind:this={attributesEl}>
  {#each attributes as attr, i}
    <li
      class:invalid={attr.name && !attr.valid}
      class="group font-mono text-rock-700 text-sm text-balance flex items-center justify-center flex-wrap pb-2 mb-2 border-b border-rock-300 last-of-type:border-0"
    >
      <FitContentInput
        class="attrname-input m-0.5 text-wrap bg-steel-100 font-bold focus:outline-none max-w-[calc(100%-8px)] p-1 rounded box-content group-[.invalid]:text-rock-500 group-[.invalid]:underline decoration-wavy decoration-red-700 disabled:opacity-50"
        bind:value={attr.name}
        placeholder="attribute"
        disabled={attr.name === "data-component"}
        oninput={(e) => {
          calledOnInput = true;
          handleInputForHistory(e);
        }}
      />
      <FitContentWrapTextarea
        class="resize-none m-0.5 text-wrap bg-steel-100 focus:outline-none max-w-[calc(100%-8px)] p-1 rounded box-content [.unsynced]:underline decoration-dotted decoration-2 decoration-blue-400 [.invalid]:text-rock-500 {attr.name ===
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
        oninput={(e) => {
          if (attr.name === "data-component")
            handleComponentAutocomplete(e.target);
          calledOnInput = true;
          handleInputForHistory(e);
        }}
      />
      <div
        class="inline-flex [.disabled]:opacity-50 [.disabled]:pointer-events-none"
      >
        <a
          class="text-xl inline-flex items-center justify-center hover:opacity-60 [.disabled]:pointer-events-none [.disabled]:opacity-45"
          class:disabled={!attr.valid}
          href={attr.referenceUrl}
          target="_blank"
          aria-disabled={!attr.valid}
          tabindex={!attr.valid ? -1 : 0}
          aria-label="Open MDN docs"
        >
          <ion-icon name="help-circle-outline"></ion-icon>
        </a>
        <button
          type="button"
          class="text-xl text-red-700 inline-flex items-center justify-center hover:opacity-60"
          onclick={() => attributes.splice(i, 1)}
          aria-label="Remove attribute"
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
                // TODO: Reassigning selection.selected to itself won't trigger an update (I believe), as it is state not store.
                // $nodesSelection = $nodesSelection;
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
<div class="h-px w-full bg-rock-300 text-center">
  <button
    class="inline-block bg-background text-rock-400 text-xl -translate-y-1/2 px-2 hover:text-rock-200"
    onclick={() =>
      attributes.push({
        name: "",
        value: "",
        referenceUrl: "",
        valid: false,
      })}>+</button
  >
</div>
