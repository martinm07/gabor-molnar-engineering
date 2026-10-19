import {
  rollup,
  type OutputAsset,
  type OutputChunk,
  type Plugin,
} from "@rollup/browser";
import {
  compile,
  compileModule,
  type Warning,
  type CompileError,
} from "svelte/compiler";
import {
  type BundlerReplyMessage,
  type BundlerSendMessage,
  type LintDiagnostic,
} from "./compiler";
import helperModule from "./helpermodule.svelte?raw";

const isSvelteCompileError = (x: unknown): x is CompileError =>
  x instanceof Error && "code" in x && "start" in x && "end" in x;

/**
 * Convert a Svelte position (1-based line, 0-based column) to a character
 * offset into the source.
 */
export function offsetAt(source: string, pos: Warning["start"] | null): number {
  if (!pos) return 0;
  const lines = source.split("\n");
  let offset = 0;
  for (let i = 0; i < pos.line - 1 && i < lines.length; i++) {
    offset += lines[i].length + 1;
  }
  return offset + pos.column;
}

type Diagnostic = (Warning | CompileError) & { severity: "warning" | "error" };

/**
 * Map Svelte compiler diagnostics (positions) to CodeMirror-ready offsets.
 * Positions are resolved against the source the user sees; for TypeScript
 * source the types were stripped before compilation, so positions after a
 * stripped annotation may drift (accepted in this PoC).
 */
export function toLintDiagnostics(
  source: string,
  diagnostics: Diagnostic[],
): LintDiagnostic[] {
  return diagnostics.map((d) => ({
    from: offsetAt(source, d.start),
    to: offsetAt(source, d.end),
    severity: d.severity,
    message: d.code ? `${d.message} (${d.code})` : d.message,
  }));
}

// import svelteURL from "./svelte-runtime/svelte?url";
// import svelteAnimateURL from "./svelte-runtime/svelte-animate?url";
// import svelteAttachmentsURL from "./svelte-runtime/svelte-attachments?url";
// import svelteCompilerURL from "./svelte-runtime/svelte-compiler?url";
// import svelteEasingURL from "./svelte-runtime/svelte-easing?url";
// import svelteEventsURL from "./svelte-runtime/svelte-events?url";
// import svelteInternalURL from "./svelte-runtime/svelte-internal?url";
// import svelteInternalClientURL from "./svelte-runtime/svelte-internal-client?url";
// import svelteInternalDiscloseVersionURL from "./svelte-runtime/svelte-internal-disclose-version?url";
// import svelteInternalFlagsAsyncURL from "./svelte-runtime/svelte-internal-flags-async?url";
// import svelteInternalFlagsLegacyURL from "./svelte-runtime/svelte-internal-flags-legacy?url";
// import svelteInternalFlagsTracingURL from "./svelte-runtime/svelte-internal-flags-tracing?url";
// import svelteInternalServerURL from "./svelte-runtime/svelte-internal-server?url";
// import svelteLegacyURL from "./svelte-runtime/svelte-legacy?url";
// import svelteMotionURL from "./svelte-runtime/svelte-motion?url";
// import sveltePackageJsonURL from "./svelte-runtime/svelte-package-json?url";
// import svelteReactivityURL from "./svelte-runtime/svelte-reactivity?url";
// import svelteReactivityWindowURL from "./svelte-runtime/svelte-reactivity-window?url";
// import svelteServerURL from "./svelte-runtime/svelte-server?url";
// import svelteStoreURL from "./svelte-runtime/svelte-store?url";
// import svelteTransitionURL from "./svelte-runtime/svelte-transition?url";

