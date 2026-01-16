# @bupkis/rxjs Property Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add comprehensive property-based tests for all 13 assertions in @bupkis/rxjs using @bupkis/property-testing and fast-check.

**Architecture:** Export individual assertion constants from `assertions.ts` (without adding to public API in `index.ts`), then create `test/property.test.ts` following the pattern established in `@bupkis/events`. Each assertion gets a `PropertyTestConfig` with valid/invalid generators that exercise diverse random inputs.

**Tech Stack:** @bupkis/property-testing, fast-check, node:test, rxjs (of, throwError, EMPTY, Subject)

---

## CRITICAL: Avoiding Timeout Traps in Async Tests

> **WARNING:** Be extremely careful when testing scenarios where "nothing happens" in async contexts.

### The Problem

Unlike `@bupkis/events` which has trigger-based assertions that can timeout waiting for events, all RxJS assertions in this package use **cold Observables** that complete synchronously (via `of()`, `throwError()`, `EMPTY`). This means:

1. **`of(...values)`** - Emits all values synchronously then completes
2. **`throwError(() => err)`** - Emits error synchronously
3. **`EMPTY`** - Completes immediately with no emissions

**There are NO timeout-based assertions in @bupkis/rxjs** - the Observable either completes/errors or it doesn't. If you were to use a `Subject` that never completes, the test would hang forever waiting.

### The Rule

**SKIP property tests for scenarios that would require waiting for "nothing to happen".**

For this package, we're safe because:
- All test Observables use `of()`, `throwError()`, or `EMPTY` which complete synchronously
- We never create Observables that hang indefinitely

However, if you encounter a situation where the "invalid" case would require waiting for a timeout (e.g., an Observable that never emits), **do not write that test**. The valid case provides sufficient coverage, and timeout-based invalid tests will:
- Make the test suite painfully slow (50 runs × timeout = minutes of waiting)
- Provide minimal additional confidence
- Be flaky in CI environments

### What This Means for Implementation

All configs in this plan use synchronously-completing Observables, so you're safe. But if you're tempted to test something like "Observable that never emits should fail the assertion" - **don't**. That's a timeout trap.

---

## Task 1: Export Individual Assertions from assertions.ts

**Files:**
- Modify: `packages/rxjs/src/assertions.ts:705-719`

**Step 1: Add named exports for all assertion constants**

At the end of `assertions.ts`, after the `rxjsAssertions` array export, add individual named exports:

```typescript
// Named exports for property testing (not re-exported from index.ts)
export {
  toBeEmptyAssertion,
  toCompleteAssertion,
  toCompleteWithValueAssertion,
  toCompleteWithValuesAssertion,
  toCompleteWithValueSatisfyingAssertion,
  toEmitErrorAssertion,
  toEmitErrorSatisfyingAssertion,
  toEmitErrorWithMessageAssertion,
  toEmitOnceAssertion,
  toEmitThriceAssertion,
  toEmitTimesAssertion,
  toEmitTwiceAssertion,
  toEmitValuesAssertion,
};
```

**Step 2: Verify index.ts does NOT re-export these**

Run: `grep -n "toCompleteAssertion\|toEmitErrorAssertion" packages/rxjs/src/index.ts`
Expected: No matches (these should NOT be in index.ts)

**Step 3: Verify build still works**

Run: `npm run build -w @bupkis/rxjs`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/rxjs/src/assertions.ts
git commit -m "feat(rxjs): export individual assertion constants for property testing"
```

---

## Task 2: Add Property Testing Dependencies

**Files:**
- Modify: `packages/rxjs/package.json`

**Step 1: Add devDependencies**

Add to the `devDependencies` section:

```json
"@bupkis/property-testing": "0.15.0",
"fast-check": "^4.5.2"
```

**Step 2: Install dependencies**

Run: `npm install`
Expected: Dependencies install successfully

**Step 3: Commit**

```bash
git add packages/rxjs/package.json package-lock.json
git commit -m "chore(rxjs): add property testing dependencies"
```

---

## Task 3: Create Property Test File Scaffold

**Files:**
- Create: `packages/rxjs/test/property.test.ts`

**Step 1: Write the test file scaffold with imports and harness setup**

```typescript
/**
 * Property-based tests for @bupkis/rxjs assertions.
 *
 * Uses fast-check to generate random inputs and validates that assertions
 * behave correctly across the input space.
 */

