import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

// Feature-Sliced Design: a layer may import only from layers below it,
// and only through a slice's public API (its index.ts).
const LAYERS = ["app", "pages", "widgets", "features", "entities", "shared"];
const SLICED = ["pages", "widgets", "features", "entities"];

const publicApiPatterns = SLICED.map((layer) => ({
  group: [`@/${layer}/*/**`],
  message: "FSD: import a slice through its public API (index.ts).",
}));

const layerRules = LAYERS.map((layer, i) => ({
  files: [`src/${layer}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          ...LAYERS.slice(0, i).map((upper) => ({
            group: [`@/${upper}`, `@/${upper}/**`],
            message: `FSD: layer "${layer}" must not import from upper layer "${upper}".`,
          })),
          ...publicApiPatterns,
        ],
      },
    ],
  },
}));

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
);
