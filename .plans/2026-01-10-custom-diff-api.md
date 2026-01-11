# Custom Diff API for AssertionFailure

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable custom assertions to provide rich diff output by extending `AssertionFailure` with optional diff customization properties.

**Architecture:** Extend the existing `AssertionFailure` interface with three optional properties: `diff` (pre-computed diff string), `formatActual`/`formatExpected` (custom serializers for jest-diff), and `diffOptions` (jest-diff configuration override). The assertion execution code will check for these properties and use them when generating error output, with clear precedence: `diff` > formatters > default behavior.

**Tech Stack:** TypeScript, Zod v4 (for schema validation), jest-diff (for diff generation)

---

## Background

Currently, assertions returning `AssertionFailure` only get plain text error messages. Schema-based assertions (Zod/Standard Schema) get rich jest-diff output via `extractDiffValues()` and `generateDiff()`. This plan bridges that gap by allowing function-based assertions to opt into rich diff output.

**Key files:**

- `src/assertion/assertion-types.ts` - `AssertionFailure` interface (lines 182-195)
- `src/internal-schema.ts` - `AssertionFailureSchema` Zod validation (lines 20-37)
- `src/assertion/assertion-sync.ts` - sync execution handles `AssertionFailure` (lines 249-257)
- `src/assertion/assertion-async.ts` - async execution (similar pattern)
- `src/diff.ts` - `generateDiff()` and `DiffOptions` type

---

## Task 1: Add Types for AssertionFailure Extensions

**Files:**

- Modify: `src/assertion/assertion-types.ts:182-195`
- Modify: `src/diff.ts` (re-export `DiffOptions`)

**Step 1: Read current state of diff.ts exports**

Verify `DiffOptions` is already exported from `src/diff.ts`.

**Step 2: Extend AssertionFailure interface**

In `src/assertion/assertion-types.ts`, replace lines 182-195 with:

````typescript
/**
 * Object which may be returned from assertion function implementations to
 * provide better failure reporting to the end-user.
 *
 * @group Assertion Creation
 */
export interface AssertionFailure {
  /**
   * The actual value or condition that was encountered
   */
  actual?: unknown;

  /**
   * Pre-computed diff string. When provided, this bypasses jest-diff entirely
   * and is used as-is in the error output. Takes precedence over
   * `formatActual`, `formatExpected`, and `diffOptions`.
   *
   * @example
   *
   * ```typescript
   * return {
   *   actual: myDate,
   *   expected: otherDate,
   *   diff: `  Expected: ${formatDate(otherDate)}\n  Actual:   ${formatDate(myDate)}`,
   *   message: 'Dates are not on the same day',
   * };
   * ```
   */
  diff?: string;

  /**
   * Override default jest-diff options. Only used when `diff` is not provided.
   *
   * @see {@link https://npm.im/jest-diff | jest-diff} for available options
   */
  diffOptions?: DiffOptions;

  /**
   * The expected value or condition that was not met
   */
  expected?: unknown;

  /**
   * Custom formatter for the actual value in diff output. Only used when `diff`
   * is not provided. The returned string is passed to jest-diff.
   *
   * @example
   *
   * ```typescript
   * return {
   *   actual: sortedActual,
   *   expected: sortedExpected,
   *   formatActual: (v) => `[sorted] ${inspect(v)}`,
   *   formatExpected: (v) => `[sorted] ${inspect(v)}`,
   * };
   * ```
   *
   * @param value - The actual value to format
   * @returns String representation for diff display
   */
  formatActual?: (value: unknown) => string;

  /**
   * Custom formatter for the expected value in diff output. Only used when
   * `diff` is not provided. The returned string is passed to jest-diff.
   *
   * @param value - The expected value to format
   * @returns String representation for diff display
   */
  formatExpected?: (value: unknown) => string;

  /**
   * A human-readable message describing the failure
   */
  message?: string | undefined;
}
````

