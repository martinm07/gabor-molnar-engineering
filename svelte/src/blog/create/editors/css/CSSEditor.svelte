<script module lang="ts">
  export interface ICSSEditor {
    syncElementInlineStyles(x: Node | Node[]): void;
  }

  /**
   * Calculates the total character offset from the start of a parent element to a given target node and offset.
   *
   * This function is useful for mapping a DOM selection (node and offset) to a linear character offset within the parent element's text content.
   *
   * @param parentEl - The parent element containing the nodes to measure.
   * @param targetNode - The target node (can be the parent element, a child element, or a text node) where the offset is calculated.
   * @param targetOffset - The offset within the target node (for elements, this is the child index; for text nodes, this is the character offset).
   * @returns The total character offset from the start of the parent element to the specified target node and offset.
   *
   * Handles the following cases:
   * - If the target node is the parent element itself, sums the text content lengths of its children up to the target offset.
   * - If the target node is a child element, sums the text content lengths of all previous siblings and the offset within the target element.
   * - If the target node is a text node, sums the lengths of all previous text nodes and adds the target offset.
   */
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

  /**
   * Finds the text node and corresponding offset within that node, given a root element and a character offset.
   *
   * @param el - The root DOM element to search within.
   * @param offset - The character offset to locate within the text nodes of the element.
   * @returns A tuple containing the found Text node and the offset within that node.
   *          If the element is undefined, returns a new empty Text node and offset 0.
   */
  export function findNodeFromOffset(
    el: Element | undefined,
    offset: number,
  ): [node: Text, offset: number] {
    if (!el) return [document.createTextNode(""), 0];
    const textNodes = getTextNodes(el);
    let remainingOffset = offset;
    let currentNode: Text = document.createTextNode("");
    let found: boolean = false;
    for (const textNode of textNodes) {
      currentNode = textNode;
      if (textNode.length >= remainingOffset) {
        found = true;
        break;
      } else remainingOffset -= textNode.length;
    }

    if (found) return [currentNode, remainingOffset];
    else return [currentNode, currentNode.length];
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

  function recursiveGetNodes(el: Node): Node[] {
    if (el.childNodes.length === 0) return [el];
    return [
      el,
      ...Array(...el.childNodes).flatMap((node) => recursiveGetNodes(node)),
    ];
  }

  function getSelectionLine(stylesEl: HTMLElement) {
    const caret = document.getSelection();
    if (!caret || !stylesEl) return;
    const focusNode =
      caret.focusNode === stylesEl
        ? stylesEl.childNodes[caret.focusOffset]
        : caret.focusNode;
    const nodes = recursiveGetNodes(stylesEl).slice(1);
    let line: Node[] = [];
    let foundLine: boolean = false;
    for (const node of nodes) {
      if (focusNode === node) foundLine = true;
      if (node instanceof HTMLElement && node.tagName === "BR") {
        if (!foundLine) line = [];
        else break;
      }
      line.push(node);
    }
    // console.log("Selection line:", line);
    return line;
  }

  function getNodesInRange(range: StaticRange, stylesEl: HTMLElement) {
    const nodes = recursiveGetNodes(stylesEl).slice(1);
    const final: Node[] = [];
    for (const node of nodes) {
      // If this node follows the start node of the range AND precedes the end node of the range, then it's in the range
      if (
        range.startContainer.compareDocumentPosition(node) ===
          Node.DOCUMENT_POSITION_FOLLOWING &&
        range.endContainer.compareDocumentPosition(node) ===
          Node.DOCUMENT_POSITION_PRECEDING
      ) {
        final.push(node);
      }
    }
    return final;
  }

  /**
   * Take the intersection of styles to have the same name and value
   * @param s1 The first list of styles
   * @param s2 The second list of styles
   */
  export function stylesIntersection(
    s1: StylesList,
    s2: StylesList,
  ): StylesList {
    const final: StylesList = [];
    for (const kvPair of s1) {
      if (s2.some(([k, v]) => k === kvPair[0] && v === kvPair[1]))
        final.push(kvPair);
    }
    return final;
  }

  export function parseStylesStr(
    inp?: HTMLElement | string,
  ): [string, StylesList, string] {
    let str = typeof inp === "string" ? inp : (inp?.textContent ?? "");

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
        `<b${validMarkup}>${urlMarkup}${prop[0]}</b><span class="colon">:</span><em>${prop[1]}</em>`;
      plainStrStatements[i] = `${prop[0]}:${prop[1]}`;
    });

    let htmlStr = htmlStrStatements.join('<span class="semic">;</span><br />');
    let plainStr = plainStrStatements.join(";");

    htmlStr += '<span class="semic">;</span>';
    plainStr += ";";

    return [htmlStr, reflowed, plainStr];
  }
