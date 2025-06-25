import { createParser, render, ast, type AstRule } from "css-selector-parser";
import {
  getAllCSSRules,
  resolveCascadeForElement,
  type CSSRuleAnalysis,
  type SpecificityVal,
} from "./CSSUtilities";
import firefoxStylesPath from "./firefoxDefaultCSS.txt";

const parseSelector = createParser();

let allRules: CSSRuleAnalysis[] = [];
const UAStyles = new CSSStyleSheet();
fetch(firefoxStylesPath)
  .then((resp) => resp.text())
  .then(async (firefoxDefaultCSS) => {
    UAStyles.replaceSync(firefoxDefaultCSS);
    console.log(UAStyles);
    allRules = await getAllCSSRules([
      { sheet: UAStyles, href: "resource://user-agent-styles.css" },
    ]);
  });

function specificityGreater(spec1: SpecificityVal, spec2: SpecificityVal) {
  return spec1.reduce(
    (p, c, i) => {
      if (p === null) {
        if (c > spec2[i]) return true;
        else if (c < spec2[i]) return false;
        // The specificities are equal
        return null;
      } else return p;
    },
    null as null | boolean,
  );
}

type PropObj = { value: string; status: string; specificity: SpecificityVal };
type PropsList = [string, PropObj][];

function alwaysApplies(selectorStr: string) {
  if (!selectorStr) return false;
  const selector = parseSelector(selectorStr);
  return selector.rules.some(
    (rule) =>
      !rule.nestedRule &&
      rule.items.length === 1 &&
      rule.items[0].type === "WildcardTag",
  );
}
// Assumes the selector does indeed apply to the element
function appliesByPseudoClass(el: Element, selectorStr: string) {
  if (!selectorStr) return false;
  const selector = parseSelector(selectorStr);
  const allNested = function (rule: AstRule): AstRule[] {
    if (rule.nestedRule) return [rule, ...allNested(rule.nestedRule)];
    else return [rule];
  };
  // For all rules, check if in any part of any sub-rule making up a combination, check that there isn't a pseudo class keyword
  // TODO: We don't want to filter out ALL pseudo classes (e.g. ":has")
  const nonPseudoClasses = selector.rules.filter(
    (rule) =>
      !allNested(rule).some((rule) =>
        rule.items.some((expr) => expr.type === "PseudoClass"),
      ),
  );
  const requiredMatcher = render(ast.selector({ rules: nonPseudoClasses }));
  if (!requiredMatcher) return true;
  return !el.matches(requiredMatcher);
}
console.log(parseSelector("*, a:hover"), alwaysApplies("*, a:hover"));

const styleInline = (prop: PropObj) =>
  specificityGreater(prop.specificity, [0, Infinity, 0, 0]);
// console.log(specificityGreater([0, 1, 0, 0], [0, Infinity, 0, 0]));

export function getCSSProps(el: Element) {
  let { matchingRules: rules } = resolveCascadeForElement(el, allRules);

  // 1) Do not consider a rule or its properties if it was inherited,
  //     or applies to every element,
  //     or applies by a pseudo class (e.g. ":hover" or ":focus")

  rules = rules.filter(
    (rule) =>
      !alwaysApplies(rule.selector) && !appliesByPseudoClass(el, rule.selector),
  );

  // Get flat list of all properties (we are no longer considering the selector after step 1)
  let propsList: PropsList = rules.flatMap((rule) => {
    return rule.properties.map((prop) => {
      // Restructure to mimic brothercake's CSSUtilities API:
      // https://www.brothercake.com/site/resources/scripts/cssutilities/functions/#getCSSRules-returns-properties
      return [
        prop.name,
        {
          value: prop.value,
          status: prop.active ? "active" : "cancelled",
          specificity: prop.specificity ?? [0, 0, 0, 0],
        },
      ] as [string, PropObj];
    });
  });

  // 2) Only consider a property if it is active

  propsList = propsList.filter((prop) => prop[1].status === "active");

  // 3) Remove 'unicode-bidi' and 'direction' because it 'should not be overridden by web designers'
  //     (except if the property is defined inline)

  propsList = propsList.filter(
    (prop) =>
      styleInline(prop[1]) ||
      (prop[0] !== "unicode-bidi" && prop[0] !== "direction"),
  );

  // 4) Remove properties if their value is a CSS-wide value
  //     (except if the property is defined inline)

  const cssWideVals = ["initial", "inherit", "unset", "revert", "revert-layer"];
  propsList = propsList.filter(
    (prop) => styleInline(prop[1]) || !cssWideVals.includes(prop[1].value),
  );

  const props: [k: string, v: string][] = propsList.map((prop) => [
    prop[0],
    prop[1].value,
  ]);
  return props;
}

const splitOn = (str: string, ...indices: number[]) =>
  [-1, ...indices].map((n, i, m) => str.slice(n + 1, m[i + 1]));

// Splits a string 'str' by a character 'char', like str.split(char),
//  but it ignore 'char's that are escaped by a backslash, or are
//  inside a quoted string, in single (') or double (") quotes.
export function splitStringAtChar(str: string, char: string) {
  const getMatchRanges = (regex: RegExp) =>
    [...str.matchAll(regex)].map((exp) => [
      exp.index,
      exp.index + exp[0].length,
    ]);
  const dQuoteRanges = getMatchRanges(/"([^"\\]|\\.)*"/g);
  const sQuoteRanges = getMatchRanges(/'([^'\\]|\\.)*'/g);
  const allRanges = [...dQuoteRanges, ...sQuoteRanges];

  const regex = new RegExp("(?<!\\\\)" + char, "g");
  // Find all matches for unescaped 'char' and filter out the ones that
  //  fall within the quoted string ranges.
  const splitIndices = [...str.matchAll(regex)]
    .filter(
      (exp) =>
        !allRanges.some(
          (range) => exp.index > range[0] && exp.index < range[1],
        ),
    )
    .map((exp) => exp.index);
  const split = splitOn(str, ...splitIndices);
  // if (!split.at(-1)) split.splice(-1, 1);
  return split;
}

export function charInStrQuoted(str: string, index: number) {
  if (index < 0 || index >= str.length) throw new Error("Index out of range");
  if (str[index - 1] === "\\") return true;
  const getMatchRanges = (regex: RegExp): [start: number, end: number][] =>
    [...str.matchAll(regex)].map((exp) => [
      exp.index,
      exp.index + exp[0].length,
    ]);
  const dQuoteRanges = getMatchRanges(/"([^"\\]|\\.)*"/g);
  const sQuoteRanges = getMatchRanges(/'([^'\\]|\\.)*'/g);
  const allRanges = [...dQuoteRanges, ...sQuoteRanges];

  return allRanges.some((range) => index > range[0] && index < range[1]);
}

function getAllAllowedPropNames() {
  const styles = getComputedStyle(document.body);
  if (Object.keys(styles).length > styles.length) {
    // On Chrome
    const styleNames = Object.keys(styles)
      .slice(styles.length)
      .map((name) => {
        // Convert camelCase into caterpillar-case and fix the -webkit- prefix
        return name
          .replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase())
          .replace("webkit", "-webkit");
      });
    return styleNames;
  } else {
    // On Firefox
    const allKeys = Object.keys(Object.getPrototypeOf(styles));
    const styleNames = allKeys.filter((key) => key.toLowerCase() === key);
    return styleNames;
  }
}
export const allowedPropNames = getAllAllowedPropNames();
console.log(
  "ALL CSS PROPERTY NAMES PERMITTED BY THIS BROWSER:",
  allowedPropNames,
);
