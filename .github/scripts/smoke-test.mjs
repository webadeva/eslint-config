#!/usr/bin/env node
// Loads every built preset and lints a file with it, on whatever Node version
// runs this script. CI uses it to check the published `engines` range, since
// the dev tooling itself needs a newer Node than the package supports.
import { ESLint } from "eslint";
import { createRequire } from "node:module";

const PKG = "@webadeva/eslint-config";
const FIXTURE = "src/tests/fixtures/sample.ts";

for (const subpath of ["", "/base", "/react", "/next", "/storybook"]) {
  const { default: config } = await import(`${PKG}${subpath}`);
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: config,
  });
  const [result] = await eslint.lintFiles([FIXTURE]);
  const ruleIds = result.messages.map((message) => {
    return message.ruleId;
  });
  if (result.fatalErrorCount > 0 || !ruleIds.includes("no-console")) {
    throw new Error(
      `${PKG}${subpath}: unexpected result ${JSON.stringify(result.messages)}`,
    );
  }
  console.log(`ok  import ${PKG}${subpath}`);
}

const require = createRequire(import.meta.url);
if (!Array.isArray(require(PKG)))
  throw new Error(`${PKG}: require() did not return a config array`);
console.log(`ok  require ${PKG}`);
console.log(`smoke test passed on Node ${process.version}`);
