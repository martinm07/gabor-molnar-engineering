<script module lang="ts">
  export interface IDocStyles {
    informStyleUpdate: (mutations: TempMutationRecord[]) => void;
  }

  export function parseStylesheetStr(stylesheetStr: string): DocCSSRule[] {
    const final: DocCSSRule[] = [];

    const ast = csstree.parse(stylesheetStr);

    let compInheritance: string | null = null;
    csstree.walk(ast, function (node, item, list) {
      if (node.type === "Rule") {
        const selector = csstree.generate(node.prelude); // e.g. 'h1'
        const declarations = csstree.generate(node.block); // e.g. '{margin:10px}'

        final.push({
          selector,
          declarations: declarations.slice(1, -1),
          compInheritance,
        });
        // console.log("Processed rule", final.at(-1));

        if (compInheritance) compInheritance = null;
      } else if (node.type === "Atrule") {
        // Some at-rules are just followed by a list of declarations, like regular rules e.g. @font-face { font-family: '...'; src: url(...) }

        // Other at-rules are just a statement by themself, and are not followed by a list of any sort e.g. @import url(...);

        // Other at-rules are a list of rules e.g. @media (width > 900px) { h1,h2,h3 { font-size: 120%; } }
        //  Given the StylesEditor only really supports defining selectors and declaration lists (and none of this nested stuff),
        //  if we encounter an at-rule that contains a list of rules, we'll select the first rule.
        //  This is to support writing selectors like @media screen and (width>900px) { em

        let preludeStr = node.prelude ? csstree.generate(node.prelude) : "";

        let blockNode: csstree.Block | null = node.block;
        if (blockNode?.children.first?.type === "Rule") {
          preludeStr +=
            "{" + csstree.generate(blockNode.children.first.prelude);
          blockNode = blockNode.children.first.block;
        }

        const declarations = blockNode
          ? csstree.generate(blockNode).slice(1, -1)
          : "";
        final.push({
          selector: `@${node.name} ${preludeStr}${!declarations ? ";" : ""}`,
          declarations,
          compInheritance,
        });
        console.log("Processed at-rule", final.at(-1));

        if (compInheritance) compInheritance = null;

        // We skip processing the children of this at-rule. This is for at-rules that are lists of rules, like @media
        return this.skip;
      } else if (
        node.type === "Comment" &&
        node.value.startsWith("! COMP-INHERITED ")
      ) {
        // Note that the css-tree parser omits comments that don' start with an exclamation mark
        //  so those that aren't of the form of e.g. '/*! Hello world */'
        // console.log("🎈 CSS comment: ", node.value);
        compInheritance = node.value.slice("! COMP-INHERITED ".length);
      }
    });

    return final;
  }

  export function generateRuleString(
    selector: string,
    rules: string,
    compInheritance?: string | null,
  ) {
    // We do this parsing and generating using csstree to automatically fix some syntax.
    // For example an @import at-rule can come in here as selector = "@import url(...);.doc", rules = ""
    //  This removes that stray ".doc" (which comes from parsing a Raw node when adding .doc to selectors).
    // Or, for example, an @media at-rule can come in as selector = "@media (screen > 900px) { h1 {", rules = "font-size: 120%;".
    //  This adds that extra closing curly brace.
    const ast = csstree.parse(`${selector} { ${rules} }`);
    let result = "";
    csstree.walk(ast, function (node) {
      if (node.type === "Rule" || node.type === "Atrule") {
        result = csstree.generate(node);
        return this.break;
      }
    });

    if (!result)
      console.warn(
        `Could not find a rule or at-rule when parsing the provided selector (${selector}) and rules (${rules}). AST generated:`,
        ast,
      );

    if (typeof compInheritance === "string") {
      result = `/*! COMP-INHERITED ${compInheritance}*/` + result;
    }

    return result;
  }
</script>

