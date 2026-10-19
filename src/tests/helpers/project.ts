import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const require = createRequire(import.meta.url);
export const execFileAsync: typeof execFile.__promisify__ = promisify(execFile);

export const DIST: string = fileURLToPath(
  new URL("../../../dist/", import.meta.url),
);
const ESLINT_URL = pathToFileURL(require.resolve("eslint")).href;
const TYPESCRIPT_DIR = realpathSync(
  dirname(require.resolve("typescript/package.json")),
);
const REACT_TYPES_DIR = realpathSync(
  dirname(require.resolve("@types/react/package.json")),
);

// A floating promise is only reported with type information, while
// `no-console` is reported either way.
export const SOURCE =
  "export const run = () => {\n  console.log(Promise.resolve(1));\n  Promise.resolve(2);\n};\n";
export const COMPONENT =
  'export const App = () => {\n  console.log(Promise.resolve(1));\n  Promise.resolve(2);\n  return <div class="greeting">hi</div>;\n};\n';
const TYPED_RULE = "@typescript-eslint/no-floating-promises";
// Only reported when @eslint-react is active.
export const REACT_RULE = "@eslint-react/dom-no-unknown-property";
export const NOT_IN_PROJECT_RULE = "webadeva/typescript-file-in-project";

interface FileResult {
  ruleIds: string[];
  fatal: string[];
}

interface Project {
  files: Record<string, string>;
  typescript?: boolean | string;
  reactTypes?: boolean;
}

const roots: string[] = [];

after(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

export const createProject = ({
  files,
  typescript = false,
  reactTypes = false,
}: Project): string => {
  // Outside the repo, so Node cannot find the repo's own typescript install.
  const root = realpathSync(mkdtempSync(join(tmpdir(), "eslint-config-")));
  roots.push(root);

  const allFiles = { "package.json": '{ "type": "module" }\n', ...files };
  for (const [path, content] of Object.entries(allFiles)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }

  if (typescript === true) {
    mkdirSync(join(root, "node_modules"), { recursive: true });
    symlinkSync(TYPESCRIPT_DIR, join(root, "node_modules/typescript"), "dir");
  } else if (typeof typescript === "string") {
    mkdirSync(join(root, "node_modules/typescript"), { recursive: true });
    writeFileSync(
      join(root, "node_modules/typescript/package.json"),
      JSON.stringify({ name: "typescript", version: typescript }),
    );
  }

  if (reactTypes) {
    mkdirSync(join(root, "node_modules/@types"), { recursive: true });
    symlinkSync(
      REACT_TYPES_DIR,
      join(root, "node_modules/@types/react"),
      "dir",
    );
  }

  return root;
};

export const lint = async (
  root: string,
  entry: string,
  files: string[],
): Promise<Record<string, FileResult>> => {
  const script = `
    import { ESLint } from ${JSON.stringify(ESLINT_URL)};
    const { default: config } = await import(${JSON.stringify(pathToFileURL(join(DIST, entry)).href)});
    const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config });
    const results = await eslint.lintFiles(${JSON.stringify(files)});
    const output = {};
    for (const result of results) {
      output[result.filePath.slice(process.cwd().length + 1)] = {
        ruleIds: result.messages.map((message) => message.ruleId).filter(Boolean),
        fatal: result.messages.filter((message) => message.fatal).map((message) => message.message),
      };
    }
    console.log(JSON.stringify(output));
  `;
  const { stdout } = await execFileAsync(
    process.execPath,
    ["--input-type=module", "-e", script],
    { cwd: root },
  );
  return JSON.parse(stdout) as Record<string, FileResult>;
};

export const assertTyped = (
  result: FileResult | undefined,
  typed: boolean,
): void => {
  assert.ok(result, "file was not linted");
  assert.deepEqual(result.fatal, []);
  assert.ok(result.ruleIds.includes("no-console"));
  assert.equal(result.ruleIds.includes(TYPED_RULE), typed);
};