**Step 3: Add DiffOptions import to assertion-types.ts**

Add import at top of `src/assertion/assertion-types.ts`:

```typescript
import type { DiffOptions } from '../diff.js';
```

**Step 4: Verify TypeScript compilation**

Run: `npm run build`
Expected: No type errors

**Step 5: Commit**

```bash
git add src/assertion/assertion-types.ts
git commit -m "feat(types): extend AssertionFailure with custom diff properties

Add optional properties to AssertionFailure interface:
- diff: pre-computed diff string (bypasses jest-diff)
- formatActual/formatExpected: custom value serializers
- diffOptions: override jest-diff configuration

This enables function-based assertions to provide rich diff output
comparable to schema-based assertions."
```

---

## Task 2: Update AssertionFailureSchema Validation

**Files:**

- Modify: `src/internal-schema.ts:20-37`
- Test: `test/internal-schema.test.ts` (create if needed)

**Step 1: Write failing test for new schema properties**

Create or update test file `test/internal-schema.test.ts`:

```typescript
import { describe, it } from 'node:test';

import { expect } from '../src/index.js';
import { isAssertionFailure } from '../src/internal-schema.js';

describe('isAssertionFailure', () => {
  describe('with new diff properties', () => {
    it('should accept diff string property', () => {
      const result = isAssertionFailure({
        actual: 'foo',
        expected: 'bar',
        diff: '- expected\n+ actual',
      });
      expect(result, 'to be true');
    });

    it('should accept formatActual function property', () => {
      const result = isAssertionFailure({
        actual: 'foo',
        expected: 'bar',
        formatActual: (v) => `formatted: ${v}`,
      });
      expect(result, 'to be true');
    });

    it('should accept formatExpected function property', () => {
      const result = isAssertionFailure({
        actual: 'foo',
        expected: 'bar',
        formatExpected: (v) => `formatted: ${v}`,
      });
      expect(result, 'to be true');
    });

    it('should accept diffOptions object property', () => {
      const result = isAssertionFailure({
        actual: 'foo',
        expected: 'bar',
        diffOptions: { expand: true },
      });
      expect(result, 'to be true');
    });

    it('should accept all new properties together', () => {
      const result = isAssertionFailure({
        actual: 'foo',
        diff: 'custom diff',
        diffOptions: { expand: true },
        expected: 'bar',
        formatActual: (v) => `${v}`,
        formatExpected: (v) => `${v}`,
        message: 'test message',
      });
      expect(result, 'to be true');
    });

    it('should reject non-string diff property', () => {
      const result = isAssertionFailure({
        actual: 'foo',
        diff: 123,
        expected: 'bar',
      });
      expect(result, 'to be false');
    });

    it('should reject non-function formatActual property', () => {
      const result = isAssertionFailure({
        actual: 'foo',
        expected: 'bar',
        formatActual: 'not a function',
      });
      expect(result, 'to be false');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="isAssertionFailure"`
Expected: FAIL - new properties not yet in schema

**Step 3: Update AssertionFailureSchema**

In `src/internal-schema.ts`, replace lines 20-37 with:

```typescript
/**
 * Schema for {@link AssertionFailure}.
 *
 * @internal
 */
const AssertionFailureSchema: z.ZodType<AssertionFailure> = z
  .object({
    actual: z
      .unknown()
      .optional()
      .describe('The actual value or description of what actually occurred'),
    diff: z
      .string()
      .optional()
      .describe('Pre-computed diff string that bypasses jest-diff'),
    diffOptions: z
      .record(z.unknown())
      .optional()
      .describe('Override options for jest-diff'),
    expected: z
      .unknown()
      .optional()
      .describe(
        'The expected value or description of what was expected to occur',
      ),
    formatActual: z
      .function()
      .optional()
      .describe('Custom formatter for actual value in diff output'),
    formatExpected: z
      .function()
      .optional()
      .describe('Custom formatter for expected value in diff output'),
    message: z
      .string()
      .optional()
      .describe('A human-readable message describing the failure'),
  })
  .describe('Potential return type of an assertion implementation function');
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --test-name-pattern="isAssertionFailure"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/internal-schema.ts test/internal-schema.test.ts
git commit -m "feat(schema): update AssertionFailureSchema for new diff properties

Add validation for new AssertionFailure properties:
- diff: optional string
- diffOptions: optional record
- formatActual: optional function
- formatExpected: optional function"
```

