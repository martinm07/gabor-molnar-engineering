import { get } from "svelte/store";
import {
  savedComponents,
  nodesSelection,
  nodeHoverTarget,
  type SavedComponent,
} from "../store";

const encodeStr = (str: string) => encodeURI(str);
const decodeStr = (str: string) => decodeURI(str);
export function createNewComponent(
  name: string,
  el: Node,
  description?: string,
  tags?: string[],
) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_ALL);
  let content = "";
  const parts: string[] = [];
  const parents: Node[] = [];
  const siblingIndices: number[] = [0];
  let prev: Node | undefined = undefined;
  step(el);

  while (walker.nextNode()) {
    const node = walker.currentNode;
    step(node);
  }

  function step(node: Node) {
    // When we've escaped a parent, we need to add a closing tag
    if (node.previousSibling === parents.at(-1)) {
      content += "</>";
      parents.pop();
      siblingIndices.pop();
    }
    // When we haven't jumped to the next sibling, that means
    //  we've jumped inside the previous element, it is now a parent
    else if (prev && node.previousSibling !== prev) {
      parents.push(prev);
      siblingIndices.push(0);
    }

    // console.log(node, parents);

    if (node instanceof Text) {
      content += encodeStr(node.textContent ?? "");
    } else if (node instanceof Element) {
      let attrStr = "";
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        if (attr.nodeName === "data-component") continue;
        attrStr += `:${attr.nodeName}="${encodeStr(attr.nodeValue ?? "")}"`;
      }
      siblingIndices[siblingIndices.length - 1]++;
      parts.push(siblingIndices.join(","));
      attrStr += `:data-component="${encodeStr(`${name}-[${siblingIndices.join(",")}]`)}"`;

      content += `<${node.tagName.toLowerCase()}${attrStr}>`;
      if (!node.hasChildNodes()) content += "</>";
    }
    prev = node;
  }

  // console.log(content);

  const newComponent: SavedComponent = {
    name,
    description,
    tags: tags ?? [],
    content,
    parts,
  };
  savedComponents.update((list) => [...list, newComponent]);
}

setTimeout(() => {
  const el = document.querySelector("div:has(+ p)")!;
  // console.log(el);
  createNewComponent("new-comp", el);
  // console.log(get(savedComponents));
  // console.log(decodeComponentStr(get(savedComponents)[0].content));
}, 1000);

export function decodeComponentStr(str: string) {
  const fragment = document.createDocumentFragment();
  let activeLoc: Node | null = null;
  const regex = /(<[\s\S]+?>)|((?<=>)[\s\S]+?(?=<))/g;
  // console.log(str.match(regex));
  str.match(regex)?.forEach((substr) => {
    if (substr === "</>") activeLoc = activeLoc?.parentNode ?? null;
    // The substr is an element
    else if (substr.startsWith("<")) {
      // This regex matches colons only if there's an even number of double
      //  quote characters behind it spread throughout the string
      // FUN FACT: When the seperator given to .split() is a RegExp with capturing groups,
      //            those groups will be spliced into the result (even if it's 'undefined')
      // "Hello world".split(/o( )w/g) // Array(3) [ "Hell", " ", "orld" ]
      const items = substr.slice(1, -1).split(/(?<=^[^"]*(?:"[^"]*"[^"]*)*):/g);
      // console.log(substr, items);
      const newEl = document.createElement(items[0]);
      const allAttrs: { name: string; value: string }[] = items
        .slice(1)
        .map((item) => {
          return {
            name: item.split("=")[0],
            value: decodeStr(item.split("=")[1].slice(1, -1)),
          };
        });
      allAttrs.forEach((attr) => newEl.setAttribute(attr.name, attr.value));
      if (activeLoc) activeLoc.appendChild(newEl);
      else fragment.appendChild(newEl);
      activeLoc = newEl;
    } else {
      // The substr is a text node
      const newText = document.createTextNode(decodeStr(substr));
      if (activeLoc) activeLoc.appendChild(newText);
      else fragment.appendChild(newText);
    }
  });
  // console.log(fragment);
  return fragment;
}

export function componentNameValid(str: string) {
  return (
    /-\[(\d+,)*\d+\]$/g.test(str) &&
    get(savedComponents).some(({ name }) => str.startsWith(name))
  );
}

function getCompNameAndPart(compName: string): [name: string, part: string] {
  if (!componentNameValid(compName))
    throw new Error(`Component name provided was invalid. Got: "${compName}"`);
  const nameParts = compName.split("-");
  const partsArr = nameParts.at(-1)!.slice(1, -1);
  return [nameParts.slice(0, -1).join("-"), partsArr];
}

export function changeElToComp(el: Element, compName: string) {
  const [name, part] = getCompNameAndPart(compName);
  // console.log(name, part);
  const saved = get(savedComponents).find((item) => item.name === name)!;
  // console.log(saved);
  if (!saved.parts.includes(part))
    throw new Error(
      `The provided component name does not have the provided part "${part} NOT IN ${saved.parts.map((str) => '"' + str + '"').join("  ")}"`,
    );
  const content = saved.content;

  // This assumes that the order of the parts array will match the content string document order
  const elIndex = saved.parts.findIndex((item) => item === part);
  // This regex matches the first e.g. <tagName:attr1="value"> that has at
  //  least an elIndex number of </> behind it in the string
  const regex = new RegExp(
    String.raw`(?<=(?:[^]*<\/>[^]*){` +
      String(elIndex) +
      String.raw`})<[^/]+?>`,
  );
  const match = regex.exec(content)?.[0]?.slice(1, -1);
  // console.log(elIndex, match);
  if (!match)
    throw new Error(
      `Could not find the provided part in the provided component name content`,
    );
  const newTagName = match.split(":")[0];
  let el_ = el;
  if (el.tagName !== newTagName.toUpperCase()) {
    const newEl = document.createElement(newTagName);
    while (el.firstChild) newEl.appendChild(el.firstChild);
    el.replaceWith(newEl);

    if (get(nodeHoverTarget) === el) nodeHoverTarget.set(newEl);
    if (get(nodesSelection).some((item) => item === el))
      nodesSelection.update((old) =>
        old.map((item) => (item === el ? newEl : item)),
      );

    el_ = newEl;
  }

  const newAttrs: [string, string][] = match
    .split(":")
    .slice(1)
    .map((str) => {
      const parts = str.split("=");
      return [parts[0], decodeStr(parts[1].slice(1, -1))];
    });
  newAttrs.forEach(([name, newVal]) => {
    if (el_.getAttribute(name) !== newVal) el_.setAttribute(name, newVal);
  });
  // console.log(Array(...el_.attributes));
  Array(...el_.attributes).forEach((attr) => {
    if (!newAttrs.some(([name]) => name === attr.nodeName))
      el_.removeAttribute(attr.nodeName);
  });
}

// The database integration will be as follows;
// There is one table for guidance documents, whether published or unpublished, that also includes the
//  component library UID, and a separate table for the saved components, and then another table "params"
//  that has an entry for the current saved components' table UID.
// When queried to make changes to the saved components table, all the views return the resultant UID
// The loaded guidance document of the editor has its own UID (from the table entry), and there's a view the
//  editor can call to update the UID, along with an update to the content, when the user selects that they
//  would like this to happen
