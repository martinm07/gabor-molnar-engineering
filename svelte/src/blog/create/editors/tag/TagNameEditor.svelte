<script lang="ts">
  import { onDestroy, getContext } from "svelte";
  import { autocompleteSuggestions, nodesSelection } from "../../store";
  import {
    calculateTotalOffset,
    findNodeFromOffset,
  } from "../css/CSSEditor.svelte";
  import tagAttributes from "./../attributes/tag_attributes.json";
  import { on } from "svelte/events";
  import { watch } from "runed";
  import { request2AnimationFrames } from "/shared/helper";

  interface Props {
    selected: Element[];
    disabled: boolean;
  }
  let { selected, disabled }: Props = $props();

  const changeElementInMasks: (oldEl: Element, newEl: Element) => void =
    getContext("changeElementInMasks");

  function allSameName(tags: Element[]): boolean {
    return Boolean(
      tags.map((el) => el.tagName).reduce((p, c) => (p === c ? c : "")),
    );
  }

  function parseTagStr(str: string) {
    const strLower = str.toLowerCase();
    const strFiltered = strLower.match(/[a-z1-6]/g)?.join("") ?? "";

    tagNameURL = getTagURL(strFiltered);
    if (tagNameURL && tagName !== strFiltered) {
      const replacements: HTMLElement[] = [];
      for (const target of selected) {
        const replacement = document.createElement(strFiltered);
        // Moves all the children to the new element
        while (target.firstChild) replacement.appendChild(target.firstChild);
        // Copy attributes
        for (let i = target.attributes.length - 1; i >= 0; --i) {
          replacement.attributes.setNamedItem(
            target.attributes[i].cloneNode() as Attr,
          );
        }

        // Replace with replacement
        target.parentNode?.replaceChild(replacement, target);
        changeElementInMasks(target, replacement);
        replacements.push(replacement);
      }
      $nodesSelection = [];
      request2AnimationFrames(() => ($nodesSelection = replacements));
    }

    return `&#60;<span>${strFiltered}</span>&#62;`;
  }

  let tagEl: HTMLElement | undefined = $state();
  let tagName: string | null = $state(null);
  let tagNameURL: string | null = $state(null);

  watch(
    () => selected,
    () => {
      if (!tagEl || selected.length === 0) return;
      tagName = allSameName(selected) ? selected[0].tagName.toLowerCase() : "";
      tagEl.innerHTML = parseTagStr(tagName ?? "");
      tagNameURL = getTagURL(tagName ?? "");
    },
  );

  function getTagURL(tagName: string) {
    return tagAttributes.find((el) => el.tag === tagName)?.url ?? null;
  }

  function onInput(e_: any) {
    const e = e_ as InputEvent;
    if (!tagEl) return;
    const selection = document.getSelection();
    const offset = calculateTotalOffset(
      tagEl,
      selection?.focusNode,
      selection?.focusOffset,
    );
    const text = tagEl.textContent ?? "";
    const parsed = parseTagStr(text);
    tagEl.innerHTML = parsed;

    tagNameURL = getTagURL(parsed.slice(11, -12));

    const [node, newOffset] = findNodeFromOffset(
      tagEl,
      text.length === 3 ? 2 : offset,
    );
    selection?.setPosition(node, newOffset);
    handleAutocomplete();
  }

  function handleAutocomplete() {
    const selection = getSelection();
    if (!selection || !selection.focusNode) return;
    const node = selection.focusNode;
    if (
      (node instanceof HTMLElement && node.tagName === "SPAN") ||
      node.parentElement?.tagName === "SPAN"
    ) {
      $autocompleteSuggestions = tagAttributes
        .map(({ tag }) => tag)
        .filter(
          (name) =>
            name.toLowerCase() === name &&
            node.textContent &&
            name.startsWith(node.textContent),
        )
        .toSorted((a, b) => a.length - b.length);
    } else {
      $autocompleteSuggestions = [];
    }
  }

  const off = on(document, "selectionchange", () => {
    const selection = document.getSelection();
    if (!selection || !tagEl) return;

    const possibilities: [Node | null, number, Node | null, number][] = [
      [
        selection.anchorNode,
        selection.anchorOffset,
        selection.focusNode,
        selection.focusOffset,
      ],
      [
        selection.focusNode,
        selection.focusOffset,
        selection.anchorNode,
        selection.anchorOffset,
      ],
    ];

    const mainTextNode = tagEl.childNodes[1].childNodes[0];
    if (!(mainTextNode instanceof Text)) return;
    for (const [
      anchorNode,
      anchorOffset,
      focusNode,
      focusOffset,
    ] of possibilities) {
      if (focusNode && focusNode === tagEl.childNodes[0]) {
        if (anchorNode)
          selection.setBaseAndExtent(anchorNode, anchorOffset, mainTextNode, 0);
        else selection.setPosition(mainTextNode, 0);
      }
      if (focusNode && focusNode === tagEl.childNodes[2]) {
        if (anchorNode)
          selection.setBaseAndExtent(
            anchorNode,
            anchorOffset,
            mainTextNode,
            (mainTextNode.textContent?.length ?? 1) - 0,
          );
        else
          selection.setPosition(
            mainTextNode,
            (mainTextNode.textContent?.length ?? 1) - 0,
          );
      }
    }
  });
  onDestroy(off);
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<span
  bind:this={tagEl}
  oninput={onInput}
  contenteditable="true"
  class:invalid={!tagNameURL}
  class="tagname-display bg-steel-100 p-2 rounded font-mono text-lg font-bold text-rock-700 focus:outline-none [&.disabled]:opacity-50 [&.disabled]:pointer-events-none"
  aria-disabled={disabled}
  class:disabled
  tabindex={disabled ? -1 : 0}
>
  &#60;<span>{tagName}</span>&#62;
</span><a
  href={tagNameURL}
  target="_blank"
  class:disabled={!tagNameURL || disabled}
  aria-disabled={!tagNameURL || disabled}
  class="text-xl hover:opacity-60 [&.disabled]:opacity-50 [&.disabled]:pointer-events-none text-rock-700 inline-block ml-1"
  tabindex={!tagNameURL || disabled ? -1 : 0}
>
  <ion-icon name="help-circle-outline"></ion-icon>
</a>

<style>
  :global(.tagname-display.invalid span) {
    /* @apply underline decoration-wavy decoration-red-700; */
    text-decoration: underline wavy #b91c1c;
  }
</style>