<script lang="ts">
  import { watch } from "runed";

  import { doc, type DocCSSRule } from "../store.svelte";
  import { type TempMutationRecord } from "./docsyncing";
  import { type SaveDoc } from "./docsaving.svelte";
  import { deepEqual, DynamicStylesheet } from "../helper";
  import { encode } from "he";
  import { getContext } from "svelte";

  import * as csstree from "css-tree";
  import { editorState } from "../url.svelte";

  const getMainStyles: () => DynamicStylesheet<number> =
    getContext("getMainStyles");

  interface Props {
    docSaver: SaveDoc;
  }
  let { docSaver }: Props = $props();

  /* EXAMPLE OF HTML STRUCTURE:
  <div class="doc-styles history-not-body">
    <div class="doc-style-rule">
      <pre class="doc-style-rule-selector">h1</pre>
      <pre class="doc-style-rule-declarations">display:block;font-size:2.5rem;</pre>
    </div>
    <div class="doc-style-rule">
      <pre class="doc-style-rule-selector">* p</pre>
      <pre class="doc-style-rule-declarations">color:red;</pre>
    </div>
  </div>
  */

  function checkRuleEl(ruleEl: Element, ruleI: number) {
    const preChildren = Array.from(ruleEl.children).filter(
      (childEl) => childEl.tagName === "PRE",
    );
    const selectorEl = preChildren.at(0);
    const declarationsEl = preChildren.at(1);

    if (ruleI < 0 || !doc.styles.at(ruleI)) {
      // We got an out-of-bounds ruleI. This can happen when undoing the removal of a rule, and means we should add it now.

      console.warn(
        `ruleI ${ruleI} is not a valid index of doc.styles:`,
        $state.snapshot(doc.styles),
        "\nAssuming that this means the rule has to be added.",
      );

      doc.styles[ruleI] = {
        selector: "",
        declarations: "",
        compInheritance: null,
      };
    }

    // Sync the selector to doc.styles
    if (selectorEl && selectorEl.textContent !== doc.styles[ruleI].selector) {
      doc.styles[ruleI].selector = selectorEl.textContent;
    } else if (!selectorEl) {
      console.error(
        "ruleEl didn't have a <pre> child for the selector",
        declarationsEl,
      );
    }

    // Sync the declaration list to doc.styles
    if (
      declarationsEl &&
      declarationsEl.textContent !== doc.styles[ruleI].declarations
    ) {
      doc.styles[ruleI].declarations = declarationsEl.textContent;
    } else if (!declarationsEl) {
      console.error(
        "ruleEl didn't have a <pre> child for the declarations list",
        declarationsEl,
      );
    }

    // Sync the component inheritance information to doc.styles
    if (
      ruleEl.getAttribute("data-compinherited") !==
      doc.styles[ruleI].compInheritance
    ) {
      doc.styles[ruleI].compInheritance =
        ruleEl.getAttribute("data-compinherited");
    }
  }

  export function informStyleUpdate(mutations: TempMutationRecord[]) {
    // return;
    for (const mutation of mutations) {
      // if (mutation.type === "attributes") continue;

      const target =
        mutation.type === "childList"
          ? (mutation.addedNode ?? mutation.target)
          : mutation.target;

      const parentEl = !(target instanceof Element)
        ? target.parentElement
        : target;

      //// This isn't really necessary, as it's otherwise handled by the doc.styles.splice in the final if-branch below.
      // if (mutation.type === "childList" && mutation.removedNode) {
      //   if (
      //     mutation.removedNode instanceof Element &&
      //     mutation.removedNode.classList.contains("doc-style-rule")
      //   ) {
      //     const removeI = Number.parseInt(
      //       mutation.removedNode.getAttribute("data-i") ?? "",
      //     );
      //     if (!isNaN(removeI)) {
      //       doc.styles.splice(removeI, 1);
      //       continue;
      //     }
      //   }
      // }

      const preEl = parentEl?.closest("pre");
      const ruleEl = parentEl?.closest(".doc-style-rule");
      const containerEl = parentEl?.closest(".doc-styles");

      // Find the index of the rule (for use indexing doc.styles) by counting siblings
      let ruleI = -1;
      if (ruleEl && containerEl) {
        ruleI = Array.from(ruleEl.parentElement?.children ?? []).indexOf(
          ruleEl,
        );
        // prettier-ignore
        if (ruleI === -1) throw new Error("ruleEl didn't exist as a child of its parent (parent doesn't exist?).");
      }

      // console.log(
      //   "informStyleUpdate | preEl:",
      //   preEl,
      //   "ruleEl:",
      //   ruleEl,
      //   "containerEl:",
      //   containerEl,
      // );

      if (preEl && ruleEl && containerEl) {
        // Mutation is for a specific <pre> element of a specific rule

        const preI = Array.from(ruleEl.children)
          .filter((el) => el.tagName === "PRE")
          .indexOf(preEl);
        // prettier-ignore
        if (preI === -1) throw new Error("<pre> element somehow wasn't found in the children of its parent rule element.");

        // console.log(preI);
        // console.log(
        //   preEl.textContent,
        //   "---",
        //   doc.styles[ruleI].selector,
        //   doc.styles[ruleI].rules,
        // );

        if (preI === 0 && preEl.textContent !== doc.styles[ruleI].selector) {
          // Mutation to selector
          doc.styles[ruleI].selector = preEl.textContent;
        } else if (
          preI === 1 &&
          preEl.textContent !== doc.styles[ruleI].declarations
        ) {
          // Mutation to declaration list
          doc.styles[ruleI].declarations = preEl.textContent;
        }
      } else if (ruleEl && containerEl) {
        // Mutation is for a specific rule
        checkRuleEl(ruleEl, ruleI);
      } else if (containerEl) {
        // Mutation is on the doc-styles element most broadly
        Array.from(containerEl.children).forEach((ruleEl, ruleI) =>
          checkRuleEl(ruleEl, ruleI),
        );
        // Remove any excess doc.styles elements (can happen when undoing adding a rule, for instance)
        doc.styles.splice(containerEl.childElementCount);
      }
      // console.log("----------------");
    }
  }

  // Server sync and editor sync with the actual stylesheet
  watch(
    () => $state.snapshot(doc.styles),
    (curr, prev) => {
      const modifiedRules: number[] = [];
      const removedRules: number[] = [];
      curr.forEach((currRule, i) => {
        if (!prev || prev.length - 1 >= i || !deepEqual(currRule, prev[i]))
          modifiedRules.push(i);
      });
      prev
        ?.slice(curr.length)
        .forEach((_, i) => removedRules.push(curr.length + i));

      if (modifiedRules.length === 0 && removedRules.length === 0) return;

      ///////////// DO THE SERVER SYNC

      if (editorState.mode === "document") {
        const stylesheetStr = curr
          .map((rule) =>
            generateRuleString(
              rule.selector,
              rule.declarations,
              rule.compInheritance,
            ),
          )
          .join("\n");
        docSaver.syncDocStylesDebounce(stylesheetStr);
      }

      ///////////// UPDATE THE EDITOR STYLESHEETS

      const mainStyles = getMainStyles();

      modifiedRules.forEach((i) => {
        // Don't try add to the stylesheet if the selector is an empty string
        if (!curr[i].selector) {
          doc.styles[i].invalid = false;
          return;
        }

        let selectorAST: csstree.CssNode | null = null;
        try {
          // We prefer parsing in the "stylesheet" context (i.e. the default context), as it is the most permissive,
          //  and this will process not only rule selectors, but also at-rules.
          // We add the "{}" at the end as otherwise the selector is processed as a Raw node (syntax error).
          selectorAST = csstree.parse(curr[i].selector + " {}");
          csstree.walk(selectorAST, (node) => {
            // We prepend ".doc " to selectors, so that they only match elements inside the document body, and none of the elements of the editor UI itself.
            // This is ONLY for showing what the styles are doing when within the editor, this modification isn't synced to the server.
            if (node.type === "Selector") {
              node.children.unshift(
                csstree.fromPlainObject({
                  type: "Combinator",
                  name: " ",
                }),
              );
              node.children.unshift(
                csstree.fromPlainObject({
                  type: "ClassSelector",
                  name: "doc",
                }),
              );
            } else if (node.type === "Raw") {
              console.warn("Found Raw node type when parsing selector", node);
              // node.value = ".doc " + node.value;
            }
          });
        } catch (e) {
          // console.log(e);
        }

        if (selectorAST) {
          let editorSelector = csstree.generate(selectorAST).trim();
          // Typical selector strings after the above processing will end in "{}" (which was added to the selector to initially enable parsing), and this removes that.
          // We may also find other patterns, e.g. processing "@media (width > 900px) { em {".
          // Appending the "{}" gives "@media (width > 900px) { em {{}" and that gets fixed during parsing to "@media (width > 900px){em{}}". So we end up with {}} at the end,
          //  which we'd want to remove.
          editorSelector = editorSelector.replace(/{*}*$/g, "");

          // console.log("editorSelector: ", editorSelector);

          const ruleStr = generateRuleString(
            editorSelector,
            curr[i].declarations,
          );
          // console.log("ruleStr: ", ruleStr);

          const successful = mainStyles.setRule(ruleStr, i, i);
          doc.styles[i].invalid = !successful;
        } else {
          console.error(
            `No mainSelectorNode found for selector "${curr[i].selector}". AST:`,
            selectorAST,
          );
          doc.styles[i].invalid = true;
        }
      });

      removedRules.forEach((i) => mainStyles.removeRule(i));
    },
  );
