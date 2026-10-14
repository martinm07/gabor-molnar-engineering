// The ".mjs" extension of this file means "modular JavaScript".
//  It's understood by Node.js to know that this file uses the ECMAScript module system
//  (rather than CommonJS, which was the legacy module system created by Node.js).
// The ".cjs" extension would let Node know the module system the file uses is CommonJS.
// If Node has to execute a script with the ".js" extension, it chooses the module system based on `package.json` (which is default CommonJS unless it says `"type": "module",`).

import { rm } from "node:fs/promises";
import { build } from "vite";
import { exports } from "resolve.exports";
import pkg from "../src/public/svelte-lib/package.json" with { type: "json" };

import { resolve } from "node:path";

// We can check with the exports list in Svelte's package.json (https://esm.sh/svelte@5.57.2/package.json)
// const ENTRIES = [
//   // "runtime",
//   // "flags-legacy",
//   // "animate",
//   // "attachments",
//   // "easing",
//   // "events",
//   // "motion",
//   // "reactivity",
//   // "store",
//   // "transition",
//   "svelte",
//   "svelte-package-json",
//   // "svelte-action",
//   "svelte-animate",
//   "svelte-attachments",
//   "svelte-compiler",
//   "svelte-easing",
//   // "svelte-elements",
//   "svelte-internal",
//   "svelte-internal-client",
//   "svelte-internal-disclose-version",
//   "svelte-internal-flags-async",
//   "svelte-internal-flags-legacy",
//   "svelte-internal-flags-tracing",
//   "svelte-internal-server",
//   "svelte-legacy",
//   "svelte-motion",
//   "svelte-reactivity",
//   "svelte-reactivity-window",
//   "svelte-server",
//   "svelte-store",
//   "svelte-transition",
//   "svelte-events",
// ];

const ENTRIES = [
  // "runtime",
  // "flags-legacy",
  // "animate",
  // "attachments",
  // "easing",
  // "events",
  // "motion",
  // "reactivity",
  // "store",
  // "transition",
  "svelte",
  "package.json",
  // "action",
  "animate",
  "attachments",
  "compiler",
  "easing",
  // "elements",
  "internal",
  "internal/client",
  "internal/disclose-version",
  "internal/flags/async",
  "internal/flags/legacy",
  "internal/flags/tracing",
  "internal/server",
  "legacy",
  "motion",
  "reactivity",
  "reactivity/window",
  "server",
  "store",
  "transition",
  "events",
];

const OUT = "src/blog/create/editors/svelte/svelte-runtime";
const RUNTIME_ENTRIES_DIR =
  "src/blog/create/editors/svelte/svelte-runtime-entries";

const SVELTE_LIB_DIR = "src/public/svelte-lib";

const entryObj = {};
for (const entry of ENTRIES) {
  const resolved = exports(pkg, entry === "svelte" ? "." : `./${entry}`, {
    browser: true,
  });
  // console.log(resolved);
  entryObj[entry] = resolve(
    import.meta.dirname,
    "../src/public/svelte-lib",
    resolved[0],
  );
}

console.log(entryObj);

await rm(OUT, { recursive: true, force: true });

console.log(resolve(import.meta.dirname, "../src/public/svelte-lib"));

for (const entry of ENTRIES) {
  await build({
    configFile: false,
    logLevel: "warn",
    // The output lands inside `public/`, so the public-dir copy step is off.
    publicDir: false,
    build: {
      outDir: OUT,
      emptyOutDir: false,
      lib: {
        // entry: `${RUNTIME_ENTRIES_DIR}/${entry}.ts`,
        entry: entryObj,
        formats: ["es"],
        // fileName: () => `${entry}.js`,
      },
      rolldownOptions: {
        // Self-contained assets: nothing is external, so each file inlines
        // its shared modules (esm-env is defined as a production web build).
        external: [],
        // output: {
        //   codeSplitting: false,
        // },
      },
    },
  });
}

console.log(`Built ${ENTRIES.length} runtime assets into ${OUT}/`);
