import type { Linter } from "eslint";
import { baseConfigs } from "./configs/base.ts";
import { untypedFilesConfigs } from "./configs/untyped.ts";

const config: Linter.Config[] = [...baseConfigs, ...untypedFilesConfigs()];

export default config;
