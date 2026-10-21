import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import {
  createProject,
  DIST,
  ESLINT_URL,
  execFileAsync,
} from "./helpers/project.ts";

// Uses JSX, hooks and an <img> so the React and a11y rules have something to
// visit, not only the TypeScript ones.
const APP =
  'import { useState } from "react";\n\nexport const App = () => {\n  const [count, setCount] = useState(0);\n  return (\n    <button type="button" onClick={() => setCount(count + 1)}>\n      <img src="logo.png" />\n    </button>\n  );\n};\n';

describe("ESLint compatibility", () => {
  // Turns on every rule of every plugin the presets register, one at a time,
  // so a plugin that uses an API removed from the installed ESLint fails here
  // even if the presets leave its broken rules off.
  it("runs every bundled plugin rule without crashing", async () => {
    const root = createProject({
      typescript: true,
      reactTypes: true,
      files: { "App.tsx": APP },
    });
    const script = `
      import { ESLint } from ${JSON.stringify(ESLINT_URL)};
      const { default: config } = await import(${JSON.stringify(pathToFileURL(join(DIST, "storybook.mjs")).href)});
      const rules = [];
      for (const { plugins = {} } of config) {
        for (const [prefix, plugin] of Object.entries(plugins)) {
          for (const [name, rule] of Object.entries(plugin.rules ?? {})) {
            if (!rule.meta?.deprecated) rules.push(prefix + "/" + name);
          }
        }
      }
      const failures = [];
      for (const rule of new Set(rules)) {
        const eslint = new ESLint({
          overrideConfigFile: true,
          overrideConfig: [...config, { rules: { [rule]: "warn" } }],
        });
        try {
          const [result] = await eslint.lintFiles(["App.tsx"]);
          for (const message of result.messages) {
            if (message.fatal) failures.push(rule + ": " + message.message);
          }
        } catch (error) {
          failures.push(rule + ": " + String(error.message).split("\\n")[0]);
        }
      }
      console.log(JSON.stringify({ count: new Set(rules).size, failures }));
    `;
    const { stdout } = await execFileAsync(
      process.execPath,
      ["--input-type=module", "-e", script],
      { cwd: root, maxBuffer: 16 * 1024 * 1024 },
    );
    const { count, failures } = JSON.parse(stdout) as {
      count: number;
      failures: string[];
    };
    assert.ok(count > 0);
    assert.deepEqual(failures, []);
  });
});
