import {
  getAllChildNodes,
  insertAfter,
  type DynamicGroupStylesheet,
} from "../helper";
import { type DocSvelteMount } from "../store.svelte";
import { SvelteCompiler, type CompiledModule } from "./compiler";

interface HandleSvelteCompMountParams {
  getSvelteCompiler: () => SvelteCompiler;
  getSvelteCompStyles: () => DynamicGroupStylesheet<string>;
  svelteCompMounts: DocSvelteMount[];
}

/**
 * The following structure is expected:
 * ```html
 * <div data-sveltecomp-source="">
 *   <pre data-sveltecomp-code="">[SVELTE-TYPE COMP SOURCE CODE HERE]</pre>
 *   <div data-sveltecomp-propname="mathexpr" data-sveltecomp-proptype="string[DEFAULT]/html/dom/snippet">[PROP HTML HERE]</div>
 *   [...]
 * </div>
 * ```
 * @param sourceEl Root of mount of svelte-type component in document (that has the "data-sveltecomp-source" attribute)
 */
function parseSvelteCompSourceEl(sourceEl: Element) {
  if (!sourceEl.hasAttribute("data-sveltecomp-source"))
    throw new Error(
      "Element provided did not have data-sveltecomp-source attribute",
    );

  const code =
    Array.from(sourceEl.children).find((child) =>
      child.hasAttribute("data-sveltecomp-code"),
    )?.textContent ?? "";

  const props: [propname: string, propvalue: any][] = Array.from(
    sourceEl.children,
  )
    .filter((child) => child.hasAttribute("data-sveltecomp-propname"))
    .map((propEl) => parseSvelteCompPropEl(propEl));

  return { code, props };
}

function parseSvelteCompPropEl(
  propEl: Element,
): [propname: string, propvalue: any] {
  const propname = propEl.getAttribute("data-sveltecomp-propname");

  if (propname === null)
    throw new Error(
      "Element provided did not have data-sveltecomp-propname attribute.",
    );

  let propvalue;

  const proptype = propEl.getAttribute("data-sveltecomp-proptype") ?? "string";
  switch (proptype) {
    case "string":
      propvalue = propEl.textContent;
      break;
    case "html":
      propvalue = propEl.innerHTML;
      break;
    case "dom":
      if (propEl.childNodes.length === 1)
        propvalue = propEl.childNodes[0].cloneNode(true);
      else {
        const frag = document.createDocumentFragment();
        Array.from(propEl.childNodes).forEach((node) =>
          frag.appendChild(node.cloneNode(true)),
        );
        propvalue = frag;
      }
      break;
    case "snippet":
      throw new Error("Not implemented.");
    default:
      console.warn(
        `Unrecognised value of data-sveltecomp-proptype "${proptype}"; defaulting to type "string".`,
      );
      propvalue = propEl.textContent;
  }

  return [propname, propvalue];
}

/**
 * Any moduleExports that don't yet have an associated data-sveltecomp-propname element, we create that element and assign the value
 * of the moduleExport to it as a HTML string (that we render).
 *
 * moduleExports that already have an associated data-sveltecomp-propname element, we assign its value to props, converting as appropriate
 * based on the proptype.
 *
 * data-sveltecomp-propname elements that don't have an associated moduleExport are removed.
 *
 * @param moduleExports
 * @param props
 * @param sourceEl
 */
