import type { Linter } from "eslint";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import { detectReactVersion } from "../utils/detect-react-version.ts";
import { ensureTypeScript } from "../utils/typescript.ts";

// @eslint-react loads TypeScript on import, so it is imported only after
// checking that the project has a supported version.
ensureTypeScript();
const { default: eslintReact } = await import("@eslint-react/eslint-plugin");

export const reactConfigs: Linter.Config[] = [
  eslintReact.configs["recommended-typescript"],
  pluginReactHooks.configs.flat["recommended-latest"],
  pluginReactRefresh.configs.recommended,
  {
    settings: {
      react: {
        // Prevent eslint-plugin-react from calling the removed
        // context.getFilename() API (removed in ESLint 10) during version detection.
        version: detectReactVersion(),
      },
    },
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/set-state-in-effect": "off",
      "@eslint-react/set-state-in-effect": "off",
      "@eslint-react/dom-no-unknown-property": ["error", { ignore: ["css"] }],
    },
  },
];

export const reactDisableTypeChecked: Linter.Config[] = [
  eslintReact.configs["disable-type-checked"],
];
