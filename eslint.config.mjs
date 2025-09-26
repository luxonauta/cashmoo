import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import prettier from "eslint-plugin-prettier";
import globals from "globals";
import { fileURLToPath } from "node:url";
import path from "node:path";

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
      prettier
    },
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    rules: {
      "prettier/prettier": "error",
      "no-empty": ["error", { allowEmptyCatch: true }]
    }
  }
]);
