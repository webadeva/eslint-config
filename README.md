# @webadeva/eslint-config

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

| Preset    | Import                              | Includes                     |
| --------- | ----------------------------------- | ---------------------------- |
| Base      | `@webadeva/eslint-config`           | TypeScript, Prettier, import |
| React     | `@webadeva/eslint-config/react`     | Base + React                 |
| Next.js   | `@webadeva/eslint-config/next`      | React + Next.js              |
| Storybook | `@webadeva/eslint-config/storybook` | Next.js + Storybook          |

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

## Defaults worth knowing

- These paths are ignored: `dist`, `*.config.*`, `**/__tests__/**`, `**/__mocks__/**`.
- Prettier runs as a lint rule and uses your Prettier config.
- The React preset detects your React version, including in monorepos.
- Some rules are opinionated: `no-console` warns, and arrow functions are preferred over `function`.

## What's included

[`@eslint/js`](https://eslint.org/docs/latest/rules/), [typescript-eslint](https://typescript-eslint.io/) (recommended + stylistic, type-checked), [Prettier](https://github.com/prettier/eslint-plugin-prettier), [import](https://github.com/import-js/eslint-plugin-import), [eslint-comments](https://github.com/eslint-community/eslint-plugin-eslint-comments), [prefer-arrow-functions](https://github.com/JamieMason/eslint-plugin-prefer-arrow-functions), [@eslint-react](https://eslint-react.xyz/), [react-hooks](https://react.dev/reference/eslint-plugin-react-hooks), [react-refresh](https://github.com/ArnaudBarre/eslint-plugin-react-refresh), [Next.js](https://nextjs.org/docs/app/api-reference/config/eslint), [Storybook](https://github.com/storybookjs/eslint-plugin-storybook), and [this package's own rules](docs/rules.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
