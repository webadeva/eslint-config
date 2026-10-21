import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import pluginJs from "@eslint/js";
import type { Linter } from "eslint";
import preferArrowFunctions from "eslint-plugin-prefer-arrow-functions";
import prettier from "eslint-plugin-prettier";
import globals from "globals";
import { createRequire } from "node:module";
import { plugin } from "../plugin/index.ts";
import {
  defaultProjectConfig,
  defaultProjectFiles,
  ensureTypeScript,
} from "../utils/typescript.ts";

// The @typescript-eslint packages load TypeScript on import, so they are
// required only after checking that the project has a supported version.
ensureTypeScript();
const require = createRequire(import.meta.url);
const tseslint =
  require("typescript-eslint") as typeof import("typescript-eslint");
const tsPlugin =
  require("@typescript-eslint/eslint-plugin") as typeof import("@typescript-eslint/eslint-plugin");

export const baseConfigs: Linter.Config[] = [
  {
    ignores: [
      "**/__tests__/**/**/*",
      "**/__mocks__/**/**/*",
      "dist",
      "*.config.*",
      "node_modules/**/*.*",
      "dist/**/*.*",
      "!.storybook",
      "!**/.storybook/**",
    ],
  },
  {
    name: "webadeva/plugin",
    plugins: { webadeva: plugin },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        projectService: {
          allowDefaultProject: defaultProjectFiles,
          defaultProject: defaultProjectConfig,
        },
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: {
      prettier,
      "prefer-arrow-functions": preferArrowFunctions,
      "@typescript-eslint": tseslint.plugin,
      "eslint-comments": eslintComments,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tsPlugin.configs["recommended-type-checked"]?.rules,
      ...tsPlugin.configs["stylistic-type-checked"]?.rules,
      ...(prettier.configs?.["recommended"] as Linter.Config | undefined)
        ?.rules,
      camelcase: "error",
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-console": "warn",
      "consistent-return": "off",
      "object-shorthand": "off",
      "no-process-exit": "off",
      "no-underscore-dangle": "off",
      "class-methods-use-this": "off",
      "prefer-destructuring": ["warn", { object: true, array: false }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_$",
          varsIgnorePattern: "^_$",
        },
      ],
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/prefer-for-of": "off",

      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",

      "@typescript-eslint/consistent-indexed-object-style": "off",

      "prefer-arrow-callback": "error",
      "eslint-comments/require-description": ["error"],

      "prefer-arrow-functions/prefer-arrow-functions": [
        "warn",
        {
          allowNamedFunctions: false,
          classPropertiesAllowed: false,
          disallowPrototype: false,
          returnStyle: "explicit",
          singleReturnOnly: false,
        },
      ],
    },
  },
  {
    name: "webadeva/max-lines",
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    rules: {
      // Configured through `settings.webadeva.maxLines` (default: warn over
      // 150, error over 175, blank and comment lines not counted).
      "webadeva/max-lines-warning": "warn",
      "webadeva/max-lines": "error",
    },
  },
];
