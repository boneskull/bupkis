# @bupkis/codemod

Migrate Jest assertions to [bupkis](https://github.com/boneskull/bupkis) with a single command.

## Installation

```bash
npx @bupkis/codemod
```

Or install globally:

```bash
npm install -g @bupkis/codemod
bupkis-codemod
```

## Usage

```bash
# Transform all test files in current directory
npx @bupkis/codemod

# Transform specific patterns
npx @bupkis/codemod "src/**/*.test.ts" "tests/**/*.spec.ts"

# Dry run (see what would change)
npx @bupkis/codemod --dry-run

# Strict mode (fail on any unsupported matcher)
npx @bupkis/codemod --strict

# Exclude patterns
npx @bupkis/codemod -e "**/fixtures/**" -e "**/snapshots/**"
```

## Modes

- **`--best-effort`** (default): Transform what we can, add `// TODO: Manual migration needed` comments for complex cases
- **`--strict`**: Fail immediately on any unsupported transformation
- **`--interactive`**: Prompt for ambiguous cases (coming soon)

## Supported Matchers

### Jest Core

| Jest                           | bupkis                                 |
| ------------------------------ | -------------------------------------- |
| `expect(x).toBe(y)`            | `expect(x, 'to be', y)`                |
| `expect(x).toEqual(y)`         | `expect(x, 'to deep equal', y)`        |
| `expect(x).toBeTruthy()`       | `expect(x, 'to be truthy')`            |
| `expect(x).toBeFalsy()`        | `expect(x, 'to be falsy')`             |
| `expect(x).toBeNull()`         | `expect(x, 'to be null')`              |
| `expect(x).toBeUndefined()`    | `expect(x, 'to be undefined')`         |
| `expect(x).toBeDefined()`      | `expect(x, 'to be defined')`           |
| `expect(x).toBeInstanceOf(Y)`  | `expect(x, 'to be an instance of', Y)` |
| `expect(x).toBeGreaterThan(y)` | `expect(x, 'to be greater than', y)`   |
| `expect(x).toBeLessThan(y)`    | `expect(x, 'to be less than', y)`      |
| `expect(x).toMatch(pattern)`   | `expect(x, 'to match', pattern)`       |
| `expect(x).toContain(y)`       | `expect(x, 'to contain', y)`           |
| `expect(x).toHaveLength(n)`    | `expect(x, 'to have length', n)`       |
| `expect(x).toHaveProperty(k)`  | `expect(x, 'to have property', k)`     |
| `expect(x).toMatchObject(y)`   | `expect(x, 'to satisfy', y)`           |
| `expect(fn).toThrow()`         | `expect(fn, 'to throw')`               |

### jest-extended

| jest-extended              | bupkis                           |
| -------------------------- | -------------------------------- |
| `expect(x).toBeTrue()`     | `expect(x, 'to be true')`        |
| `expect(x).toBeFalse()`    | `expect(x, 'to be false')`       |
| `expect(x).toBeArray()`    | `expect(x, 'to be an array')`    |
| `expect(x).toBeEmpty()`    | `expect(x, 'to be empty')`       |
| `expect(x).toStartWith(s)` | `expect(x, 'to start with', s)`  |
| `expect(x).toEndWith(s)`   | `expect(x, 'to end with', s)`    |
| `expect(x).toBeOneOf(arr)` | `expect(x, 'to be one of', arr)` |

### Negation

All matchers support negation:

```javascript
// Jest
expect(x).not.toBe(y);

// bupkis
expect(x, 'not to be', y);
```

## Programmatic API

```typescript
import { transform, transformCode } from '@bupkis/codemod';

// Transform a code string
const result = await transformCode(`expect(42).toBe(42);`);
console.log(result.code); // expect(42, 'to be', 42);

// Transform files
const results = await transform({
  include: ['src/**/*.test.ts'],
  exclude: ['**/node_modules/**'],
  mode: 'best-effort',
  write: true,
});
```

## What Requires Manual Migration

Some Jest patterns cannot be automatically transformed:

- **Mock/spy matchers**: `toHaveBeenCalled`, `toHaveBeenCalledWith`, etc. (bupkis doesn't include mocking)
- **DOM matchers**: `@testing-library/jest-dom` matchers like `toBeInTheDocument`
- **Promise matchers**: `resolves`/`rejects` need restructuring to `expectAsync`
- **Complex `toHaveProperty`**: When checking property value, not just existence

These cases will be marked with `// TODO: Manual migration needed` comments when using `--best-effort` mode.

## License

Apache-2.0
