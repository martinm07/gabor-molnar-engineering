import { quartOut } from "svelte/easing";

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

export async function timeoutPromise(
  seconds: number,
  returnVal?: any,
  reject = false
) {
  if (!reject) await new Promise((res) => setTimeout(res, seconds * 1000));
  else await new Promise((_r, rej) => setTimeout(rej, seconds * 1000));
  return returnVal;
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

interface TadaOptions {
  duration: number;
  disable?: boolean;
  directionChanges?: number;
  intensity?: number;
}
export function tada(
  _: HTMLElement,
  {
    duration,
    disable = false,
    directionChanges = 2,
    intensity = 10,
  }: TadaOptions
) {
  return {
    duration,
    css: (t: number) => {
      const marginRight = Math.sin(Math.PI * directionChanges * t);
      const easedMarginRight = quartOut(1 - t) * marginRight * intensity;
      return `transform: translateX(${!disable ? easedMarginRight : 0}px);`;
    },
  };
}

export function splitCodes(codes: string) {
  if (codes.length % 3 !== 0)
    throw new Error("codes string not a multiple of 3");
  const final: string[] = [];
  for (let i = 0; i < codes.length / 3; i++) {
    final.push(codes.slice(i * 3, (i + 1) * 3));
  }
  return final;
}