import {
  createPropertyTestHarness,
  extractPhrases,
  filteredObject,
  getVariants,
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from '@bupkis/property-testing';
import { use } from 'bupkis';
import fc from 'fast-check';
import { describe, it } from 'node:test';
import { EMPTY, of, Subject, throwError } from 'rxjs';

import * as assertions from '../src/assertions.js';

const { expectAsync } = use(assertions.rxjsAssertions);
const { runVariant } = createPropertyTestHarness({ expectAsync });

// Use 'small' run size to keep tests fast
const testConfigDefaults: PropertyTestConfigParameters = {
  runSize: 'small',
} as const;

// ─────────────────────────────────────────────────────────────
// HELPER ARBITRARIES
// ─────────────────────────────────────────────────────────────

// Diverse values for Observable emissions
const valueArbitrary = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.boolean(),
  fc.double({ noNaN: true }),
  fc.constant(null),
  fc.constant(undefined),
);

// Array of diverse values (for multi-emission tests)
const valuesArbitrary = fc.array(valueArbitrary, { maxLength: 10, minLength: 0 });

// Non-empty array of values
const nonEmptyValuesArbitrary = fc.array(valueArbitrary, { maxLength: 10, minLength: 1 });

// Random Error instances with varied types
const errorArbitrary = fc
  .tuple(fc.string(), fc.constantFrom(Error, TypeError, RangeError, SyntaxError))
  .map(([msg, ErrorClass]) => new ErrorClass(msg));

// ─────────────────────────────────────────────────────────────
// ASYNC ASSERTION CONFIGS
// ─────────────────────────────────────────────────────────────

// Note: All RxJS assertions are async since Observable operations
// are inherently asynchronous.

const asyncTestConfigs = new Map<
  (typeof assertions.rxjsAssertions)[number],
  PropertyTestConfig
>([
  // Configs will be added in subsequent tasks
]);

// ─────────────────────────────────────────────────────────────
// TEST HARNESS
// ─────────────────────────────────────────────────────────────

