# @webadeva/eslint-config

[![npm version](https://img.shields.io/npm/v/@webadeva/eslint-config)](https://www.npmjs.com/package/@webadeva/eslint-config)
[![Release](https://github.com/webadeva/eslint-config/actions/workflows/release.yml/badge.svg)](https://github.com/webadeva/eslint-config/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/npm/l/@webadeva/eslint-config)](LICENSE)

Shared ESLint flat configs for TypeScript projects, with type-aware rules, Prettier, and presets for React, Next.js, and Storybook.

## Requirements

- Node.js `>=20.19`
- ESLint `>=10.13`
- Prettier `>=3`
- TypeScript `>=5 <7`, installed in your project. TypeScript 7 is not supported, because typescript-eslint needs the compiler API it removed.

## Install

```bash
pnpm add -D @webadeva/eslint-config eslint prettier typescript@6
```

Use `typescript@6`, not a bare `typescript`. A bare install pulls the latest version, which may be TypeScript 7 (or later), and that isn't supported.

## Usage

Create an ESLint config file. It can be `eslint.config.ts`, `eslint.config.js`, or `eslint.config.mjs` (use `.mjs` if your project is not `"type": "module"`). For `eslint.config.ts`, also install [`jiti`](https://github.com/unjs/jiti), which ESLint uses to load TypeScript config files. The presets include types, so a TypeScript config is type-checked too.

```js
import config from "@webadeva/eslint-config";

export default config;
```

| Preset    | Import                              | Includes                |
| --------- | ----------------------------------- | ----------------------- |
| Base      | `@webadeva/eslint-config`           | TypeScript, Prettier    |
| React     | `@webadeva/eslint-config/react`     | Base + React + JSX a11y |
| Next.js   | `@webadeva/eslint-config/next`      | React + Next.js         |
| Storybook | `@webadeva/eslint-config/storybook` | Next.js + Storybook     |

`@webadeva/eslint-config/base` is an alias of the base preset. Only the base preset can be loaded with `require()`. The others are ESM-only because `@eslint-react` is.

## Customizing

Add your own config objects after the preset:

```js
import config from "@webadeva/eslint-config/react";

export default [
  ...config,
  {
    rules: { "no-console": "off" },
    settings: { webadeva: { maxLines: { warn: 250, error: 300 } } },
  },
];
```

`maxLines` sets the file length limits. By default a file warns above 150 lines of code and errors above 175. See [docs/rules.md](docs/rules.md) for all options.

## TypeScript and typed linting

Type-aware rules run on every file that typed linting can cover:

- **Files in a tsconfig** (the nearest `tsconfig.json`, including project references) get every rule. That includes JS files when `allowJs` is on.
- **Up to 8 root-level files outside any tsconfig**, such as config files and scripts, are typed with a [built-in fallback tsconfig](tsconfig.default.json). Root-level `.jsx`/`.tsx` files are included only if `@types/react` is installed.
- **Other files outside any tsconfig** get every rule except the type-aware ones. TS files in this situation are reported by `webadeva/typescript-file-in-project`, so they don't go unchecked unnoticed.

## Accessibility

The React preset (and so the Next.js and Storybook presets) turns on the `recommended` config of [`eslint-plugin-jsx-a11y-x`](https://github.com/es-tooling/eslint-plugin-jsx-a11y-x), a maintained fork of `eslint-plugin-jsx-a11y`. Its rules are prefixed `jsx-a11y-x/`. To use the stricter rule set, or to adjust single rules, add a config after the preset:

```js
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import config from "@webadeva/eslint-config/react";

export default [
  ...config,
  jsxA11y.configs.strict,
  { rules: { "jsx-a11y-x/no-autofocus": "off" } },
];
```

Install `eslint-plugin-jsx-a11y-x` in your project if you import it yourself like this.

Lint rules only see static JSX. To check the rendered DOM, run [`@axe-core/react`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react) in development. It is a runtime tool, not an ESLint plugin, so this package doesn't install it. Add it to your app and call it from your entry point:

```bash
pnpm add -D @axe-core/react
```

```js
import React from "react";
import ReactDOM from "react-dom";

if (process.env.NODE_ENV !== "production") {
  const { default: axe } = await import("@axe-core/react");
  await axe(React, ReactDOM, 1000);
}
```

Violations are logged to the browser console. `@axe-core/react` does not support React 18 or later, and it needs Node.js `>=22.12`.

## Defaults worth knowing

- These paths are ignored: `dist`, `*.config.*`, `**/__tests__/**`, `**/__mocks__/**`.
- Prettier runs as a lint rule and uses your Prettier config. Imports are not linted by a dedicated plugin. Add [`prettier-plugin-organize-imports`](https://github.com/simonhaenisch/prettier-plugin-organize-imports) to your Prettier config, and `eslint --fix` sorts imports and removes unused ones.
- The React preset detects your React version, including in monorepos.
- Some rules are opinionated: `no-console` warns, and arrow functions are preferred over `function`.

## What's included

[`@eslint/js`](https://eslint.org/docs/latest/rules/), [typescript-eslint](https://typescript-eslint.io/) (recommended + stylistic, type-checked), [Prettier](https://github.com/prettier/eslint-plugin-prettier), [eslint-comments](https://github.com/eslint-community/eslint-plugin-eslint-comments), [prefer-arrow-functions](https://github.com/JamieMason/eslint-plugin-prefer-arrow-functions), [@eslint-react](https://eslint-react.xyz/), [react-hooks](https://react.dev/reference/eslint-plugin-react-hooks), [react-refresh](https://github.com/ArnaudBarre/eslint-plugin-react-refresh), [jsx-a11y-x](https://github.com/es-tooling/eslint-plugin-jsx-a11y-x), [Next.js](https://nextjs.org/docs/app/api-reference/config/eslint), [Storybook](https://github.com/storybookjs/eslint-plugin-storybook), and [this package's own rules](docs/rules.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
