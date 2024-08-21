/// <reference no-default-lib="true"/>
/// <reference lib="ES2015" />
/// <reference lib="webworker" />

// Default type of `self` is `WorkerGlobalScope & typeof globalThis`
// https://github.com/microsoft/TypeScript/issues/14877
// declare var self: ServiceWorkerGlobalScope;

const OTHER_ORIGIN = "https://www.example.com";
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function tryCORSThroughServer(request) {
  if (request.mode === "cors") {
    return await fetch(request).catch((err) => {
      const params = new URLSearchParams([["url", request.url]]);
      const newUrl =
        location.origin + `/documents/iframeresizer_cors?${params.toString()}`;
      console.log(
        `CORS request to "${newUrl}" failed. Retrying through local server...`
      );
      return fetch(new Request(newUrl, request));
    });
  } else {
    return fetch(request);
  }
}

self.addEventListener("fetch", function (event) {
  const request = event.request;
  let OTHER_ORIGIN;
  try {
    const url = new URL(request.referrer);
    const sourceUrl = new URL(url.searchParams.get("url") ?? "");
    OTHER_ORIGIN = sourceUrl.origin;
  } catch {
    event.respondWith(tryCORSThroughServer(request));
    return;
  }

  event.respondWith(
    (async function () {
      if (request.mode === "navigate") return fetch(request);
      let modifiedRequest;
      try {
        const url = new URL(request.url);
        if (url.host === location.host)
          modifiedRequest = new Request(
            new URL(url.pathname, OTHER_ORIGIN),
            request
          );
        else modifiedRequest = request;
      } catch {
        // The URL was not qualified with a domain name, causing a parse error
        modifiedRequest = new Request(
          new URL(request.url, OTHER_ORIGIN),
          request
        );
      }

      // Proceed with the modified request
      return tryCORSThroughServer(modifiedRequest);
    })()
  );
});

// export default null;
