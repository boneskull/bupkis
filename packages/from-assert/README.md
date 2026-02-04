# @bupkis/from-assert

Migrate `node:assert` assertions to [bupkis](https://github.com/boneskull/bupkis) with a single command.

Supports both **strict mode** (`node:assert/strict`) and **legacy mode** (`node:assert`) assertions.

## Installation

```bash
npx @bupkis/from-assert
```

Or install locally:

```bash
npm install -D @bupkis/from-assert
```

## Usage

### CLI

```bash
# Transform all test files in current directory
npx bupkis-from-assert

# Transform specific patterns
npx bupkis-from-assert "src/**/*.test.ts" "test/**/*.spec.ts"

# Dry run (see what would change without writing)
npx bupkis-from-assert --dry-run

# Exclude patterns
npx bupkis-from-assert --exclude "**/fixtures/**"

# Strict mode (fail on any unsupported assertion)
npx bupkis-from-assert --strict
```

### Programmatic API

```typescript
import { transform, transformCode } from '@bupkis/from-assert';

// Transform a code string
const { code, transformCount, warnings } = await transformCode(`
  import assert from 'node:assert';
  assert.strictEqual(foo, bar);
`);
// Result: "import { expect } from 'bupkis';\nexpect(foo, 'to be', bar);"

// Transform files
const result = await transform({
  include: ['**/*.test.ts'],
  exclude: ['**/node_modules/**'],
  mode: 'best-effort',
  write: true,
});
```

## Transformations

### Strict Equality

| node:assert                       | bupkis                              |
| --------------------------------- | ----------------------------------- |
| `assert.strictEqual(a, b)`        | `expect(a, 'to be', b)`             |
| `assert.notStrictEqual(a, b)`     | `expect(a, 'not to be', b)`         |
| `assert.deepStrictEqual(a, b)`    | `expect(a, 'to deep equal', b)`     |
| `assert.notDeepStrictEqual(a, b)` | `expect(a, 'not to deep equal', b)` |

### Legacy Equality (with warning)

When using plain `node:assert` (legacy mode), loose equality assertions are transformed with a warning since behavior may differ:

| node:assert                 | bupkis                              |
| --------------------------- | ----------------------------------- |
| `assert.equal(a, b)`        | `expect(a, 'to be', b)` ⚠️          |
| `assert.notEqual(a, b)`     | `expect(a, 'not to be', b)` ⚠️      |
| `assert.deepEqual(a, b)`    | `expect(a, 'to deep equal', b)`     |
| `assert.notDeepEqual(a, b)` | `expect(a, 'not to deep equal', b)` |

### Truthiness

| node:assert        | bupkis                          |
| ------------------ | ------------------------------- |
| `assert(value)`    | `expect(value, 'to be truthy')` |
| `assert.ok(value)` | `expect(value, 'to be truthy')` |

### Throws

| node:assert                  | bupkis                            |
| ---------------------------- | --------------------------------- |
| `assert.throws(fn)`          | `expect(fn, 'to throw')`          |
| `assert.throws(fn, Error)`   | `expect(fn, 'to throw', Error)`   |
| `assert.throws(fn, /regex/)` | `expect(fn, 'to throw', /regex/)` |
| `assert.doesNotThrow(fn)`    | `expect(fn, 'not to throw')`      |

### Async Assertions

Async assertions use `expectAsync`:

| node:assert                      | bupkis                                          |
| -------------------------------- | ----------------------------------------------- |
| `assert.rejects(asyncFn)`        | `expectAsync(asyncFn, 'to reject')`             |
| `assert.rejects(asyncFn, Error)` | `expectAsync(asyncFn, 'to reject with', Error)` |
| `assert.doesNotReject(asyncFn)`  | `expectAsync(asyncFn, 'not to reject')`         |

### String Matching

| node:assert                         | bupkis                                 |
| ----------------------------------- | -------------------------------------- |
| `assert.match(str, /regex/)`        | `expect(str, 'to match', /regex/)`     |
| `assert.doesNotMatch(str, /regex/)` | `expect(str, 'not to match', /regex/)` |

### Fail

| node:assert            | bupkis                 |
| ---------------------- | ---------------------- |
| `assert.fail()`        | `expect.fail()`        |
| `assert.fail(message)` | `expect.fail(message)` |

### Unsupported

The following require manual migration:

- `assert.ifError(value)` - Semantics don't map cleanly
- `assert.CallTracker` - Deprecated; use `@bupkis/sinon` instead
- Complex error matchers with validation functions

## Import Handling

The transformer automatically handles all `node:assert` import styles:

```typescript
// All of these are transformed
import assert from 'node:assert';
import assert from 'node:assert/strict';
import assert from 'assert';
import assert from 'assert/strict';
import { strict as assert } from 'node:assert';
```

The import is replaced with:

```typescript
import { expect } from 'bupkis';
// or, if async assertions are present:
import { expect, expectAsync } from 'bupkis';
```

## Options

| Option            | Description                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `--dry-run`       | Show what would change without writing files                     |
| `--strict`        | Fail on any unsupported assertion                                |
| `--best-effort`   | Transform what we can, return warnings for unsupported (default) |
| `--exclude`, `-e` | Patterns to exclude (default: `**/node_modules/**`)              |

## Handling Unsupported Assertions

In `best-effort` mode (default), unsupported assertions are left unchanged and a warning is returned. Search for warnings in the output to find items requiring manual review.

## License

[Blue Oak Model License 1.0.0](https://blueoakcouncil.org/license/1.0.0)
