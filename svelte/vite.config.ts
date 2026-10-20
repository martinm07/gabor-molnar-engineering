import { resolve, parse, sep, relative } from "node:path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";

// Vite 8 is powered by Rolldown, whose types Vite re-exports.
import type { GetModuleInfo } from "rolldown";

const _dirname = import.meta.dirname;

const root = resolve(_dirname, "src");
const outDir = resolve(_dirname, "dist");

// IMP: Make sure this is the same as your Flask application's URL for the static endpoint for static files
//      Unless you explicitly changed it you don't have to worry about this, as it should be the default.
const STATIC_PATH = "static/";

// IMP: Set the build's entry points here. The key names don't matter
const entryPoints: Record<string, string> = {
  register: resolve(root, "auth/register/index.html"),
  bloghome: resolve(root, "blog/home/index.html"),
  blogsearch: resolve(root, "blog/search/index.html"),
  // blogread: resolve(root, "blog/read/index.html"),
  blogcreate: resolve(root, "blog/create/index.html"),
  blogtagsedit: resolve(root, "blog/tagsedit/index.html"),
  blogadmin: resolve(root, "blog/admin/index.html"),
  authlogin: resolve(root, "auth/login/index.html"),
  authpdfpass: resolve(root, "auth/pdfpass/index.html"),
};

// IMP: Want to extend output.manualChunks? Do so here!
// NOTE: Vite 8 (Rolldown) replaced output.manualChunks with output.codeSplitting,
//      and the codeSplitting name() function cannot enumerate the module graph.
//      This function is therefore invoked for every module up front in the
//      "precompute-manual-chunks" plugin's buildEnd hook (see manualChunksMap),
//      and its results are honoured by the codeSplitting group in `build`.
const manualChunks: (
  id: string,
  meta: { getModuleInfo: GetModuleInfo; getModuleIds: () => string[] },
) => string | null | undefined = (id, { getModuleInfo, getModuleIds }) => {
  return;
};

// prettier-ignore
function isMediaFile(name: string) {
  const path = parse(name);
  const ext = path.ext ? path.ext.replace(".", "") : name.replace(".", "");

  if (/a?png|avif|gif|jpe?g|jfif|pjpeg|pjp|svgz?|webp/i.test(ext)) return "img";
  if (/tif?f|psd|raw|arw|cr2|nrw|k25|bmp|dib|heif|heic|ind?d|indt|jp2|j2k|jpf|jpx|jpm|mj2/i.test(ext)) return "img";
  if (/ai|eps|ico|cur/i.test(ext)) return "img";

  if (/webm|mkv|flv|vob|ogv|ogg|drc|gifv?|mng|avi|m2?ts|mov|qt|wmv|yuv|rmvb|viv|asf|mp4|m4v/i.test(ext)) return "vid";
  if (/mpe?g|mp2|mpe|mpv|m2v|m4v|svi|3gp|3g2|mxf|roq|nsv|flv|f4v|f4p|f4a|f4b/i.test(ext)) return "vid";

  if (/aac?|aax|act|aiff?|aifc|alac|amr|ape|au|awb|dss|dvf|flac|gsm|iklax|ivs|m4a|m4b|mpc/i.test(ext)) return "aud";
  if (/msv|nmf|ogg|oga|mogg|opus|ra|ra?m|rf64|sln|tta|voc|vox|wave?|wma|wvc?|8svx|cda/i.test(ext)) return "aud";
  if (/caf|3ga|snd|m4p|m4r|mmf|movpkg|mp3|l16|pcm|ad4|iff/i.test(ext)) return "aud";

  if (/txt|md|pdf|asc|docx?|rtf|msg|wpd|wps/i.test(ext)) return "txt";

  if (/vfb|pfa|fnt|vlw|jfproj|woff2?|sfd|pfb|otf|bdf|glif|fot|ttf|odttf|fon|chr|pmt|ttc/i.test(ext)) return "font";
  if (/amfm|bmfc|mf|pf2|pfm|compositefont|gxf|etx|abf|fnt|pcf|dfont|sfp|gf|mxf|ufo|tte/i.test(ext)) return "font";
  if (/vnf|bf|xfn|pfr|tfm|gdr|afm|xft|eot|txf|acfm|pk|suit|ffil|nftr|t65|euf|mcf|cha|ytf/i.test(ext)) return "font";
  if (/lwfn|f3f|fea|pft|sft/i.test(ext)) return "font";

  // The custom plugin should generally be able to work for all cases (thus we could
  //  always return true), however it doesn't for resolving dependent packages (e.g. svelte)
  //  because it has to do so by making a lookup in the package's package.json, and
  //  once a file is renamed by the plugin that link becomes rotten and fails.
  // We could try and walk each id from the resolveId hook up its parent directories until
  //  it finds the package.json and edits it to include the hash, but that sounds like too much...
  // Anything that engages in code-splitting (including the js files from package dependencies)
  //  can be handled by the build.manualChunks method anyway.
  // This check, thus, needs to be sure to exclude whatever can be found in the links in a
  //  node_modules package.json. Anything else (should) goes.
  if (!/jsx?|tsx?|cjs|mjs|cts|mts|svelte|css|x?html|php|aspx?|rss|xps|x?htm/i.test(ext)) return ext;
  return false;
}

