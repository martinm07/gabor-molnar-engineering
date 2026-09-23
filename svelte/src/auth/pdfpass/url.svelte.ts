import { fetch_ } from "/shared/helper";

interface PDFPassInfo {
  marker: string;
  seed: string;
}

export const pdfpassInfo: PDFPassInfo = $state({
  marker: "",
  seed: "",
});

if (globalThis.jinjaParsed) {
  pdfpassInfo.marker = globalThis.pdfpassMarker;
  pdfpassInfo.seed = globalThis.pdfpassSeed;
} else {
  const query = new URLSearchParams(window.location.search);
  pdfpassInfo.seed = query.get("seed") ?? "";

  fetch_("/api/pdfpass_get_marker")
    .then((resp) => resp.text())
    .then((data) => {
      pdfpassInfo.marker = data;
    });
}
