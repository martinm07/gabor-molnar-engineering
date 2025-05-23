<script module lang="ts">
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
  import MDNLinks from "./mdn_links.json";
  import { diffChars } from "diff";
  import { onDestroy, getContext } from "svelte";
  import { on } from "svelte/events";
  import { watch } from "runed";
  import { cssStyles, autocompleteSuggestions } from "../../store";
  import {
    charInStrQuoted,
    getCSSProps,
    splitStringAtChar,
    allowedPropNames,
  } from "./handlecss";
  import { ClonedSelection, insertAtIndex, isInputEvent } from "../../helper";
  import {
    type CSSEditorState,
    type StyleStrSelection,
    UndoManager,
  } from "./undo.svelte";

  let styles = $state("");
  let stylesEl: HTMLElement;
  const updateHighlight: () => void = getContext("updateHighlight");
  const getPrevSelection: () => ClonedSelection | null =
    getContext("getPrevSelection");

  const undoManager = new UndoManager();

  let prevSelection: ClonedSelection | null = $state(null);

  let styleStrSelection: StyleStrSelection | null = null;
  let prevStyleStrSelection: StyleStrSelection | null = null;

  interface Props {
    selected: Element[];
    disabled: boolean;
  }
  let { selected, disabled }: Props = $props();

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
          target.setAttribute(
            "style",
            genStyles.map((item) => item.join(":")).join(";"),
          );
          styles_ = genStyles;
        }
        commonStyles = commonStyles
          ? stylesIntersection(commonStyles, styles_)
          : styles_;
      }
      if (!commonStyles) return;
      prevSyncedStyles = commonStyles;

      const styleStr = commonStyles
        .map((style) => `${style[0]}:${style[1]};`)
        .join(" ");

      let plainStr: string;
      [styles, , plainStr] = parseStylesStr(styleStr);
      if (stylesEl?.innerHTML) stylesEl.innerHTML = styles;

      undoManager.changeSelection(targets, {
        text: plainStr,
        selection: {
          isCollapsed: true,
          focusIndex: 0,
          anchorIndex: 0,
          direction: "none",
          focusLoc: "other",
        },
        insertType: "other",
      });
    },
  );

  // Take the intersection of styles to have the same name and value
  function stylesIntersection(s1: StylesList, s2: StylesList): StylesList {
    const final: StylesList = [];
    for (const kvPair of s1) {
      if (s2.some(([k, v]) => k === kvPair[0] && v === kvPair[1]))
        final.push(kvPair);
    }
    return final;
  }

  function parseStylesStr(
    inp?: HTMLElement | string,
  ): [string, StylesList, string] {
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

    const htmlStrStatements: string[] = [];
    const plainStrStatements: string[] = [];
    reflowed.forEach((prop, i) => {
      const url = MDNLinks.find((item) => item.name === prop[0])?.url;
      const urlMarkup = url
        ? `<a href=${url} contenteditable="false" target="_blank"><ion-icon name="help-circle-outline"></ion-icon></a>`
        : "";
      const validMarkup = allowedPropNames.includes(prop[0])
        ? ""
        : ' class="invalid"';

      htmlStrStatements[i] =
        `<b${validMarkup}>${urlMarkup}${prop[0]}</b><div class="colon">:</div><em>${prop[1]}</em>`;
      plainStrStatements[i] = `${prop[0]}:${prop[1]}`;
    });

    let htmlStr = htmlStrStatements.join('<div class="semic">;</div><br />');
    let plainStr = plainStrStatements.join(";");

    htmlStr += '<div class="semic">;</div>';
    plainStr += ";";

    return [htmlStr, reflowed, plainStr];
  }

  let prevSyncedStyles: StylesList;
  function syncStyles(propsList: StylesList) {
    const removeProps = prevSyncedStyles.filter(
      (prop) => !propsList.some((p) => p[0] === prop[0]),
    );

    for (const target of selected) {
      if (!(target instanceof HTMLElement)) continue;

      let targetProps: StylesList;

      if (target.getAttribute("style"))
        targetProps = splitStringAtChar(
          target.getAttribute("style") ?? "",
          ";",
        ).map((propStr) =>
          splitStringAtChar(propStr, ":").map((str) => str.trim()),
        ) as StylesList;
      else targetProps = [];

      // Remove props from removeProps, if they exist, and don't include propsList props, which we'll add afterwards
      const notIncluded = [...removeProps, ...propsList];
      targetProps = targetProps.filter(
        ([propname]) => !notIncluded.some((p) => p[0] === propname),
      );
      targetProps = [...targetProps, ...propsList];

      target.setAttribute(
        "style",
        targetProps.map((item) => item.join(":")).join(";"),
      );
      $cssStyles.set(target, targetProps);

      // If the element's innerText is just a single nbsp character, that indicates
      //  the user would like this element to be empty, but we don't allow that
      //  unless the element has some non-zero area that could be hovered and selected.
      // Likewise, if the &nbsp; is gutted because it's unnecessary, and then a later
      //  style updates makes it necessary, we should check if that's the case
      // if (target.innerHTML === "&nbsp;" || target.innerHTML === "") {
      //   target.innerHTML = "";
      //   const rect = target.getBoundingClientRect();
      //   // Greater than or equal to 1 pixel, since stuff like <br> actually has 0.016px width!
      //   if (rect.width * rect.height < 1) target.innerHTML = "&nbsp;";
      // }
    }
    prevSyncedStyles = propsList;
    updateHighlight();
  }

  // IMP: Currently doing nothing (because maybe this behaviour wasn't necessary)
  function preventColonsDeletion(styleStr: string, prevStyleStr: string) {
    // const diff = diffChars(prevStyleStr, styleStr);
    // let finalStr = "";
    // for (const change of diff) {
    //   if (!change.removed) finalStr += change.value;
    //   else {
    //     const del = change.value;
    //     let toBeAdded = [...del.matchAll(/[;:]/g)]
    //       .map((exp) => (!charInStrQuoted(del, exp.index) ? exp[0] : ""))
    //       .join("");
    //     // :;: <-- margin:0;position:rela
    //     // :;:; <-- margin:0;position:relative;disp
    //     // ;:; <-- 0px;display:block;
    //     // ;:;: <-- 0px;display:block;position:rela
    //     toBeAdded = toBeAdded.replace(/(?<!^):;/g, "");
    //     // toBeAdded will at most be 3 long
    //     if (toBeAdded.startsWith(":;") && finalStr.at(-1) === ";")
    //       toBeAdded = toBeAdded.slice(2);
    //     finalStr += toBeAdded;
    //   }
    // }
    // return finalStr;
    return styleStr;
  }

  let prevStyleStr: string;

  let doingEditInput: boolean = false;

  function onInput(e_: Event) {
    if (!stylesEl) return;
    const event = e_ as InputEvent | Event;

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
    let plainStr: string;
    [stylesEl.innerHTML, propsList, plainStr] = parseStylesStr(styleStr);
    syncStyles(propsList);

    if (enterPressed) selection?.setPosition(stylesEl, enterPressed);
    else {
      const [node, newOffset] = findNodeFromOffset(
        stylesEl,
        offset + Number(backspaceRemoveLine),
      );
      selection?.setPosition(node, newOffset);
    }
    handleAutocomplete();

    let insertType: "insert" | "delete" | "other";
    if (isInputEvent(event) && event.inputType.startsWith("insert"))
      insertType = "insert";
    else if (isInputEvent(event) && event.inputType.startsWith("delete"))
      insertType = "delete";
    else insertType = "other";
    const newState = {
      text: plainStr,
      selection: styleStrSelection,
      insertType,
    };

    undoManager.updateInitialStateSelection(styleStrSelection);

    // Only set doingEditInput to true if this input event actually caused the
    //  editor text content to change- creating a new item on the stack (or at least combining with the topmost item).
    if (undoManager.isTrueEdit(newState)) {
      doingEditInput = true;
    }

    if (!undoManager.isTrueEdit(newState))
      console.log("input event did not result in changed text content");

    undoManager.addEdit(newState, event);

    enterPressed = undefined;
    backspaceRemoveLine = false;
  }

  function handleAutocomplete() {
    const selection = getSelection();
    if (!selection || !selection.focusNode) return;
    const node = selection.focusNode;
    if (
      (node instanceof HTMLElement && node.tagName === "B") ||
      node.parentElement?.tagName === "B"
    ) {
      $autocompleteSuggestions = allowedPropNames
        .filter((name) => node.textContent && name.startsWith(node.textContent))
        .toSorted((a, b) => a.length - b.length);
    } else {
      $autocompleteSuggestions = [];
    }
  }

  function getTopEl(node: Node) {
    if (!stylesEl.contains(node)) return null;
    const parent = node.parentNode;
    if (parent !== stylesEl && parent) return getTopEl(parent);
    return node;
  }
  function getTextNode(el: Element | null): Text | null {
    if (!el) return null;
    return (
      (Array(...el.childNodes).find(
        (child) => child.nodeType === Node.TEXT_NODE,
      ) as Text) ?? null
    );
  }

  function selectionToState(selection: Selection): StyleStrSelection {
    const determineLoc = (node: Node | null) => {
      if (node === null) return "other";
      const topEl = getTopEl(node) as Element | null;
      if (topEl === null) return "other";
      if (topEl.tagName === "B") return "prop";
      else if (topEl.tagName === "EM") return "val";
      return "other";
    };
    // console.log(determineLoc(selection.focusNode));
    return {
      isCollapsed: selection.isCollapsed,
      focusIndex: calculateTotalOffset(
        stylesEl,
        selection.focusNode,
        selection.focusOffset,
      ),
      anchorIndex: calculateTotalOffset(
        stylesEl,
        selection.anchorNode,
        selection.anchorOffset,
      ),
      direction: selection.direction as "backward" | "forward" | "none",
      focusLoc: determineLoc(selection.focusNode) as "prop" | "val" | "other",
    };
  }

  const off1 = on(document, "selectionchange", (e) => {
    const selection = getSelection();
    prevStyleStrSelection = styleStrSelection;
    styleStrSelection = selection !== null ? selectionToState(selection) : null;

    prevSelection = getPrevSelection();

    // console.log(
    //   selection?.anchorNode,
    //   selection?.anchorOffset,
    //   selection?.focusNode,
    //   selection?.focusOffset,
    //   selection?.direction,
    // );

    function adjustSelection(
      predicate: (el: HTMLElement) => boolean,
      whenOffset: number,
      bump: "prev" | "next",
      selectionNode: "anchor" | "focus",
    ) {
      let el: Node | null;
      let offset: number | null;
      let prevEl: Node | null;
      let prevOffset: number | null;
      if (selectionNode === "anchor") {
        el = selection?.anchorNode ?? null;
        offset = selection?.anchorOffset ?? null;
        prevEl = prevSelection?.anchorNode ?? null;
        prevOffset = prevSelection?.anchorOffset ?? null;
      } else {
        el = selection?.focusNode ?? null;
        offset = selection?.focusOffset ?? null;
        prevEl = prevSelection?.focusNode ?? null;
        prevOffset = prevSelection?.focusOffset ?? null;
      }

      if (!el || !stylesEl.contains(el)) return;
      const topEl = getTopEl(el) as HTMLElement;
      if (!(selection && topEl && predicate(topEl) && offset === whenOffset))
        return;
      // If the selection is being moved within the style editor, make sure the bump
      //  would be bumping in the same direction as the movement
      if (prevSelection && prevEl && stylesEl.contains(prevEl)) {
        if (el === prevEl && prevOffset) {
          if (prevOffset < offset && bump === "prev") return;
          else if (prevOffset > offset && bump === "next") return;
        } else {
          const comparison = prevEl?.compareDocumentPosition(el);
          if (
            comparison === Node.DOCUMENT_POSITION_FOLLOWING &&
            bump === "prev"
          )
            return;
          else if (
            comparison === Node.DOCUMENT_POSITION_PRECEDING &&
            bump === "next"
          )
            return;
        }
      }

      const newFocus = getTextNode(
        bump === "prev"
          ? topEl.previousElementSibling
          : topEl.nextElementSibling,
      );
      if (!newFocus) return;

      const newOffset = bump === "prev" ? newFocus.length : 0;
      if (selection.focusNode && selection.anchorNode) {
        selectionNode === "anchor"
          ? selection.setBaseAndExtent(
              newFocus,
              newOffset,
              selection.focusNode,
              selection.focusOffset,
            )
          : selection.setBaseAndExtent(
              selection.anchorNode,
              selection.anchorOffset,
              newFocus,
              newOffset,
            );
      } else selection.setPosition(newFocus, newOffset);
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

    // console.log(
    //   "Selection update! 💙",
    //   selection?.focusNode,
    //   selection?.focusOffset,
    // );

    // Update the selection info of the topmost item of the undo stack to after
    //  the insertion has happened that the new selection point could be determined
    //  (selectionchange event fires after input event), including adjustments made above.
    if (doingEditInput) {
      if (selection !== null)
        undoManager.updateLatestStateSelection(selectionToState(selection));
      // If the previous selection was a range (highlighting text), then we want to visually display that selection
      //  in the undo history, and that requires updating the previous state to have this highlight as the selection
      // Interestingly, if we remove this condition then for non-range selections it errors as "out of bounds" by setPosition() in restoreState()
      if (prevStyleStrSelection !== null && !prevStyleStrSelection.isCollapsed)
        undoManager.updatePrevStateSelection(prevStyleStrSelection);
      doingEditInput = false;
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
      if (!line || !stylesEl.querySelector("br")) return;
      const text = line
        .map((node) =>
          node.nodeType === Node.TEXT_NODE ? node.textContent : "",
        )
        .join("");
      if (text.length <= 3 && text.includes(":") && text.includes(";")) {
        line.forEach((node) => {
          if (stylesEl && stylesEl !== node && stylesEl.contains(node))
            stylesEl?.removeChild(node);
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
      handleAutocomplete();
    } else if (e.key === ";" && stylesEl) {
      e.preventDefault();
      const line = getSelectionLine();
      if (!line) return;
      const selection = getSelection();
      const semic = line.find((node) => node.textContent === ";") ?? null;
      selection?.setPosition(semic, 1);
      handleAutocomplete();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      const newState = undoManager.undo();
      if (newState === null) return;
      restoreState(newState);
    } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
      const newState = undoManager.redo();
      if (newState === null) return;
      restoreState(newState);
    }
  }

  function restoreState(state: CSSEditorState) {
    console.log("🎈 Restoring state!", state);
    // console.log(state.selection);
    let propsList: StylesList;
    [stylesEl.innerHTML, propsList] = parseStylesStr(state.text);
    syncStyles(propsList);

    const selection = getSelection();
    if (!state.selection || !selection) return;

    // console.log("anchor", base, baseOffset);
    // console.log("focus", focus, focusOffset);
    setTimeout(() => {
      if (!state.selection) return;
      const [base, baseOffset] = findNodeFromOffset(
        stylesEl,
        state.selection.anchorIndex,
      );
      const [focus, focusOffset] = findNodeFromOffset(
        stylesEl,
        state.selection.focusIndex,
      );

      if (state.selection.isCollapsed) {
        selection.setPosition(focus, focusOffset);
        // selection.modify("move", "right", "character");
      } else {
        console.log(
          "Setting selection range",
          base,
          baseOffset,
          focus,
          focusOffset,
        );
        selection.setBaseAndExtent(base, baseOffset, focus, focusOffset);
      }
    }, 0);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  role="application"
  bind:this={stylesEl}
  contenteditable="true"
  oninput={onInput}
  onbeforeinput={(e) => {
    prevStyleStr = stylesEl.textContent ?? "";
  }}
  onkeydown={onKeydown}
  class="styles-display font-mono inline-block text-left text-rock-700 bg-steel-100 p-2 rounded focus:outline-none text-sm [&.disabled]:opacity-50 [&.disabled]:pointer-events-none"
  aria-disabled={disabled}
  tabindex={disabled ? -1 : 0}
  class:disabled
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
  :global(.styles-display b) {
    position: relative;
  }
  :global(.styles-display b.invalid) {
    opacity: 0.6;
  }
  :global(.styles-display a) {
    position: absolute;
    transform: translateX(calc(-100% - 8px));
    font-size: 16px;
  }
  :global(.styles-display a:hover) {
    opacity: 0.6;
  }
</style>