</script>

<!-- Note the reason we don't use a svelte {#each} here is because it can behave weirdly when the children are modified by external JS (like undo/redo most notably) -->
<div
  class="doc-styles history-not-body"
  {@attach (container) => {
    // console.log("→→→ Setting DocStyles elements", $state.snapshot(doc.styles));
    if (container.childElementCount > doc.styles.length) {
      // If there are more child <div>s than styles, we must remove the excess
      Array.from(container.children)
        .slice(doc.styles.length)
        .forEach((child) => child.remove());
    } else if (container.childElementCount < doc.styles.length) {
      // If there are more styles than child <div>s, we must add new <div>s to make up the difference
      doc.styles.slice(container.childElementCount).forEach((rule, i_) => {
        const newDiv = document.createElement("div");
        newDiv.classList.add("doc-style-rule");

        newDiv.setAttribute("data-i", `${container.childElementCount + i_}`);

        if (rule.compInheritance)
          newDiv.setAttribute("data-compinherited", rule.compInheritance);
        // newDiv.textContent = tag;
        const selectorPre = document.createElement("pre");
        selectorPre.textContent = rule.selector;
        selectorPre.classList.add("doc-style-rule-selector");
        newDiv.appendChild(selectorPre);

        const declarationsPre = document.createElement("pre");
        declarationsPre.textContent = rule.declarations;
        declarationsPre.classList.add("doc-style-rule-declarations");
        newDiv.appendChild(declarationsPre);

        container.appendChild(newDiv);
      });
    }

    // Now that there's exactly one <div> child for every rule in doc.styles, we can go through them and make sure the contents are correct
    Array.from(container.children).forEach((child, i) => {
      const rule = doc.styles[i];
      // if (child.textContent !== tag) child.textContent = tag;
      if (
        child.childElementCount !== 2 ||
        !child.children[0].classList.contains("doc-style-rule-selector") ||
        !child.children[1].classList.contains("doc-style-rule-declarations")
      ) {
        // Malformed internals; reset by setting innerHTML
        console.warn(
          "Malformed internals of doc-style-rule element. Resetting innerHTML.",
          child,
        );
        child.innerHTML = `<pre class="doc-style-rule-selector">${encode(rule.selector)}</pre><pre class="doc-style-rule-declarations">${encode(rule.declarations)}</pre>`;
        return;
      }

      if (child.children[0].textContent !== rule.selector) {
        child.children[0].textContent = rule.selector;
      }
      if (child.children[1].textContent !== rule.declarations) {
        child.children[1].textContent = rule.declarations;
      }

      if (child.getAttribute("data-compinherited") !== rule.compInheritance) {
        if (rule.compInheritance === null)
          child.removeAttribute("data-compinherited");
        else child.setAttribute("data-compinherited", rule.compInheritance);
      }
    });
  }}
></div>

<style>
  .doc-styles {
    background: lightgoldenrodyellow;
    display: none;
  }
</style>
