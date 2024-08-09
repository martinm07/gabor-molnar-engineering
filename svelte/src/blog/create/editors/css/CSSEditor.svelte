<script context="module" lang="ts">
  export function calculateTotalOffset(
    parentEl?: Element,
    targetNode?: Node | null,
    targetOffset?: number,
  ) {
    if (!targetNode || !parentEl) return 0;

    // Target node is the outer div, which can happen when a child element is removed
    //  (through all the text content getting deleted)
    if (targetNode === parentEl) {
      return Array(...parentEl.children)
        .slice(0, targetOffset ?? 0)
        .map((node) => node.textContent?.length ?? 0)
        .reduce((p, c) => p + c, 0);
      // Target node is one of the elements, which can happen when pressing Enter inside one of the elements,
      //  splitting it into a [<text> <br> <text>].
    } else if (targetNode instanceof Element) {
      let children = Array(...parentEl.children);
      children = children.slice(0, children.indexOf(targetNode));
      const elOffset = children
        .map((child) => child.textContent?.length ?? 0)
        .reduce((p, c) => p + c, 0);
      const nodeOffset = Array(...targetNode.childNodes)
        .slice(0, targetOffset ?? 0)
        .map((node) => node.textContent?.length ?? 0)
        .reduce((p, c) => p + c, 0);
      return elOffset + nodeOffset;
    }

    // Target node is one of the text nodes, which is the case for usual insertions/deletions
    const textNodes = getTextNodes(parentEl);
    let totalOffset = 0;
    for (const textNode of textNodes) {
      if (textNode === targetNode) break;
      totalOffset += textNode.length;
    }
    return totalOffset + (targetOffset ?? 0);
  }

  export function findNodeFromOffset(
    el: Element | undefined,
    offset: number,
  ): [node: Text, offset: number] {
    if (!el) return [Object.create(Text), 0];
    const textNodes = getTextNodes(el);
    let remainingOffset = offset;
    let currentNode: Text = Object.create(Text);
    for (const textNode of textNodes) {
      currentNode = textNode;
      if (textNode.length >= remainingOffset) break;
      else remainingOffset -= textNode.length;
    }
    return [currentNode, remainingOffset];
  }

  const isTextNode = (node: Node): node is Text =>
    node.nodeType === Node.TEXT_NODE;
  function getTextNodes(node: Node): Text[] {
    if (isTextNode(node)) {
      return [node];
    } else {
      return Array(...node.childNodes).flatMap((node) => getTextNodes(node));
    }
  }
</script>

