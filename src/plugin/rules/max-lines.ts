import type { Rule, SourceCode } from "eslint";

/**
 * `settings.webadeva.maxLines`, shared by both rules so they are configured in
 * one place. Omitted keys keep their defaults; `false` is shorthand for
 * `{ enabled: false }`. Use ESLint's `files` to give different paths
 * different settings.
 */
interface MaxLinesSettings {
  /** `false` turns both rules off, keeping the other settings in place. */
  enabled: boolean;
  /** Warn while `warn < LOC <= error`; `false` turns the warning off. */
  warn: number | false;
  /** Error when `LOC > error`; `false` turns it off and unbounds the warning. */
  error: number | false;
  /** Leave whitespace-only lines out of the count. */
  skipBlankLines: boolean;
  /** Leave comment-only lines out of the count. */
  skipComments: boolean;
}

const DEFAULTS: MaxLinesSettings = {
  enabled: true,
  warn: 150,
  error: 175,
  skipBlankLines: true,
  skipComments: true,
};

const SETTINGS_ERROR =
  "@webadeva/eslint-config: `settings.webadeva.maxLines` must be `false` or " +
  "`{ enabled?, warn?, error?, skipBlankLines?, skipComments? }`";

const isLimit = (value: unknown): value is number | false => {
  return (
    value === false ||
    (typeof value === "number" && Number.isInteger(value) && value >= 0)
  );
};

const readSettings = (
  context: Rule.RuleContext,
): MaxLinesSettings | undefined => {
  const webadeva = context.settings["webadeva"] as
    { maxLines?: Partial<MaxLinesSettings> | false } | undefined;
  const maxLines = webadeva?.maxLines;
  if (maxLines === false) return undefined;

  const settings = { ...DEFAULTS, ...maxLines };
  if (typeof settings.enabled !== "boolean") {
    throw new Error(`${SETTINGS_ERROR}; \`enabled\` must be a boolean.`);
  }
  if (!settings.enabled) return undefined;
  if (!isLimit(settings.warn) || !isLimit(settings.error)) {
    throw new Error(
      `${SETTINGS_ERROR}; \`warn\` and \`error\` must be non-negative integers or \`false\`.`,
    );
  }
  if (
    typeof settings.skipBlankLines !== "boolean" ||
    typeof settings.skipComments !== "boolean"
  ) {
    throw new Error(
      `${SETTINGS_ERROR}; \`skipBlankLines\` and \`skipComments\` must be booleans.`,
    );
  }
  if (
    settings.warn !== false &&
    settings.error !== false &&
    settings.warn >= settings.error
  ) {
    throw new Error(
      `${SETTINGS_ERROR}; \`warn\` (${settings.warn}) must be lower than \`error\` (${settings.error}).`,
    );
  }
  return settings;
};

const addLines = (
  lines: Set<number>,
  { start, end }: { start: { line: number }; end: { line: number } },
): void => {
  for (let { line } = start; line <= end.line; line++) lines.add(line);
};

const countLines = (
  sourceCode: SourceCode,
  { skipBlankLines, skipComments }: MaxLinesSettings,
): number => {
  const lines = new Set<number>();
  for (const token of sourceCode.ast.tokens) addLines(lines, token.loc);
  if (!skipComments) {
    for (const comment of sourceCode.getAllComments()) {
      if (comment.loc) addLines(lines, comment.loc);
    }
  }
  if (!skipBlankLines) {
    // The empty string after a trailing newline is not a line of its own.
    const lastLine =
      sourceCode.lines.at(-1) === ""
        ? sourceCode.lines.length - 1
        : sourceCode.lines.length;
    sourceCode.lines.slice(0, lastLine).forEach((text, index) => {
      if (text.trim() === "") lines.add(index + 1);
    });
  }
  return lines.size;
};

const createMaxLinesRule = (
  level: "warn" | "error",
  description: string,
  message: string,
): Rule.RuleModule => {
  return {
    meta: {
      type: "suggestion",
      docs: { description },
      messages: { tooLong: message },
      schema: [],
    },
    create: (context) => {
      const settings = readSettings(context);
      const max = settings?.[level];
      if (!settings || max === false || max === undefined) return {};
      // The warning hands over to the error once the hard limit is passed.
      const upperBound = level === "warn" ? settings.error : false;

      return {
        "Program:exit": () => {
          const { sourceCode } = context;
          const count = countLines(sourceCode, settings);
          if (count <= max) return;
          if (upperBound !== false && count > upperBound) return;

          const lastLine = sourceCode.lines.length;
          context.report({
            loc: {
              start: { line: 1, column: 0 },
              end: {
                line: lastLine,
                column: sourceCode.lines[lastLine - 1]?.length ?? 0,
              },
            },
            messageId: "tooLong",
            data: { count: String(count), max: String(max) },
          });
        },
      };
    },
  };
};

/** Reports files over `settings.webadeva.maxLines.error`; meant to be an error. */
export const maxLines: Rule.RuleModule = createMaxLinesRule(
  "error",
  "Enforce a hard limit on lines of code per file.",
  "File has {{count}} lines of code, over the limit of {{max}}. Split it into smaller modules.",
);

/**
 * Reports files between `settings.webadeva.maxLines.warn` and `.error`;
 * meant to be a warning.
 */
export const maxLinesWarning: Rule.RuleModule = createMaxLinesRule(
  "warn",
  "Warn when a file grows past the soft lines-of-code limit.",
  "File has {{count}} lines of code, over the soft limit of {{max}}. Consider splitting it into smaller modules.",
);
