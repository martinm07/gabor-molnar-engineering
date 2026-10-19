export function snippetToDOM(snippet, args = []) {
  return () => {
    const container = document.createElement("div");
    const anchor = document.createComment("");
    container.append(anchor);

    const destroy = $effect.root(() => {
      snippet(anchor, ...args.map((arg) => () => arg)); // args must be thunks
    });

    const frag = document.createDocumentFragment();
    while (container.firstChild) frag.appendChild(container.firstChild);
    frag.removeChild(anchor);
    return frag;
  };
}

export function snippetToHTML(snippet, args = []) {
  return () => {
    const frag = snippetToDOM(snippet, args)();
    const div = document.createElement("div");
    while (frag.firstChild) div.appendChild(frag.firstChild);
    return div.innerHTML;
  };
}

export function snippetToString(snippet, args = []) {
  return () => {
    const frag = snippetToDOM(snippet, args)();
    const div = document.createElement("div");
    while (frag.firstChild) div.appendChild(frag.firstChild);
    return div.textContent;
  };
}

export function htmlToDOM(htmlStr) {
  const div = document.createElement("div");
  div.innerHTML = htmlStr;
  if (div.childNodes.length === 1) return div.childNodes[0];
  else {
    const frag = document.createDocumentFragment();
    while (div.firstChild) frag.appendChild(div.firstChild);
    return frag;
  }
}

export function htmlToSnippet(htmlStr) {
  throw new Error("Not implemented");
}