// Small string hasher, taken from https://stackoverflow.com/a/52171480/11493659
const hashCode = (s: string) => {
  for (var i = 0, h = 9; i < s.length;)
    h = Math.imul(h ^ s.charCodeAt(i++), 9 ** 9);
  return Math.abs(h ^ (h >>> 9)).toString(16);
};
/**
 * Maps e.g. `C:/Users/marti/OneDrive/Desktop/Martin/projects/misc/svelte-5-flask-demo/svelte3/src/intro/home/index.html` -> `intro/home`
 */
const getEntryName = (entryPoint: string) =>
  entryPoint.split("/").slice(-3, -1).join("/");

let firstManualChunksCall = true;
const manualChunksMap = new Map<string, string | null | undefined>();
// Rolldown's codeSplitting name() context only exposes getModuleInfo, so we keep
//  a reference to the build's getModuleInfo here for the output.chunkFileNames function.
let currentGetModuleInfo: GetModuleInfo | undefined;

/**
 * NOTE: This function is not as advanced as Rollup's code splitting algorithm!
 * While this sees if a file is used by an entry point by the chain of imports on the "file level,"
 * Rollup does so by looking at WHAT each entry point is importing, and what those functions/variables
 * are importing
 *
 * What this allows it to see, for example, is in the svelte package that while
 * `src/internal/client/dom/elements/attributes.js` has functions used by our App.svelte for our `about` and `home` entry points through
 * `src/internal/client/index.js`, it isn't used by the `privacy` entry point, thus we keep it as a seperate file
 * that only `about` and `home` need to import. However, since all three of our entry points do import SOMETHING from
 * `src/internal/client/index.js`, our findDependentEntryPoints function simply sees all three entry points dependent on
 * `src/internal/client/index.js`, and `src/internal/client/index.js` dependent on `src/internal/client/dom/elements/attributes.js`;
 * no need to keep it as a seperate file.
 *
 * While this matters if we want to use our output.manualChunks method to chunk JavaScript, it doesn't matter for CSS, since
 * you cannot import only a "specific subset" of styles, for example.
 */
function findDependentEntryPoints(id: string, getModuleInfo: GetModuleInfo) {
  const dependentEntryPoints: string[] = [];
  let isDynamic: boolean = false;

  // Rolldown internal/synthetic modules (e.g. "\0rolldown/runtime.js", which
  //  asset URL handling in JS pulls in) can appear in chunk moduleIds, but
  //  getModuleInfo returns null for them; they contribute no entry points.
  const rootInfo = getModuleInfo(id);
  if (!rootInfo) return { dependentEntryPoints, isDynamic };
  const { isEntry, dynamicImporters, importers } = rootInfo;
  if (isEntry) dependentEntryPoints.push(id);
  const idsToHandle = new Set([...dynamicImporters, ...importers]);
  // Even if we know it has a dynamic import, and thus won't be grouped with anything
  //  else, to be able to place it under the file hierarchy's sections we need
  //  all the dependent entry points to see if they share a common section.
  if (dynamicImporters.length > 0) isDynamic = true;

  for (const moduleId of idsToHandle) {
    const info = getModuleInfo(moduleId);
    if (!info) continue;
    const { isEntry, dynamicImporters, importers } = info;
    if (isEntry) dependentEntryPoints.push(moduleId);

    for (const importerId of [...dynamicImporters, ...importers])
      idsToHandle.add(importerId);

    if (dynamicImporters.length > 0) isDynamic = true;
  }
  return { dependentEntryPoints, isDynamic };
}

