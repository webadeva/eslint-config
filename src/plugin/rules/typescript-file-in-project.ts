import type { Rule } from "eslint";

export const typescriptFileInProject: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Report TypeScript files that no tsconfig includes, since type-aware rules skip them.",
    },
    messages: {
      notInProject:
        "This file is not included in any tsconfig, so it is not type-checked and type-aware lint rules are skipped. Add it to a tsconfig's `include`.",
    },
    schema: [],
  },
  create: (context) => {
    return {
      Program: () => {
        context.report({
          loc: { line: 1, column: 0 },
          messageId: "notInProject",
        });
      },
    };
  },
};