---

## Task 3: Implement Diff Generation for AssertionFailure

**Files:**

- Create: `src/assertion/format-assertion-failure.ts`
- Test: `test/assertion/format-assertion-failure.test.ts`

**Step 1: Write failing test for formatAssertionFailure helper**

Create `test/assertion/format-assertion-failure.test.ts`:

```typescript
import { describe, it } from 'node:test';

import type { AssertionFailure } from '../../src/assertion/assertion-types.js';
import { formatAssertionFailure } from '../../src/assertion/format-assertion-failure.js';
import { expect } from '../../src/index.js';

describe('formatAssertionFailure', () => {
  describe('with diff property', () => {
    it('should return the diff string directly', () => {
      const failure: AssertionFailure = {
        actual: 'foo',
        diff: 'custom diff output',
        expected: 'bar',
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to equal', 'custom diff output');
    });

    it('should ignore formatters when diff is provided', () => {
      const failure: AssertionFailure = {
        actual: 'foo',
        diff: 'custom diff',
        expected: 'bar',
        formatActual: () => 'SHOULD NOT SEE THIS',
        formatExpected: () => 'SHOULD NOT SEE THIS',
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to equal', 'custom diff');
    });
  });

  describe('with formatters', () => {
    it('should use formatActual for actual value', () => {
      const failure: AssertionFailure = {
        actual: { value: 'foo' },
        expected: { value: 'bar' },
        formatActual: (v) => `ACTUAL:${JSON.stringify(v)}`,
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be a string');
      expect(result, 'to contain', 'ACTUAL:');
    });

    it('should use formatExpected for expected value', () => {
      const failure: AssertionFailure = {
        actual: { value: 'foo' },
        expected: { value: 'bar' },
        formatExpected: (v) => `EXPECTED:${JSON.stringify(v)}`,
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be a string');
      expect(result, 'to contain', 'EXPECTED:');
    });

    it('should use both formatters together', () => {
      const failure: AssertionFailure = {
        actual: 'a',
        expected: 'b',
        formatActual: (v) => `[A:${v}]`,
        formatExpected: (v) => `[E:${v}]`,
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be a string');
      expect(result, 'to contain', '[A:a]');
      expect(result, 'to contain', '[E:b]');
    });
  });

  describe('with diffOptions', () => {
    it('should pass options to jest-diff', () => {
      const failure: AssertionFailure = {
        actual: { a: 1, b: 2 },
        diffOptions: { contextLines: 0 },
        expected: { a: 1, b: 3 },
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be a string');
    });
  });

  describe('without custom diff properties', () => {
    it('should return null when actual and expected are identical', () => {
      const failure: AssertionFailure = {
        actual: 'same',
        expected: 'same',
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be null');
    });

    it('should generate diff for different values', () => {
      const failure: AssertionFailure = {
        actual: { a: 1 },
        expected: { a: 2 },
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be a string');
    });

    it('should return null when actual is undefined', () => {
      const failure: AssertionFailure = {
        expected: 'bar',
        message: 'only message',
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be null');
    });

    it('should return null when expected is undefined', () => {
      const failure: AssertionFailure = {
        actual: 'foo',
        message: 'only message',
      };
      const result = formatAssertionFailure(failure);
      expect(result, 'to be null');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="formatAssertionFailure"`
Expected: FAIL - module does not exist

**Step 3: Implement formatAssertionFailure**

