import { resolve, parse, sep } from "node:path";
import { promises } from "node:fs";
import { relative } from "node:path";
import { createHash } from "crypto";
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
//      "get-media-section-info" plugin's buildEnd hook (see manualChunksMap),
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
//  a reference to the build's getModuleInfo ere for the output.chunkFileNames function.
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

  const { isEntry, dynamicImporters, importers } = getModuleInfo(id)!;
  if (isEntry) dependentEntryPoints.push(id);
  const idsToHandle = new Set([...dynamicImporters, ...importers]);
  // Even if we know it has a dynamic import, and thus won't be grouped with anything
  //  else, to be able to place it under the file hierarchy's sections we need
  //  all the dependent entry points to see if they share a common section.
  if (dynamicImporters.length > 0) isDynamic = true;

  for (const moduleId of idsToHandle) {
    const { isEntry, dynamicImporters, importers } = getModuleInfo(moduleId)!;
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

const HASH_SIZE = 8;
function addFileHash(id: string, data: any) {
  const hash = createHash("sha256")
    .update(data)
    .digest("hex")
    .slice(0, HASH_SIZE);
  const path = parse(id);
  return `${path.dir}/${path.name}${hash}${path.ext}`;
}
function removeFileHash(id: string) {
  const path = parse(id);
  return `${path.dir}/${path.name.slice(0, -HASH_SIZE)}${path.ext}`;
}
function getFileHash(id: string) {
  const path = parse(id);
  return path.name.slice(-HASH_SIZE);
}

const mapHashName = new Map<string, string>();
const mediaFiles = new Set<string>();
const mediaSections = new Map<string, { sec: string; subpath: string }>();

const inMediaSections = (name?: string) => {
  return Array.from(mediaSections.entries()).find(([key, _]) =>
    name?.includes(key),
  );
};
const generateMediaFilePath = (name: string) => {
  const extType_ = parse(name).ext.slice(1);
  const extType = isMediaFile(extType_) || extType_;

  const mediaMapResult = inMediaSections(name);
  if (mediaMapResult) {
    const { sec, subpath } = mediaMapResult[1];
    const origName = parse(name.replace(mediaMapResult[0], "")).name;

    return `${STATIC_PATH}${sec}/${extType}/${subpath}${origName}-[hash][extname]`;
  }
};

export default defineConfig({
  root,
  // test: {
  //   globals: true,
  //   environment: "jsdom",
  // },
  plugins: [
    tailwindcss(),
    svelte({
      compilerOptions: {
        runes: true,
      },
    }),
    {
      name: "get-media-section-info",
      apply: "build",
      // Vite requires we use "enfore: pre" to hook into resolveId
      enforce: "pre",
      // Collect all media files
      async resolveId(source, importer, options) {
        const resolution = await this.resolve(source, importer, options);
        if (resolution?.id && isMediaFile(resolution.id)) {
          if (resolution.id.includes("\0")) return;
          // If the hash for this exact file has already been computed (because resolveId works
          //  not on modules but the source code import statements this can happen) then return that.
          const precomputedId = [...mediaFiles].find(
            (id) => removeFileHash(id) === resolution.id,
          );
          if (precomputedId) return precomputedId;

          // Rename file to include content hash such that output.assetFileNames can distinguish
          //  between files of an otherwise identical name in the "mediaSections" lookup
          const id = addFileHash(resolution.id, resolution.id);
          try {
            // This function seems multi-threaded and so cases where this tries to rename an
            //  already renamed file still possible despite the above check
            await promises.rename(resolution.id, id);
          } catch {}

          mediaFiles.add(id);
          // Rolldown computes asset filenames at emitFile time, which for Vite 8's CSS
          //  plugin happens during transform — i.e. BEFORE buildEnd. So the media
          //  sections must be populated here, up front, using only the media file's
          //  own path. NOTE: the section is taken from the file's own location, which
          //  matches the old importer-based algorithm for this project (media files
          //  live under their own section).
          const sec = secFromPath(id)!;
          let subpath = relative(root, parse(id).dir)
            .split(sep)
            .slice(2)
            .join("/");
          subpath = subpath ? subpath + "/" : "";
          mediaSections.set(getFileHash(id), { sec, subpath });
          return id;
        }
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
        //  full graph is available. This must run after mediaSections is populated,
        //  since the file hashes are stripped from the module ids before storing.
        if (firstManualChunksCall) {
          for (const id_ of getModuleIds()) {
            const id = Array.from(mediaSections.keys()).reduce(
              (p, c) => p.replace(c, ""),
              id_,
            );
            manualChunksMap.set(
              id,
              manualChunks(id, { getModuleInfo, getModuleIds }),
            );
          }
          firstManualChunksCall = false;
        }
      },
      // Revert the file renames
      closeBundle() {
        for (const id of mediaFiles) {
          promises.rename(id, removeFileHash(id));
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
              //  (a user chunk, or a CSS module outside a media section)
              //  are candidates for this group.
              test: (id) =>
                !!manualChunksMap.get(id) ||
                (!inMediaSections(parse(id).base) && id.endsWith(".css")),
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

                // Only worry about files under src/
                // if (!resolve(id).includes(resolve(root))) return;
                // Generally will never happen, but the custom plugin could handle
                //  CSS files as long as we don't do anything here
                if (inMediaSections(parse(id).base)) return;

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
          const name = assetInfo.name ?? assetInfo.names[0];
          if (!name) {
            console.warn("Asset without a name. Received object: " + assetInfo);
            return "[name]-[hash][extname]";
          }

          const mediaFilePath = generateMediaFilePath(name);
          if (mediaFilePath) return mediaFilePath;

          const extType_ = parse(name).ext.slice(1);
          const extType = isMediaFile(extType_) || extType_;

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

          sec =
            secsEqual(
              chunkInfo.moduleIds.flatMap(
                (moduleId) =>
                  findDependentEntryPoints(moduleId, getModuleInfo)
                    .dependentEntryPoints,
              ),
            ) || "shared";

          // Redundant; expression above does everything
          if (!sec)
            for (const id of chunkInfo.moduleIds) {
              const mediaMapResult = inMediaSections(id);
              if (!mediaMapResult) continue;
              if (!sec) sec = mediaMapResult[1].sec;
              else if (sec !== mediaMapResult[1].sec) sec = "shared";
            }

          // Also redundant; same reason. These are only included so that the
          //  mapHashName and mediaSections maps would work better should the code change
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
          const mediaFilePath = generateMediaFilePath(entryInfo.name);
          if (mediaFilePath) return mediaFilePath;

          const sec = entryPoints[entryInfo.name].split(sep).at(-3);
          const name = entryPoints[entryInfo.name].split(sep).at(-2);
          return `${STATIC_PATH}${sec}/js/${name}-[hash].js`;
        },
      },
    },
  },
});