describe('@bupkis/rxjs Property Tests', () => {
  describe('Async Assertions', () => {
    for (const [assertion, testConfig] of asyncTestConfigs) {
      const { id } = assertion;
      const { params, variants } = getVariants(testConfig);
      describe(`Assertion: ${assertion} [${id}]`, () => {
        for (const [name, variant] of variants) {
          it(`should pass ${name} checks [${id}]`, async () => {
            await runVariant(
              variant,
              testConfigDefaults,
              params,
              name,
              assertion,
            );
          });
        }
      });
    }
  });
});
```

**Step 2: Verify the test file compiles**

Run: `npx tsc --noEmit -p packages/rxjs/tsconfig.json`
Expected: No type errors

**Step 3: Run the (empty) test to verify harness works**

Run: `npm test -w @bupkis/rxjs -- --test-name-pattern="Property Tests"`
Expected: Test suite runs (0 tests, since configs map is empty)

**Step 4: Commit**

```bash
git add packages/rxjs/test/property.test.ts
git commit -m "test(rxjs): add property test scaffold"
```

---

## Task 4: Add toCompleteAssertion Config

**Files:**
- Modify: `packages/rxjs/test/property.test.ts`

**Step 1: Add the config to asyncTestConfigs Map**

Insert into the `asyncTestConfigs` Map:

```typescript
// toCompleteAssertion
[
  assertions.toCompleteAssertion,
  {
    valid: {
      async: true,
      generators: nonEmptyValuesArbitrary.chain((values) =>
        fc.tuple(
          fc.constant(of(...values)),
          fc.constantFrom(...extractPhrases(assertions.toCompleteAssertion)),
        ),
      ),
    },
    invalid: {
      async: true,
      generators: errorArbitrary.chain((error) =>
        fc.tuple(
          fc.constant(throwError(() => error)),
          fc.constantFrom(...extractPhrases(assertions.toCompleteAssertion)),
        ),
      ),
    },
  },
],
```

**Step 2: Run tests to verify**

Run: `npm test -w @bupkis/rxjs -- --test-name-pattern="toCompleteAssertion"`
Expected: All 4 variants pass (valid, invalid, validNegated, invalidNegated)

**Step 3: Commit**

```bash
git add packages/rxjs/test/property.test.ts
git commit -m "test(rxjs): add property tests for toCompleteAssertion"
```

---

## Task 5: Add toEmitErrorAssertion Config

**Files:**
- Modify: `packages/rxjs/test/property.test.ts`

**Step 1: Add the config**

```typescript
// toEmitErrorAssertion
[
  assertions.toEmitErrorAssertion,
  {
    valid: {
      async: true,
      generators: errorArbitrary.chain((error) =>
        fc.tuple(
          fc.constant(throwError(() => error)),
          fc.constantFrom(...extractPhrases(assertions.toEmitErrorAssertion)),
        ),
      ),
    },
    invalid: {
      async: true,
      generators: valuesArbitrary.chain((values) =>
        fc.tuple(
          fc.constant(of(...values)),
          fc.constantFrom(...extractPhrases(assertions.toEmitErrorAssertion)),
        ),
      ),
    },
  },
],
```

**Step 2: Run tests**

Run: `npm test -w @bupkis/rxjs -- --test-name-pattern="toEmitErrorAssertion"`
Expected: All 4 variants pass

**Step 3: Commit**

```bash
git add packages/rxjs/test/property.test.ts
git commit -m "test(rxjs): add property tests for toEmitErrorAssertion"
```

---

## Task 6: Add toEmitErrorWithMessageAssertion Config

**Files:**
- Modify: `packages/rxjs/test/property.test.ts`

**Step 1: Add the config**

This assertion takes a string or RegExp message parameter. Test both:

```typescript
// toEmitErrorWithMessageAssertion
[
  assertions.toEmitErrorWithMessageAssertion,
  {
    valid: {
      async: true,
      // Generate random error messages and match them exactly
      generators: fc.string({ minLength: 1 }).chain((message) =>
        fc.tuple(
          fc.constant(throwError(() => new Error(message))),
          fc.constantFrom(
            ...extractPhrases(assertions.toEmitErrorWithMessageAssertion),
          ),
          fc.constant(message),
        ),
      ),
    },
    invalid: {
      async: true,
      // Generate mismatched messages
      generators: fc
        .tuple(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
        )
        .filter(([actual, expected]) => actual !== expected)
        .chain(([actualMsg, expectedMsg]) =>
          fc.tuple(
            fc.constant(throwError(() => new Error(actualMsg))),
            fc.constantFrom(
              ...extractPhrases(assertions.toEmitErrorWithMessageAssertion),
            ),
            fc.constant(expectedMsg),
          ),
        ),
    },
  },
],
```

**Step 2: Run tests**

Run: `npm test -w @bupkis/rxjs -- --test-name-pattern="toEmitErrorWithMessageAssertion"`
Expected: All 4 variants pass

**Step 3: Commit**

```bash
git add packages/rxjs/test/property.test.ts
git commit -m "test(rxjs): add property tests for toEmitErrorWithMessageAssertion"
```

---

## Task 7: Add toEmitErrorSatisfyingAssertion Config

**Files:**
- Modify: `packages/rxjs/test/property.test.ts`

**Step 1: Add the config**

```typescript
// toEmitErrorSatisfyingAssertion
[
  assertions.toEmitErrorSatisfyingAssertion,
  {
    valid: {
      async: true,
      generators: fc
        .tuple(
          fc.string({ minLength: 1 }),
          fc.constantFrom(Error, TypeError, RangeError),
        )
        .chain(([message, ErrorClass]) =>
          fc.tuple(
            fc.constant(throwError(() => new ErrorClass(message))),
            fc.constantFrom(
              ...extractPhrases(assertions.toEmitErrorSatisfyingAssertion),
            ),
            fc.constant({ message }),
          ),
        ),
    },
    invalid: {
      async: true,
      // Error has different message than spec expects
      generators: fc
        .tuple(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
        )
        .filter(([actual, expected]) => actual !== expected)
        .chain(([actualMsg, expectedMsg]) =>
          fc.tuple(
            fc.constant(throwError(() => new Error(actualMsg))),
            fc.constantFrom(
              ...extractPhrases(assertions.toEmitErrorSatisfyingAssertion),
            ),
            fc.constant({ message: expectedMsg }),
          ),
        ),
    },
  },
],
```

**Step 2: Run tests**

Run: `npm test -w @bupkis/rxjs -- --test-name-pattern="toEmitErrorSatisfyingAssertion"`
Expected: All 4 variants pass

**Step 3: Commit**

```bash
git add packages/rxjs/test/property.test.ts
git commit -m "test(rxjs): add property tests for toEmitErrorSatisfyingAssertion"
```

---

## Task 8: Add toEmitValuesAssertion Config

**Files:**
- Modify: `packages/rxjs/test/property.test.ts`

**Step 1: Add the config**

```typescript
// toEmitValuesAssertion
[
  assertions.toEmitValuesAssertion,
  {
    valid: {
      async: true,
      generators: valuesArbitrary.chain((values) =>
        fc.tuple(
          fc.constant(of(...values)),
          fc.constantFrom(...extractPhrases(assertions.toEmitValuesAssertion)),
          fc.constant(values),
        ),
      ),
    },
    invalid: {
      async: true,
      // Generate different actual vs expected values
      generators: fc
        .tuple(valuesArbitrary, valuesArbitrary)
        .filter(
          ([actual, expected]) =>
            JSON.stringify(actual) !== JSON.stringify(expected),
        )
        .chain(([actualValues, expectedValues]) =>
          fc.tuple(
            fc.constant(of(...actualValues)),
            fc.constantFrom(...extractPhrases(assertions.toEmitValuesAssertion)),
            fc.constant(expectedValues),
          ),
        ),
    },
  },
],
```

**Step 2: Run tests**

Run: `npm test -w @bupkis/rxjs -- --test-name-pattern="toEmitValuesAssertion"`
Expected: All 4 variants pass

**Step 3: Commit**

```bash
git add packages/rxjs/test/property.test.ts
git commit -m "test(rxjs): add property tests for toEmitValuesAssertion"
```

---

## Task 9: Add toEmitTimesAssertion Config

**Files:**
- Modify: `packages/rxjs/test/property.test.ts`

**Step 1: Add the config**

```typescript
// toEmitTimesAssertion
[
  assertions.toEmitTimesAssertion,
  {
    valid: {
      async: true,
      generators: fc.integer({ min: 0, max: 10 }).chain((count) => {
        const values = Array.from({ length: count }, (_, i) => i);
        return fc.tuple(
          fc.constant(of(...values)),
          fc.constantFrom(...extractPhrases(assertions.toEmitTimesAssertion)),
          fc.constant(count),
        );
      }),
    },
    invalid: {
      async: true,
      generators: fc
        .tuple(
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 0, max: 10 }),
        )
        .filter(([actual, expected]) => actual !== expected)
        .chain(([actualCount, expectedCount]) => {
          const values = Array.from({ length: actualCount }, (_, i) => i);
          return fc.tuple(
            fc.constant(of(...values)),
            fc.constantFrom(...extractPhrases(assertions.toEmitTimesAssertion)),
            fc.constant(expectedCount),
          );
        }),
    },
  },
],
```

**Step 2: Run tests**

Run: `npm test -w @bupkis/rxjs -- --test-name-pattern="toEmitTimesAssertion"`
Expected: All 4 variants pass

**Step 3: Commit**

```bash
git add packages/rxjs/test/property.test.ts
git commit -m "test(rxjs): add property tests for toEmitTimesAssertion"
```

---

## Task 10: Add Count Assertions Configs (toEmitOnce, toEmitTwice, toEmitThrice)

**Files:**
- Modify: `packages/rxjs/test/property.test.ts`

**Step 1: Add all three configs**

```typescript
// toEmitOnceAssertion
[
  assertions.toEmitOnceAssertion,
  {
    valid: {
      async: true,
      generators: valueArbitrary.chain((value) =>
        fc.tuple(
          fc.constant(of(value)),
          fc.constantFrom(...extractPhrases(assertions.toEmitOnceAssertion)),
        ),
      ),
    },
    invalid: {
      async: true,
      // Emit 0, 2, or more values (not exactly 1)
      generators: fc
        .integer({ min: 0, max: 5 })
        .filter((count) => count !== 1)
        .chain((count) => {
          const values = Array.from({ length: count }, (_, i) => i);
          return fc.tuple(
            fc.constant(of(...values)),
            fc.constantFrom(...extractPhrases(assertions.toEmitOnceAssertion)),
          );
        }),
    },
  },
],

