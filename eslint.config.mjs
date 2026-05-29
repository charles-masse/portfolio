import js from "@eslint/js";
import globals from "globals";
import {defineConfig} from "eslint/config";
import compat from "eslint-plugin-compat";

export default defineConfig([
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off"
    }
  },

  compat.configs["flat/recommended"],

  { 
    files: ["**/*.{js,mjs,cjs}"],
    ignores: [".vite/**", ".node_modules/**"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {globals: {...globals.browser, ...globals.node}},
    rules: {
      "semi": ["error", "always"],
      "no-tabs" : ["error"],
      "no-warning-comments": ["warn", { "terms": ["todo", "fix", "delete"], "location": "start" }]
    },
  },
]);