Create `src/assertion/format-assertion-failure.ts`:

```typescript
/**
 * Utility for formatting AssertionFailure objects with custom diff support.
 *
 * @packageDocumentation
 */

import type { AssertionFailure } from './assertion-types.js';

import { generateDiff, shouldGenerateDiff } from '../diff.js';

/**
 * Formats an AssertionFailure into a diff string for error output.
 *
 * Precedence:
 *
 * 1. `diff` property - returned as-is
 * 2. `formatActual`/`formatExpected` - used to serialize values for jest-diff
 * 3. Default - uses jest-diff with raw actual/expected values
 *
 * @param failure - The AssertionFailure to format
 * @returns Formatted diff string, or null if no diff can be generated
 */
export const formatAssertionFailure = (
  failure: AssertionFailure,
): string | null => {
  const { actual, diff, diffOptions, expected, formatActual, formatExpected } =
    failure;

  // Precedence 1: Pre-computed diff string
  if (diff !== undefined) {
    return diff;
  }

  // Need both actual and expected for diff generation
  if (!shouldGenerateDiff(actual, expected)) {
    return null;
  }

  // Precedence 2: Custom formatters
  const formattedActual = formatActual ? formatActual(actual) : actual;
  const formattedExpected = formatExpected
    ? formatExpected(expected)
    : expected;

  // Precedence 3: Default jest-diff
  return generateDiff(formattedExpected, formattedActual, {
    aAnnotation: 'expected',
    bAnnotation: 'actual',
    expand: false,
    includeChangeCounts: true,
    ...diffOptions,
  });
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --test-name-pattern="formatAssertionFailure"`
Expected: PASS

**Step 5: Verify build**

Run: `npm run build`
Expected: No errors

**Step 6: Commit**

```bash
git add src/assertion/format-assertion-failure.ts test/assertion/format-assertion-failure.test.ts
git commit -m "feat(diff): add formatAssertionFailure utility

Implements diff generation for AssertionFailure objects with precedence:
1. diff property - returned as-is
2. formatActual/formatExpected - custom serializers for jest-diff
3. Default - raw values to jest-diff"
```

---

## Task 4: Integrate formatAssertionFailure into Sync Execution

**Files:**

- Modify: `src/assertion/assertion-sync.ts:249-257`
- Test: `test/assertion/assertion-sync-diff.test.ts`

**Step 1: Write failing integration test**

Create `test/assertion/assertion-sync-diff.test.ts`:

```typescript
import { describe, it } from 'node:test';

import { AssertionError } from '../../src/error.js';
import { expect } from '../../src/index.js';
import { createAssertion } from '../../src/assertion/create.js';
import { z } from 'zod/v4';

describe('sync assertion execution with custom diff', () => {
  describe('AssertionFailure with diff property', () => {
    it('should include custom diff in error message', () => {
      const customDiffAssertion = createAssertion(
        [z.string(), 'to have custom diff with', z.string()],
        (actual, expected) => ({
          actual,
          diff: `Custom:\n  want: ${expected}\n  got:  ${actual}`,
          expected,
          message: 'Values differ',
        }),
      );

      try {
        expect('foo', 'to have custom diff with', 'bar', [customDiffAssertion]);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
        expect((err as AssertionError).message, 'to contain', 'Custom:');
        expect((err as AssertionError).message, 'to contain', 'want: bar');
        expect((err as AssertionError).message, 'to contain', 'got:  foo');
      }
    });
  });

  describe('AssertionFailure with formatters', () => {
    it('should use formatActual in diff output', () => {
      const formatterAssertion = createAssertion(
        [z.unknown(), 'to format as', z.unknown()],
        (actual, expected) => ({
          actual,
          expected,
          formatActual: (v) => `[ACTUAL:${JSON.stringify(v)}]`,
          message: 'Formatted comparison failed',
        }),
      );

      try {
        expect({ a: 1 }, 'to format as', { a: 2 }, [formatterAssertion]);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
        expect((err as AssertionError).message, 'to contain', '[ACTUAL:');
      }
    });

    it('should use formatExpected in diff output', () => {
      const formatterAssertion = createAssertion(
        [z.unknown(), 'to format expected as', z.unknown()],
        (actual, expected) => ({
          actual,
          expected,
          formatExpected: (v) => `[EXPECTED:${JSON.stringify(v)}]`,
          message: 'Formatted comparison failed',
        }),
      );

      try {
        expect({ a: 1 }, 'to format expected as', { a: 2 }, [
          formatterAssertion,
        ]);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
        expect((err as AssertionError).message, 'to contain', '[EXPECTED:');
      }
    });
  });

  describe('AssertionFailure with diffOptions', () => {
    it('should respect diffOptions', () => {
      const optionsAssertion = createAssertion(
        [z.unknown(), 'to diff with options', z.unknown()],
        (actual, expected) => ({
          actual,
          diffOptions: { expand: true },
          expected,
          message: 'Diff with options',
        }),
      );

      try {
        expect({ a: 1, b: 2 }, 'to diff with options', { a: 1, b: 3 }, [
          optionsAssertion,
        ]);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
        // Just verify it doesn't crash - diffOptions are passed through
      }
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="sync assertion execution with custom diff"`
Expected: FAIL - custom diff not appearing in error message

