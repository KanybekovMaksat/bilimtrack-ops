import { readdirSync } from "node:fs";
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

// Feature-Sliced Design:
// 1. a layer may import only from layers below it;
// 2. a slice is imported only through its public API (its index.ts);
// 3. slices of one layer do not import each other.
const LAYERS = ["app", "pages", "widgets", "features", "entities", "shared"];
const SLICED = ["pages", "widgets", "features", "entities"];

const publicApiPatterns = SLICED.map((layer) => ({
  group: [`@/${layer}/*/**`],
  message: "FSD: import a slice through its public API (index.ts).",
}));

const upperLayerPatterns = (layer) =>
  LAYERS.slice(0, LAYERS.indexOf(layer)).map((upper) => ({
    group: [`@/${upper}`, `@/${upper}/**`],
    message: `FSD: layer "${layer}" must not import from upper layer "${upper}".`,
  }));

const restrict = (patterns) => ({ "no-restricted-imports": ["error", { patterns }] });

const slicesOf = (layer) =>
  readdirSync(new URL(`./src/${layer}`, import.meta.url), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

// app and shared are not sliced: only the layer order and public API apply.
const layerRules = ["app", "shared"].map((layer) => ({
  files: [`src/${layer}/**/*.{ts,tsx}`],
  rules: restrict([...upperLayerPatterns(layer), ...publicApiPatterns]),
}));

// One block per slice: no-restricted-imports does not merge across blocks, so each carries every pattern.
const sliceRules = SLICED.flatMap((layer) =>
  slicesOf(layer).map((slice) => ({
    files: [`src/${layer}/${slice}/**/*.{ts,tsx}`],
    rules: restrict([
      ...upperLayerPatterns(layer),
      ...publicApiPatterns,
      {
        group: [`@/${layer}/*`, `!@/${layer}/${slice}`],
        message: `FSD: slices of "${layer}" must not import each other. Move the shared part down a layer or compose it a layer up.`,
      },
    ]),
  })),
);

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  ...layerRules,
  ...sliceRules,
);
