import { defineConfig, type UserConfig } from "tsdown";

// These presets build on @eslint-react, which only ships ESM (no `require`
// export condition), so they are ESM-only. Only the base preset gets CJS.
const ESM_ONLY_PRESETS = ["react", "next", "storybook"];

const config: UserConfig = defineConfig({
  entry: {
    index: "src/index.ts",
    ...Object.fromEntries(
      ESM_ONLY_PRESETS.map((name) => {
        return [name, `src/${name}.ts`];
      }),
    ),
  },
  format: {
    esm: {},
    cjs: { entry: { index: "src/index.ts" } },
  },
  platform: "node",
  fixedExtension: true,
  dts: true,
  shims: true,
  exports: {
    customExports: (exports: Record<string, unknown>) => {
      // Only the `import` condition, so `require()` fails at resolution
      // instead of deep inside @eslint-react.
      for (const name of ESM_ONLY_PRESETS) {
        exports[`./${name}`] = { import: exports[`./${name}`] };
      }
      return {
        ...exports,
        "./base": exports["."],
        // Fallback project for files outside every tsconfig.
        "./tsconfig.default.json": "./tsconfig.default.json",
      };
    },
  },
  publint: { level: "error" },
  // attw runs in src/tests/package.test.ts, which can allow the missing
  // `require` resolution for the ESM-only presets alone.
  attw: false,
});

export default config;
