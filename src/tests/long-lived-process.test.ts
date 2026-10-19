import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertTyped,
  createProject,
  lint,
  NOT_IN_PROJECT_RULE,
  SOURCE,
} from "./helpers/project.ts";

// An editor's ESLint server keeps one ESLint instance for the whole session,
// so files created after startup must still be matched to their tsconfig.
describe("long-lived ESLint process", () => {
  it("types files created after the first lint in the same process", async () => {
    const root = createProject({
      typescript: true,
      files: {
        "tsconfig.json": JSON.stringify({ include: ["src"] }),
        "src/main.ts": SOURCE,
      },
    });
    const results = await lint(root, "index.mjs", ["src/main.ts"], {
      "src/new-file.ts": SOURCE,
      "scripts/new-tool.ts": SOURCE,
    });
    assertTyped(results["src/new-file.ts"], true);
    assert.equal(
      results["src/new-file.ts"]?.ruleIds.includes(NOT_IN_PROJECT_RULE),
      false,
    );
    assertTyped(results["scripts/new-tool.ts"], false);
    assert.ok(
      results["scripts/new-tool.ts"]?.ruleIds.includes(NOT_IN_PROJECT_RULE),
    );
  });
});
