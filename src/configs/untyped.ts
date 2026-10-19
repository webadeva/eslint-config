import type { Linter } from "eslint";
import { createRequire } from "node:module";
import { filesMatching } from "../utils/files-matching.ts";
import {
  ensureTypeScript,
  hasTypeInformation,
  isLintableFile,
  isTypeScriptFile,
} from "../utils/typescript.ts";

// typescript-eslint loads TypeScript on import; see ensureTypeScript().
ensureTypeScript();
const require = createRequire(import.meta.url);
const tseslint =
  require("typescript-eslint") as typeof import("typescript-eslint");

/**
 * Turns off type-aware rules for files no TypeScript project includes (e.g.
 * JS files without `allowJs`), which would otherwise fail to parse. Must come
 * after every config that enables type-aware rules.
 */
export const untypedFilesConfigs = (
  disableTypeChecked: Linter.Config[] = [],
): Linter.Config[] => {
  const files = filesMatching((filePath) => {
    return isLintableFile(filePath) && !hasTypeInformation(filePath);
  });

  return [
    ...[
      tseslint.configs.disableTypeChecked as Linter.Config,
      ...disableTypeChecked,
    ].map((config) => {
      return { ...config, files };
    }),
    {
      name: "webadeva/typescript-file-not-in-project",
      files: filesMatching((filePath) => {
        return isTypeScriptFile(filePath) && !hasTypeInformation(filePath);
      }),
      rules: {
        "webadeva/typescript-file-in-project": "error",
      },
    },
  ];
};
