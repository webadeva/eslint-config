import { ESLint, type Linter } from "eslint";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

const require = createRequire(import.meta.url);

const PKG = "@webadeva/eslint-config";
const PRESETS = ["", "/base", "/react", "/next", "/storybook"];
const CJS_PRESETS = ["", "/base"];
const ESM_ONLY_PRESETS = ["/react", "/next", "/storybook"];
const FIXTURE = new URL("./fixtures/sample.ts", import.meta.url).pathname;

const importPreset = async (subpath: string): Promise<Linter.Config[]> => {
  return ((await import(`${PKG}${subpath}`)) as { default: Linter.Config[] })
    .default;
};

describe("ESM entries", () => {
  for (const subpath of PRESETS) {
    it(`imports ${PKG}${subpath}`, async () => {
      const config = await importPreset(subpath);
      assert.ok(Array.isArray(config));
      assert.ok(config.length > 0);
    });
  }
});

describe("CJS entries", () => {
  for (const subpath of CJS_PRESETS) {
    it(`requires ${PKG}${subpath} with the same config as ESM`, async () => {
      const config = require(`${PKG}${subpath}`) as Linter.Config[];
      assert.ok(Array.isArray(config));
      assert.equal(config.length, (await importPreset(subpath)).length);
    });
  }

  for (const subpath of ESM_ONLY_PRESETS) {
    it(`refuses to require ESM-only ${PKG}${subpath}`, () => {
      assert.throws(
        () => {
          return require(`${PKG}${subpath}`);
        },
        {
          code: "ERR_PACKAGE_PATH_NOT_EXPORTED",
        },
      );
    });
  }
});

describe("linting", () => {
  for (const subpath of PRESETS) {
    it(`lints a TypeScript file with ${PKG}${subpath}`, async () => {
      const eslint = new ESLint({
        overrideConfigFile: true,
        overrideConfig: await importPreset(subpath),
      });
      const [result] = await eslint.lintFiles([FIXTURE]);
      assert.ok(result);
      const fatal = result.messages.filter((message) => {
        return message.fatal;
      });
      assert.deepEqual(fatal, []);
      assert.ok(
        result.messages.some((message) => {
          return message.ruleId === "no-console";
        }),
      );
    });
  }
});

describe("file length rules", () => {
  for (const subpath of PRESETS) {
    it(`enables both file length rules in ${PKG}${subpath}`, async () => {
      const eslint = new ESLint({
        overrideConfigFile: true,
        overrideConfig: await importPreset(subpath),
      });
      const { rules } = (await eslint.calculateConfigForFile(
        FIXTURE,
      )) as Linter.Config;
      assert.deepEqual(rules?.["webadeva/max-lines-warning"], [1]);
      assert.deepEqual(rules?.["webadeva/max-lines"], [2]);
    });
  }
});

describe("accessibility rules", () => {
  for (const subpath of ESM_ONLY_PRESETS) {
    it(`reports JSX a11y issues with ${PKG}${subpath}`, async () => {
      const eslint = new ESLint({
        overrideConfigFile: true,
        overrideConfig: await importPreset(subpath),
      });
      const [result] = await eslint.lintText(
        'export const Logo = () => {\n  return <img src="logo.png" />;\n};\n',
        { filePath: FIXTURE.replace(/\.ts$/, ".tsx") },
      );
      assert.ok(
        result?.messages.some((message) => {
          return message.ruleId === "jsx-a11y-x/alt-text";
        }),
      );
    });
  }
});

describe("combining presets", () => {
  it("lints with the base and React presets spread together", async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        ...(await importPreset("")),
        ...(await importPreset("/react")),
      ],
    });
    const [result] = await eslint.lintFiles([FIXTURE]);
    assert.ok(result);
    assert.ok(
      result.messages.some((message) => {
        return message.ruleId === "no-console";
      }),
    );
  });
});
