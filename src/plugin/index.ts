import type { ESLint } from "eslint";
import { maxLines, maxLinesWarning } from "./rules/max-lines.ts";
import { typescriptFileInProject } from "./rules/typescript-file-in-project.ts";

export const plugin: ESLint.Plugin = {
  meta: { name: "@webadeva/eslint-config" },
  rules: {
    "max-lines": maxLines,
    "max-lines-warning": maxLinesWarning,
    "typescript-file-in-project": typescriptFileInProject,
  },
};