/** The asset URL (as served by the app) for each runtime asset id. */
// export const RUNTIME_ASSET_FOR_ID: Record<string, string> = {
//   svelte: svelteURL,
//   "svelte/animate": svelteAnimateURL,
//   "svelte/attachments": svelteAttachmentsURL,
//   "svelte/compiler": svelteCompilerURL,
//   "svelte/easing": svelteEasingURL,
//   "svelte/events": svelteEventsURL,
//   "svelte/internal": svelteInternalURL,
//   "svelte/internal/client": svelteInternalClientURL,
//   "svelte/internal/disclose-version": svelteInternalDiscloseVersionURL,
//   "svelte/internal/flags/async": svelteInternalFlagsAsyncURL,
//   "svelte/internal/flags/legacy": svelteInternalFlagsLegacyURL,
//   "svelte/internal/flags/tracing": svelteInternalFlagsTracingURL,
//   "svelte/internal/server": svelteInternalServerURL,
//   "svelte/legacy": svelteLegacyURL,
//   "svelte/motion": svelteMotionURL,
//   "svelte/package.json": sveltePackageJsonURL,
//   "svelte/reactivity": svelteReactivityURL,
//   "svelte/reactivity/window": svelteReactivityWindowURL,
//   "svelte/server": svelteServerURL,
//   "svelte/store": svelteStoreURL,
//   "svelte/transition": svelteTransitionURL,
// };

// The runtime asset sources are fetched once per worker and cached.
const fetchCache = new Map<string, Promise<string>>();
function fetchURL(url: string): Promise<string> {
  let cached = fetchCache.get(url);
  if (!cached) {
    cached = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`Failed to fetch runtime asset ${url}`);
      return r.text();
    });
    fetchCache.set(url, cached);
  }
  return cached;
}

const simplifyPath = (path: string) => {
  const pathList = path.split("/");
  let ans = [];
  for (let dir of pathList)
    if (!dir || dir === ".") continue;
    else if (dir === "..") ans.pop();
    else ans.push(dir);
  return "/" + ans.join("/");
};

function createVirtualFilesPlugin(
  files: Record<string, string>,
  opts?: BundlerSendMessage["opts"],
): Plugin {
  return {
    name: "provide-virtual-files",
    resolveId(importee, importer, { attributes, importerAttributes }) {
      let source: string;

      // Importee is a relative filepath, and we need to resolve it using `importer`
      if (importee.startsWith(".")) {
        if (importer === undefined)
          this.warn(
            `resolveID got importee with relative filepath ("${importer}"), but importer is undefined.`,
          );

        // The importer may have a URL structure, out of which we must extract the path
        let importerPath = importer ?? "";
        let importerOrigin = "";
        try {
          const url = new URL(importer ?? "");
          importerPath = url.pathname;
          importerOrigin = url.origin;
        } catch {}

        // If the final path component is a file (identified by it containing a dot), then splice it out.
        // TODO: It may be better to just splice out the final component of the path unconditionally.
        // const importerDir = importerPath.split("/").at(-1)?.includes(".")
        //   ? importerPath.split("/").slice(0, -1).join("/")
        //   : importerPath;

        // If the path ends in a trailing slash, the final component is interpreted as a directory, otherwise it's
        //  interpreted as a file. (see https://developer.mozilla.org/en-US/docs/Web/API/URL#usage_notes)
        const importerDir = importerPath.endsWith("/")
          ? importerPath.slice(0, -1)
          : importerPath.split("/").slice(0, -1).join("/");

        const newPath = simplifyPath(importerDir + "/" + importee);
        source = importerOrigin + newPath;
        if (opts?.debug)
          console.log(
            `resolveID (RELATIVE FP): "${importer}" + "${importee}" --> "${source}"`,
          );
      } else if (importee.startsWith("/")) {
        // Importee is an absolute filepath; if the importer was a URL we want to add that URL origin back.
        try {
          const url = new URL(importer ?? "");
          source = url.origin + importee;
          if (opts?.debug)
            console.log(
              `resolveID (ABSOLUTE FP): "${importer}" + "${importee}" --> "${source}"`,
            );
        } catch {
          source = importee;
        }
      } else {
        // Importee is a URL, or a module identifier (like "virtual:entry.js" or "svelte/motion"); keep it as it is.
        source = importee;
      }

      if (Object.hasOwn(files, source)) {
        return { id: source };
      } else if (
        source === "svelte" ||
        source.startsWith("svelte/") ||
        source.startsWith("/svelte-lib/")
      ) {
        // Resolve svelte module entrypoints to files on the server
        let fp: string;
        if (source === "svelte") fp = "/svelte-lib/svelte.js";
        else if (source.startsWith("svelte/"))
          fp = `/svelte-lib/${source.slice("svelte/".length)}.js`;
        else fp = source;

        // Transform the module ID to include the server URL if the option is set
        let id: string;
        if (opts?.makeImportsURLs) {
          const urlID = new URL(fp, location.origin);
          id = urlID.toString();
        } else id = fp;

        return { id, external: opts?.externalizeSvelte };
      } else if (
        source.startsWith("http://") ||
        source.startsWith("https://")
      ) {
        // If an import, or the current module's importer, has the attribute `bundling: "include"`, then it should be included in the bundle,
        //  as well as any modules it imports in turn (i.e. the attribute propagates to from the module's importer to all of the module's imports).
        // For info on what import attributes are (as well as their syntax):
        //  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import/with
        if (
          attributes["bundling"] === "include" ||
          importerAttributes?.["bundling"] === "include"
        ) {
          if (opts?.debug) console.log("INCLUDE URL IN BUNDLING");
          return {
            id: source,
            external: false,
            attributes: { bundling: "include" },
          };
        } else return { id: source, external: true };
      } else {
        return null;
      }
    },

    load(id, options) {
      // https://rollupjs.org/plugin-development/#load

      if (Object.hasOwn(files, id)) {
        return files[id];
      } else if (id.startsWith("/svelte-lib/")) {
        if (opts?.debug) console.log("FETCHING LOCAL: " + id);
        return fetchURL(id);
      } else if (id.startsWith("http://") || id.startsWith("https://")) {
        return fetchURL(id);
      }

      console.log("⚠⚠⚠ Could not load: " + id);
    },
  };
}