</script>

<script lang="ts">
  import MDNLinks from "./mdn_links.json";
  import { onDestroy, getContext } from "svelte";
  import { on } from "svelte/events";
  import { watch } from "runed";
  import { autocompleteSuggestions } from "../../store.svelte";
  import {
    getCSSProps,
    splitStringAtChar,
    allowedPropNames,
  } from "./handlecss";
  import { ClonedSelection, closest, insertAfter } from "../../helper";
  import {
    attrNameToStatesToForce,
    type StyleCache,
  } from "./AllStyleEditors.svelte";

  let styles = $state("");
  let stylesEl: HTMLElement;
  const updateHighlight: () => void = getContext("updateHighlight");
  const getPrevSelection: () => ClonedSelection | null =
    getContext("getPrevSelection");
  const styleCache: StyleCache = getContext("styleCache");

  const suggestCreateNewHistoryItem: () => void = getContext(
    "suggestCreateNewHistoryItem",
  );

  let prevSelection: ClonedSelection | null = $state(null);

  let performedMutation: boolean = false;

  // let styleStrSelection: StyleStrSelection | null = null;
  // let prevStyleStrSelection: StyleStrSelection | null = null;

  interface Props {
    syncAttrName: string;
    selected: Element[];
  }
  let { syncAttrName, selected }: Props = $props();

  type StylesList = [k: string, v: string][];

  /**
   * Gets the intersection of all the styles on all the elements in `selection`, to only return
   *  a style string with prop/value pairs that match on every element in `selection`.
   * @param selection A list of Elements for which to get the intersection of styles for.
   */
  function getSelectionStyleStr(
    selection: Element[],
    statesToForce: ReadonlySet<string>,
    inlineStyleAttribute: string,
  ): [string, StylesList] {
    let commonStyles: StylesList | undefined;
    for (const target of selection) {
      let styles_ = styleCache.get(target, syncAttrName);
      if (!styles_ && target.hasAttribute(syncAttrName)) {
        let genStyles: [k: string, v: string][];
        genStyles = getCSSProps(
          target,
          target.hasAttribute("data-component") ? false : true,
          statesToForce,
          inlineStyleAttribute,
        );

        styleCache.set(target, syncAttrName, genStyles);
        target.setAttribute(
          syncAttrName,
          genStyles.map((item) => item.join(":")).join(";"),
        );
        styles_ = genStyles;
      }
      commonStyles = commonStyles
        ? stylesIntersection(commonStyles, styles_ ?? [])
        : styles_;
    }

    if (!commonStyles) return ["", []];

    const styleStr = commonStyles
      .map((style) => `${style[0]}:${style[1]};`)
      .join(""); // NOTE: Changed from " " to ""
    return [styleStr, commonStyles];
  }

  watch(
    () => selected,
    (targets) => {
      const statesToForce = attrNameToStatesToForce(syncAttrName);
      const [styleStr, commonStyles] = getSelectionStyleStr(
        targets,
        statesToForce,
        syncAttrName,
      );
      prevSyncedStyles = commonStyles;

      let plainStr: string;
      [styles, , plainStr] = parseStylesStr(styleStr);
      if (stylesEl?.innerHTML) {
        stylesEl.innerHTML = styles;
        declareMadeMutation();
      }

      // undoManager.changeSelection(targets, {
      //   text: plainStr,
      //   selection: {
      //     isCollapsed: true,
      //     focusIndex: 0,
      //     anchorIndex: 0,
      //     direction: "none",
      //     focusLoc: "other",
      //   },
      //   insertType: "other",
      // });
    },
  );

  let prevSyncedStyles: StylesList;
  function syncStyles(propsList: StylesList) {
    const removeProps = prevSyncedStyles.filter(
      (prop) => !propsList.some((p) => p[0] === prop[0]),
    );

    for (const target of selected) {
      if (!(target instanceof HTMLElement)) continue;

      let targetProps: StylesList;

      if (target.getAttribute(syncAttrName))
        targetProps = splitStringAtChar(
          target.getAttribute(syncAttrName) ?? "",
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
        syncAttrName,
        targetProps.map((item) => item.join(":")).join(";"),
      );
      styleCache.set(target, syncAttrName, targetProps);

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

  function declareMadeMutation() {
    performedMutation = true;
    requestAnimationFrame(() => (performedMutation = false));
  }
  /**
   * This function is pretty much only for being called in App.svelte, in the
   *  MutationObserver whenever it sees a mutation to an element's inline styles.
   */
  export function syncElementInlineStyles(x: Node | Node[]): void {
    const syncInlineStyles = (el: Element) => {
      // console.log("Syncing styles for element", el);
      const statesToForce = attrNameToStatesToForce(syncAttrName);
      const inlineStyleAttribute = syncAttrName;

      // NOTE: There is a lot of extra logic performed by this function (even with useStylesheets = false)
      //        that isn't necessary. It might be worth to optimize (though at the moment this function
      //        is called sparingly thanks to the performedMutation check, so it isn't really necessary)
      let genStyles: [k: string, v: string][];
      genStyles = getCSSProps(el, false, statesToForce, inlineStyleAttribute);

      styleCache.set(el, syncAttrName, genStyles);

      const [styleStr] = getSelectionStyleStr(
        selected,
        statesToForce,
        inlineStyleAttribute,
      );
      updateDisplay(styleStr, true, true);
    };

    if (performedMutation) {
      // console.log(
      //   "Skipping syncElementInlineStyles; performedMutation is true",
      //   x,
      // );
      return;
    }

    const processed: Node[] = [];
    if (x instanceof Node) {
      if (!(x instanceof Element)) return;
      syncInlineStyles(x);
    } else {
      x.forEach((x_) => {
        if (!(x_ instanceof Element) || processed.includes(x_)) return;
        syncInlineStyles(x_);
        // Elements that we've already called syncInlineStyles for don't need to be processed again
        processed.push(x_);
      });
    }
  }

  const removedColons: Node[] = [];
  let removeColonsStartRangePos: number = -1;

  function beforeInputFindRemovedColons(e: InputEvent) {
    const getContainerEl = (node: Node) =>
      node.nodeType === Node.TEXT_NODE ? node.parentElement : node;

    // Separators refer to colons and semi-colons in the style string
    const isSeparator = (node: Node) => {
      const containerEl = getContainerEl(node);
      const isColonOrSemic =
        containerEl instanceof HTMLElement &&
        (containerEl.classList.contains("colon") ||
          containerEl.classList.contains("semic"));
      return isColonOrSemic;
    };

    // Reset the removedColons array
    removedColons.splice(0);

    if (e.inputType.startsWith("delete") || e.inputType.startsWith("insert")) {
      for (const range of e.getTargetRanges()) {
        // It is impossible for a range to remove/replace separators if it is collapsed!
        if (range.collapsed) continue;

        // Note that startContainer will always precede endOffset in the DOM order
        //  (unlike focusNode and anchorNode in selections from getSelection())
        // Check if the start node for the range being removed/replaced is a colon/semic
        //  and if the offset in that start node would cause the colon/semic to indeed get removed/replaced
        if (isSeparator(range.startContainer) && range.startOffset === 0) {
          const containerEl = getContainerEl(range.startContainer);
          if (!removedColons.includes(containerEl!))
            removedColons.push(containerEl!);
        }

        getNodesInRange(range, stylesEl).forEach((node) => {
          const containerEl = getContainerEl(node);
          if (isSeparator(node) && !removedColons.includes(containerEl!))
            removedColons.push(containerEl!);
        });

        // Check if the end node for the range being removed/replaced is a colon/semic,
        //  and if the offset in that end node would cause the colon/semic to indeed get removed/replaced
        if (isSeparator(range.endContainer) && range.endOffset === 1) {
          const containerEl = getContainerEl(range.endContainer);
          if (!removedColons.includes(containerEl!))
            removedColons.push(containerEl!);
        }
      }
    }

    // console.log("REMOVED COLONS:", removedColons);
    if (removedColons.length > 0) {
      // TODO: Handle the (rare) possibility that there's more than one target range?
      const range = e.getTargetRanges()[0];
      // Find the position in the style string the separators should be reinserted
      removeColonsStartRangePos = calculateTotalOffset(
        stylesEl,
        range.startContainer,
        range.startOffset,
      );
      // If the range is getting replaced by certain text, we want to reinsert after that new text
      const insertedText = e.data ?? e.dataTransfer?.getData("text/plain");
      removeColonsStartRangePos += insertedText?.length ?? 0;
    }
  }

  function preventColonsDeletion(styleStr: string) {
    if (removedColons.length === 0 || removeColonsStartRangePos === -1)
      return styleStr;
    // The "special backspace" is pressing backspace on a line that's only :; defined by onKeydown
    // We don't want to mess with the reinsertion of ":"s and ";"s in this case.
    if (doingSpecialBackspace) return styleStr;

    let reinsertStr = removedColons.map((node) => node.textContent).join("");

    // console.log(styleStr[removeColonsStartRangePos - 1], "   ", reinsertStr);

    // We don't reinsert the :; for a line that's completely removed,
    //  and we know that if there is a preceding semi-colon that has been removed (or a semi-colon is the first character preceding the removed range)
    //  for a given :;, then it represents a completely removed line.

    // :;   <-- margin:0;pos
    // :;:  <-- margin:0;position:rela
    // :;:; <-- margin:0;position:relative;disp

    // ;:   <-- 0px;display:bl
    // ;:;  <-- 0px;display:block;pos
    // ;:;: <-- 0px;display:block;position:rela

    if (styleStr[removeColonsStartRangePos - 1] === ";")
      reinsertStr = reinsertStr.replace(/:;/g, "");
    else reinsertStr = reinsertStr.replace(/(?<=;):;/g, "");

    // console.log(
    //   `reinsertStr: "${reinsertStr}"  removeColonsEndRangePos: ${removeColonsStartRangePos}`,
    // );

    const newStyleStr =
      styleStr.slice(0, removeColonsStartRangePos) +
      reinsertStr +
      styleStr.slice(removeColonsStartRangePos);

    // After using these variable values to prevent colons deletion, we reset them.
    // These variables are of course reassigned the next time beforeinput is fired,
    //  but it's not reliable that that will happen before this is called again (i.e. the input event).
    // Most notably, when manually dispatching events in JS (which happens when accepting autocomplete
    //  suggestions, for example), we usually dispatch an "input" event but no "beforeinput" event.
    removedColons.splice(0);
    removeColonsStartRangePos = -1;

    return newStyleStr;
  }

  // Used by onselectionchange to suggest new history items when there's a selection change without an input
  //  (NOTE: the timing of events was tested that oninput does indeed get called before onselectionchange)
  let calledOnInput: boolean = false;

  // Called by oninput
  function updateDisplay(
    overrideTextContent?: string,
    skipAutocompleteUpdate?: boolean,
    skipSyncStyles?: boolean,
  ) {
    if (!stylesEl) return;

    const caret = document.getSelection();
    const offset = calculateTotalOffset(
      stylesEl,
      caret?.focusNode,
      caret?.focusOffset,
    );

    const styleStr = preventColonsDeletion(
      overrideTextContent ?? stylesEl.textContent ?? "",
    );
    let propsList: StylesList;
    let plainStr: string;
    [stylesEl.innerHTML, propsList, plainStr] = parseStylesStr(styleStr);
    if (!skipSyncStyles) syncStyles(propsList);
    declareMadeMutation();

    if (
      caret?.focusNode instanceof Element &&
      caret.focusNode.closest(".styles-display")
    ) {
      if (enterPressed) caret?.setPosition(stylesEl, enterPressed);
      else {
        const [node, newOffset] = findNodeFromOffset(stylesEl, offset);
        caret?.setPosition(node, newOffset);
      }
    }
    if (!skipAutocompleteUpdate) handleAutocomplete();

    enterPressed = undefined;
  }

  function handleAutocomplete() {
    const caret = getSelection();
    if (!caret || !caret.focusNode) return;
    if (!closest(caret.focusNode, stylesEl)) return;

    const node = caret.focusNode;
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

  // Somehow, it seems like using `on(document, "selectionchange", [...])` only calls selection changes after input events
  //  on the CSSEditor...
  // Using `<svelte:document onselectionchange={[...]}>` does the expected thing of calling after ALL selection changes.
  const off1 = on(document, "selectionchange", (e) => {
    const caret = getSelection();
    // prevStyleStrSelection = styleStrSelection;
    // styleStrSelection = caret !== null ? selectionToState(caret) : null;

    prevSelection = getPrevSelection();

    // console.log(
    //   caret?.anchorNode,
    //   caret?.anchorOffset,
    //   caret?.focusNode,
    //   caret?.focusOffset,
    //   caret?.direction,
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
        el = caret?.anchorNode ?? null;
        offset = caret?.anchorOffset ?? null;
        prevEl = prevSelection?.anchorNode ?? null;
        prevOffset = prevSelection?.anchorOffset ?? null;
      } else {
        el = caret?.focusNode ?? null;
        offset = caret?.focusOffset ?? null;
        prevEl = prevSelection?.focusNode ?? null;
        prevOffset = prevSelection?.focusOffset ?? null;
      }

      if (!el || !stylesEl.contains(el)) return;
      const topEl = getTopEl(el) as HTMLElement;
      if (!(caret && topEl && predicate(topEl) && offset === whenOffset))
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
      if (caret.focusNode && caret.anchorNode) {
        selectionNode === "anchor"
          ? caret.setBaseAndExtent(
              newFocus,
              newOffset,
              caret.focusNode,
              caret.focusOffset,
            )
          : caret.setBaseAndExtent(
              caret.anchorNode,
              caret.anchorOffset,
              newFocus,
              newOffset,
            );
      } else caret.setPosition(newFocus, newOffset);
    }

    // console.log(
    //   insertAtIndex(
    //     "|",
    //     caret?.focusNode?.textContent,
    //     caret?.focusOffset,
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
    //   caret?.focusNode,
    //   caret?.focusOffset,
    // );
  });
  onDestroy(off1);

  let enterPressed: number | undefined;
  let doingSpecialBackspace: boolean = false;
  function onKeydown(e: KeyboardEvent) {
    doingSpecialBackspace = false;

    if (e.key === "Backspace" && stylesEl) {
      const line = getSelectionLine(stylesEl);
      if (!line || !stylesEl.querySelector("br")) return;
      const text = line
        .map((node) =>
          node.nodeType === Node.TEXT_NODE ? node.textContent : "",
        )
        .join("");
      if (text.length <= 3 && text.includes(":") && text.includes(";")) {
        doingSpecialBackspace = true;
        line.forEach((node) => {
          if (stylesEl && stylesEl !== node && stylesEl.contains(node))
            stylesEl?.removeChild(node);
        });
        // Preventing the backspace from actually happening so that after the custom
        //  backspace behaviour this doesn't also happen, causing unexpected deletion of
        //  preceding semicolon and all sorts of funky restructuring of values becoming parameters etc.
        e.preventDefault();
        if (e.target)
          e.target.dispatchEvent(new Event("input", { bubbles: true }));
      }
    } else if (e.key === "Enter" && stylesEl) {
      const line = getSelectionLine(stylesEl);
      if (!line) return;
      const finalNode = line.at(-1)!;

      // if (finalNode?.textContent) finalNode.textContent += ":;";
      insertAfter(finalNode, document.createTextNode(":;"));

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
      const line = getSelectionLine(stylesEl);
      if (!line) return;
      const caret = getSelection();
      const colon = line.find((node) => node.textContent === ":") ?? null;
      caret?.setPosition(colon, 1);
      handleAutocomplete();
    } else if (e.key === ";" && stylesEl) {
      e.preventDefault();
      const line = getSelectionLine(stylesEl);
      if (!line) return;
      const caret = getSelection();
      const semic = line.find((node) => node.textContent === ";") ?? null;
      caret?.setPosition(semic, 1);
      handleAutocomplete();
    }
  }

  let lastEditType: "back" | "forward" | "other" | null = null;
  let lastEditLoc: "prop" | "val" | "other" | null = null;
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

    const determineLoc = (node: Node | null): typeof lastEditLoc => {
      if (node === null) return "other";
      const topEl = getTopEl(node) as Element | null;
      if (topEl === null) return "other";
      if (topEl.tagName === "B") return "prop";
      else if (topEl.tagName === "EM") return "val";
      return "other";
    };

    const caret = getSelection();
    const editLoc = determineLoc(caret?.focusNode ?? null);

    if (lastEditLoc !== null && editLoc !== lastEditLoc) {
      // console.log(`CHANGED FROM WORK ON A ${lastEditLoc} TO A ${editLoc}`);
      suggestCreateNewHistoryItem();
    }
    lastEditLoc = editLoc;
  }
</script>

<svelte:document
  onselectionchange={() => {
    const caret = getSelection();
    if (!caret || !closest(caret.focusNode, stylesEl)) return;
    // console.log("CSSEditor selection update! 💙");
    // Suggest new history items if the selection changed without an input event being fired
    //  (i.e. the user is using the arrow keys, or clicking around, or making a range selection)
    if (!calledOnInput) suggestCreateNewHistoryItem();
    calledOnInput = false;
  }}
/>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  role="application"
  bind:this={stylesEl}
  contenteditable="true"
  spellcheck="false"
  oninput={(e) => {
    calledOnInput = true;
    updateDisplay();
    handleInputForHistory(e);
  }}
  onbeforeinput={(e) => {
    beforeInputFindRemovedColons(e);
  }}
  onkeydown={onKeydown}
  class="styles-display font-mono inline-block text-left text-rock-700 bg-steel-100 p-2 rounded focus:outline-none text-sm"
  tabindex="0"
>
  {@html styles}
</div>

<style>
  :global(.styles-display .colon, .styles-display .semic) {
    margin-right: 4px;
    color: var(--rock-500);
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