function syncModuleExportsToSourceEl(
  moduleExports: CompiledModule["moduleExports"],
  props: CompiledModule["props"],
  sourceEl: Element,
) {
  if (!sourceEl.hasAttribute("data-sveltecomp-source"))
    throw new Error(
      "Element provided did not have data-sveltecomp-source attribute",
    );

  const sourceElChildren = Array.from(sourceEl.children);

  for (const property in moduleExports) {
    const matchResult = /^__(string|html|dom|snippet)prop__(.+)$/g.exec(
      property,
    );
    if (matchResult) {
      const proptype = matchResult[1];
      const propname = matchResult[2];

      let propEl = sourceElChildren.find(
        (child) => child.getAttribute("data-sveltecomp-propname") === propname,
      );

      if (!propEl) {
        // Create a new el for this moduleExport
        propEl = document.createElement(sourceEl.localName);
        propEl.setAttribute("data-sveltecomp-propname", propname);
        propEl.setAttribute("data-sveltecomp-proptype", proptype);
        propEl.innerHTML = moduleExports[property];
        sourceEl.appendChild(propEl);
      }

      // Sync the existing value of the el to props
      const [, propvalue] = parseSvelteCompPropEl(propEl);
      props[propname] = propvalue;
    }

    for (const childEl of sourceElChildren) {
      const propname = childEl.getAttribute("data-sveltecomp-propname");
      if (propname === null) continue;

      const moduleExportNames = Object.getOwnPropertyNames(moduleExports);
      const nameTest = new RegExp(
        String.raw`^__(string|html|dom|snippet)prop__${propname}$`,
      );
      if (!moduleExportNames.some((exportName) => exportName.match(nameTest))) {
        // Remove this element; it has no match in moduleExports
        childEl.remove();
      }
    }
  }
}

async function checkSourceEl(
  sourceEl: Element,
  p: HandleSvelteCompMountParams,
) {
  // If the next sibling is already the preview element, then there's nothing we need to do
  const nextSibling = sourceEl.nextSibling;
  if (
    nextSibling instanceof Comment &&
    nextSibling.textContent === "!<SVELTECOMP-PREVIEW>"
  )
    return;

  if (!sourceEl.parentElement) {
    console.error("sourceEl does not have a parentElement", sourceEl);
    return;
  }

  // console.log("CREATING SVELTE COMPONENT PREVIEW");

  // Create a svelte-comp-preview as the next sibling, and mount the component detailed in svelte-comp-source
  const svelteCompiler = p.getSvelteCompiler();
  const svelteCompStyles = p.getSvelteCompStyles();

  const parsed = parseSvelteCompSourceEl(sourceEl);

  const previewStartMarker = document.createComment("!<SVELTECOMP-PREVIEW>");
  const previewEndMarker = document.createComment("!</SVELTECOMP-PREVIEW>");

  insertAfter(sourceEl, previewEndMarker);
  insertAfter(sourceEl, previewStartMarker);

  p.svelteCompMounts.push({
    status: "building",
    moduleExports: null,
    props: null,
    unmount: null,
    mountSourceEl: sourceEl,
    mountPreviewStartMarker: previewStartMarker,
    mountPreviewEndMarker: previewEndMarker,
    id: null,
    diagnostics: [],
  });
  const mountInfo = p.svelteCompMounts.at(-1)!;

  const result = await svelteCompiler.compile(parsed.code);
  if (result.ok) {
    const id = sourceEl.getAttribute("data-id") ?? crypto.randomUUID();

    const mod = await SvelteCompiler.loadJSModule(result.code);

    const instance = mod.mount(mod.default, {
      target: sourceEl.parentElement,
      anchor: previewEndMarker,
    });
    svelteCompStyles.setRules(result.css, id);

    syncModuleExportsToSourceEl(mod.moduleExports, mod.props, sourceEl);

    mountInfo.status = "success";
    mountInfo.moduleExports = mod.moduleExports;
    mountInfo.props = () => mod.props;
    mountInfo.unmount = () => {
      mod.unmount(instance);
      svelteCompStyles.setRules([], id);
    };
    mountInfo.id = id;
    mountInfo.diagnostics = result.diagnostics;
  } else {
    mountInfo.status = "error";
    mountInfo.diagnostics = result.diagnostics;
  }
}

