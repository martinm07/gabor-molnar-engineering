import { quartOut } from "svelte/easing";
export function tada(
  node,
  { duration, disable = false, directionChanges = 2, intensity = 10 }
) {
  return {
    duration,
    css: (t) => {
      const marginRight = Math.sin(Math.PI * directionChanges * t);
      const easedMarginRight = quartOut(1 - t) * marginRight * intensity;
      return `transform: translateX(${!disable ? easedMarginRight : 0}px);`;
    },
  };
}

import { writable } from "svelte/store";
export const stages = ["name", "possession", "verify", "congrats"];
export const stageStore = writable(
  stages.find((el) => window.location.hash.includes(el)) ?? "possession"
);

export async function postData(
  url,
  getDataFunc,
  getRequest = false,
  plainText = false
) {
  try {
    const data = getDataFunc ? (!getRequest ? getDataFunc() : null) : {};
    const urlRoot = globalThis.jinjaParsed
      ? globalThis.urlRoot
      : "http://127.0.0.1:5000/";
    const resp = await fetch(urlRoot + "api/register/" + url, {
      ...(!getRequest && {
        method: "POST",
        headers: {
          "Content-Type": !plainText ? "application/json" : "text/plain",
          ...(globalThis.jinjaParsed &&
            !plainText && {
              "X-CSRFToken": globalThis.csrf_token,
            }),
        },
        body: JSON.stringify(data),
      }),

      ...(!globalThis.jinjaParsed && {
        mode: "cors",
        credentials: "include",
      }),
    });
    const returnData = await resp.json();
    if (!resp.ok)
      throw new Error(
        `${resp.status} - ${resp.statusText}\n${returnData.message}`
      );
    return returnData;
  } catch (err) {
    console.log(err.message);
    throw new Error(err.message);
  }
}

export const flyIn = (step) => {
  return { delay: step * 100, duration: 500, x: 30 };
};
export const flyOut = (step) => {
  return { delay: step * 100, duration: 500, x: -30 };
};

export async function timeoutPromise(seconds, returnVal, reject = false) {
  if (!reject) await new Promise((res) => setTimeout(res, seconds * 1000));
  else await new Promise((_r, rej) => setTimeout(rej, seconds * 1000));
  return returnVal;
}

export function updateValidWidth(validEl) {
  validEl.style.setProperty("--after-width", "auto");
  const textContent = validEl.dataset.msg;
  const text = document.createElement("span");
  document.body.appendChild(text);

  text.innerHTML = textContent;
  text.style.width = getComputedStyle(validEl, ":after").width;
  text.style.fontSize = getComputedStyle(validEl, ":after")["font-size"];
  text.style.fontWeight = getComputedStyle(validEl, ":after")["font-weight"];
  text.style.position = "fixed";

  const textNode = text.firstChild;
  const range = new Range();
  range.setStart(textNode, 0);
  range.setEnd(textNode, textContent.length);

  validEl.style.setProperty(
    "--after-width",
    range.getClientRects()[0].width + "px"
  );
  text.remove();
}