const secFromPath = (id: string): string | undefined => {
  const relativePath = relative(root, id);
  return relativePath.split(sep)[0];
};
// Returns undefined for an empty array, since Rolldown can emit chunks with
//  no modules (e.g. an empty code-splitting group).
const secsEqual = (arr: string[]) =>
  arr.length
    ? arr
        .map((id) => secFromPath(id))
        .reduce((p, c) => (p === c ? p : undefined))
    : undefined;

function getChunkName(
  id: string,
  getModuleInfo: GetModuleInfo,
): { hash: string | null; name_: string } | undefined {
  const { dependentEntryPoints, isDynamic } = findDependentEntryPoints(
    id,
    getModuleInfo,
  );

  if (dependentEntryPoints.length === 0) return;
  if (dependentEntryPoints.length === 1) {
    if (isDynamic) {
      const hash = hashCode(id);
      const sec = secFromPath(dependentEntryPoints[0]);
      const name = parse(id).name;
      return { hash, name_: `${sec}/${name}` };
    }
    return {
      hash: null,
      // We add ".css" here if it's a CSS file because we don't want to group CSS files with JS files,
      //  only because of some weirdness with Vite not including the "section/" in assetInfo.name of the
      //  output.assetFileNames method (this is why its fine to group them together if we're mapping a hash).
      name_:
        getEntryName(dependentEntryPoints[0]) +
        (id.endsWith(".css") ? ".css" : ""),
    };
  }

  let hash: string;
  if (isDynamic) hash = hashCode(id);
  else {
    // Group this CSS file with all others who share the same entry points
    const entryNames = dependentEntryPoints.map((entry) => getEntryName(entry));
    // Sort the list so that order doesn't matter in the hash
    entryNames.sort();

    hash = hashCode(entryNames.join(""));
  }
  // To have a more reasonable name, we create mapping of the dependencies hash to the file name,
  //  to be substituted in at the output.assetFileNames() method
  let fileName = parse(id).name;
  // If all the dependencies are under the same section of the folder hierarchy, we can place
  //  the bundle under that section
  const commonSection = secsEqual(dependentEntryPoints);
  return {
    hash,
    name_: `${commonSection ? commonSection + "/" : ""}${fileName}`,
  };
}

/**
 * Places a media file (anything isMediaFile() recognises) under the section of
 *  the directory hierarchy it lives in: the first path segment is the section,
 *  and the segments beyond `section/<page>/` become the subpath
 *  (e.g. `src/blog/create/editors/css/x.txt` -> sec "blog", subpath "editors/css/").
 * Returns undefined for files outside of `root` (e.g. node_modules assets).
 */
function getMediaSectionInfo(id: string) {
  const relativePath = relative(root, id);
  if (relativePath.startsWith("..")) return;
  const sec = relativePath.split(sep)[0];
  let subpath = relative(root, parse(id).dir).split(sep).slice(2).join("/");
  subpath = subpath ? subpath + "/" : "";
  return { sec, subpath };
}

const mapHashName = new Map<string, string>();

// Web workers are handled separately by Vite. These globals are for dealing with them.

/**
 * Nested worker builds are independent async pipelines that can interleave,
 * so a plain shared value would be clobbered by a concurrent build. To make
 * this safe we serialize the worker builds: the plugin's buildStart acquires
 * a turn on `workerBuildGate` (Rolldown awaits buildStart, so only one worker
 * build is in flight at a time) and its closeBundle releases it. closeBundle
 * is safe to rely on because Vite calls bundle.close() in a finally, so the
 * hook fires on both success and failure (no leaked gate). If a build never
 * reaches buildStart (rolldown() threw), no gate is installed, so the chain
 * can't deadlock.
 */
