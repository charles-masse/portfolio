import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { 
    files: ["**/*.{js,mjs,cjs}"],
    ignores: [".vite/**"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {globals: {...globals.browser, ...globals.node}},
    rules: {
      "semi": ["error", "always"],
      "no-tabs" : ["error"],
    },
  },
]);
