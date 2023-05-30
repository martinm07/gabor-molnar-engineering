import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import walkSync from "walk-sync";
import * as fs from "node:fs";
import { fileURLToPath } from "url";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const _dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : dirname(fileURLToPath(import.meta.url));

const root = resolve(_dirname, "src");
const outDir = resolve(_dirname, "dist");

const entryPoints = {
  // about: resolve(root, "intro/about/index.html"),
  register: resolve(root, "auth/register/index.html"),
  home: resolve(root, "blog/home/index.html"),
};

Object.entries(entryPoints).forEach(
  ([key, val]) => (entryPoints[key] = val.replace(/\\/g, "/"))
);

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
function createRuleMatchRegex(source) {
  // Identify the styles in a Svelte file, and match all the selectors not ":root" or "@media" or including Svelte's ":global()",
  // looking for a preceding "}"+whitespace and subsequent "{", ignoring CSS comments
  const styleTagPos = source.indexOf("<style>");
  if (styleTagPos === -1) return { selector: [], rules: [] };
  // IMP: Regex somewhat dependent on Prettier styling
  const selectorMatches = Array.from(
    source
      .slice(styleTagPos, -1)
      .replace("<style>", "<style>}")
      .matchAll(
        /}(?:(?:\/\*[\s\S]+?\*\/)|\s)*((?![^{]*:global)[^{}:@\s][^{}]+?) *{/g
      )
  );
  if (!selectorMatches) return { selector: [], rules: [] };
  const allRuleChecks = [];
  for (const selectorMatch of selectorMatches) {
    // For each selector, find its opening and closing braces ("{" and "}") and find the rules by splitting by newlines.
    const rulesStartPos = source.slice(
      styleTagPos + selectorMatch.index + selectorMatch[1].length,
      -1
    );
    // Also, make some changes to the rules to make matching kinder.
    const rules = rulesStartPos
      .slice(rulesStartPos.indexOf("{"), rulesStartPos.indexOf("}"))
      .split("\n")
      .slice(1, -1)
      .map(
        (str) =>
          escapeRegExp(str.trim())
            .replaceAll(/0\\\.(?=\d)/g, "\\.") // "0.33" -> ".33"
            .replaceAll(/"|'/g, "(?:\"|')?") // 'font-family: "Merriweather";' -> "font-family: Merriweather;"
            .replaceAll(/ +?/g, " *") // "display: none;" -> "display:none;"
      );
    // Identify the "units" of the selector, which we can match by while the bundler adds things like ".svelte-7ykgws"
    let selector = selectorMatch[1];
    const selectorUnits = [];
    // Things enclosed in square brackets ->
    // One or two colons followed by alphanumeric text ending with or without round brackets. ->
    // Alphanumeric texts with and without a starting "."
    for (const regex of [
      /\[\w+=.+?\]/,
      /:{1,2}[-\w]+(?:\([\w-.#*>+~ ,]+\))?/,
      /(?:\.|#)?-?[_a-zA-Z]+[_a-zA-Z0-9-]*/,
    ]) {
      let match;
      while ((match = regex.exec(selector)) !== null) {
        // Also, make some changes to the "units" to make matching kinder
        selectorUnits.push(
          escapeRegExp(match[0])
            .replaceAll(/:{1,2}/g, ":{1,2}")
            .replaceAll(/"|'/g, "(?:\"|')?")
        );
        // Remove the match, and let the regex find the next "first" match, until it runs out
        selector =
          selector.substring(0, match.index) +
          selector.substring(match.index + match[0].length);
      }
    }
    allRuleChecks.push({ selector: selectorUnits, rules });
  }
  return allRuleChecks;
}
function matchFileRule(source, selectorAndRules) {
  // Find all the matches of one of the "units" of the selector
  let candidates = source.match(
    RegExp(
      "[^{}]*" + selectorAndRules.selector[0] + "(?![-\\w])[^}]*(?={)",
      "g"
    )
  );
  if (!candidates) return 0;
  // Then, iteratively prune the candidates with the rest of the units
  for (let i = 1; i < selectorAndRules.selector.length; i++) {
    const unit = selectorAndRules.selector[i];
    candidates = candidates.filter((cdate) =>
      RegExp("[^{}]*" + unit + "(?![-\\w])[^}]*(?={)").test(`}${cdate}{`)
    );
    if (!candidates) return 0;
  }
  // Join all the rules of all remaining candidates together into one, big string
  // prettier-ignore
  const rules =
    candidates.map((selector) =>
      source.slice(
        source.indexOf("{",
          source.search(RegExp(`(?<={|}|^)${escapeRegExp(selector)}{`))
        ) + 1,
        source.indexOf("}",
          source.search(RegExp(`(?<={|}|^)${escapeRegExp(selector)}{`))
        )
      )
    ).join(";") + ";";
  // Find how many of our rules we can find in this big string
  const matchedRules = selectorAndRules.rules.map((ruleRegex) =>
    RegExp(ruleRegex).test(rules)
  );
  // Return percentage of matched rules
  return (
    matchedRules.reduce((acc, curr) => acc + curr) / (matchedRules.length || 1)
  );
}

const accuracyVsAmountBalance = 4.0; // Higher values means accuracy > amount
const sectionRulesLimit = 25; // This is a soft-limit. It may be arbitrarily higher than this number

const paths = walkSync("src");
// Create a mapping where each of the entryPoints is associated with a number of CSS selectors and rules.
const cssSourceMap = new Map();
for (const path of paths) {
  const section = path.split("/").slice(0, -1).join("/");
  if (
    path.endsWith(".svelte") &&
    Object.values(entryPoints)
      .map((p_) => p_.replaceAll("\\", "/"))
      .some((p_) => p_.includes(section)) &&
    (cssSourceMap.get(section) ?? []).length < sectionRulesLimit
  ) {
    const source = fs.readFileSync("src/" + path, "utf8");
    cssSourceMap.set(section, [
      ...(cssSourceMap.get(section) ?? []),
      ...createRuleMatchRegex(source),
    ]);
  }
}

function identifySectionFromCssSource(bundledCss) {
  if (!bundledCss)
    throw new Error(
      "No CSS source code provided. Perhaps called from `entryFileNames` and asset name not found in entryPoints object?"
    );
  // Match to each of the possibilites in cssSourceMap, and return the one that matched best
  let identifiedSection,
    bestPercent = -1;
  for (const [section, sectionRules] of cssSourceMap.entries()) {
    const matchPercents = sectionRules.map((rule) =>
      matchFileRule(bundledCss, rule)
    );
    const matchPercentSum = matchPercents.reduce((a, b) => a + b, 0);
    const match =
      matchPercents.length * matchPercentSum +
      (1 / accuracyVsAmountBalance) * matchPercentSum;
    if (match > bestPercent) {
      identifiedSection = section;
      bestPercent = match;
    }
  }
  // Here we know that there's only ONE bundled CSS file per entry point.
  // Thus, we can delete it to aid the next searches.
  cssSourceMap.delete(identifiedSection);
  return identifiedSection;
}

export default defineConfig({
  root,
  plugins: [
    svelte({
      onwarn: (warning, handler) => {
        const { code, frame } = warning;
        if (code === "css-unused-selector") return;

        handler(warning);
      },
    }),
  ],
  build: {
    outDir,
    emptyOutDir: true,
    target: "esnext",
    rollupOptions: {
      input: entryPoints,
      output: {
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split(".").at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = "img";
          } else if (
            /webm|mkv|flv|vob|ogv|ogg|drc|mp4|m4p|m4v/i.test(extType)
          ) {
            extType = "vid";
          }

          const [webSec, name] = getSectionAndName(
            assetInfo.name,
            assetInfo.source,
            extType !== "css"
          );

          return `assets/${webSec}/${extType}/${name}-[hash][extname]`;
        },
        chunkFileNames: "assets/shared/js/[name]-[hash].js",
        entryFileNames: (entryInfo) => {
          const [webSec, name] = getSectionAndName(
            entryInfo.name,
            undefined,
            false
          );
          return `assets/${webSec}/js/${name}-[hash].js`;
        },
      },
    },
  },
});

function findSvelteFile(name) {
  const paths = walkSync("src");
  return paths.find((path) => path.endsWith(name + ".svelte"));
}

function getSectionAndName(name, source, pathAlreadyFull = true) {
  const assetName = name.split(".").at(0);
  // First check in entryPoints captures js files.
  // Second check for similarly-named Svelte file captures shared/lib css files.
  // Third check for generated source code captures entryPoints' css files.
  const stringPath = !pathAlreadyFull
    ? entryPoints[assetName] ??
      findSvelteFile(assetName) ??
      identifySectionFromCssSource(source) + "/index.css"
    : undefined;
  try {
    const path = pathAlreadyFull
      ? name.split("/")
      : [...stringPath.split("/").slice(0, -1), "assets", name];
    const secRoot = path.findIndex((dirName) => dirName === "assets") - 2;
    // if (secRoot < 0)
    //   throw new Error(
    //     `Asset "${path.at(
    //       -1
    //     )}" somehow not inside "assets" directory. Full path: ${path.join("/")}`
    //   );

    let newName = assetName;
    // prettier-ignore
    if ((stringPath ? stringPath.split("/").at(-1).split(".")[0] : assetName) === "index") 
      newName = path[secRoot + 1];

    return [path[secRoot] ?? "shared", newName];
  } catch (err) {
    console.log(name, pathAlreadyFull, stringPath);
    throw err;
  }
}
