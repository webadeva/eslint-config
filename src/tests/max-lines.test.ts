import { Linter, RuleTester } from "eslint";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { maxLines, maxLinesWarning } from "../plugin/rules/max-lines.ts";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester();

const linesOfCode = (count: number): string => {
  return Array.from({ length: count }, (_, index) => {
    return `export const value${index} = ${index};`;
  }).join("\n");
};

const tooLong = (count: number, max: number) => {
  return {
    messageId: "tooLong",
    data: { count: String(count), max: String(max) },
    line: 1,
    column: 1,
  };
};

const withSettings = (maxLines: unknown) => {
  return { settings: { webadeva: { maxLines } } };
};

ruleTester.run("max-lines-warning", maxLinesWarning, {
  valid: [
    linesOfCode(150),
    // Past the error limit, only max-lines reports.
    linesOfCode(176),
    // Blank and comment-only lines are skipped by default.
    `${linesOfCode(150)}\n\n\n// comment\n/*\n * block\n */`,
    { code: linesOfCode(301), ...withSettings({ warn: 250, error: 300 }) },
    { code: linesOfCode(151), ...withSettings({ warn: false }) },
    { code: linesOfCode(160), ...withSettings(false) },
    { code: linesOfCode(160), ...withSettings({ enabled: false }) },
    // A trailing newline is not a blank line.
    {
      code: `${linesOfCode(150)}\n`,
      ...withSettings({ skipBlankLines: false }),
    },
  ],
  invalid: [
    { code: linesOfCode(151), errors: [tooLong(151, 150)] },
    { code: linesOfCode(175), errors: [tooLong(175, 150)] },
    // Every line of a multi-line token counts.
    {
      code: `${linesOfCode(149)}\nexport const text = \`a\nb\`;`,
      errors: [tooLong(151, 150)],
    },
    {
      code: linesOfCode(300),
      ...withSettings({ warn: 250, error: 300 }),
      errors: [tooLong(300, 250)],
    },
    // A partial setting keeps the other default.
    {
      code: linesOfCode(200),
      ...withSettings({ error: 300 }),
      errors: [tooLong(200, 150)],
    },
    // Without an error limit, the warning has no upper bound.
    {
      code: linesOfCode(400),
      ...withSettings({ error: false }),
      errors: [tooLong(400, 150)],
    },
    {
      code: `${linesOfCode(149)}\n// one\n/* two */`,
      ...withSettings({ skipComments: false }),
      errors: [tooLong(151, 150)],
    },
    {
      code: `${linesOfCode(149)}\n\n\n`,
      ...withSettings({ skipBlankLines: false }),
      errors: [tooLong(151, 150)],
    },
  ],
});

ruleTester.run("max-lines", maxLines, {
  valid: [
    linesOfCode(175),
    { code: linesOfCode(300), ...withSettings({ warn: 250, error: 300 }) },
    { code: linesOfCode(400), ...withSettings({ error: false }) },
    { code: linesOfCode(400), ...withSettings(false) },
    // Disabling keeps the other settings, even ones that would be invalid.
    {
      code: linesOfCode(400),
      ...withSettings({ enabled: false, warn: 200, error: 175 }),
    },
  ],
  invalid: [
    {
      code: linesOfCode(176),
      errors: [{ ...tooLong(176, 175), endLine: 176 }],
    },
    {
      code: linesOfCode(301),
      ...withSettings({ warn: 250, error: 300 }),
      errors: [tooLong(301, 300)],
    },
    // Only the warning is turned off.
    {
      code: linesOfCode(176),
      ...withSettings({ warn: false }),
      errors: [tooLong(176, 175)],
    },
  ],
});

describe("settings.webadeva.maxLines validation", () => {
  const verify = (value: unknown) => {
    return () => {
      return new Linter().verify("export const x = 1;", {
        plugins: { webadeva: { rules: { "max-lines": maxLines } } },
        rules: { "webadeva/max-lines": "error" },
        ...withSettings(value),
      });
    };
  };

  it("rejects non-integer limits", () => {
    assert.throws(verify({ error: "300" }), /must be non-negative integers/);
  });

  it("rejects a warn limit at or above the error limit", () => {
    assert.throws(
      verify({ warn: 200, error: 175 }),
      /`warn` \(200\) must be lower than `error` \(175\)/,
    );
  });

  it("rejects a non-boolean enabled", () => {
    assert.throws(verify({ enabled: "no" }), /`enabled` must be a boolean/);
  });

  it("rejects non-boolean skip options", () => {
    assert.throws(verify({ skipComments: "no" }), /must be booleans/);
  });
});
