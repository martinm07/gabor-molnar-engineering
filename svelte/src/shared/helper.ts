export function fetch_(input: string | URL | Request, init?: RequestInit) {
  if (globalThis.jinjaParsed) {
    if (
      input instanceof Request &&
      /^(GET|HEAD|OPTIONS|TRACE)/i.test(input.method)
    ) {
      input.headers.set("X-CSRFToken", globalThis.csrfToken);
    }
    if (init?.method && !/GET|HEAD|OPTIONS|TRACE/i.test(init.method)) {
      init.headers = {
        ...(init.headers ?? {}),
        "X-CSRFToken": globalThis.csrfToken,
      };
    }
  } else {
    const url = input instanceof Request ? input.url : input;
    // If the URL in relative (not absolute):
    if (!URL.canParse(url)) {
      const newURL = new URL(url, import.meta.env.VITE_DEV_FLASK_SERVER);
      if (input instanceof Request) input = new Request(newURL, input);
      else input = newURL;
    }
    // "init" overrides options set in an "input" of type Request
    init ??= {};
    init.mode = "cors";
    init.credentials = "include";
  }

  return fetch(input, init);
}

export function preventDefault(fn: Function) {
  return function (this: any, event: Event) {
    event.preventDefault();
    fn.call(this, event);
  };
}

export function snapStylesOnActive(
  el: HTMLElement,
  styles: string[],
  snapRelease: boolean = true
) {
  const addSnap = (el: HTMLElement) => {
    el.style.transition = styles.map((style) => style + " 0s").join(", ");
  };
  const removeSnap = (el: HTMLElement) => {
    snapRelease
      ? setTimeout(() => {
          el.style.removeProperty("transition");
        })
      : el.style.removeProperty("transition");
  };

  el.addEventListener("mousedown", () => {
    addSnap(el);
    for (const childEl of el.querySelectorAll("*")) {
      if (!(childEl instanceof HTMLElement)) continue;
      addSnap(childEl);
    }
  });
  el.addEventListener("mouseup", () => {
    removeSnap(el);
    for (const childEl of el.querySelectorAll("*")) {
      if (!(childEl instanceof HTMLElement)) continue;
      removeSnap(childEl);
    }
  });
}