<script lang="ts">
  import { diffChars } from "diff";
  import { onDestroy, getContext } from "svelte";
  import { on } from "svelte/events";
  import { watch } from "runed";
  import { cssStyles } from "../../store";
  import { charInStrQuoted, getCSSProps, splitStringAtChar } from "./handlecss";

  let styles = $state("");
  let stylesEl: HTMLElement;
  const updateHighlight: () => void = getContext("updateHighlight");

  interface Props {
    selected: Element[];
  }
  let { selected }: Props = $props();

  type StylesList = [k: string, v: string][];

  watch(
    () => selected,
    (targets) => {
      let commonStyles: StylesList | undefined;
      for (const target of targets) {
        let styles_ = $cssStyles.get(target);
        if (!styles_) {
          const genStyles = getCSSProps(target);
          $cssStyles.set(target, genStyles);
          styles_ = genStyles;
        }
        commonStyles = commonStyles
          ? stylesIntersection(commonStyles, styles_)
          : styles_;
      }
      if (!commonStyles) return;
      [styles] = parseStylesStr(
        commonStyles.map((style) => `${style[0]}:${style[1]};`).join(" "),
      );
      if (stylesEl?.innerHTML) stylesEl.innerHTML = styles;
    },
  );

  // Take the intersection of styles to have the same name and value
  function stylesIntersection(s1: StylesList, s2: StylesList): StylesList {
    return s1.filter((s, i) => s[0] === s2[i]?.[0] && s[1] === s2[i]?.[1]);
  }

  function parseStylesStr(inp?: HTMLElement | string): [string, StylesList] {
    let str = typeof inp === "string" ? inp : inp?.textContent ?? "";

    const props = splitStringAtChar(str, ";")
      .map((propStr) => {
        const keyval = splitStringAtChar(propStr, ":");
        if (propStr.length === 0) return null;
        if (keyval.length === 1) return [keyval[0], ""];
        // if (keyval.length === 3) return []
        return keyval;
      })
      .filter((keyval) => keyval);
    let reflowed = props
      .flat()
      .map((item, i, a) => (i % 2 === 0 ? [item, a.at(i + 1) ?? ""] : []))
      .filter((_, i) => i % 2 === 0) as StylesList;
    reflowed = reflowed.map(([propname, val]) => [
      propname.replace(/[^a-zA-Z0-9\-_]/g, ""),
      val,
    ]);

    let htmlStr = reflowed
      .map((prop, i) => {
        return `<b>${prop[0]}</b><div class="colon">:</div><em>${prop[1]}</em>`;
      })
      .join('<div class="semic">;</div><br />');
    htmlStr += '<div class="semic">;</div>';

    return [htmlStr, reflowed];
  }

  function syncStyles(styles: string | StylesList) {
    let styleStr: string;
    let propsList: StylesList;

    if (typeof styles === "string") {
      styleStr = styles;
      propsList = splitStringAtChar(styleStr, ";").map((propStr) =>
        splitStringAtChar(propStr, ":").map((str) => str.trim()),
      ) as StylesList;
    } else {
      propsList = styles;
      styleStr = propsList.map((item) => item.join(":")).join(";");
    }
    for (const target of selected) {
      if (!(target instanceof HTMLElement)) continue;
      target.setAttribute("style", styleStr);
      $cssStyles.set(target, propsList as StylesList);
    }
    updateHighlight();
  }

  function preventColonsDeletion(styleStr: string, prevStyleStr: string) {
    const diff = diffChars(prevStyleStr, styleStr);
    let finalStr = "";
    for (const change of diff) {
      if (!change.removed) finalStr += change.value;
      else {
        const del = change.value;
        let toBeAdded = [...del.matchAll(/[;:]/g)]
          .map((exp) => (!charInStrQuoted(del, exp.index) ? exp[0] : ""))
          .join("");
        // :;: <-- margin:0;position:rela
        // :;:; <-- margin:0;position:relative;disp
        // ;:; <-- 0px;display:block;
        // ;:;: <-- 0px;display:block;position:rela
        toBeAdded = toBeAdded.replace(/(?<!^):;/g, "");
        // toBeAdded will at most be 3 long
        if (toBeAdded.startsWith(":;") && finalStr.at(-1) === ";")
          toBeAdded = toBeAdded.slice(2);
        finalStr += toBeAdded;
      }
    }
    return finalStr;
  }

  let prevStyleStr: string;
  function onInput(e_: any) {
    if (!stylesEl) return;
    const selection = document.getSelection();
    const offset = calculateTotalOffset(
      stylesEl,
      selection?.focusNode,
      selection?.focusOffset,
    );

    const styleStr = preventColonsDeletion(
      stylesEl.textContent ?? "",
      prevStyleStr,
    );
    let propsList: StylesList;
    [stylesEl.innerHTML, propsList] = parseStylesStr(styleStr);
    syncStyles(propsList);

    if (enterPressed) selection?.setPosition(stylesEl, enterPressed);
    else {
      const [node, newOffset] = findNodeFromOffset(
        stylesEl,
        offset + Number(backspaceRemoveLine),
      );
      selection?.setPosition(node, newOffset);
    }
    enterPressed = undefined;
    backspaceRemoveLine = false;
  }

  const off1 = on(document, "selectionchange", (e) => {
    const selection = document.getSelection();
    function adjustSelection(
      predicate: (el: HTMLElement) => boolean,
      whenOffset: number,
      bump: "prev" | "next",
      selectionNode: "anchor" | "focus",
    ) {
      const el = (
        selectionNode === "anchor"
          ? selection?.anchorNode
          : selection?.focusNode
      )?.parentElement;
      const offset =
        selectionNode === "anchor"
          ? selection?.anchorOffset
          : selection?.focusOffset;
      if (selection && el && predicate(el) && offset === whenOffset) {
        const newFocus = (
          bump === "prev" ? el.previousElementSibling : el.nextElementSibling
        )?.childNodes[0];
        if (newFocus && newFocus instanceof Text) {
          const offset = bump === "prev" ? newFocus.length : 0;
          if (selection.focusNode && selection.anchorNode) {
            selectionNode === "anchor"
              ? selection.setBaseAndExtent(
                  newFocus,
                  offset,
                  selection.focusNode,
                  selection.focusOffset,
                )
              : selection.setBaseAndExtent(
                  selection.anchorNode,
                  selection.anchorOffset,
                  newFocus,
                  offset,
                );
          } else
            selection.setPosition(
              newFocus,
              bump === "prev" ? newFocus.length : 0,
            );
        }
      }
    }

    // console.log(
    //   insertAtIndex(
    //     "|",
    //     selection?.focusNode?.textContent,
    //     selection?.focusOffset,
    //   ),
    // );
    const anchorfocus: Array<"anchor" | "focus"> = ["anchor", "focus"];
    for (const focus of anchorfocus) {
      adjustSelection((el) => el.classList.contains("semic"), 0, "prev", focus);
      adjustSelection((el) => el.classList.contains("colon"), 0, "prev", focus);
      adjustSelection((el) => el.classList.contains("colon"), 1, "next", focus);
    }
  });
  onDestroy(off1);

  function recursiveGetNodes(el: Node): Node[] {
    if (el.childNodes.length === 0) return [el];
    return [
      el,
      ...Array(...el.childNodes).flatMap((node) => recursiveGetNodes(node)),
    ];
  }

  function getSelectionLine() {
    const selection = document.getSelection();
    if (!selection || !stylesEl) return;
    const focusNode =
      selection.focusNode === stylesEl
        ? stylesEl.childNodes[selection.focusOffset]
        : selection.focusNode;
    const nodes = recursiveGetNodes(stylesEl);
    let line: Node[] = [];
    let foundLine: boolean = false;
    for (const node of nodes) {
      if (node instanceof HTMLElement && node.tagName === "BR") {
        if (!foundLine) line = [];
        else break;
      }
      line.push(node);
      if (focusNode === node) foundLine = true;
    }
    return line;
  }

  let enterPressed: number | undefined;
  let backspaceRemoveLine: boolean = false;
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Backspace" && stylesEl) {
      const line = getSelectionLine();
      if (!line) return;
      const text = line
        .map((node) =>
          node.nodeType === Node.TEXT_NODE ? node.textContent : "",
        )
        .join("");
      if (text.length <= 3 && text.includes(":") && text.includes(";")) {
        line.forEach((node) => {
          if (stylesEl && stylesEl.contains(node)) stylesEl?.removeChild(node);
        });
        backspaceRemoveLine = true;
      }
    } else if (e.key === "Enter" && stylesEl) {
      const line = getSelectionLine();
      if (!line) return;
      const finalNode = line.at(-1);
      if (finalNode?.textContent) finalNode.textContent += ":;";
      let offset = 0;
      for (const child of stylesEl.children) {
        if (child.contains(finalNode ?? null)) break;
        offset++;
      }
      // Two after the final node of the line is where the next line starts
      // Must set the selection after the innerHTML is refreshed
      enterPressed = offset + 2;
    } else if (e.key === ":" && stylesEl) {
      e.preventDefault();
      const line = getSelectionLine();
      if (!line) return;
      const selection = getSelection();
      const colon = line.find((node) => node.textContent === ":") ?? null;
      selection?.setPosition(colon, 1);
    } else if (e.key === ";" && stylesEl) {
      e.preventDefault();
      const line = getSelectionLine();
      if (!line) return;
      const selection = getSelection();
      const semic = line.find((node) => node.textContent === ";") ?? null;
      selection?.setPosition(semic, 1);
    }
  }
</script>

<div
  role="application"
  bind:this={stylesEl}
  contenteditable="true"
  oninput={onInput}
  onbeforeinput={(e) => {
    prevStyleStr = stylesEl.textContent ?? "";
  }}
  onkeydown={onKeydown}
  class="styles-display font-mono inline-block text-left text-rock-700 bg-steel-100 p-2 rounded focus:outline-none text-sm"
>
  {@html styles}
</div>

<style>
  :global(.styles-display .colon, .styles-display .semic) {
    display: inline-block;
    margin-right: 4px;
    color: var(--rock-500);
  }
  :global(.styles-display .semic) {
    display: inline-block;
  }
</style>
