<script lang="ts">
  import { getContext, untrack } from "svelte";
  import { activeElement, watch } from "runed";
  import { autocompleteMode, autocompleteSuggestions } from "../store.svelte";
  import { ClonedSelection, isElementVisible } from "../helper";
  import { request2AnimationFrames } from "/shared/helper";
  import type { Attachment } from "svelte/attachments";
  import { SvelteMap } from "svelte/reactivity";

  const getPrevSelection: () => ClonedSelection | null =
    getContext("getPrevSelection");

  let activeI = $state(0);
  let lastHorizontalX = $state(0);
  let unfocused = $state(true);
  let suggestionEls: HTMLElement[] = $state([]);
  let suggestionGroupXs: number[][] = $state([]);

  // A mapping of offsetTop values to the list of suggestion elements that share that value
  // const suggestionElGroups = new SvelteMap<number, HTMLElement[]>();
  // A flat list of all suggestion elements, sorted in reading order (left-to-right, top-to-bottom)
  // const suggestionEls: HTMLElement[] = $derived(
  //   Array.from(suggestionElGroups.entries())
  //     .toSorted(([a], [b]) => a - b)
  //     .flatMap(([_, els]) =>
  //       els.toSorted((a, b) => a.offsetLeft - b.offsetLeft),
  //     ),
  // );
  // A nested list of the x coordinates of suggestion elements, where the index of every entry in
  //  a flattened version of this list corresponds correctly to an element in suggestionEls,
  //  and entries in the same nested list are in the same horizontal row (i.e. group).
  // const suggestionGroupXs: number[][] = $derived(
  //   Array.from(suggestionElGroups.entries())
  //     .toSorted(([a], [b]) => a - b)
  //     .map(([_, els]) =>
  //       els
  //         .map((el) => el.offsetLeft + el.clientWidth / 2)
  //         .toSorted((a, b) => a - b),
  //     ),
  // );

  // watch(
  //   [() => Boolean($autocompleteMode), () => $autocompleteSuggestions],
  //   () => {
  //     activeI = 0;
  //     lastHorizontalX = 0;
  //     unfocused = false;
  //   },
  // );

  watch(
    [() => Boolean($autocompleteMode), () => $autocompleteSuggestions],
    () => {
      activeI = 0;
      lastHorizontalX = 0;
      unfocused = false;
      requestAnimationFrame(() => {
        const groupedEls: HTMLElement[][] = [];
        for (const el of suggestionEls) {
          if (!el) continue;
          if (groupedEls.at(-1)?.at(-1)?.offsetTop === el.offsetTop)
            groupedEls.at(-1)?.push(el);
          else groupedEls.push([el]);
        }
        // console.log(suggestionEls, groupedEls);
        suggestionGroupXs = groupedEls.map((elsList) =>
          elsList.map((el) => el.offsetLeft + el.clientWidth / 2),
        );
      });
    },
  );
  // const updateGroupsMap: Attachment = (element) => {
  //   if (!(element instanceof HTMLElement)) return;
  //   const i: number = Number.parseInt(element.dataset.i ?? "");
  //   if (Number.isNaN(i))
  //     throw new Error(
  //       "Attachment element had an invalid value for 'i' in data-i",
  //     );

  //   const groupsMap = untrack(() => $state.snapshot(suggestionElGroups));

  //   const key = element.offsetTop;
  //   suggestionElGroups.set(key, [...(groupsMap.get(key) ?? []), element]);

  //   return () => {
  //     // console.log("performing teardown", element);

  //     // FOR SOME REASON, THIS TEARDOWN DOESN'T FULLY GET RID OF OLD ELEMENTS

  //     // Remove the element from the map when it gets destroyed (cleanup)
  //     suggestionElGroups.set(
  //       key,
  //       (groupsMap.get(key) ?? []).filter((el_) => el_ !== element),
  //     );
  //   };
  // };

  const getNodeElement = (node: Node) =>
    (node.nodeType === Node.TEXT_NODE
      ? node.parentElement
      : node) as HTMLElement;

  function acceptSuggestion(i_?: number) {
    const isAutcompleteDisplay = (el: HTMLElement) =>
      el.closest(".autocomplete-display");
    // console.log(getSelection());
    // e.target.closest(".autocomplete-display");
    for (const selection of [getSelection(), getPrevSelection()]) {
      if (!selection || !selection.focusNode || !selection.anchorNode) continue;
      if (selection.focusNode !== selection.anchorNode) {
        if (
          isAutcompleteDisplay(getNodeElement(selection.focusNode)) ||
          isAutcompleteDisplay(getNodeElement(selection.anchorNode))
        )
          continue;
        else break;
      }
      const selectionEl = getNodeElement(selection.focusNode);
      if (isAutcompleteDisplay(selectionEl)) continue;

      const i = i_ ?? activeI;
      let newVal = $autocompleteSuggestions[i];
      if ($autocompleteMode === "attributes") newVal = newVal.replace("*", "");

      if (
        selectionEl instanceof HTMLInputElement ||
        selectionEl instanceof HTMLTextAreaElement
      ) {
        selectionEl.value = newVal;
        const len = newVal.length;
        selectionEl.setSelectionRange(len, len);
      } else {
        selection.focusNode.textContent = newVal;
        selection.setPosition(selection.focusNode, newVal.length);
        if ($autocompleteMode === "css")
          selection.modify("move", "right", "character");
      }
      selectionEl.dispatchEvent(new Event("input", { bubbles: true }));
      // After autocompleting the name of a component, we then need to autcomplete the child index
      //  which means the autocomplete shouldn't unfocus
      if ($autocompleteMode !== "component" || newVal.endsWith("]"))
        requestAnimationFrame(() => (unfocused = true));
      break;
    }
  }

  function handleHorizontalMove(direction: "ArrowLeft" | "ArrowRight") {
    const dir = direction === "ArrowLeft" ? -1 : 1;
    let newI = activeI + dir;
    if (newI < 0) newI = $autocompleteSuggestions.length - 1;
    else if (newI >= $autocompleteSuggestions.length) newI = 0;
    activeI = newI;
    const { groupI, innerI } = findGroupIndex(activeI);
    lastHorizontalX = suggestionGroupXs[groupI][innerI];
    if (!isElementVisible(suggestionEls[activeI]))
      suggestionEls[activeI].scrollIntoView({
        block: dir === 1 ? "end" : "start",
      });
  }

  function findGroupIndex(i: number) {
    return suggestionGroupXs.reduce(
      (p, c) => {
        if (p.innerI !== -1) return p;
        if (p.i + c.length > i) {
          return { i: p.i, groupI: p.groupI, innerI: i - p.i };
        } else {
          return { i: p.i + c.length, groupI: p.groupI + 1, innerI: -1 };
        }
      },
      { i: 0, groupI: 0, innerI: -1 },
    );
  }

  function handleVerticalMove(direction: "ArrowUp" | "ArrowDown") {
    const dir = direction === "ArrowUp" ? -1 : 1;
    const { groupI: activeGroupI } = findGroupIndex(activeI);

    let newGroupI = activeGroupI + dir;
    if (newGroupI < 0) newGroupI = suggestionGroupXs.length - 1;
    else if (newGroupI >= suggestionGroupXs.length) newGroupI = 0;

    let bestInnerI: number = 0;
    let bestDistance: number = Infinity;
    for (const [i, x] of suggestionGroupXs[newGroupI].entries()) {
      const distance = Math.abs(lastHorizontalX - x);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestInnerI = i;
      }
    }

    const newI =
      suggestionGroupXs.slice(0, newGroupI).reduce((p, c) => p + c.length, 0) +
      bestInnerI;
    activeI = newI;
    if (!isElementVisible(suggestionEls[activeI]))
      suggestionEls[activeI].scrollIntoView({
        block: dir === 1 ? "end" : "start",
      });
  }

  let focusedIn = false;
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape") {
      unfocused = true;
    } else if (
      !unfocused &&
      $autocompleteMode &&
      $autocompleteSuggestions.length > 0
    ) {
      if (e.key === "Tab") {
        acceptSuggestion();
        e.preventDefault();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        handleHorizontalMove(e.key);
        e.preventDefault();
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        handleVerticalMove(e.key);
        e.preventDefault();
      }
    }
  }}
  onfocusin={(e) => {
    if (!(e.target instanceof HTMLElement)) return;
    // We set $autocompleteSuggestions when focusing in on one of the editors
    //  because we don't want suggestions to start until there is some typing,
    //  however we don't set it to an empty list otherwise so that focusing in
    //  on .autocomplete-display (like when clicking to accept a suggestion) doesn't
    //  prematurely erase the suggestions.
    if (e.target.closest(".styles-display")) {
      $autocompleteMode = "css";
      $autocompleteSuggestions = [];
    } else if (e.target.closest(".attributes-display li input:first-child")) {
      $autocompleteMode = "attributes";
      $autocompleteSuggestions = [];
    } else if (e.target.closest(".tagname-display")) {
      $autocompleteMode = "tag";
      $autocompleteSuggestions = [];
    } else if (e.target.closest(".data-component-val-input")) {
      $autocompleteMode = "component";
      $autocompleteSuggestions = [];
    } else if (e.target.closest("#edit-tags-doc")) {
      $autocompleteMode = "doctag";
      $autocompleteSuggestions = [];
    } else if (!e.target.closest(".autocomplete-display")) {
      $autocompleteMode = null;
    }

    focusedIn = true;
  }}
  onfocusout={() => {
    // The focusout event fires before the focusin event, and so we should wait if the
    //  new focus is the autocomplete menu (or anything the focusin callback can handle)
    //  before going through with the focusout
    focusedIn = false;
    requestAnimationFrame(() => {
      if (!focusedIn) $autocompleteMode = null;
    });
  }}
/>
<svelte:document
  onclick={(e) => {
    if (!(e.target instanceof HTMLElement)) return;
    if (
      e.target.closest(".styles-display") ||
      e.target.closest(".attributes-display li input:first-child") ||
      e.target.closest(".tagname-display")
    ) {
      unfocused = true;
    }
  }}
/>

<div class="text-center autocomplete-display">
  {#if !unfocused}
    {#each $autocompleteSuggestions as suggestion, i}
      <button
        bind:this={suggestionEls[i]}
        type="button"
        class:active={activeI === i}
        onclick={() => acceptSuggestion(i)}
        data-i={i}
        class="inline-block p-1 px-2 rounded bg-steel-100 hover:bg-steel-200 text-steel-600 m-1 text-sm font-mono [.active]:bg-steel-200"
        >{suggestion}</button
      >
      <!-- {@attach updateGroupsMap}>{suggestion}</button
        > -->
    {/each}
  {/if}
</div>
