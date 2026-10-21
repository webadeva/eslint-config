import assert from "node:assert/strict";
import { mkdirSync, realpathSync, symlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import {
  createProject,
  DIST,
  ESLINT_URL,
  execFileAsync,
} from "./helpers/project.ts";

const require = createRequire(import.meta.url);
const ORGANIZE_IMPORTS_DIR = realpathSync(
  dirname(require.resolve("prettier-plugin-organize-imports/package.json")),
);

const SOURCE =
  'import { readFileSync, writeFileSync } from "node:fs";\nimport { join } from "node:path";\n\nexport const read = (path: string): string => {\n  return readFileSync(path, "utf8");\n};\n';

const fix = async (root: string, file: string): Promise<string> => {
  const script = `
    import { ESLint } from ${JSON.stringify(ESLINT_URL)};
    const { default: config } = await import(${JSON.stringify(pathToFileURL(join(DIST, "index.mjs")).href)});
    const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config, fix: true });
    const [result] = await eslint.lintFiles([${JSON.stringify(file)}]);
    console.log(JSON.stringify(result.output ?? null));
  `;
  const { stdout } = await execFileAsync(
    process.execPath,
    ["--input-type=module", "-e", script],
    { cwd: root },
  );
  return JSON.parse(stdout) as string;
};

describe("unused imports", () => {
  // Unused imports are removed by prettier-plugin-organize-imports, which the
  // `prettier/prettier` rule runs when the project's Prettier config loads it.
  it("are removed by --fix with prettier-plugin-organize-imports", async () => {
    const root = createProject({
      typescript: true,
      files: {
        "tsconfig.json": '{ "include": ["src"] }\n',
        ".prettierrc": '{ "plugins": ["prettier-plugin-organize-imports"] }\n',
        "src/read.ts": SOURCE,
      },
    });
    mkdirSync(join(root, "node_modules"), { recursive: true });
    symlinkSync(
      ORGANIZE_IMPORTS_DIR,
      join(root, "node_modules/prettier-plugin-organize-imports"),
      "dir",
    );

    const output = await fix(root, "src/read.ts");
    assert.match(output, /^import \{ readFileSync \} from "node:fs";\n/);
    assert.doesNotMatch(output, /writeFileSync|node:path/);
  });
});