**Step 3: Update assertion-sync.ts to use formatAssertionFailure**

In `src/assertion/assertion-sync.ts`, add import at top:

```typescript
import { formatAssertionFailure } from './format-assertion-failure.js';
```

Then replace lines 249-257 (the `isAssertionFailure` block) with:

```typescript
    } else if (isAssertionFailure(result)) {
      const diffOutput = formatAssertionFailure(result);
      const baseMessage =
        result.message ??
        `Assertion ${this} failed for arguments: ${inspect(args)}`;
      const message = diffOutput
        ? `${baseMessage}\n${diffOutput}`
        : baseMessage;

      throw new AssertionError({
        actual: result.actual,
        expected: result.expected,
        id: this.id,
        message,
      });
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --test-name-pattern="sync assertion execution with custom diff"`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/assertion/assertion-sync.ts test/assertion/assertion-sync-diff.test.ts
git commit -m "feat(execution): integrate custom diff into sync assertion execution

AssertionFailure results now generate rich diff output using
formatAssertionFailure. Custom diff, formatters, and diffOptions
are all respected with proper precedence."
```

---

## Task 5: Integrate formatAssertionFailure into Async Execution

**Files:**

- Modify: `src/assertion/assertion-async.ts`
- Test: `test/assertion/assertion-async-diff.test.ts`

**Step 1: Locate the AssertionFailure handling in async execution**

Find the equivalent `isAssertionFailure` block in `src/assertion/assertion-async.ts`.

**Step 2: Write failing integration test**

Create `test/assertion/assertion-async-diff.test.ts`:

```typescript
import { describe, it } from 'node:test';

import { AssertionError } from '../../src/error.js';
import { expectAsync } from '../../src/index.js';
import { createAsyncAssertion } from '../../src/assertion/create.js';
import { z } from 'zod/v4';

