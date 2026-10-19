import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  assertTyped,
  createProject,
  DIST,
  execFileAsync,
  lint,
  NOT_IN_PROJECT_RULE,
  SOURCE,
} from "./helpers/project.ts";

describe("TypeScript project setups", { concurrency: true }, () => {
  it("rejects projects without TypeScript", async () => {
    const root = createProject({ files: { "index.js": SOURCE } });
    await assert.rejects(
      lint(root, "index.mjs", ["index.js"]),
      /TypeScript is not installed in this project/,
    );
    await assert.rejects(
      execFileAsync(
        process.execPath,
        ["-e", `require(${JSON.stringify(join(DIST, "index.cjs"))})`],
        { cwd: root },
      ),
      /TypeScript is not installed in this project/,
    );
  });

  it("rejects TypeScript 7", async () => {
    const root = createProject({ typescript: "7.0.0", files: {} });
    await assert.rejects(
      lint(root, "index.mjs", []),
      /TypeScript 7\.0\.0 is not supported/,
    );
  });

  it("TypeScript installed without a tsconfig", async () => {
    const root = createProject({
      typescript: true,
      files: { "index.js": SOURCE, "src/util.js": SOURCE },
    });
    const results = await lint(root, "index.mjs", ["index.js", "src/util.js"]);
    // Root-level files are typed through the default project.
    assertTyped(results["index.js"], true);
    assertTyped(results["src/util.js"], false);
  });

  it("tsconfig with allowJs", async () => {
    const root = createProject({
      typescript: true,
      files: {
        "tsconfig.json": JSON.stringify({
          compilerOptions: { allowJs: true, noEmit: true },
          include: ["src"],
        }),
        "src/util.js": SOURCE,
        "src/main.ts": SOURCE,
        "scripts/build.js": SOURCE,
      },
    });
    const results = await lint(root, "index.mjs", [
      "src/util.js",
      "src/main.ts",
      "scripts/build.js",
    ]);
    assertTyped(results["src/util.js"], true);
    assertTyped(results["src/main.ts"], true);
    assertTyped(results["scripts/build.js"], false);
  });

  it("tsconfig without allowJs", async () => {
    const root = createProject({
      typescript: true,
      files: {
        "tsconfig.json": JSON.stringify({ include: ["src"] }),
        "src/util.js": SOURCE,
        "src/main.ts": SOURCE,
      },
    });
    const results = await lint(root, "index.mjs", [
      "src/util.js",
      "src/main.ts",
    ]);
    assertTyped(results["src/util.js"], false);
    assertTyped(results["src/main.ts"], true);
  });

  it("solution-style tsconfig with project references", async () => {
    const root = createProject({
      typescript: true,
      files: {
        "tsconfig.json": JSON.stringify({
          files: [],
          references: [{ path: "./tsconfig.app.json" }],
        }),
        "tsconfig.app.json": JSON.stringify({
          compilerOptions: { composite: true, allowJs: true },
          include: ["src"],
        }),
        "src/util.js": SOURCE,
        "src/main.ts": SOURCE,
      },
    });
    const results = await lint(root, "index.mjs", [
      "src/util.js",
      "src/main.ts",
    ]);
    assertTyped(results["src/util.js"], true);
    assertTyped(results["src/main.ts"], true);
  });

  it("reports TypeScript files outside every tsconfig", async () => {
    const root = createProject({
      typescript: true,
      files: {
        "tsconfig.json": JSON.stringify({ include: ["src"] }),
        "src/main.ts": SOURCE,
        "scripts/tool.ts": SOURCE,
        "setup.ts": SOURCE,
      },
    });
    const results = await lint(root, "index.mjs", [
      "src/main.ts",
      "scripts/tool.ts",
      "setup.ts",
    ]);
    assertTyped(results["src/main.ts"], true);
    assert.equal(
      results["src/main.ts"]?.ruleIds.includes(NOT_IN_PROJECT_RULE),
      false,
    );
    assertTyped(results["scripts/tool.ts"], false);
    assert.ok(
      results["scripts/tool.ts"]?.ruleIds.includes(NOT_IN_PROJECT_RULE),
    );
    // Root-level files are typed through the default project instead.
    assertTyped(results["setup.ts"], true);
    assert.equal(
      results["setup.ts"]?.ruleIds.includes(NOT_IN_PROJECT_RULE),
      false,
    );
  });
});
