import path from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default defineConfig([
  globalIgnores(["**/node_modules/", "**/dist/", "**/build/"]),
  {
    extends: compat.extends(
      "eslint:recommended",
      "plugin:prettier/recommended"
    ),
    plugins: {
      prettier,
      "simple-import-sort": simpleImportSort
    },
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "prettier/prettier": "error",
      "simple-import-sort/exports": "error",
      "simple-import-sort/imports": "error"
    }
  }
]);
