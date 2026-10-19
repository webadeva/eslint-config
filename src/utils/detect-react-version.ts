import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);

const FALLBACK_VERSION = "19.0";

interface PackageJson {
  version?: string;
  workspaces?: string[] | { packages?: string[] };
}

const readReactVersion = (fromDir: string): string => {
  const pkgPath = require.resolve("react/package.json", { paths: [fromDir] });
  return String((require(pkgPath) as PackageJson).version);
};

export const detectReactVersion = (): string => {
  const cwd = process.cwd();

  // 1. Try from cwd. Node's module resolution walks up the directory tree,
  //    so this covers: normal repos, monorepo package dirs, and hoisted react.
  try {
    return readReactVersion(cwd);
  } catch {
    // noop
  }

  // 2. Monorepo fallback: ESLint is running from the repo root but react is
  //    not hoisted (e.g. pnpm with shamefully-hoist=false). Walk workspace
  //    package directories defined in the root package.json.
  try {
    const rootPkg = JSON.parse(
      readFileSync(join(cwd, "package.json"), "utf8"),
    ) as PackageJson;
    const ws = rootPkg.workspaces ?? [];
    const patterns = Array.isArray(ws) ? ws : (ws.packages ?? []);

    for (const pattern of patterns) {
      // Strip trailing glob (e.g. "packages/*" → "packages")
      const baseDir = join(cwd, String(pattern).replace(/\/\*.*$/, ""));
      try {
        const entries = readdirSync(baseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          try {
            return readReactVersion(join(baseDir, entry.name));
          } catch {
            // noop
          }
        }
      } catch {
        // noop
      }
    }
  } catch {
    // noop
  }

  return FALLBACK_VERSION;
};
