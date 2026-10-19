# Rules

This package ships its own ESLint plugin, registered as `webadeva` in every preset.

## `webadeva/max-lines` and `webadeva/max-lines-warning`

These rules limit how long a file can get, measured in lines of code. Each report covers the whole file.

| Lines of code | Result  |
| ------------- | ------- |
| up to 150     | nothing |
| 151–175       | warning |
| over 175      | error   |

ESLint attaches severity to a rule, so the limit is two rules: `max-lines-warning` set to `warn` and `max-lines` set to `error`. Both rules read one shared setting, so you configure them in one place:

```js
export default [
  ...config,
  { settings: { webadeva: { maxLines: { warn: 250, error: 300 } } } },
];
```

Any key you leave out keeps its default:

| Key              | Default | Meaning                                                                                              |
| ---------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `enabled`        | `true`  | `false` turns both rules off                                                                         |
| `warn`           | `150`   | Warn while `warn < LOC <= error`. `false` turns only the warning off.                                |
| `error`          | `175`   | Error when `LOC > error`. `false` turns only the error off, and the warning then has no upper bound. |
| `skipBlankLines` | `true`  | Don't count blank lines                                                                              |
| `skipComments`   | `true`  | Don't count comment-only lines                                                                       |

`maxLines: false` is shorthand for `{ enabled: false }`. `warn` must be lower than `error`. An invalid setting stops linting with an error message that explains the problem.

To use different limits for different paths, use ESLint's `files`:

```js
{
  files: ["**/*.test.ts"],
  settings: { webadeva: { maxLines: { enabled: false } } },
}
```

## `webadeva/typescript-file-in-project`

This rule reports a TypeScript file that no tsconfig includes. Such a file is not type-checked, and type-aware lint rules skip it. To fix the report, add the file to a tsconfig's `include`. To turn the rule off:

```js
{ rules: { "webadeva/typescript-file-in-project": "off" } }
```
