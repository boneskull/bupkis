/**
 * Property-based tests for @bupkis/rxjs assertions.
 *
 * Uses fast-check to generate random inputs and validates that assertions
 * behave correctly across the input space.
 */

import {
  createPropertyTestHarness,
  diverseValueArbitrary,
  extractPhrases,
  getVariants,
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
  safeRegexStringFilter,
} from '@bupkis/property-testing';
import { use } from 'bupkis';
import fc from 'fast-check';
import { describe, it } from 'node:test';
import { EMPTY, of, throwError } from 'rxjs';

import * as assertions from '../src/assertions.js';

const { expect, expectAsync } = use(assertions.rxjsAssertions);
const { runVariant } = createPropertyTestHarness({ expect, expectAsync });

// Use a larger run size to shake out more edge cases
const testConfigDefaults: PropertyTestConfigParameters = {
  runSize: process.env.CI ? 'small' : 'medium',
} as const;

// ─────────────────────────────────────────────────────────────
// HELPER ARBITRARIES
// ─────────────────────────────────────────────────────────────

// Diverse values for Observable emissions
const valueArbitrary = diverseValueArbitrary();

// Array of diverse values (for multi-emission tests)
const valuesArbitrary = fc.array(valueArbitrary, {
  maxLength: 30,
  minLength: 0,
});

// Non-empty array of values
const nonEmptyValuesArbitrary = fc.array(valueArbitrary, {
  maxLength: 30,
  minLength: 1,
});

// Random Error instances with varied types
const errorArbitrary: fc.Arbitrary<Error> = fc.oneof(
  fc.string().map((message) => new Error(message)),
  fc.string().map((message) => new TypeError(message)),
  fc.string().map((message) => new RangeError(message)),
  fc.string().map((message) => new SyntaxError(message)),
  fc
    .array(valueArbitrary, { maxLength: 5 })
    .map((errors) => new AggregateError(errors, 'aggregate')),
);

const arraysShallowEqual = (
  actual: readonly unknown[],
  expected: readonly unknown[],
): boolean => {
  if (actual.length !== expected.length) {
    return false;
  }
  for (let i = 0; i < actual.length; i++) {
    if (!Object.is(actual[i], expected[i])) {
      return false;
    }
  }
  return true;
};

const safeRegexPatternArbitrary = fc
  .string({ minLength: 1 })
  .map((value) => safeRegexStringFilter(value))
  .filter((value) => value.length > 0);

// ─────────────────────────────────────────────────────────────
// ASYNC ASSERTION CONFIGS
// ─────────────────────────────────────────────────────────────

// Note: All RxJS assertions are async since Observable operations
// are inherently asynchronous.

const asyncTestConfigs = new Map<
  (typeof assertions.rxjsAssertions)[number],
  PropertyTestConfig