describe('async assertion execution with custom diff', () => {
  describe('AssertionFailure with diff property', () => {
    it('should include custom diff in error message', async () => {
      const customDiffAssertion = createAsyncAssertion(
        [z.promise(z.string()), 'to async diff with', z.string()],
        async (actualPromise, expected) => {
          const actual = await actualPromise;
          return {
            actual,
            diff: `Async Custom:\n  want: ${expected}\n  got:  ${actual}`,
            expected,
            message: 'Async values differ',
          };
        },
      );

      try {
        await expectAsync(Promise.resolve('foo'), 'to async diff with', 'bar', [
          customDiffAssertion,
        ]);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
        expect((err as AssertionError).message, 'to contain', 'Async Custom:');
      }
    });
  });

  describe('AssertionFailure with formatters', () => {
    it('should use formatActual in diff output', async () => {
      const formatterAssertion = createAsyncAssertion(
        [z.promise(z.unknown()), 'to async format as', z.unknown()],
        async (actualPromise, expected) => {
          const actual = await actualPromise;
          return {
            actual,
            expected,
            formatActual: (v) => `[ASYNC_ACTUAL:${JSON.stringify(v)}]`,
            message: 'Async formatted comparison failed',
          };
        },
      );

      try {
        await expectAsync(
          Promise.resolve({ a: 1 }),
          'to async format as',
          { a: 2 },
          [formatterAssertion],
        );
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
        expect((err as AssertionError).message, 'to contain', '[ASYNC_ACTUAL:');
      }
    });
  });
});

// Need to import expect for sync assertions in the test
import { expect } from '../../src/index.js';
```

**Step 3: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="async assertion execution with custom diff"`
Expected: FAIL - custom diff not appearing in error message

**Step 4: Update assertion-async.ts to use formatAssertionFailure**

Add import at top of `src/assertion/assertion-async.ts`:

```typescript
import { formatAssertionFailure } from './format-assertion-failure.js';
```

Find the `isAssertionFailure(result)` block in `executeAsync` method and update it similarly:

```typescript
    } else if (isAssertionFailure(result)) {
      const diffOutput = formatAssertionFailure(result);
      const baseMessage =
        result.message ??
        `Assertion ${this} failed for arguments: ${inspect(args)}`;
      const message = diffOutput
        ? `${baseMessage}\n${diffOutput}`
        : baseMessage;

      throw new AssertionError({
        actual: result.actual,
        expected: result.expected,
        id: this.id,
        message,
      });
```

**Step 5: Run test to verify it passes**

Run: `npm test -- --test-name-pattern="async assertion execution with custom diff"`
Expected: PASS

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/assertion/assertion-async.ts test/assertion/assertion-async-diff.test.ts
git commit -m "feat(execution): integrate custom diff into async assertion execution

Async assertions now also support custom diff output via AssertionFailure
properties, matching the sync implementation."
```

---

## Task 6: Export New Types and Update Public API

**Files:**

- Modify: `src/types.ts` or `src/index.ts` (verify DiffOptions is exported)

**Step 1: Verify DiffOptions is publicly accessible**

Check if `DiffOptions` needs to be re-exported from `src/index.ts` for user consumption.

**Step 2: Update exports if needed**

If `DiffOptions` is not already exported, add to `src/index.ts`:

```typescript
export type { DiffOptions } from './diff.js';
```

**Step 3: Verify build and types**

Run: `npm run build`
Run: `npm run lint`
Expected: No errors

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat(api): export DiffOptions type for custom diff configuration"
```

---

## Task 7: Add Documentation Examples

**Files:**

- Modify: `src/assertion/assertion-types.ts` (JSDoc examples already added in Task 1)

**Step 1: Verify JSDoc examples compile**

The examples in the JSDoc should be valid TypeScript. Run:

Run: `npm run build`
Expected: No errors

**Step 2: Consider adding to custom assertions guide**

If there's a `docs/custom-assertions/` guide, consider adding a section about custom diff output. This is optional documentation work.

**Step 3: Final commit**

```bash
git add -A
git commit -m "docs: finalize custom diff API implementation"
```

---

## Summary

After completing all tasks, the following capabilities will be available:

1. **Pre-computed diff**: Return `diff: string` to bypass jest-diff entirely
2. **Custom formatters**: Return `formatActual`/`formatExpected` functions to customize serialization
3. **Diff options**: Return `diffOptions` to configure jest-diff behavior
4. **Full backwards compatibility**: Existing assertions work unchanged

Users can build reusable "DiffStrategy" patterns on top of these primitives in userland.
