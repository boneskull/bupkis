# @bupkis/from-jest

Migrate Jest and Vitest assertions to [bupkis](https://github.com/boneskull/bupkis) with a single command.

## Installation

```bash
npx @bupkis/from-jest
```

Or install globally:

```bash
npm install -g @bupkis/from-jest
bupkis-from-jest
```

## Usage

```bash
# Transform all test files in current directory
npx @bupkis/from-jest

# Transform specific patterns
npx @bupkis/from-jest "src/**/*.test.ts" "tests/**/*.spec.ts"

# Dry run (see what would change)
npx @bupkis/from-jest --dry-run

# Strict mode (fail on any unsupported matcher)
npx @bupkis/from-jest --strict

# Exclude patterns
npx @bupkis/from-jest -e "**/fixtures/**" -e "**/snapshots/**"

# Transform mock/spy matchers using @bupkis/sinon
npx @bupkis/from-jest --sinon
```

## Modes

- **`--best-effort`** (default): Transform what we can, add `// TODO: Manual migration needed` comments for complex cases
- **`--strict`**: Fail immediately on any unsupported transformation
- **`--interactive`**: Prompt for ambiguous cases (coming soon)

## Supported Test Frameworks

**Supported versions:**

- **Jest 29+** (including Jest 30)
- **Vitest 1+**

The codemod handles imports from:

- **Jest**: `@jest/globals`
- **Vitest**: `vitest`
- **Global `expect`**: Adds `import { expect } from 'bupkis'`

When transforming, the codemod:

1. Removes `expect` from your test framework import
2. Adds `import { expect } from 'bupkis'`
3. Keeps other imports (`describe`, `it`, `test`, etc.) from your original framework

> **Note:** Jest 30 removed several matcher aliases (e.g., `toThrowError` → `toThrow`, `toBeCalled` → `toHaveBeenCalled`). This codemod handles both the old aliases and the new canonical names.

## Supported Matchers

### Jest/Vitest Core

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

### Promise Matchers (resolves/rejects)

The codemod transforms Jest's promise matchers to bupkis's `expectAsync`:

| Jest                              | bupkis                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `expect(p).resolves.toBe(v)`      | `expectAsync(p, 'to fulfill with value satisfying', v)`                         |
| `expect(p).resolves.toEqual(v)`   | `expectAsync(p, 'to fulfill with value satisfying', v)`                         |
| `expect(p).resolves.toBeTruthy()` | `expectAsync(p, 'to fulfill with value satisfying', expect.it('to be truthy'))` |
| `expect(p).rejects.toThrow()`     | `expectAsync(p, 'to reject')`                                                   |
| `expect(p).rejects.toThrow(Err)`  | `expectAsync(p, 'to reject with a', Err)`                                       |
| `expect(p).rejects.toThrow(msg)`  | `expectAsync(p, 'to reject with error satisfying', msg)`                        |

For matchers that check properties of the resolved/rejected value (like `toBeTruthy`, `toContain`, `toHaveLength`), the codemod wraps them in `expect.it()` to preserve the assertion semantics.

**Example:**

```javascript
// Before (Jest)
await expect(fetchData()).resolves.toBe('success');
await expect(fetchData()).resolves.toContain('data');
await expect(badPromise).rejects.toThrow(TypeError);

// After (bupkis)
await expectAsync(fetchData(), 'to fulfill with value satisfying', 'success');
await expectAsync(
  fetchData(),
  'to fulfill with value satisfying',
  expect.it('to contain', 'data'),
);
await expectAsync(badPromise, 'to reject with a', TypeError);
```

### Negation

All matchers support negation:

```javascript
// Jest/Vitest
expect(x).not.toBe(y);
expect(p).resolves.not.toBe(y);

// bupkis
expect(x, 'not to be', y);
expectAsync(p, 'not to fulfill with value satisfying', y);
```

### Mock/Spy Matchers (with `--sinon`)

When you use the `--sinon` flag, the codemod transforms Jest mock matchers to [`@bupkis/sinon`](https://github.com/boneskull/bupkis/tree/main/packages/sinon) assertions:

| Jest (canonical)             | Jest 29 alias        | @bupkis/sinon                             |
| ---------------------------- | -------------------- | ----------------------------------------- |
| `toHaveBeenCalled()`         | `toBeCalled()`       | `'was called'`                            |
| `toHaveBeenCalledTimes(n)`   | `toBeCalledTimes()`  | `'was called times', n`                   |
| `toHaveBeenCalledWith(...)`  | `toBeCalledWith()`   | `'was called with', [...]`                |
| `toHaveBeenLastCalledWith()` | `lastCalledWith()`   | `spy.lastCall, 'to have args', [...]`     |
| `toHaveBeenNthCalledWith(n)` | `nthCalledWith()`    | `spy.getCall(n-1), 'to have args', [...]` |
| `toHaveReturned()`           | `toReturn()`         | `'to have returned'`                      |
| `toHaveReturnedTimes(n)`     | `toReturnTimes()`    | `'to have returned times', n`             |
| `toHaveReturnedWith(v)`      | `toReturnWith()`     | `'to have returned with', v`              |
| `toHaveLastReturnedWith(v)`  | `lastReturnedWith()` | `spy.lastCall, 'to have returned', v`     |
| `toHaveNthReturnedWith(n,v)` | `nthReturnedWith()`  | `spy.getCall(n-1), 'to have returned', v` |

> **Note:** The Jest 29 aliases were deprecated in Jest 26 and removed in Jest 30. This codemod handles both.

**Example transformation:**

```javascript
// Before (Jest)
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenLastCalledWith('final');

// After (bupkis + @bupkis/sinon)
expect(mockFn, 'was called');
expect(mockFn, 'was called with', ['arg1', 'arg2']);
expect(mockFn.lastCall, 'to have args', ['final']);
```

**Important:** The `--sinon` flag only transforms _assertions_. You must manually migrate your mock/spy creation from `jest.fn()` to Sinon:

```javascript
// Before
const mockFn = jest.fn();

// After (manual migration required)
import sinon from 'sinon';
const mockFn = sinon.spy();
```

When mock matchers are detected without `--sinon`, the codemod will notify you and suggest using the flag.

## Programmatic API

```typescript
import { transform, transformCode } from '@bupkis/from-jest';

// Transform a code string
const result = await transformCode(`expect(42).toBe(42);`);
console.log(result.code); // expect(42, 'to be', 42);

// Transform promise matchers
const promiseResult = await transformCode(`expect(p).resolves.toBe(42);`);
console.log(promiseResult.code); // expectAsync(p, 'to fulfill with value satisfying', 42);

// Transform with sinon support
const sinonResult = await transformCode(`expect(spy).toHaveBeenCalled();`, {
  sinon: true,
});
console.log(sinonResult.code); // expect(spy, 'was called');

// Transform files
const results = await transform({
  include: ['src/**/*.test.ts'],
  exclude: ['**/node_modules/**'],
  mode: 'best-effort',
  sinon: true, // Enable mock matcher transformation
  write: true,
});
```

## What Requires Manual Migration

Some Jest/Vitest patterns cannot be automatically transformed:

- **Mock/spy creation**: `jest.fn()`, `jest.spyOn()`, `vi.fn()` must be manually migrated to Sinon (`sinon.spy()`, `sinon.stub()`)
- **DOM matchers**: `@testing-library/jest-dom` matchers like `toBeInTheDocument`
- **Asymmetric matchers in promise chains**: `expect(p).resolves.toEqual(expect.anything())` needs manual migration
- **Complex `toHaveProperty`**: When checking property value, not just existence

These cases will be marked with `// TODO: Manual migration needed` comments when using `--best-effort` mode.

> **Tip:** Mock/spy _assertions_ can be transformed automatically with `--sinon`. See the [Mock/Spy Matchers](#mockspy-matchers-with---sinon) section.

## License

Copyright © 2025 Christopher Hiller. Licensed under [BlueOak-1.0.0](https://blueoakcouncil.org/license/1.0.0).
