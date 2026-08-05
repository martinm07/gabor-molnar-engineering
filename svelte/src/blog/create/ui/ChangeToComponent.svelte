<script lang="ts">
  import ComponentTray from "../components/ComponentTray.svelte";

  import WrenchIcon from "phosphor-svelte/lib/WrenchIcon";
  import {
    compPartToInheritedAttrs,
    mode,
    savedComponents,
    selection,
    type SavedComponent,
    type SavedComponentWithEdit,
  } from "../store.svelte";
  import { changePage, editorState } from "../url.svelte";
  import {
    changeElToComp,
    getCompNameAndPart,
  } from "../components/component.svelte";

  function changeToComponent(comp: SavedComponent) {
    console.log("Changing to component!", $state.snapshot(comp));

    selection.island.forEach((el, i) => {
      changeElToComp(el, `${comp.name}-[${i + 1}]`);
    });
    mode.sidebar = "edit";
  }

  function selectComponentEdit(comp: SavedComponentWithEdit) {
    if (editorState.mode !== "document") return;
    changePage("component", comp.identName, editorState.resourceName);
  }

  const filteredCompLib = $derived.by(() => {
    if (mode.sidebar !== "changetocomponent") return savedComponents;

    const numRequiredSiblings = selection.island.length;
    console.log("🏻", numRequiredSiblings, $state.snapshot(selection.island));
    console.log("🦰", $state.snapshot(compPartToInheritedAttrs));

    const blacklistSet = new Set<string>();

    const allowedCompNames = compPartToInheritedAttrs
      .entries()
      .filter(([dataComponent]) => {
        const [name, part] = getCompNameAndPart(dataComponent);
        const firstPart = Number.parseInt(part.split(",")[0]);

        if (firstPart > numRequiredSiblings) blacklistSet.add(name);

        return firstPart === numRequiredSiblings;
      })
      .map(([dataComponent]) => getCompNameAndPart(dataComponent)[0]);

    const allowedSet = new Set(allowedCompNames);
    console.log(allowedSet, blacklistSet);
    const filteredAllowedSet = allowedSet.difference(blacklistSet);
    console.log(filteredAllowedSet);

    // allowedCompNames.some(() => )

    return savedComponents.filter((comp) => filteredAllowedSet.has(comp.name));
  });
</script>

{#if editorState.mode === "document" && mode.sidebar === "changetocomponent" && selection.island.length > 0}
  <div class="text-center mt-3 mb-8 text-xl italic text-rock-800">
    Change selection to component
  </div>
  <ComponentTray
    comps={filteredCompLib}
    mainAction={changeToComponent}
    mainActionTag="button"
    secondaryAction={selectComponentEdit}
    secondaryActionTag="a"
    generateHref={(comp) => `/documents/edit/component/${comp.identName}`}
    secondaryActionLabel="Edit component"
  >
    {#snippet secondaryActionContent()}
      <WrenchIcon />
    {/snippet}
  </ComponentTray>
{/if}