let workerBuildGate: Promise<void> = Promise.resolve();
/**
 * The section of the web worker source file for the nested worker build
 * currently being bundled, set by the "worker-section" plugin's buildStart
 * and read by the worker output naming functions.
 */
let currentWorkerSection: string | undefined;

export default defineConfig({
  root,
  // test: {
  //   globals: true,
  //   environment: "jsdom",
  // },
  server: {
    hmr: false,
  },
  // Vite bundles web workers with a nested Rolldown build whose default
  //  output names are "assets/[name]-[hash].*" (the main build's
  //  assetFileNames never sees them). worker.rolldownOptions.output is
  //  spread over those defaults inside the nested build, so we redirect the
  //  worker and its assets (e.g. the .wasm that wasm-bindgen packages pull
  //  in) under the section of the directory the worker file lives in.
  worker: {
    // Vite calls this function for each nested worker bundling process, so it must return fresh plugin instances.
    // Vite invokes it with no arguments; the worker entry is reached via the plugin context's environment config, which carries the build's bundleChain.
    plugins: () => {
      let releaseMyGate: (() => void) | undefined;
      return [
        {
          name: "worker-section",
          buildStart() {
            // Understanding this `this.environment.config` code:
            //   https://vite.dev/guide/api-environment-plugins#accessing-the-current-environment-in-hooks

            // IMP: bundleChain is an internal property used by Vite (i.e. undocumented and liable to change without warning).
            //       It is a list of moduleIDs representing the chain of nested worker entries (the chain of workers importing other workers),
            //       and is primarily used by Vite to detect circular imports of workers importing other workers.
            //      The last item of this list is the module ID of the worker currently being bundled/worked on.
            //      There is no other way to know the moduleID of this worker (the module ID being the resolved absolute file import path);
            //       these nested Rolldown builds are quite isolated otherwise.
            //      For an explanation on module IDs: https://github.com/rolldown/rolldown/blob/main/internal-docs/module-id/implementation.md
            const bundleChain = (
              this.environment.config as { bundleChain?: string[] }
            ).bundleChain;
            const entry = bundleChain?.at(-1);
            const section = entry ? getMediaSectionInfo(entry)?.sec : undefined;
            currentWorkerSection = section;

            // Make buildStart return the Promise created by the previous call to buildStart(),
            //  and create a new Promise() for the next call to buildStart() that only resolves on closeBundle().
            // This is to force worker builds to run synchronously, ensuring they don't clobber each other on the global `currentWorkerSection` variable.
            // This relies on the fact that Rolldown awaits buildStart
            const gateToWait = workerBuildGate;
            workerBuildGate = new Promise<void>((r) => (releaseMyGate = r));
            return gateToWait;
          },
          // Fires on success AND failure (Vite calls bundle.close() in a finally), so the gate is always released.
          closeBundle() {
            releaseMyGate?.();
          },
        },
      ];
    },
    rolldownOptions: {
      output: {
        // All of a worker build's output (its JS chunks and its assets)
        //  belongs to the section of the directory the worker file lives in,
        //  so name everything with currentWorkerSection.
        entryFileNames: (chunkInfo) =>
          `${STATIC_PATH}${currentWorkerSection ?? "shared"}/js/${chunkInfo.name}-[hash].js`,
        chunkFileNames: (chunkInfo) =>
          `${STATIC_PATH}${currentWorkerSection ?? "shared"}/js/${chunkInfo.name}-[hash].js`,
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names[0] ?? "asset";
          const orig = assetInfo.originalFileNames[0];
          // Assets that live under root (e.g. a section-local image) keep
          //  their own section; assets from node_modules (e.g. the .wasm)
          //  have no section of their own, so place them with the worker's.
          const sec =
            (orig ? getMediaSectionInfo(resolve(root, orig)) : undefined)
              ?.sec ??
            currentWorkerSection ??
            "shared";
          const type = isMediaFile(name) || parse(name).ext.slice(1);
          return `${STATIC_PATH}${sec}/${type}/${parse(name).name}-[hash][extname]`;
        },
      },
    },
  },
  plugins: [
    tailwindcss(),
    svelte({
      compilerOptions: {
        runes: true,
      },
    }),
    {
      name: "precompute-manual-chunks",
      apply: "build",
      buildStart() {
        // Reset the worker section state per main build, so stale state from a
        //  previous watch rebuild doesn't leak in. This fires before any
        //  nested worker build (they're triggered during the main build's
        //  parse), so it's safe to reset the gate here.
        currentWorkerSection = undefined;
        workerBuildGate = Promise.resolve();
      },
      // Capture the build's getModuleInfo for output.chunkFileNames, and precompute
      //  the user's manualChunks outputs for the codeSplitting group.
      buildEnd() {
        const getModuleInfo = this.getModuleInfo;
        const getModuleIds = () => Array.from(this.getModuleIds());
        currentGetModuleInfo = getModuleInfo;

        // The first thing we do is generate all the outputs from the user's manualChunks
        //  function. This is because for each module we need to know ALL the modules it's
        //  forced to group with that we may determine a common section (or not).
        // Rolldown's codeSplitting name() function cannot enumerate the module graph
        //  (its context only exposes getModuleInfo), so we do it here, where the
        //  full graph is available.
        if (firstManualChunksCall) {
          for (const id of getModuleIds()) {
            manualChunksMap.set(
              id,
              manualChunks(id, { getModuleInfo, getModuleIds }),
            );
          }
          firstManualChunksCall = false;
        }
      },
    },
  ],
  build: {
    outDir,
    emptyOutDir: true,
    rolldownOptions: {
      input: entryPoints,
      output: {
        // Vite 8 (Rolldown) replaced output.manualChunks with output.codeSplitting.
        //  As with manualChunks, every distinct name returned by `name` below
        //  becomes its own chunk.
        codeSplitting: {
          groups: [
            {
              // Only modules the old manualChunks function would have claimed
              //  (a user chunk, or a CSS module) are candidates for this group.
              //  (Media files never end in ".css", so the old media-section
              //   guard is no longer needed.)
              test: (id) => !!manualChunksMap.get(id) || id.endsWith(".css"),
              // Identifies this group in Rolldown's bundler timing report.
              debugName: "manual-chunks-and-css",
              name: (id, ctx) => {
                // Rolldown's codeSplitting name() context's getModuleInfo is a class
                //  method (ChunkingContextImpl) that relies on `this`, so bind it.
                const getModuleInfo = ctx.getModuleInfo.bind(ctx);
                // Consult the precomputed outputs from the user's manualChunks
                //  function (see the buildEnd hook above).
                const userChunk = manualChunksMap.get(id);
                if (userChunk) {
                  // Get all module IDs of the same chunk
                  const idsGroup = [...manualChunksMap.entries()]
                    .filter(([_, v]) => v === userChunk)
                    .map(([k, _]) => k);

                  // A Set because we almost certainly will face an importer
                  //  importing multiple modules and we don't want duplicates.
                  const allEntryPointsSet = new Set<string>();
                  for (const id of idsGroup) {
                    const { dependentEntryPoints } = findDependentEntryPoints(
                      id,
                      getModuleInfo,
                    );
                    dependentEntryPoints.forEach((entry) =>
                      allEntryPointsSet.add(entry),
                    );
                  }
                  const dependentEntryPoints = [...allEntryPointsSet];

                  if (dependentEntryPoints.length === 0) return userChunk;
                  const commonSec = secsEqual(dependentEntryPoints);
                  if (!commonSec) return userChunk;
                  return `${commonSec}/${userChunk}`;
                }

                // This also includes the style tag of Svelte files, which are emitted seperately and
                //   end with "?svelte&type=style&lang.css"
                // It's possible to remove this conditional (accepting both JS and CSS), but it means opting
                //   for a worse code splitter (see docstring on findDependentEntryPoints function for more details).
                if (id.endsWith(".css")) {
                  // This generates a hash that will group all CSS modules that have the same dependencies
                  //   (account for how dynamic imports don't allow grouping).
                  // It also generates a sensible file name (one chosen arbitrarily from the bundle)
                  //   and under a common section if there is one. This better name can be mapped to from the
                  //   hash in the output.assetFileNames method.
                  // NOTE, Because CSS files engage in code splitting,
                  //   the assetFileNames method for CSS modules must execute after these manualChunks calls.
                  //   However, no other asset type I'm aware of does this by Rollup/Vite, and for them assetFileNames executes BEFORE.
                  //   That's why they can't be handled here and must be done with a custom plugin.
                  const chunkName = getChunkName(id, getModuleInfo);
                  if (!chunkName) return;
                  const { hash, name_ } = chunkName;
                  if (!hash) return name_;
                  mapHashName.set(hash, name_);
                  return hash;
                }
              },
            },
          ],
        },
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names[0];
          if (!name) {
            console.warn("Asset without a name. Received object: " + assetInfo);
            return "[name]-[hash][extname]";
          }

          const ext = parse(name).ext.slice(1);
          const extType = isMediaFile(ext) || ext;

          // Media files (images, fonts, videos, audio, text, ...): place them
          //  under the section of the directory they live in.
          // assetInfo.originalFileNames[0] is the path of the on-disk source
          //  file (root-relative as of Vite 8.3; resolve() keeps this working
          //  if Rolldown switches to absolute paths), so this works for assets
          //  imported from JS as well as for assets referenced from CSS url()
          //  (which Vite resolves without involving user plugins).
          // Query-suffixed imports (?raw, ?inline, ?worker&inline, ...) never
          //  reach here: Vite inlines them into JS instead of emitting assets,
          //  and the only suffixes that do emit (?url, ?no-inline) do so from
          //  the un-suffixed file, carrying its originalFileNames.
          const mediaType = isMediaFile(ext);
          const originalFile = assetInfo.originalFileNames[0];
          if (mediaType && originalFile) {
            const info = getMediaSectionInfo(resolve(root, originalFile));
            if (info)
              return `${STATIC_PATH}${info.sec}/${mediaType}/${info.subpath}${parse(name).name}-[hash][extname]`;
          }

          let mapReturn = mapHashName.get(parse(name).name);
          if (!mapReturn && extType === "css") mapReturn = name;
          if (mapReturn) {
            const sec = parse(mapReturn).dir || "shared";
            const origName = parse(mapReturn).name;

            if (sec === "shared")
              return `${STATIC_PATH}${sec}/${extType}/${origName}[extname]`;
            return `${STATIC_PATH}${sec}/${extType}/${origName}-[hash][extname]`;
          }

          console.warn(`The asset file "${name}" was not able to be seen to a section.
                        Perhaps it was a media file not recognized?`);
          return `${STATIC_PATH}shared/${extType}/[name][extname]`;
        },
        chunkFileNames: (chunkInfo) => {
          const getModuleInfo = currentGetModuleInfo!;

          let sec: string | undefined;
          let name: string | undefined;

          sec = secsEqual(
            chunkInfo.moduleIds.flatMap(
              (moduleId) =>
                findDependentEntryPoints(moduleId, getModuleInfo)
                  .dependentEntryPoints,
            ),
          );

          // Fallback for chunks whose modules lead to no common section (or no
          //  entry points at all): place the chunk under the section of the
          //  first media file it contains, if all its media files agree.
          // (Suffixed ids like "x.glsl?raw" are virtual modules, not files.)
          if (!sec)
            for (const id of chunkInfo.moduleIds) {
              if (id.includes("?") || !isMediaFile(id)) continue;
              const info = getMediaSectionInfo(id);
              if (!info) continue;
              if (!sec) sec = info.sec;
              else if (sec !== info.sec) sec = "shared";
            }

          // These are only included so that the mapHashName map would work
          //  better should the code change
          const mapReturn = mapHashName.get(chunkInfo.name);
          if (mapReturn && !sec) {
            sec = parse(mapReturn).dir || "shared";
            name = parse(mapReturn).name;
          }

          if (
            chunkInfo.moduleIds.some(
              (id) =>
                resolve(id) ===
                resolve(_dirname, "node_modules", "svelte/src/version.js"),
            )
          )
            name = "svelte";

          return `${STATIC_PATH}${sec ?? "shared"}/js/${
            name ?? "[name]"
          }-[hash].js`;
        },
        entryFileNames: (entryInfo) => {
          const sec = entryPoints[entryInfo.name].split(sep).at(-3);
          const name = entryPoints[entryInfo.name].split(sep).at(-2);
          return `${STATIC_PATH}${sec}/js/${name}-[hash].js`;
        },
      },
    },
  },
});