function checkPreviewEl(
  previewMarker: Comment,
  p: HandleSvelteCompMountParams,
  mutation?: MutationRecord,
) {
  let startMarker: Comment, endMarker: Comment;
  let otherMarker: Comment;

  if (previewMarker.textContent === "!<SVELTECOMP-PREVIEW>") {
    startMarker = previewMarker;
    const endMarker_ = p.svelteCompMounts.find(
      (info) => info.mountPreviewStartMarker === startMarker,
    )?.mountPreviewEndMarker;
    if (!endMarker_) {
      console.warn(
        "Could not find mount info for startMarker in checkPreviewEl",
        startMarker,
      );
      return;
    } else {
      endMarker = endMarker_;
      otherMarker = endMarker_;
    }
  } else if (previewMarker.textContent === "!</SVELTECOMP-PREVIEW>") {
    endMarker = previewMarker;
    const startMarker_ = p.svelteCompMounts.find(
      (info) => info.mountPreviewEndMarker === endMarker,
    )?.mountPreviewStartMarker;
    if (!startMarker_) {
      console.warn(
        "Could not find mount info for endMarker in checkPreviewEl",
        endMarker,
      );
      return;
    } else {
      startMarker = startMarker_;
      otherMarker = startMarker_;
    }
  } else return;

  let removedPreview = false;

  if (mutation) {
    // The list of removed nodes must be contiguous nodes in the DOM i.e. siblings
    const removedSiblings = Array.from(mutation.removedNodes);
    // Note the reason this function (checkPreviewEl) would be called is because previewMarker got removed
    if (
      removedSiblings.includes(previewMarker) &&
      !removedSiblings.includes(otherMarker)
    ) {
      // One of the markers was removed, we must now remove the other marker and everything that was between them
      console.log(
        "Removing preview becasuse one of the markers for the preview got removed.",
      );

      const getNext = (node: Node) =>
        previewMarker === startMarker ? node.nextSibling : node.previousSibling;
      let currentNode = mutation.nextSibling;

      while (currentNode) {
        console.log("--- Removing ", currentNode, "parent:", mutation.target);

        // We get the prev/next sibling before removing currentNode (i.e. before we disconnect it from the DOM, after which prev/next sibling becomes null)
        const next_ = getNext(currentNode);

        mutation.target.removeChild(currentNode);
        if (currentNode === otherMarker) break;
        currentNode = next_;
      }
      removedPreview = true;
    } else if (removedSiblings.includes(previewMarker)) {
      // Nothing more we need to do; both markers (and everything between them) already got removed
      removedPreview = true;
    } else if (!previewMarker.isConnected && !otherMarker.isConnected) {
      // Both markers were removed from the DOM anyway (likely because a parent of element of the markers got removed; is in mutation.removedNodes)
      removedPreview = true;
    } else {
      // Mutation didn't remove preview markers
    }
  } else {
    // No mutation was passed in; that should mean we don't need to worry about one marker being removed while the other one wasn't.
    // Instead, we just need to check that the startMarker the direct next sibling of the source element (removing if not, and removing from p.svelteCompMounts)
  }

  checkForSourceEl: if (!removedPreview) {
    if (
      !(startMarker.previousSibling instanceof Element) ||
      !startMarker.previousSibling.hasAttribute("data-sveltecomp-source")
    ) {
      if (startMarker.parentNode !== endMarker.parentNode) {
        console.error(
          "startMarker and endMarker don't share the same direct parent (aren't siblings), when they should both be connected to the DOM",
        );
        break checkForSourceEl;
      }
      if (
        startMarker.compareDocumentPosition(endMarker) !==
        Node.DOCUMENT_POSITION_FOLLOWING
      ) {
        console.error(
          "startMarker and endMarker are direct siblings, but startMarker doesn't precede endMarker",
        );
        break checkForSourceEl;
      }

      // If the above two guards pass (which should hopefully always happen), we are safe to remove the preview by the following
      console.log(
        "Removing preview because it no longer directly precedes a data-sveltecomp-source",
      );

      let currentNode: Node | null = startMarker;
      while (currentNode) {
        // prettier-ignore
        console.log("--- Removing ", currentNode, "parent:", currentNode.parentNode);

        // We get the nextSibling before removing currentNode (i.e. before we disconnect it from the DOM, after which nextSibling becomes null)
        const next_: Node | null = currentNode.nextSibling;

        currentNode.parentNode?.removeChild(currentNode);
        if (currentNode === endMarker) break;
        currentNode = next_;
      }
      removedPreview = true;
    }
  }

  if (removedPreview) {
    // We want to splice the entry from p.svelteCompmounts out
    const mountInfoI = p.svelteCompMounts.findIndex(
      (info) =>
        info.mountPreviewStartMarker === startMarker &&
        info.mountPreviewEndMarker === endMarker,
    );
    if (mountInfoI !== -1) {
      console.log(
        "◆◆◆ Unmounting and removing from svelteCompMounts:",
        p.svelteCompMounts[mountInfoI],
      );
      p.svelteCompMounts[mountInfoI].unmount?.();
      p.svelteCompMounts.splice(mountInfoI, 1);
    } else
      throw Error("Somehow couldn't find mount info after just finding it...");
  }
}

