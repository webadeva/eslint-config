# Contributing

Thanks for helping out! Bug reports, rule suggestions, and pull requests are all welcome.

## Setup

You need Node.js `>=20.19` and pnpm. The repo pins its pnpm version, so `corepack enable` picks the right one.

```bash
git clone https://github.com/webadeva/eslint-config.git
cd eslint-config
pnpm install
pnpm check
```

`pnpm check` type-checks, lints, builds, and runs the tests. It's the same check that runs before publishing.

## Making a change

1. Edit the TypeScript source in `src/`. Never edit `dist/`; it's generated.
2. Add or update tests in `src/tests/`.
3. If behavior changes, update [README.md](README.md) or [docs/rules.md](docs/rules.md).
4. Run `pnpm check` and make sure it passes.

[docs/development.md](docs/development.md) covers the source layout, the scripts, the test suites, and how to add a rule.

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/), e.g. `fix: handle empty tsconfig`. A git hook checks every commit message, and CI checks every commit in a pull request.

## Releases

Every merge to `main` publishes a new version to npm. The commit message on `main` picks the version bump:

| Message starts with | Bump  | Example                     |
| ------------------- | ----- | --------------------------- |
| `major:`            | major | `major: drop TypeScript 5`  |
| `minor:`            | minor | `minor: add a Vue preset`   |
| anything else       | patch | `fix: count JSX text lines` |

When squash-merging, set the merge commit's title accordingly. Release commits (`chore(release): ...`) don't trigger another release.

## Pull requests

`main` only accepts pull requests. A git hook blocks direct pushes to it and runs `pnpm check` before every push.

- Keep each pull request to one change, and explain why it's needed.
- Rule changes affect everyone who uses the config, so say what each one catches or allows, ideally with a code example.
- Keep files short. The repo lints itself, so the [file-length limits](docs/rules.md) apply here too.

## Reporting issues

Open an issue with your ESLint, TypeScript, and package versions, the preset you use, and a minimal file that shows the problem.
