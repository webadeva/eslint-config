import nextPlugin from "@next/eslint-plugin-next";
import type { Linter } from "eslint";

export const nextConfigs: Linter.Config[] = [
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      "@next/next/no-img-element": "warn",
    },
    settings: {
      next: {
        rootDir: ".",
      },
    },
  },
];