function createSvelteCompilerPlugin(
  diagnostics: Diagnostic[],
  opts?: BundlerSendMessage["opts"],
): Plugin {
  const moduleCSSMap: Map<string, string> = new Map();

  return {
    name: "compile-svelte",

    transform(code, id) {
      // https://rollupjs.org/plugin-development/#transform
      // transform is called in the "build" phase; when `const bundle = await rollup({...})` is called.
      // This hook is called for each individual module (a module is a "piece of code being imported from another piece code"; typically one file importing another file).

      // console.log("transforming module of ID: ", id);
      if (id.endsWith(".svelte")) {
        if (opts?.debug) console.log("Compiling " + id);

        const result = compile(code, {
          filename: id,
          generate: "client",
          css: "external",
          //// If this is set to true (the default), then the emitted code will contain an import of "svelte/internal/disclose-version",
          // discloseVersion: false,
        });

        if (result.css) moduleCSSMap.set(id, result.css.code);

        if (opts?.debug) console.log(result.js.code);

        // result.warnings.forEach((warning) => {
        //   diagnostics.push(warning);
        // })
        diagnostics.splice(
          result.warnings.length,
          0,
          // Add the "severity" field to each Warning object
          ...result.warnings.map((warning) => ({
            ...warning,
            severity: "warning" as "warning",
          })),
        );

        return {
          code: result.js.code,
          map: result.js.map,
        };
      } else if (
        id.endsWith(".svelte.js") ||
        id.endsWith(".svelte.ts") ||
        id === "helper" ||
        id === "virtual:entry.js"
      ) {
        if (opts?.debug) console.log("Compiling module " + id);
        if (opts?.debug) console.log(code);

        const result = compileModule(code, {
          filename: id,
          generate: "client",
        });

        if (opts?.debug) console.log(result.js.code);

        return {
          code: result.js.code,
          map: result.js.map,
        };
      }
    },

    generateBundle(options, bundle) {
      // https://rollupjs.org/plugin-development/#generatebundle
      // generateBundle is called in the "output generation" phase; when bundle.generate() is called.
      // This hook is called at the end, and bundle is a record containing all the files that rollup wants to write
      //  as part of the final build. The keys are the filenames and the values are info on the respective chunks/assets.

      let finalCSS = "";

      for (const item of Object.values(bundle)) {
        if (item.type !== "chunk") continue;

        for (const id of item.moduleIds) {
          const css = moduleCSSMap.get(id);
          if (css) finalCSS += css + "\n";
        }
      }

      if (finalCSS) {
        this.emitFile({
          type: "asset",
          fileName: "svelteBundle.css",
          source: finalCSS,
        });
      }
    },
  };
}

