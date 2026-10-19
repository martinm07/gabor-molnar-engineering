import { svelte } from "@replit/codemirror-lang-svelte";
import { type Component, type MountOptions } from "svelte";

export interface LintDiagnostic {
  from: number;
  to: number;
  severity: "error" | "warning";
  message: string;
}

export interface BundlerSendMessage {
  id: number;
  files: Record<string, string>;
  opts: {
    externalizeSvelte?: boolean;
    makeImportsURLs?: boolean;
    debug?: boolean;
  };
}

export interface BundlerReplyMessage {
  id: number;
  ok: boolean;
  code: string;
  css: string;
  diagnostics: LintDiagnostic[];
}

type Exports = Record<string, any>;
export interface CompiledModule {
  /** The default export of the module (mod.default) is the Svelte component itself */
  default: Component;
  /** All the module-level exports from the user-written Svelte file (mainly those exported under the <script module> tag, but also `default` again) */
  moduleExports: Record<string, any>;
  /** A reference to a $state object that is passed as $props to the component when `mount()` is called; meaning that assignment to this object cause reactive updates to $props values. */
  readonly props: Record<string, any>;

  /** The exported `mount` function (mod.mount) is the standard from the Svelte library (https://svelte.dev/docs/svelte/svelte#mount) */
  mount: (component: Component, options: MountOptions) => Exports;
  /** The exported `unmount` function (mod.unmount) is the standard from the Svelte library (https://svelte.dev/docs/svelte/svelte#unmount) */
  unmount: (
    component: Record<string, any>,
    options?: { outro?: boolean },
  ) => Promise<void>;
}

export type CompilePublishInfo = {
  uuid: string;
  parentDataID: string;
  svelteCode: string;
  name: string;
  props: {
    name: string;
    type: "string" | "html" | "dom" | "snippet";
    value: string;
  }[];
}[];

export class SvelteCompiler {
  private id_: number = 0;
  // Maps IDs to functions that resolve promises to return the argument when called.
  private pendingCompiles = new Map<
    number,
    (output: BundlerReplyMessage) => void
  >();

  worker: Worker;

  debug: boolean;

  constructor(opts?: { debug?: boolean }) {
    this.debug = opts?.debug ?? false;

    // Vite automatically reads and resolves this URL construction to the web worker file.
    // https://vite.dev/guide/features#web-workers
    // "The worker detection will only work if the `new URL()` constructor is used directly inside the `new Worker()` declaration."
    this.worker = new Worker(new URL("./bundler.worker.ts", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = (event: MessageEvent<BundlerReplyMessage>) => {
      // All messages posted by this web worker are just the results of compiling a Svelte source.

      const resolve = this.pendingCompiles.get(event.data.id);
      if (resolve) {
        // Resolve promise with compilation result from Web Worker
        resolve(event.data);
        this.pendingCompiles.delete(event.data.id);
      } else {
        console.error(
          "Bundler worker sent message for compilation of ID that wasn't pending in pendingCompiles",
          this.pendingCompiles,
          event,
          event.data,
        );
      }
    };
  }

  async compile(svelteCode: string) {
    const msg: BundlerSendMessage = {
      id: this.id_++,
      files: {
        "virtual:component.svelte": svelteCode,
      },
      opts: {
        externalizeSvelte: true,
        // This option makes the bundler turn module specifiers referring to the local server (e.g. import { abc } from "./test/script.js" or import Hello from "/src/hello.js")
        //  and prepends a URL specifier to the origin where this is executed (i.e. location.origin), (turning them into e.g. import { abc } from "https://structural-design.eu/test/script.js" or import Hello from "http://localhost:5173/src/hello.js").
        // This is important when showing previews in the document editor, which are loaded using SvelteCompiler.loadJSModule
        //  which uses blob: URLs. So when our code tries to run inside that blob URL, it doesn't have the server URL as the base, but "blob:..." as the base.
        //  The code can't load modules stored on our server because it doesn't know the URL on our server because the code executed on a different. made-up URL by the browser.
        //  That's why we need this option set to true here (but not in compileForPublish, because that resulting JS is embedded in a <script> tag in the page in the /documents/read view)
        makeImportsURLs: true,
        debug: this.debug,
      },
    };

    return new Promise<BundlerReplyMessage>((resolve) => {
      this.pendingCompiles.set(msg.id, resolve);

      this.worker.postMessage(msg);
    });
  }

  async compileForPublish(componentsInfo: CompilePublishInfo) {
    const componentNames = SvelteCompiler.makeNamesUnique(
      componentsInfo.map((info) => SvelteCompiler.toPascalCaseName(info.name)),
    );

    // prettier-ignore
    const entryFileJS = componentNames.map((name) => `
      import ${name} from "virtual:${name}.svelte";
    `).join("\n") + `

      import { mount } from "svelte";
      import { htmlToDOM, htmlToSnippet } from "helper";

    ` + componentsInfo.map((info, i) => `
      (() => {
        const parent = document.querySelector('[data-id="${info.parentDataID}"]');
        if (!parent) {
          console.error("Could not find parent with data-id ${info.parentDataID} for mounting component ${componentNames[i]}");
          return;
        }
        const children = Array.from(parent?.childNodes ?? []);
        const anchor = children.find((node) => node.nodeType === Node.COMMENT_NODE && node.textContent === "${info.uuid}");
        if (!anchor) {
          console.error("Could not find anchor ${info.uuid} for mounting component ${componentNames[i]}");
          return;
        }

        const props = {};
        ${JSON.stringify(info.props)}.map((prop) => {
          switch (prop.type) {
            case "string":
            case "html":
              props[prop.name] = prop.value;
              return;
            case "dom":
              props[prop.name] = htmlToDOM(prop.value);
              return;
            case "snippet":
              props[prop.name] = htmlToSnippet(prop.value);
              return;
          }
        });

        mount(${componentNames[i]}, { target: parent, anchor, props });
      })();
    `).join("\n\n");

    const msg: BundlerSendMessage = {
      id: this.id_++,
      files: {
        "virtual:entry.js": entryFileJS,
      },
      opts: {
        externalizeSvelte: true,
        makeImportsURLs: false,
        debug: this.debug,
      },
    };
    componentsInfo.forEach(
      (info, i) =>
        (msg.files[`virtual:${componentNames[i]}.svelte`] = info.svelteCode),
    );

    return new Promise<BundlerReplyMessage>((resolve) => {
      this.pendingCompiles.set(msg.id, resolve);

      this.worker.postMessage(msg);
    });
  }

  static toPascalCaseName(str: string) {
    // Filter out all illegal characters (non-alphanumeric, and and digts at the start of the string)
    str = str.replaceAll(/^\d+|[^a-zA-Z0-9\-]/g, "");
    // Get rid of dashes and replace the letter after them with an uppercased version of it
    str = str.replaceAll(/-(.)/g, (_, letter: string) => letter.toUpperCase());
    // Replace the first letter with an uppercased version of itself
    str = str[0].toUpperCase() + str.slice(1);
    return str;
  }

  static makeNamesUnique(names: string[]) {
    const final: string[] = [];
    for (const name of names) {
      let currentName = name;
      let i = 1;
      while (final.includes(currentName)) {
        if (i === 1) currentName += "2";
        else
          currentName =
            currentName.slice(0, -(i - 1).toString().length) + `${i}`;

        i++;
      }
      final.push(currentName);
    }
    return final;
  }

  static async loadJSModule(code: string) {
    const url = URL.createObjectURL(
      new Blob([code], { type: "text/javascript" }),
    );
    try {
      const mod = (await import(/* @vite-ignore */ url)) as CompiledModule;

      return mod;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
