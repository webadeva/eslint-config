import type { Linter } from "eslint";

/**
 * ESLint accepts `(filePath) => boolean` matchers in `files`, but its types
 * only allow glob strings.
 */
export const filesMatching = (
  matcher: (filePath: string) => boolean,
): Linter.Config["files"] => {
  return [matcher] as unknown as Linter.Config["files"];
};
