import {
  checkPackage,
  createPackageFromTarballData,
  type Problem,
} from "@arethetypeswrong/core";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const packDir = mkdtempSync(join(tmpdir(), "eslint-config-pack-"));

after(() => {
  rmSync(packDir, { recursive: true, force: true });
});

const { exports } = JSON.parse(
  readFileSync(join(ROOT, "package.json"), "utf8"),
) as { exports: Record<string, unknown> };

// Entrypoints published without a `require` condition, on purpose.
const esmOnlyEntrypoints = Object.entries(exports)
  .filter(([, target]) => {
    return (
      typeof target === "object" && target !== null && !("require" in target)
    );
  })
  .map(([entrypoint]) => {
    return entrypoint;
  });

const isAllowed = (problem: Problem): boolean => {
  if (!("entrypoint" in problem)) return false;
  // Like attw's node16 profile: node10 resolution is not supported.
  if (problem.resolutionKind === "node10") return true;
  return (
    problem.kind === "NoResolution" &&
    problem.resolutionKind === "node16-cjs" &&
    esmOnlyEntrypoints.includes(problem.entrypoint)
  );
};

describe("published package", () => {
  it("has no type or resolution problems (arethetypeswrong)", async () => {
    execFileSync("pnpm", ["pack", "--pack-destination", packDir], {
      cwd: ROOT,
      stdio: "ignore",
    });
    const tarball = readdirSync(packDir).find((file) => {
      return file.endsWith(".tgz");
    });
    assert.ok(tarball, "pnpm pack produced no tarball");

    const result = await checkPackage(
      createPackageFromTarballData(readFileSync(join(packDir, tarball))),
    );
    assert.ok(result.types, "package has no types");
    assert.deepEqual(
      result.problems.filter((problem) => {
        return !isAllowed(problem);
      }),
      [],
    );
  });

  it("publishes the ESM-only presets without a require condition", () => {
    assert.deepEqual(esmOnlyEntrypoints.sort(), [
      "./next",
      "./react",
      "./storybook",
    ]);
  });
});
