import { existsSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import type * as TypeScript from "typescript";

const cwd = process.cwd();

const projectRequire = createRequire(join(cwd, "package.json"));
const packageRequire = createRequire(import.meta.url);

const loadTypeScript = (): typeof TypeScript => {
  let version: string;
  try {
    ({ version } = projectRequire("typescript/package.json") as {
      version: string;
    });
  } catch {
    throw new Error(
      "@webadeva/eslint-config: TypeScript is not installed in this project. " +
        "This config is for TypeScript projects; install it with " +
        "`pnpm add -D typescript@6` (or the npm/yarn equivalent).",
    );
  }

  if (Number.parseInt(version, 10) >= 7) {
    throw new Error(
      `@webadeva/eslint-config: TypeScript ${version} is not supported. ` +
        "typescript-eslint needs the TypeScript compiler API, which TypeScript 7 " +
        "no longer ships. Install typescript@6.",
    );
  }

  return projectRequire("typescript") as typeof TypeScript;
};

let typescript: typeof TypeScript | undefined;

/**
 * Loads the project's TypeScript, throwing a readable error when it is
 * missing or unsupported. Call it before importing anything that loads
 * TypeScript itself (typescript-eslint, @eslint-react), which would otherwise
 * fail with a bare "Cannot find module 'typescript'".
 */
export const ensureTypeScript = (): typeof TypeScript => {
  typescript ??= loadTypeScript();
  return typescript;
};

const LINTABLE_FILE = /\.(?:[cm]?[jt]s|[jt]sx)$/;

export const isLintableFile = (filePath: string): boolean => {
  return LINTABLE_FILE.test(filePath);
};

const nearestConfigCache = new Map<string, string | undefined>();

// Mirrors how the TypeScript project service picks a project for a file:
// the closest tsconfig.json walking up from its directory.
const findNearestConfig = (dir: string): string | undefined => {
  if (nearestConfigCache.has(dir)) return nearestConfigCache.get(dir);

  const candidate = join(dir, "tsconfig.json");
  const parent = dirname(dir);
  const found = existsSync(candidate)
    ? candidate
    : parent === dir
      ? undefined
      : findNearestConfig(parent);

  nearestConfigCache.set(dir, found);
  return found;
};

const projectFilesCache = new Map<string, Set<string>>();

const getProjectFiles = (
  configPath: string,
  seen = new Set<string>(),
): Set<string> => {
  const cached = projectFilesCache.get(configPath);
  if (cached) return cached;

  const files = new Set<string>();
  if (seen.has(configPath)) return files;
  seen.add(configPath);

  const ts = ensureTypeScript();
  const parsed = ts.getParsedCommandLineOfConfigFile(configPath, undefined, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: () => {
      return undefined;
    },
  });

  for (const fileName of parsed?.fileNames ?? []) {
    files.add(resolve(fileName));
  }
  // Solution-style configs list their files through project references.
  for (const reference of parsed?.projectReferences ?? []) {
    const referencePath = ts.resolveProjectReferencePath(reference);
    for (const fileName of getProjectFiles(referencePath, seen)) {
      files.add(fileName);
    }
  }

  projectFilesCache.set(configPath, files);
  return files;
};

// When the file lists in projectFilesCache were last read.
let projectFilesReadAt = Date.now();

const changedSinceFilesRead = (filePath: string): boolean => {
  try {
    return statSync(filePath).ctimeMs >= projectFilesReadAt;
  } catch {
    return false;
  }
};

const isInProject = (filePath: string): boolean => {
  const configPath = findNearestConfig(dirname(filePath));
  if (configPath === undefined) return false;

  const path = resolve(filePath);
  if (getProjectFiles(configPath).has(path)) return true;

  // A long-lived ESLint process (an editor's ESLint server) would otherwise
  // keep the file list from startup and miss files created since. Re-read
  // only for files changed after the last read, so files that are genuinely
  // outside the project don't re-parse every tsconfig on each lint.
  if (!changedSinceFilesRead(path)) return false;
  projectFilesCache.clear();
  projectFilesReadAt = Date.now();
  return getProjectFiles(configPath).has(path);
};

/** The tsconfig typescript-eslint uses for files outside every project. */
export const defaultProjectConfig: string = packageRequire.resolve(
  "@webadeva/eslint-config/tsconfig.default.json",
);

const canResolve = (id: string): boolean => {
  try {
    projectRequire.resolve(id);
    return true;
  } catch {
    return false;
  }
};

// typescript-eslint refuses to open more than this many files through the
// default project unless a deliberately scary option is set.
const DEFAULT_PROJECT_FILE_LIMIT = 8;
const GLOB_SPECIAL_CHARS = /[*?[\]{}()!+@\\]/;
// Without React's types, JSX can only be typed as `any`, which turns every
// component into no-unsafe-* reports.
const DEFAULT_PROJECT_FILE = canResolve("@types/react/package.json")
  ? /\.[cm]?[jt]sx?$/
  : /\.[cm]?[jt]s$/;

/**
 * Root-level files that no tsconfig includes, linted with type information
 * through typescript-eslint's default project (`allowDefaultProject`).
 */
export const defaultProjectFiles: string[] = readdirSync(cwd, {
  withFileTypes: true,
})
  .filter((entry) => {
    return (
      entry.isFile() &&
      DEFAULT_PROJECT_FILE.test(entry.name) &&
      !GLOB_SPECIAL_CHARS.test(entry.name) &&
      !isInProject(join(cwd, entry.name))
    );
  })
  .map((entry) => {
    return entry.name;
  })
  .sort()
  .slice(0, DEFAULT_PROJECT_FILE_LIMIT);

const defaultProjectPaths = new Set(
  defaultProjectFiles.map((name) => {
    return join(cwd, name);
  }),
);

const TYPESCRIPT_FILE = /\.[cm]?tsx?$/;

export const isTypeScriptFile = (filePath: string): boolean => {
  return TYPESCRIPT_FILE.test(filePath);
};

/** Whether typescript-eslint can provide type information for this file. */
export const hasTypeInformation = (filePath: string): boolean => {
  return defaultProjectPaths.has(resolve(filePath)) || isInProject(filePath);
};
