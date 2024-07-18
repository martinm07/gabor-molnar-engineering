<script lang="ts">
  import { useMutationObserver } from "runed";
  import { getCSSProps, splitStringAtChar } from "./handlecss";
  import { cssStyles } from "./store";
  import { onMount, onDestroy } from "svelte";
  import { on } from "svelte/events";

  interface Props {
    nodeHoverTarget: Element | undefined;
  }

  let { nodeHoverTarget }: Props = $props();

  let styles: string = $state("");
  $effect(() => {
    if (!nodeHoverTarget) return;

    let styles_ = $cssStyles.get(nodeHoverTarget);
    if (!styles_) {
      const genStyles = getCSSProps(nodeHoverTarget);
      $cssStyles.set(nodeHoverTarget, genStyles);
      styles_ = genStyles;
    }

    styles = parseStylesStr(
      styles_.map((style) => `${style[0]}:${style[1]};`).join(" "),
    );
    if (stylesEl?.innerHTML) stylesEl.innerHTML = styles;
  });
  let stylesEl: HTMLElement | undefined = $state();

  function endsWith(str: string, regex: RegExp) {
    const result = regex.exec(str);
    if (!result) return false;
    return str.length === result.index + result[0].length;
  }

  const insertAtIndex = (insert: string, str?: string | null, id?: number) => {
    if (!str) return "";
    return str.slice(0, id) + insert + str.slice(id);
  };

  // Traverses up the parent chain until it finds a parent with a next sibling
  function findNextSibling(node: Node): Node | null {
    if (node.nextSibling) return node.nextSibling;
    else return node.parentNode ? findNextSibling(node.parentNode) : null;
  }

  function parseStylesStr(inp?: HTMLElement | string) {
    let str = typeof inp === "string" ? inp : inp?.textContent ?? "";

    const props = splitStringAtChar(str, ":").map((el, i, a) => {
      if (i !== 0) {
        const valprop = splitStringAtChar(el, ";");
        if (valprop.length === 1) return ["", valprop[0]];
        else return valprop;
      } else return i === 0 ? ["", el] : [el, ""];
    });

    const reflowed = props
      .flat()
      .map((el, i, a) => (i % 2 === 0 ? [el, a.at(i + 1) ?? ""] : []))
      .filter((_, i) => i % 2 === 0)
      .filter((el, i, a) => el[0] || el[1] || i === a.length - 1);
    if (reflowed.at(-1)?.at(1)) reflowed.push(["", ""]);
    console.log(reflowed);

    console.log(str, props);
    let propStr = reflowed
      .map((prop, i, a) => {
        if (i === 0) return `<b>${prop[1].trim()}</b>`;
        // if (i === a.length - 1)
        //   return `<em>${prop[0]}</em><div class="semic">;</div>`;
        if (!prop[1].trim())
          return `<em>${prop[0]}</em><div class="semic">;</div><br />`;
        return `<em>${prop[0]}</em><div class="semic">;</div><br /><b>${prop[1].trim()}</b>`;
      })
      .join('<div class="colon">:</div>');
    if (propStr.endsWith("<br />")) propStr = propStr.slice(0, -6);
    console.log(propStr);
    // console.log(propStr);
    return propStr;
  }

  function parseStylesStr2(inp?: HTMLElement | string) {
    let str = typeof inp === "string" ? inp : inp?.textContent ?? "";
    const props = splitStringAtChar(str, ";").map((prop) =>
      splitStringAtChar(prop, ":"),
    );
    // parseStylesStr2(str);
    const propStrs = props.map((prop) => {
      if (prop.length === 0) return "";
      if (prop.length === 1)
        return `<b>${prop[0].trim()}</b><div class="colon">:</div><div class="semic">;</div>`;
      return `<b>${prop[0].trim()}</b><div class="colon">:</div><em>${prop[1]}</em><div class="semic">;</div>`;
    });
    return propStrs.join("<br />");
  }

  function calculateTotalOffset(
    targetNode?: Node | null,
    targetOffset?: number,
  ) {
    if (!targetNode || !stylesEl) return 0;

    // Target node is the outer div, which can happen when a child element is removed
    //  (through all the text content getting deleted)
    if (targetNode === stylesEl) {
      return Array(...stylesEl.children)
        .slice(0, targetOffset ?? 0)
        .map((node) => node.textContent?.length ?? 0)
        .reduce((p, c) => p + c, 0);
      // Target node is one of the elements, which can happen when pressing Enter inside one of the elements,
      //  splitting it into a [<text> <br> <text>].
    } else if (targetNode instanceof Element) {
      let children = Array(...stylesEl.children);
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
    const textNodes = getTextNodes(stylesEl);
    let totalOffset = 0;
    for (const textNode of textNodes) {
      if (textNode === targetNode) break;
      totalOffset += textNode.length;
    }
    return totalOffset + (targetOffset ?? 0);
  }

  function findNodeFromOffset(offset: number): [node: Text, offset: number] {
    if (!stylesEl) return [Object.create(Text), 0];
    const textNodes = getTextNodes(stylesEl);
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

  function onInput(e_: any) {
    const e = e_ as InputEvent;
    if (!stylesEl) return;
    const selection = document.getSelection();
    const offset = calculateTotalOffset(
      selection?.focusNode,
      selection?.focusOffset,
    );
    stylesEl.innerHTML = parseStylesStr(stylesEl);
    const [node, newOffset] = findNodeFromOffset(offset);
    if (enterPressed) selection?.setPosition(stylesEl, enterPressed);
    else selection?.setPosition(node, newOffset);
    enterPressed = undefined;
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
      // adjustSelection((el) => el.classList.contains("colon"), 1, "next", focus);
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
        e.preventDefault();
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
    }
  }
</script>

{#if nodeHoverTarget}
  <div class="text-center font-mono text-lg font-bold text-rock-700">
    <span class="bg-steel-100 p-2 rounded">
      &#60;{nodeHoverTarget.tagName.toLowerCase()}&#62;
    </span>
  </div>
{/if}
<div class:hidden={!nodeHoverTarget} class="w-full h-fit p-2 text-center mt-8">
  <div
    role="application"
    bind:this={stylesEl}
    contenteditable="true"
    oninput={onInput}
    onkeydown={onKeydown}
    class="styles-display font-mono inline-block text-left text-rock-700 bg-steel-100 p-2 rounded focus:outline-none text-sm"
  >
    {@html styles}
  </div>
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
