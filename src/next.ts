import type { Linter } from "eslint";
import { baseConfigs } from "./configs/base.ts";
import { nextConfigs } from "./configs/next.ts";
import { reactConfigs, reactDisableTypeChecked } from "./configs/react.ts";
import { untypedFilesConfigs } from "./configs/untyped.ts";

const config: Linter.Config[] = [
  ...baseConfigs,
  ...reactConfigs,
  ...nextConfigs,
  ...untypedFilesConfigs(reactDisableTypeChecked),
];

export default config;
