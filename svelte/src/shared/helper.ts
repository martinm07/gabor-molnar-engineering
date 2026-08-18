import type { Attachment } from "svelte/attachments";
import { quartOut } from "svelte/easing";

export function fetch_(input: string | URL | Request, init?: RequestInit) {
  if (globalThis.jinjaParsed) {
    if (
      input instanceof Request &&
      !/(GET|HEAD|OPTIONS|TRACE)/i.test(input.method)
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

/****************************** Claude generated this, as an XMLHttpRequest equivalent to the above fetch function */
type XHRBody = Document | XMLHttpRequestBodyInit | null;

export interface XHROptions {
  method?: string;
  headers?: HeadersInit;
  body?: XHRBody;
  responseType?: XMLHttpRequestResponseType;
  timeout?: number;
  onUploadProgress?: (event: ProgressEvent) => void;
  onDownloadProgress?: (event: ProgressEvent) => void;
}

export interface XHRHandle {
  /** Raw XHR instance — use for `.abort()`, inspecting `.status`, etc. */
  xhr: XMLHttpRequest;
  /** Resolves with the XHR once it loads (check `.status` yourself — this
   *  does NOT reject on 4xx/5xx, only on network error/abort/timeout). */
  promise: Promise<XMLHttpRequest>;
}

function normalizeHeaders(headers: HeadersInit): [string, string][] {
  if (headers instanceof Headers) return [...headers.entries()];
  if (Array.isArray(headers)) return headers;
  return Object.entries(headers);
}

/**
 * XMLHttpRequest counterpart to `fetch_`. Same dev/prod split:
 *  - production (jinjaParsed): same-origin, attach CSRF token on unsafe methods
 *  - dev: rewrite relative URLs to the Vite-side Flask dev server, send cookies
 *    cross-origin via `withCredentials`
 *
 * Unlike `fetch_`, this only accepts string/URL inputs (XHR has no Request
 * object), and calls `.send()` immediately — attach progress handlers via the
 * options, not after the fact.
 */
export function xhr_(input: string | URL, init: XHROptions = {}): XHRHandle {
  const method = init.method ?? "GET";
  let url = input.toString();

  if (!globalThis.jinjaParsed && !URL.canParse(url)) {
    url = new URL(url, import.meta.env.VITE_DEV_FLASK_SERVER).toString();
  }

  const xhr = new XMLHttpRequest();
  xhr.open(method, url, true);

  if (globalThis.jinjaParsed) {
    // Unsafe methods need the CSRF token; safe methods don't.
    if (!/^(GET|HEAD|OPTIONS|TRACE)/i.test(method)) {
      xhr.setRequestHeader("X-CSRFToken", globalThis.csrfToken);
    }
  } else {
    // Cross-origin dev request — let cookies (session/CSRF) flow.
    xhr.withCredentials = true;
  }

  if (init.headers) {
    for (const [key, value] of normalizeHeaders(init.headers)) {
      xhr.setRequestHeader(key, value);
    }
  }

  if (init.responseType) xhr.responseType = init.responseType;
  if (init.timeout) xhr.timeout = init.timeout;
  if (init.onUploadProgress) {
    xhr.upload.addEventListener("progress", init.onUploadProgress);
  }
  if (init.onDownloadProgress) {
    xhr.addEventListener("progress", init.onDownloadProgress);
  }

  const promise = new Promise<XMLHttpRequest>((resolve, reject) => {
    xhr.addEventListener("load", () => resolve(xhr));
    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.addEventListener("timeout", () =>
      reject(new DOMException("Timed out", "TimeoutError")),
    );
    xhr.addEventListener("abort", () =>
      reject(new DOMException("Aborted", "AbortError")),
    );
  });

  xhr.send(init.body ?? null);

  return { xhr, promise };
}
/****************************** */

export async function timeoutPromise(
  seconds: number,
  returnVal?: any,
  reject = false,
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
  snapRelease: boolean = true,
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
  const recursiveApply = (func: (el: HTMLElement) => void) => {
    func(el);
    for (const childEl of el.querySelectorAll("*")) {
      if (!(childEl instanceof HTMLElement)) continue;
      func(childEl);
    }
  };

  el.addEventListener("mousedown", recursiveApply.bind(null, addSnap));
  el.addEventListener("mouseleave", recursiveApply.bind(null, removeSnap));
  el.addEventListener("mouseup", recursiveApply.bind(null, removeSnap));
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
  }: TadaOptions,
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

export const ellipsesAnimationAttachment: Attachment = (el) => {
  let i = 3;
  el.textContent = "...";
  const periodInterval = setInterval(() => {
    i = (i + 1) % 4;
    if (i === 0) el.textContent = "";
    else el.textContent = el.textContent + ".";
  }, 300);
  return () => {
    clearInterval(periodInterval);
  };
};

export function splitCodes(codes: string) {
  if (codes.length % 3 !== 0)
    throw new Error("codes string not a multiple of 3");
  const final: string[] = [];
  for (let i = 0; i < codes.length / 3; i++) {
    final.push(codes.slice(i * 3, (i + 1) * 3));
  }
  return final;
}

/**
 * At least in the case of the onMount of a component, the next DOM update never
 * happens after one requestAnimationFrame, inconsistently after one setTimeout
 * and seemingly consistently after two requestAnimationFrames, which is what this
 * function does.
 */
export function request2AnimationFrames(callback: FrameRequestCallback) {
  requestAnimationFrame(() => requestAnimationFrame(callback));
}

export function fadeColor(color: string, alpha: number) {
  const color_ = color.split(" ").map((str) => Number.parseInt(str));
  return color_.map((c) => alpha * c + (1 - alpha) * 255).join(" ");
}
export function darkenColor(color: string, alpha: number) {
  const color_ = color.split(" ").map((str) => Number.parseInt(str));
  return color_.map((c) => alpha * c).join(" ");
}

// https://stackoverflow.com/a/3561711/11493659
export function escapeRegex(string: string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
}

/**
 * Object.assign(), but calls structuredClone on the object passed in as the first argument. This is to avoid
 * Object.assign() modifying that object.
 *
 * NOTE: structuredClone() doesn't expect Proxy objects (which is what $state variables are), so if some $state
 *       is passed in as the first argument, make sure to use $state.snapshot() first.
 */
export function assign<T1 extends object, T2 extends object>(
  obj1: T1,
  obj2: T2,
): T1 & T2 {
  return Object.assign(structuredClone(obj1), obj2);
}

export function convertAccent(accent?: string) {
  if (!accent) return accent;
  let color: string;
  if (/^\d+ \d+ \d/g.test(accent)) {
    color =
      "#" +
      accent
        .split(" ")
        .map((num) => Number.parseInt(num).toString(16))
        .join("");
  } else {
    color = accent;
  }

  return color;
}

const bytePrefixMap = new Map([
  [1, "bytes"],
  [1_000, "KB"],
  [1_000_000, "MB"],
  [1_000_000_000, "GB"],
]);
export function prefixBytesVal(bytes: number) {
  let bestVal: number = bytes;
  let bestPrefix: string = "bytes";
  bytePrefixMap.forEach((prefixStr, key) => {
    const val = bytes / key;
    if (val > 1 && val < bestVal) {
      bestVal = val;
      bestPrefix = prefixStr;
    }
  });

  return bestVal.toPrecision(3) + " " + bestPrefix;
}

export const rootFontSize = parseFloat(
  getComputedStyle(document.documentElement).fontSize,
);
export const remToPixels = (x: number) => x * rootFontSize;
