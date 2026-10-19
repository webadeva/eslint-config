import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertTyped,
  COMPONENT,
  createProject,
  lint,
  REACT_RULE,
} from "./helpers/project.ts";

describe("React project setups", { concurrency: true }, () => {
  it("rejects React projects without TypeScript before loading @eslint-react", async () => {
    const root = createProject({ files: { "src/App.jsx": COMPONENT } });
    await assert.rejects(
      lint(root, "react.mjs", ["src/App.jsx"]),
      /TypeScript is not installed in this project/,
    );
  });

  it("React project with TypeScript but no tsconfig", async () => {
    const root = createProject({
      typescript: true,
      files: { "App.jsx": COMPONENT, "src/Page.jsx": COMPONENT },
    });
    const results = await lint(root, "react.mjs", ["App.jsx", "src/Page.jsx"]);
    assert.ok(results["src/Page.jsx"]?.ruleIds.includes(REACT_RULE));
    // Without React's types, JSX would be typed as `any`, so even root-level
    // JSX stays out of the default project.
    assertTyped(results["App.jsx"], false);
    assertTyped(results["src/Page.jsx"], false);
  });

  it("React project with TypeScript and React types but no tsconfig", async () => {
    const root = createProject({
      typescript: true,
      reactTypes: true,
      files: { "App.jsx": COMPONENT, "src/Page.jsx": COMPONENT },
    });
    const results = await lint(root, "react.mjs", ["App.jsx", "src/Page.jsx"]);
    assertTyped(results["App.jsx"], true);
    assert.deepEqual(
      results["App.jsx"]?.ruleIds.filter((ruleId) => {
        return ruleId.includes("unsafe");
      }),
      [],
    );
    assertTyped(results["src/Page.jsx"], false);
  });
});
