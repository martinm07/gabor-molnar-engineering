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

// username, possessionType, possession, isVerified, is2FA, isPassword, recovery
export const regState = await postData({
  url: "get_reg_state",
  getRequest: true,
});
console.log(regState);

import { writable } from "svelte/store";
export const stages = ["name", "possession", "verify", "congrats"];

let startingLoc;
if (!regState.username) startingLoc = "name";
else if (!regState.possession) startingLoc = "possession";
else startingLoc = "verify";
export const stageStore = writable(startingLoc);

export async function postData({
  url,
  data = null,
  getRequest = false,
  plainText = false,
  autoErrorMsg = true,
}) {
  try {
    const data_ = data ? (!getRequest ? data() : null) : {};
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
        body: JSON.stringify(data_),
      }),

      ...(!globalThis.jinjaParsed && {
        mode: "cors",
        credentials: "include",
      }),
    });
    const returnData = await resp.json();
    if (autoErrorMsg && !resp.ok) throw new HttpError(resp.status, returnData);
    return returnData;
  } catch (err) {
    console.log(err.message);
    throw err;
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

export function getStatusText(code) {
  return (
    {
      100: "Continue",
      101: "Switching Protocols",
      102: "Processing",
      200: "OK",
      201: "Created",
      202: "Accepted",
      203: "Non-authoritative Information",
      204: "No Content",
      205: "Reset Content",
      206: "Partial Content",
      207: "Multi-Status",
      208: "Already Reported",
      226: "IM Used",
      300: "Multiple Choices",
      301: "Moved Permanently",
      302: "Found",
      303: "See Other",
      304: "Not Modified",
      305: "Use Proxy",
      307: "Temporary Redirect",
      308: "Permanent Redirect",
      400: "Bad Request",
      401: "Unauthorized",
      402: "Payment Required",
      403: "Forbidden",
      404: "Not Found",
      405: "Method Not Allowed",
      406: "Not Acceptable",
      407: "Proxy Authentication Required",
      408: "Request Timeout",
      409: "Conflict",
      410: "Gone",
      411: "Length Required",
      412: "Precondition Failed",
      413: "Payload Too Large",
      414: "Request-URI Too Long",
      415: "Unsupported Media Type",
      416: "Requested Range Not Satisfiable",
      417: "Expectation Failed",
      418: "I'm a teapot",
      421: "Misdirected Request",
      422: "Unprocessable Entity",
      423: "Locked",
      424: "Failed Dependency",
      426: "Upgrade Required",
      428: "Precondition Required",
      429: "Too Many Requests",
      431: "Request Header Fields Too Large",
      444: "Connection Closed Without Response",
      451: "Unavailable For Legal Reasons",
      499: "Client Closed Request",
      500: "Internal Server Error",
      501: "Not Implemented",
      502: "Bad Gateway",
      503: "Service Unavailable",
      504: "Gateway Timeout",
      505: "HTTP Version Not Supported",
      506: "Variant Also Negotiates",
      507: "Insufficient Storage",
      508: "Loop Detected",
      510: "Not Extended",
      511: "Network Authentication Required",
      599: "Network Connect Timeout Error",
    }[code] || ""
  );
}

export class HttpError extends Error {
  constructor(statusCode, returnData) {
    super(
      `${statusCode} - ${getStatusText(statusCode)}\n${returnData?.message}`
    );
    this.name = "HttpError";
    this.data = returnData;
    this.status = statusCode;
    this.statusText = getStatusText(statusCode);
  }
}
