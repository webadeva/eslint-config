import type { Linter } from "eslint";
import storybook from "eslint-plugin-storybook";

export const storybookConfigs: Linter.Config[] = [
  // Plugin rules are typed with typescript-eslint's RuleModule, which is not
  // assignable to ESLint's RuleDefinition.
  ...(storybook.configs["flat/recommended"] as Linter.Config[]),
  {
    rules: {
      "node/no-unsupported-features/es-syntax": "off",
      "node/no-missing-import": "off",
      "react/jsx-props-no-spreading": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
];
