
import js from "@eslint/js";
import globals from "globals";
import compat from "eslint-plugin-compat";
import {jsdoc} from 'eslint-plugin-jsdoc';
import {defineConfig} from "eslint/config";

export default defineConfig([

  {
    linterOptions: {
      reportUnusedDisableDirectives: "off"
    }
  },
  compat.configs["flat/recommended"],
  jsdoc({
    config: 'flat/recommended',
    files: ["src/**/*.{js,mjs,cjs}"],
  }),
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
