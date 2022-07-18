import { quartOut, sineInOut } from "svelte/easing";
export function tada(node, { duration, directionChanges = 2, intensity = 10 }) {
  return {
    duration,
    css: (t) => {
      const marginRight = Math.sin(Math.PI * directionChanges * t);
      const easedMarginRight = quartOut(1 - t) * marginRight * intensity;
      return `transform: translateX(${easedMarginRight}px);`;
    },
  };
}
export function turnPage(
  node,
  { duration, degrees = -15, doTransition = true }
) {
  return {
    duration,
    css: (t) => {
      // const marginRight = Math.sin(Math.PI * directionChanges * t);
      // const easedMarginRight = quartOut(1 - t) * marginRight * intensity;
      // return `margin-right: ${easedMarginRight}px;`;
      const easedRotate = sineInOut(1 - t) * degrees;
      const easedOpacity = sineInOut(t);
      // const doTransition = false;
      console.log("Do we do transition? ", doTransition);
      return `
          transform-origin: 0 0;
          transform: rotate(${doTransition ? easedRotate : degrees}deg);
          opacity: ${doTransition ? easedOpacity : 0};
        `;
    },
  };
}
export function newPageIn(
  node,
  { duration, delay = 400, doTransition = true }
) {
  return {
    delay,
    duration,
    css: (t) => {
      const easedOpacity = sineInOut(t);
      return `opacity: ${doTransition ? easedOpacity : 1};`;
    },
  };
}

export const focusInput = (inputEl) => {
  if (
    !(document.activeElement instanceof HTMLInputElement) ||
    document.activeElement.type === "submit"
  )
    inputEl.focus();
};

export const setWarning = (el, msg) => {
  el.dataset.warning = msg ? true : false;
  el.dataset.warningMessage = msg;
};

import { writable } from "svelte/store";
export const stages = ["details", "secure", "recovery"];
export const stageStore = writable(
  stages.find((el) => window.location.hash.includes(el)) ?? "details"
);

export const specialError = function (field, message) {
  if (this?.promise) this.promise = undefined;
  field.input.setCustomValidity("");
  setTimeout(() => {
    field.input.setCustomValidity(message);
    field.updateInput();
  }, 0);
};
export async function postData(
  url,
  getDataFunc,
  specialExceptions = {},
  getRequest = false
) {
  try {
    const data = getDataFunc ? (!getRequest ? getDataFunc() : null) : {};
    const resp = await fetch("http://127.0.0.1:5000/api/" + url, {
      ...(!getRequest && {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(globalThis.jinjaParsed && {
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
    // In case of OK response but still error
    if (returnData?.message) {
      for (const [signature, _] of Object.entries(specialExceptions)) {
        if (returnData.message.includes(signature)) {
          throw new Error(returnData.message);
        }
      }
    }
    return returnData;
  } catch (err) {
    console.log(err.message);
    if (specialExceptions && typeof specialExceptions === "object") {
      for (const [signature, func] of Object.entries(specialExceptions)) {
        if (err.message.includes(signature)) {
          func();
        }
      }
    }
    throw new Error(err.message);
  }
}

export function clearErrors(fields) {
  fields.forEach((el) => {
    el.input.setCustomValidity("");
    setWarning(el.input, "");
    el.updateInput();
  });
}
export function validateFields(validateInput, fields) {
  return fields
    .map((el) => {
      validateInput(el.name, false, true);
      if (el.input.validity.customError) return false;
      return true;
    })
    .every((el) => (el ? true : false));
}
