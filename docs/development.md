# Development

The source is TypeScript in `src/`. [tsdown](https://tsdown.dev/) builds it to `dist/`: ESM plus types for every preset, and also CJS for the base preset. Code shared between presets goes into shared chunk files.

```
src/
  index.ts, react.ts, next.ts, storybook.ts   entry points (one per preset)
  configs/                                    config layers the entries combine
  plugin/                                     the `webadeva` ESLint plugin and its rules
  utils/                                      TypeScript and React detection
  tests/                                      node:test suites
```

## Scripts

| Script           | Does                                                   |
| ---------------- | ------------------------------------------------------ |
| `pnpm build`     | Build `dist/` and validate it with publint             |
| `pnpm dev`       | Rebuild on change                                      |
| `pnpm typecheck` | Type-check the source                                  |
| `pnpm lint`      | Lint the repo with its own config (`eslint.config.ts`) |
| `pnpm test`      | Run the tests against `dist/`, so build first          |
| `pnpm check`     | Run all of the above in order; also runs on publish    |

## Tests

- `presets.test.ts`: every entry imports and lints, CJS works for the base preset, and the custom rules are turned on.
- `typescript-projects.test.ts` and `react-projects.test.ts`: lint temporary projects with different TypeScript setups, outside the repo, each in its own process.
- `max-lines.test.ts`: tests the file-length rules with ESLint's `RuleTester`.
- `package.test.ts`: packs the tarball and checks it with [arethetypeswrong](https://arethetypeswrong.github.io/). Only the ESM-only presets may lack a `require` resolution.

## Adding a rule

1. Add it to `src/plugin/rules/` and register it in `src/plugin/index.ts`.
2. Turn it on in a config layer under `src/configs/`.
3. Add a `RuleTester` suite in `src/tests/` and document it in [rules.md](rules.md).

## CI and releases

- `.github/workflows/ci.yml` runs on pull requests. It checks commit messages, runs `pnpm check` and the format check on Node 24, then builds and smoke-tests the presets on Node 20.19 and 22 (`.github/scripts/smoke-test.mjs`). The dev tools need Node 22+, but the package supports `>=20.19`.
- `.github/workflows/release.yml` runs on pushes to `main`. It tests, picks the version bump (`.github/scripts/next-version.mjs`), publishes to npm with trusted publishing (provenance included), then commits, tags, and creates a GitHub release.