async function bundle(
  id: number,
  files: Record<string, string>,
  opts?: BundlerSendMessage["opts"],
): Promise<BundlerReplyMessage> {
  const diagnostics: Diagnostic[] = [];

  try {
    const bundle = await rollup({
      // This "virtual:" prefix isn't special Rollup syntax or anything; this is just defining an arbitrary moduleID (something for our custom plugin- defined below- to recognise)
      input: "virtual:entry.js",
      plugins: [
        createSvelteCompilerPlugin(diagnostics),
        createVirtualFilesPlugin(files, opts),
      ],
    });

    const { output } = await bundle.generate({
      // There are two sources for Rollup to automatically create multiple chunks (separate) files for JS code;
      //  1. Having multiple entry points (i.e. passing an array or record to `input` in `await rollup({})` above)
      //  2. Having code dynamically import other code using the `import()` function.
      // We want to have only one standalone chunk generated (or else we'd have to worry about import maps between chunks and storing them somewhere/somehow).
      // So we only have one entry point (naturally) and by specifying `inlineDynamicImports: true` we make sure Rollup doesn't generate
      //  separate chunks for dynamically imported code.
      inlineDynamicImports: true,
    });
    await bundle.close();

    const js = (
      output.find((o) => o.type === "chunk" && o.isEntry) as
        OutputChunk | undefined
    )?.code;
    if (js === undefined) throw new Error("No entry chunk found for build.");

    const allCSSFiles = output.filter(
      (o) => o.type === "asset" && o.fileName.endsWith(".css"),
    ) as OutputAsset[];

    const css = allCSSFiles.map((o) => o.source).join("\n\n");

    return {
      id,
      ok: true,
      code: js,
      css,
      diagnostics: toLintDiagnostics(
        files["virtual:component.svelte"],
        diagnostics,
      ),
    };
  } catch (err) {
    if (isSvelteCompileError(err)) {
      diagnostics.push({ ...err, severity: "error" });
    } else {
      diagnostics.push({
        code: "",
        message: err instanceof Error ? err.message : String(err),
        severity: "error",
      });
    }

    console.log("⚠ ERROR/S WHEN COMPILING: ", diagnostics);

    return {
      id,
      ok: false,
      code: "",
      css: "",
      diagnostics: toLintDiagnostics(
        files["virtual:component.svelte"],
        diagnostics,
      ),
    };
  }
}

self.onmessage = (event: MessageEvent<BundlerSendMessage>) => {
  const { id, files, opts } = event.data;

  if (
    !Object.hasOwn(files, "virtual:component.svelte") &&
    !Object.hasOwn(files, "virtual:entry.js")
  )
    throw new Error(
      "Didn't supply 'virtual:component.svelte' file while also not supplying a replacement 'virtual:entry.js' file.",
    );

  files["virtual:entry.js"] ??= `
    export * as moduleExports from "virtual:component.svelte";
    export { default } from "virtual:component.svelte";
    import { mount as mount_, unmount } from "svelte";

    export const props = $state({});

    export function mount(component, options) {
      options.props = props;
      return mount_(component, options);
    }

    export { unmount };
  `;
  files["helper"] ??= helperModule;

  bundle(id, files, opts).then((returnMsg) => {
    if (opts.debug) console.log("Bundling complete:", returnMsg);
    self.postMessage(returnMsg);
  });
};
