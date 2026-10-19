<script lang="ts">
  import {
    keymap,
    highlightSpecialChars,
    drawSelection,
    dropCursor,
    lineNumbers,
    highlightActiveLineGutter,
  } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import {
    defaultHighlightStyle,
    syntaxHighlighting,
    indentOnInput,
    bracketMatching,
    foldGutter,
    foldKeymap,
  } from "@codemirror/language";
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
  import {
    autocompletion,
    completionKeymap,
    closeBrackets,
    closeBracketsKeymap,
    completionStatus,
    acceptCompletion,
  } from "@codemirror/autocomplete";
  import {
    lintGutter,
    lintKeymap,
    setDiagnosticsEffect,
    type Diagnostic,
  } from "@codemirror/lint";
  import { indentLess, indentMore } from "@codemirror/commands";
  import { EditorView } from "@codemirror/view";
  import { espresso } from "thememirror";

  import { svelte } from "@replit/codemirror-lang-svelte";
  import { useDebounce, watch } from "runed";
  import { getContext } from "svelte";
  import { isNotBody, isHistoryNotBody } from "../App.svelte";
  import { type LintDiagnostic } from "./compiler";
  import { type TempMutationRecord } from "../documents/docsyncing";
  import { doc } from "../store.svelte";
  import { encode } from "he";
  import { type CompileError } from "svelte/compiler";
  import { comps } from "../components/libraryeditor.svelte";

  const getDocEl: () => HTMLElement = getContext("getDocEl");
  const syncFakeMutation: (mutation: TempMutationRecord) => void =
    getContext("syncFakeMutation");

  interface Props {
    value: string | undefined;
  }

  let { value = $bindable("") }: Props = $props();

  let view: EditorView | undefined;
  let diagnostics: LintDiagnostic[] = $state([]);

  /**
   * Convert a character offset to a 1-based line / 0-based column.
   */
  export function positionAt(
    source: string,
    offset: number,
  ): CompileError["start"] {
    const clamped = Math.max(0, Math.min(offset, source.length));
    const lines = source.slice(0, clamped).split("\n");
    return {
      line: lines.length,
      column: lines[lines.length - 1].length,
      character: clamped,
    };
  }

  const isBody = (node: Node) => !isNotBody(node) && !isHistoryNotBody(node);

  const clearDoc = (docEl: HTMLElement) => {
    while (docEl?.lastChild && isBody(docEl.lastChild))
      docEl.removeChild(docEl.lastChild);
  };

  let sourceEl: HTMLElement | undefined;

  const onChange = useDebounce(async (newValue: string) => {
    if (comps.current.type !== "svelte") return;

    const docEl = getDocEl();

    clearDoc(docEl);

    const main = document.createElement("main");
    main.style.padding = "0.5rem";
    main.style.fontSize = "1.2rem";
    main.innerHTML =
      "<div class='svelte-compiling'><em>Compiling...</em></div>";

    sourceEl = document.createElement("div");
    sourceEl.setAttribute("data-sveltecomp-source", "");
    sourceEl.style.setProperty(
      "--markertext",
      `"Mounted ${comps.current.name ?? ""}"`,
    );
    const codeEl = document.createElement("pre");
    codeEl.setAttribute("data-sveltecomp-code", "");
    sourceEl.appendChild(codeEl);
    main.appendChild(sourceEl);

    codeEl.textContent = newValue;

    docEl.appendChild(main);
  }, 300);

  watch(
    () => doc.svelteCompMounts.map((info) => info.status),
    () => {
      if (!sourceEl || comps.current.type !== "svelte") return;
      const mountInfo = doc.svelteCompMounts.find(
        (info) => info.mountSourceEl === sourceEl,
      );
      if (!mountInfo) {
        console.error(
          "Could not find mount info for sourceEl in svelteCompMounts.",
          sourceEl,
          doc.svelteCompMounts,
        );
        return;
      }

      const docEl = getDocEl();
      docEl.querySelector(".svelte-compiling")?.remove();

      diagnostics = mountInfo.diagnostics;

      if (mountInfo.status === "error") {
        const errors = mountInfo.diagnostics.filter(
          (diagnostic) => diagnostic.severity === "error",
        );

        for (const error of errors) {
          const div = document.createElement("div");
          docEl.appendChild(div);

          const pos = positionAt(value, error.from);

          const msg = `${error.message} (line ${pos?.line}, column ${pos?.column})`;
          // Note that setting outerHTML does nothing if the element does not have a parent element (which is why we append this div to docEl first)
          div.outerHTML = `<div style="
            background: #fee;
            border: 1px solid #e88;
            border-radius: 4px;
            color: #a00;
            font-family: monospace;
            font-size: 0.85rem;
            padding: 0.75rem;
            margin: 0.75rem;
            white-space: pre-wrap;
          ">${encode(msg)}</div>`;
        }
      }
    },
  );

  watch(
    () => value,
    (newValue) => {
      if (newValue === undefined || view === undefined) return;

      if (view.state.doc.toString() !== newValue) {
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: newValue,
          },
        });
      }
    },
  );

  watch(
    () => $state.snapshot(diagnostics),
    () => {
      view?.dispatch({
        effects: setDiagnosticsEffect.of(
          diagnostics.map((x): Diagnostic => ({
            from: x.from,
            to: x.to,
            severity: x.severity,
            message: x.message,
          })),
        ),
      });
    },
  );
</script>

{#if comps.current.type === "svelte"}
  <div
    class="svelte-editor mt-13 bg-white w-full"
    {@attach (el) => {
      view = new EditorView({
        parent: el,

        extensions: [
          highlightSpecialChars(),
          history(),

          lineNumbers(),
          highlightActiveLineGutter(),
          foldGutter(),
          lintGutter(),

          drawSelection(),
          dropCursor(),
          EditorState.allowMultipleSelections.of(true),
          indentOnInput(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          bracketMatching(),
          closeBrackets(),

          autocompletion(),
          // rectangularSelection(),
          // crosshairCursor(),
          // highlightActiveLine(),
          highlightSelectionMatches(),
          keymap.of([
            {
              key: "Tab",
              run: (view) => {
                if (completionStatus(view.state) === "active")
                  return acceptCompletion(view);
                indentMore(view);
                return true;
              },
            },
            {
              key: "Shift-Tab",
              run: (view) => {
                indentLess(view);
                return true;
              },
            },
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...completionKeymap,
            ...lintKeymap,
          ]),
          svelte(),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && comps.current.type === "svelte") {
              onChange(update.state.doc.toString());
              value = update.state.doc.toString();
              // Trigger a fake mutation so that docSaver.save() is triggered.
              syncFakeMutation({
                type: "attributes",
                target: getDocEl(),
                addedNode: null,
                removedNode: null,
                previousSibling: null,
                oldValue: null,
                attributeName: null,
              });
            }
          }),
          espresso,
        ],
      });
    }}
  ></div>
{/if}

<style>
  :global(.svelte-editor .cm-editor) {
    height: 100%;
    outline: 1px dotted #212121;
    font-size: 1.1rem;
  }
</style>