// toEmitTwiceAssertion
[
  assertions.toEmitTwiceAssertion,
  {
    valid: {
      async: true,
      generators: fc.tuple(valueArbitrary, valueArbitrary).chain(([v1, v2]) =>
        fc.tuple(
          fc.constant(of(v1, v2)),
          fc.constantFrom(...extractPhrases(assertions.toEmitTwiceAssertion)),
        ),
      ),
    },
    invalid: {
      async: true,
      generators: fc
        .integer({ min: 0, max: 5 })
        .filter((count) => count !== 2)
        .chain((count) => {
          const values = Array.from({ length: count }, (_, i) => i);
          return fc.tuple(
            fc.constant(of(...values)),
            fc.constantFrom(...extractPhrases(assertions.toEmitTwiceAssertion)),
          );
        }),
    },
  },
],

// toEmitThriceAssertion
[
  assertions.toEmitThriceAssertion,
  {
    valid: {
      async: true,
      generators: fc
        .tuple(valueArbitrary, valueArbitrary, valueArbitrary)
        .chain(([v1, v2, v3]) =>
          fc.tuple(
            fc.constant(of(v1, v2, v3)),
            fc.constantFrom(...extractPhrases(assertions.toEmitThriceAssertion)),
          ),
        ),
    },
    invalid: {
      async: true,
      generators: fc
        .integer({ min: 0, max: 5 })
        .filter((count) => count !== 3)
        .chain((count) => {
          const values = Array.from({ length: count }, (_, i) => i);
          return fc.tuple(
            fc.constant(of(...values)),
            fc.constantFrom(...extractPhrases(assertions.toEmitThriceAssertion)),
          );
        }),
    },
  },
],
```

**Step 2: Run tests**

Run: `npm test -w @bupkis/rxjs -- --test-name-pattern="toEmit(Once|Twice|Thrice)Assertion"`
Expected: All 12 variants pass (4 each for 3 assertions)

**Step 3: Commit**

```bash
git add packages/rxjs/test/property.test.ts
git commit -m "test(rxjs): add property tests for count assertions (once, twice, thrice)"
```

---

## Task 11: Add toBeEmptyAssertion Config

**Files:**
- Modify: `packages/rxjs/test/property.test.ts`

**Step 1: Add the config**

```typescript
// toBeEmptyAssertion
[
  assertions.toBeEmptyAssertion,
  {
    valid: {
      async: true,
      // EMPTY is always empty, but vary the phrase
      generators: fc.constant(null).chain(() =>
        fc.tuple(
          fc.constant(EMPTY),
          fc.constantFrom(...extractPhrases(assertions.toBeEmptyAssertion)),
        ),
      ),
    },
    invalid: {
      async: true,
      // Emit at least one value
      generators: nonEmptyValuesArbitrary.chain((values) =>
        fc.tuple(
          fc.constant(of(...values)),
          fc.constantFrom(...extractPhrases(assertions.toBeEmptyAssertion)),
        ),
      ),
    },
  },
],
```

**Step 2: Run tests**

Run: `npm test -w @bupkis/rxjs -- --test-name-pattern="toBeEmptyAssertion"`
Expected: All 4 variants pass

**Step 3: Commit**

```bash
git add packages/rxjs/test/property.test.ts
git commit -m "test(rxjs): add property tests for toBeEmptyAssertion"
```

---

## Task 12: Add toCompleteWithValueAssertion Config

**Files:**
- Modify: `packages/rxjs/test/property.test.ts`

**Step 1: Add the config**

```typescript
// toCompleteWithValueAssertion
[
  assertions.toCompleteWithValueAssertion,
  {
    valid: {
      async: true,
      // Generate values array and check last value matches
      generators: nonEmptyValuesArbitrary.chain((values) => {
        const lastValue = values[values.length - 1];
        return fc.tuple(
          fc.constant(of(...values)),
          fc.constantFrom(
            ...extractPhrases(assertions.toCompleteWithValueAssertion),
          ),
          fc.constant(lastValue),
        );
      }),
    },
    invalid: {
      async: true,
      // Last value doesn't match expected
      generators: fc
        .tuple(nonEmptyValuesArbitrary, valueArbitrary)
        .filter(([values, expected]) => {
          const lastValue = values[values.length - 1];
          return !Object.is(lastValue, expected);
        })
        .chain(([values, expected]) =>
          fc.tuple(
            fc.constant(of(...values)),
            fc.constantFrom(
              ...extractPhrases(assertions.toCompleteWithValueAssertion),
            ),
            fc.constant(expected),
          ),
        ),
    },
  },
],
```

**Step 2: Run tests**

Run: `npm test -w @bupkis/rxjs -- --test-name-pattern="toCompleteWithValueAssertion"`
Expected: All 4 variants pass

**Step 3: Commit**

```bash
git add packages/rxjs/test/property.test.ts
git commit -m "test(rxjs): add property tests for toCompleteWithValueAssertion"
```

---

## Task 13: Add toCompleteWithValuesAssertion Config

**Files:**
- Modify: `packages/rxjs/test/property.test.ts`

**Step 1: Add the config**

```typescript
// toCompleteWithValuesAssertion
[
  assertions.toCompleteWithValuesAssertion,
  {
    valid: {
      async: true,
      generators: valuesArbitrary.chain((values) =>
        fc.tuple(
          fc.constant(of(...values)),
          fc.constantFrom(
            ...extractPhrases(assertions.toCompleteWithValuesAssertion),
          ),
          fc.constant(values),
        ),
      ),
    },
    invalid: {
      async: true,
      generators: fc
        .tuple(valuesArbitrary, valuesArbitrary)
        .filter(
          ([actual, expected]) =>
            JSON.stringify(actual) !== JSON.stringify(expected),
        )
        .chain(([actualValues, expectedValues]) =>
          fc.tuple(
            fc.constant(of(...actualValues)),
            fc.constantFrom(
              ...extractPhrases(assertions.toCompleteWithValuesAssertion),
            ),
            fc.constant(expectedValues),
          ),
        ),
    },
  },
],
```

**Step 2: Run tests**

Run: `npm test -w @bupkis/rxjs -- --test-name-pattern="toCompleteWithValuesAssertion"`
Expected: All 4 variants pass

**Step 3: Commit**

```bash
git add packages/rxjs/test/property.test.ts
git commit -m "test(rxjs): add property tests for toCompleteWithValuesAssertion"
```

---

## Task 14: Add toCompleteWithValueSatisfyingAssertion Config

**Files:**
- Modify: `packages/rxjs/test/property.test.ts`

**Step 1: Add the config**

```typescript
// toCompleteWithValueSatisfyingAssertion
[
  assertions.toCompleteWithValueSatisfyingAssertion,
  {
    valid: {
      async: true,
      // Generate objects and check partial match
      generators: fc
        .tuple(
          fc.string({ minLength: 1 }),
          fc.integer(),
          fc.string(),
        )
        .chain(([status, count, extra]) => {
          const obj = { status, count, extra };
          return fc.tuple(
            fc.constant(of(obj)),
            fc.constantFrom(
              ...extractPhrases(assertions.toCompleteWithValueSatisfyingAssertion),
            ),
            fc.constant({ status }), // Partial match on status only
          );
        }),
    },
    invalid: {
      async: true,
      // Spec doesn't match actual value
      generators: fc
        .tuple(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
        )
        .filter(([actual, expected]) => actual !== expected)
        .chain(([actualStatus, expectedStatus]) =>
          fc.tuple(
            fc.constant(of({ status: actualStatus })),
            fc.constantFrom(
              ...extractPhrases(assertions.toCompleteWithValueSatisfyingAssertion),
            ),
            fc.constant({ status: expectedStatus }),
          ),
        ),
    },
  },
],
```

**Step 2: Run tests**

Run: `npm test -w @bupkis/rxjs -- --test-name-pattern="toCompleteWithValueSatisfyingAssertion"`
Expected: All 4 variants pass

**Step 3: Commit**

```bash
git add packages/rxjs/test/property.test.ts
git commit -m "test(rxjs): add property tests for toCompleteWithValueSatisfyingAssertion"
```

---

## Task 15: Run Full Test Suite and Lint

**Files:**
- None (verification only)

**Step 1: Run all property tests**

Run: `npm test -w @bupkis/rxjs -- --test-name-pattern="Property Tests"`
Expected: All 52 tests pass (13 assertions × 4 variants each)

**Step 2: Run ESLint**

Run: `npm run lint -w @bupkis/rxjs`
Expected: No lint errors

**Step 3: Run full test suite including existing tests**

Run: `npm test -w @bupkis/rxjs`
Expected: All tests pass (existing + property tests)

**Step 4: Commit any lint fixes if needed**

```bash
git add packages/rxjs/test/property.test.ts
git commit -m "style(rxjs): fix lint issues in property tests"
```

---

## Task 16: Final Verification and Summary Commit

**Step 1: Verify build**

Run: `npm run build -w @bupkis/rxjs`
Expected: Build succeeds

**Step 2: Run entire workspace test suite**

Run: `npm test`
Expected: All workspace tests pass

**Step 3: Create summary commit if multiple small fixes were needed**

Only if there were additional small fixes not covered by previous commits:

```bash
git add -A
git commit -m "test(rxjs): complete property test implementation"
```

---

## Summary

This plan adds comprehensive property-based tests for all 13 RxJS assertions:

| Assertion | Test Focus |
|-----------|------------|
| `toCompleteAssertion` | Completing vs erroring Observables |
| `toEmitErrorAssertion` | Erroring vs completing Observables |
| `toEmitErrorWithMessageAssertion` | Error message matching (string) |
| `toEmitErrorSatisfyingAssertion` | Error object partial matching |
| `toEmitValuesAssertion` | Exact value array matching |
| `toEmitTimesAssertion` | Emission count (parametric) |
| `toEmitOnceAssertion` | Exactly 1 emission |
| `toEmitTwiceAssertion` | Exactly 2 emissions |
| `toEmitThriceAssertion` | Exactly 3 emissions |
| `toBeEmptyAssertion` | Zero emissions (EMPTY) |
| `toCompleteWithValueAssertion` | Last value matching |
| `toCompleteWithValuesAssertion` | All values matching |
| `toCompleteWithValueSatisfyingAssertion` | Last value partial matching |

Each assertion gets 4 test variants: valid, invalid, validNegated, invalidNegated.

**Total: 52 property test cases** (13 assertions × 4 variants)