>([
  // toBeEmptyAssertion
  [
    assertions.toBeEmptyAssertion,
    {
      invalid: {
        async: true,
        generators: fc.oneof(
          // Emit at least one value
          nonEmptyValuesArbitrary.chain((values) =>
            fc.tuple(
              fc.constant(of(...values)),
              fc.constantFrom(...extractPhrases(assertions.toBeEmptyAssertion)),
            ),
          ),
          // Emit an error
          errorArbitrary.chain((error) =>
            fc.tuple(
              fc.constant(throwError(() => error)),
              fc.constantFrom(...extractPhrases(assertions.toBeEmptyAssertion)),
            ),
          ),
        ),
      },
      valid: {
        async: true,
        // EMPTY is always empty, but vary the phrase
        generators: fc
          .constant(null)
          .chain(() =>
            fc.tuple(
              fc.constant(EMPTY),
              fc.constantFrom(...extractPhrases(assertions.toBeEmptyAssertion)),
            ),
          ),
      },
    },
  ],

  // toCompleteAssertion
  [
    assertions.toCompleteAssertion,
    {
      invalid: {
        async: true,
        generators: errorArbitrary.chain((error) =>
          fc.tuple(
            fc.constant(throwError(() => error)),
            fc.constantFrom(...extractPhrases(assertions.toCompleteAssertion)),
          ),
        ),
      },
      valid: {
        async: true,
        generators: fc.oneof(
          // Observable that emits values then completes
          nonEmptyValuesArbitrary.chain((values) =>
            fc.tuple(
              fc.constant(of(...values)),
              fc.constantFrom(
                ...extractPhrases(assertions.toCompleteAssertion),
              ),
            ),
          ),
          // Empty Observable that completes immediately (EMPTY)
          fc
            .constant(null)
            .chain(() =>
              fc.tuple(
                fc.constant(EMPTY),
                fc.constantFrom(
                  ...extractPhrases(assertions.toCompleteAssertion),
                ),
              ),
            ),
        ),
      },
    },
  ],

  // toCompleteWithValueAssertion
  [
    assertions.toCompleteWithValueAssertion,
    {
      invalid: {
        async: true,
        generators: fc.oneof(
          // Last value doesn't match expected
          fc
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
          // No values emitted
          valueArbitrary.chain((expected) =>
            fc.tuple(
              fc.constant(EMPTY),
              fc.constantFrom(
                ...extractPhrases(assertions.toCompleteWithValueAssertion),
              ),
              fc.constant(expected),
            ),
          ),
          // Emit an error
          errorArbitrary.chain((error) =>
            valueArbitrary.chain((expected) =>
              fc.tuple(
                fc.constant(throwError(() => error)),
                fc.constantFrom(
                  ...extractPhrases(assertions.toCompleteWithValueAssertion),
                ),
                fc.constant(expected),
              ),
            ),
          ),
        ),
      },
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
    },
  ],

  // toCompleteWithValuesAssertion
  [
    assertions.toCompleteWithValuesAssertion,
    {
      invalid: {
        async: true,
        generators: fc.oneof(
          fc
            .tuple(valuesArbitrary, valuesArbitrary)
            .filter(
              ([actual, expected]) => !arraysShallowEqual(actual, expected),
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
          errorArbitrary.chain((error) =>
            valuesArbitrary.chain((expectedValues) =>
              fc.tuple(
                fc.constant(throwError(() => error)),
                fc.constantFrom(
                  ...extractPhrases(assertions.toCompleteWithValuesAssertion),
                ),
                fc.constant(expectedValues),
              ),
            ),
          ),
        ),
      },
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
    },
  ],

  // toCompleteWithValueSatisfyingAssertion
  [
    assertions.toCompleteWithValueSatisfyingAssertion,
    {
      invalid: {
        async: true,
        // Spec doesn't match actual value
        generators: fc
          .tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }))
          .filter(([actual, expected]) => actual !== expected)
          .chain(([actualStatus, expectedStatus]) =>
            fc.tuple(
              fc.constant(of({ status: actualStatus })),
              fc.constantFrom(
                ...extractPhrases(
                  assertions.toCompleteWithValueSatisfyingAssertion,
                ),
              ),
              fc.constant({ status: expectedStatus }),
            ),
          ),
      },
      valid: {
        async: true,
        // Generate objects and check partial match
        generators: fc
          .tuple(fc.string({ minLength: 1 }), fc.integer(), valueArbitrary)
          .chain(([status, count, extra]) => {
            const obj = { count, extra, status };
            const keys: Array<keyof typeof obj> = ['status', 'count', 'extra'];
            return fc.subarray(keys, { minLength: 1 }).chain((selected) => {
              const spec: Record<string, unknown> = {};
              for (const key of selected) {
                spec[key] = obj[key];
              }
              return fc.tuple(
                fc.constant(of(obj)),
                fc.constantFrom(
                  ...extractPhrases(
                    assertions.toCompleteWithValueSatisfyingAssertion,
                  ),
                ),
                fc.constant(spec),
              );
            });
          }),
      },
    },
  ],

  // toEmitErrorAssertion
  [
    assertions.toEmitErrorAssertion,
    {
      invalid: {
        async: true,
        generators: valuesArbitrary.chain((values) =>
          fc.tuple(
            fc.constant(of(...values)),
            fc.constantFrom(...extractPhrases(assertions.toEmitErrorAssertion)),
          ),
        ),
      },
      valid: {
        async: true,
        generators: errorArbitrary.chain((error) =>
          fc.tuple(
            fc.constant(throwError(() => error)),
            fc.constantFrom(...extractPhrases(assertions.toEmitErrorAssertion)),
          ),
        ),
      },
    },
  ],

  // toEmitErrorSatisfyingAssertion
  [
    assertions.toEmitErrorSatisfyingAssertion,
    {
      invalid: {
        async: true,
        // Error has different message than spec expects
        generators: fc
          .tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }))
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
      valid: {
        async: true,
        generators: fc
          .tuple(
            fc.string({ minLength: 1 }),
            fc.constantFrom(Error, TypeError, RangeError),
          )
          .chain(([message, ErrorClass]) => {
            const error = new ErrorClass(message);
            return fc
              .constantFrom(
                { message },
                { name: error.name },
                { message, name: error.name },
              )
              .chain((spec) =>
                fc.tuple(
                  fc.constant(throwError(() => error)),
                  fc.constantFrom(
                    ...extractPhrases(
                      assertions.toEmitErrorSatisfyingAssertion,
                    ),
                  ),
                  fc.constant(spec),
                ),
              );
          }),
      },
    },
  ],

  // toEmitErrorWithMessageAssertion
  [
    assertions.toEmitErrorWithMessageAssertion,
    {
      invalid: {
        async: true,
        generators: fc.oneof(
          // Generate mismatched message strings
          fc
            .tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }))
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
          // Generate mismatched regex patterns
          fc
            .tuple(safeRegexPatternArbitrary, safeRegexPatternArbitrary)
            .filter(([actual, expected]) => actual !== expected)
            .chain(([actualMsg, expectedPattern]) =>
              fc.tuple(
                fc.constant(throwError(() => new Error(actualMsg))),
                fc.constantFrom(
                  ...extractPhrases(assertions.toEmitErrorWithMessageAssertion),
                ),
                fc.constant(new RegExp(`^${expectedPattern}$`)),
              ),
            ),
        ),
      },
      valid: {
        async: true,
        generators: fc.oneof(
          // Exact string match
          fc
            .string({ minLength: 1 })
            .chain((message) =>
              fc.tuple(
                fc.constant(throwError(() => new Error(message))),
                fc.constantFrom(
                  ...extractPhrases(assertions.toEmitErrorWithMessageAssertion),
                ),
                fc.constant(message),
              ),
            ),
          // RegExp match
          safeRegexPatternArbitrary.chain((pattern) =>
            fc.tuple(
              fc.constant(throwError(() => new Error(pattern))),
              fc.constantFrom(
                ...extractPhrases(assertions.toEmitErrorWithMessageAssertion),
              ),
              fc.constant(new RegExp(pattern)),
            ),
          ),
        ),
      },
    },
  ],

  // toEmitOnceAssertion
  [
    assertions.toEmitOnceAssertion,
    {
      invalid: {
        async: true,
        generators: fc.oneof(
          // Emit 0, 2, or more values (not exactly 1)
          fc
            .integer({ max: 5, min: 0 })
            .filter((count) => count !== 1)
            .chain((count) => {
              const values = Array.from({ length: count }, (_, i) => i);
              return fc.tuple(
                fc.constant(of(...values)),
                fc.constantFrom(
                  ...extractPhrases(assertions.toEmitOnceAssertion),
                ),
              );
            }),
          // Emit an error
          errorArbitrary.chain((error) =>
            fc.tuple(
              fc.constant(throwError(() => error)),
              fc.constantFrom(
                ...extractPhrases(assertions.toEmitOnceAssertion),
              ),
            ),
          ),
        ),
      },
      valid: {
        async: true,
        generators: valueArbitrary.chain((value) =>
          fc.tuple(
            fc.constant(of(value)),
            fc.constantFrom(...extractPhrases(assertions.toEmitOnceAssertion)),
          ),
        ),
      },
    },
  ],

  // toEmitThriceAssertion
  [
    assertions.toEmitThriceAssertion,
    {
      invalid: {
        async: true,
        generators: fc.oneof(
          fc
            .integer({ max: 5, min: 0 })
            .filter((count) => count !== 3)
            .chain((count) => {
              const values = Array.from({ length: count }, (_, i) => i);
              return fc.tuple(
                fc.constant(of(...values)),
                fc.constantFrom(
                  ...extractPhrases(assertions.toEmitThriceAssertion),
                ),
              );
            }),
          errorArbitrary.chain((error) =>
            fc.tuple(
              fc.constant(throwError(() => error)),
              fc.constantFrom(
                ...extractPhrases(assertions.toEmitThriceAssertion),
              ),
            ),
          ),
        ),
      },
      valid: {
        async: true,
        generators: fc
          .tuple(valueArbitrary, valueArbitrary, valueArbitrary)
          .chain(([v1, v2, v3]) =>
            fc.tuple(
              fc.constant(of(v1, v2, v3)),
              fc.constantFrom(
                ...extractPhrases(assertions.toEmitThriceAssertion),
              ),
            ),
          ),
      },
    },
  ],

  // toEmitTimesAssertion
  [
    assertions.toEmitTimesAssertion,
    {
      invalid: {
        async: true,
        generators: fc.oneof(
          fc
            .tuple(
              fc.integer({ max: 10, min: 0 }),
              fc.integer({ max: 10, min: 0 }),
            )
            .filter(([actual, expected]) => actual !== expected)
            .chain(([actualCount, expectedCount]) => {
              const values = Array.from({ length: actualCount }, (_, i) => i);
              return fc.tuple(
                fc.constant(of(...values)),
                fc.constantFrom(
                  ...extractPhrases(assertions.toEmitTimesAssertion),
                ),
                fc.constant(expectedCount),
              );
            }),
          errorArbitrary.chain((error) =>
            fc
              .integer({ max: 10, min: 0 })
              .chain((expectedCount) =>
                fc.tuple(
                  fc.constant(throwError(() => error)),
                  fc.constantFrom(
                    ...extractPhrases(assertions.toEmitTimesAssertion),
                  ),
                  fc.constant(expectedCount),
                ),
              ),
          ),
        ),
      },
      valid: {
        async: true,
        generators: fc.integer({ max: 10, min: 0 }).chain((count) => {
          const values = Array.from({ length: count }, (_, i) => i);
          return fc.tuple(
            fc.constant(of(...values)),
            fc.constantFrom(...extractPhrases(assertions.toEmitTimesAssertion)),
            fc.constant(count),
          );
        }),
      },
    },
  ],

  // toEmitTwiceAssertion
  [
    assertions.toEmitTwiceAssertion,
    {
      invalid: {
        async: true,
        generators: fc.oneof(
          fc
            .integer({ max: 5, min: 0 })
            .filter((count) => count !== 2)
            .chain((count) => {
              const values = Array.from({ length: count }, (_, i) => i);
              return fc.tuple(
                fc.constant(of(...values)),
                fc.constantFrom(
                  ...extractPhrases(assertions.toEmitTwiceAssertion),
                ),
              );
            }),
          errorArbitrary.chain((error) =>
            fc.tuple(
              fc.constant(throwError(() => error)),
              fc.constantFrom(
                ...extractPhrases(assertions.toEmitTwiceAssertion),
              ),
            ),
          ),
        ),
      },
      valid: {
        async: true,
        generators: fc
          .tuple(valueArbitrary, valueArbitrary)
          .chain(([v1, v2]) =>
            fc.tuple(
              fc.constant(of(v1, v2)),
              fc.constantFrom(
                ...extractPhrases(assertions.toEmitTwiceAssertion),
              ),
            ),
          ),
      },
    },
  ],

  // toEmitValuesAssertion
  [
    assertions.toEmitValuesAssertion,
    {
      invalid: {
        async: true,
        generators: fc.oneof(
          // Generate different actual vs expected values
          fc
            .tuple(valuesArbitrary, valuesArbitrary)
            .filter(
              ([actual, expected]) => !arraysShallowEqual(actual, expected),
            )
            .chain(([actualValues, expectedValues]) =>
              fc.tuple(
                fc.constant(of(...actualValues)),
                fc.constantFrom(
                  ...extractPhrases(assertions.toEmitValuesAssertion),
                ),
                fc.constant(expectedValues),
              ),
            ),
          // Emit an error
          errorArbitrary.chain((error) =>
            valuesArbitrary.chain((expectedValues) =>
              fc.tuple(
                fc.constant(throwError(() => error)),
                fc.constantFrom(
                  ...extractPhrases(assertions.toEmitValuesAssertion),
                ),
                fc.constant(expectedValues),
              ),
            ),
          ),
        ),
      },
      valid: {
        async: true,
        generators: valuesArbitrary.chain((values) =>
          fc.tuple(
            fc.constant(of(...values)),
            fc.constantFrom(
              ...extractPhrases(assertions.toEmitValuesAssertion),
            ),
            fc.constant(values),
          ),
        ),
      },
    },
  ],
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