function checkPropEl(propEl: Element, p: HandleSvelteCompMountParams) {
  // Any mutation to an element or node inside a propname container should trigger a reassignment to the Svelte component prop

  const sourceEl = propEl.parentElement;
  const mountInfo = p.svelteCompMounts.find(
    (info) => info.mountSourceEl === sourceEl,
  );

  if (!mountInfo) {
    // This could happen for pre-existing propEls saved to the server, with mutations happening to them before the Svelte component is mounted;
    //  this case is harmless, as the values will be synced the moment it *is* mounted (by syncModuleExportsToSourceEl()).
    console.warn(
      "Could not find mount info in svelteCompMounts for prop element ",
      propEl,
      "svelteCompMounts:",
      p.svelteCompMounts,
    );
    return;
  }

  if (mountInfo.status === "success") {
    const [propname, propvalue] = parseSvelteCompPropEl(propEl);
    console.log(`✨ Assigning to prop ${propname}: `, propvalue);
    mountInfo.props()[propname] = propvalue;
  }
}

export function handleSvelteCompMounts(
  mutations: MutationRecord[],
  p: HandleSvelteCompMountParams,
) {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      const addedSources = Array.from(mutation.addedNodes).flatMap((added) =>
        added instanceof Element
          ? added.hasAttribute("data-sveltecomp-source")
            ? [added]
            : Array.from(added.querySelectorAll("[data-sveltecomp-source]"))
          : [],
      );
      const removedPreviewMarkers = Array.from(mutation.removedNodes).flatMap(
        (removed) =>
          getAllChildNodes(removed).filter(
            (node) =>
              node.nodeType === Node.COMMENT_NODE &&
              (node.textContent === "!<SVELTECOMP-PREVIEW>" ||
                node.textContent === "!</SVELTECOMP-PREVIEW>"),
          ),
      ) as Comment[];

      addedSources.forEach((sourceEl) => checkSourceEl(sourceEl, p));
      removedPreviewMarkers.forEach((previewMarker) =>
        checkPreviewEl(previewMarker, p, mutation),
      );

      if (
        mutation.previousSibling instanceof Element &&
        mutation.previousSibling.hasAttribute("data-sveltecomp-source")
      ) {
        // Check the source element still has its preview
        checkSourceEl(mutation.previousSibling, p);
      }
      if (
        mutation.nextSibling instanceof Comment &&
        mutation.nextSibling.textContent === "!<SVELTECOMP-PREVIEW>"
      ) {
        // console.log(
        //   "Mutation nextSibling was preview marker start comment.",
        //   mutation,
        // );
        checkPreviewEl(mutation.nextSibling, p);
      }
    }

    const targetEl =
      mutation.target.nodeType !== Node.ELEMENT_NODE
        ? mutation.target.parentElement
        : (mutation.target as Element);
    const propEl = targetEl?.closest("[data-sveltecomp-propname]");
    if (propEl) checkPropEl(propEl, p);
  }
}
