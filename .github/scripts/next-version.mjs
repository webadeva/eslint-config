#!/usr/bin/env node
// Usage: node next-version.mjs <currentVersion> <commitMessage>
// major:/minor: prefix (case-insensitive) picks the bump; anything else is a patch.
const nextVersion = (current, message) => {
  const [major, minor, patch] = current.split(".").map(Number);
  const prefix = message.trimStart().toLowerCase();
  if (prefix.startsWith("major:")) return `${major + 1}.0.0`;
  if (prefix.startsWith("minor:")) return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
};

if (process.argv[2] === "--self-test") {
  const assert = await import("node:assert");
  assert.strictEqual(nextVersion("1.2.3", "major: breaking change"), "2.0.0");
  assert.strictEqual(nextVersion("1.2.3", "MINOR: new feature"), "1.3.0");
  assert.strictEqual(nextVersion("1.2.3", "patch: fix bug"), "1.2.4");
  assert.strictEqual(nextVersion("1.2.3", "fix: no prefix"), "1.2.4");
  assert.strictEqual(nextVersion("1.2.3", "  minor: leading space"), "1.3.0");
  console.log("next-version self-test: ok");
  process.exit(0);
}

console.log(nextVersion(process.argv[2], process.argv[3]));
