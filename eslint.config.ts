import type { Linter } from "eslint";
import baseConfig from "./src/index.ts";

const config: Linter.Config[] = [
  ...baseConfig,
  {
    ignores: ["src/tests/fixtures/**"],
  },
  {
    // Command-line scripts report through the console.
    files: [".github/scripts/**"],
    rules: { "no-console": "off" },
  },
  {
    files: ["src/tests/**/*.ts"],
    rules: {
      // node:test's describe/it return promises that the runner tracks itself.
      "@typescript-eslint/no-floating-promises": [
        "error",
        {
          allowForKnownSafeCalls: [
            { from: "package", package: "node:test", name: ["describe", "it"] },
          ],
        },
      ],
    },
  },
];

export default config;
