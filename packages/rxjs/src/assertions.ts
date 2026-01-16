/**
 * RxJS Observable assertions for Bupkis.
 *
 * All assertions in this module are asynchronous since Observable operations
 * are inherently async. Use with `expectAsync.use()` to add these assertions.
 *
 * @packageDocumentation
 */

import type { Observable } from 'rxjs';

import { createAsyncAssertion, schema } from 'bupkis';
import { inspect } from 'node:util';

import { ObservableSchema } from './schema.js';
import { collectObservable } from './util.js';

const { is, keys } = Object;

// #region Completion Assertions

/**
 * Asserts that an Observable completes successfully (without error).
 *
 * @example
 *
 * ```typescript
 * import { of, throwError } from 'rxjs';
 *
 * await expectAsync(of(1, 2, 3), 'to complete'); // passes
 * await expectAsync(
 *   throwError(() => new Error()),
 *   'to complete',
 * ); // fails
 * ```
 */
const toCompleteAssertion = createAsyncAssertion(
  [ObservableSchema, 'to complete'],
  async (observable: Observable<unknown>) => {
    const result = await collectObservable(observable);

    if (!result.completed) {
      if (result.error !== undefined) {
        return {
          actual: result.error,
          expected: 'completion',
          message: `Expected Observable to complete, but it emitted an error`,
        };
      }
      return {
        message: `Expected Observable to complete, but it did not terminate`,
      };
    }
  },
);

// #endregion

// #region Error Assertions

/**
 * Asserts that an Observable emits an error.
 *
 * @example
 *
 * ```typescript
 * import { throwError, of } from 'rxjs';
 *
 * await expectAsync(
 *   throwError(() => new Error('oops')),
 *   'to emit error',
 * ); // passes
 * await expectAsync(of(1, 2, 3), 'to emit error'); // fails
 * ```
 */
const toEmitErrorAssertion = createAsyncAssertion(
  [ObservableSchema, 'to emit error'],
  async (observable: Observable<unknown>) => {
    const result = await collectObservable(observable);

    if (result.error === undefined) {
      if (result.completed) {
        return {
          actual: 'completed successfully',
          expected: 'an error',
          message: `Expected Observable to emit an error, but it completed successfully`,
        };
      }
      return {
        message: `Expected Observable to emit an error, but it did not terminate`,
      };
    }
  },
);

/**
 * Asserts that an Observable emits an error with a specific message.
 *
 * The message parameter can be:
 *
 * - A string for exact message match
 * - A RegExp for pattern matching
 *
 * @example
 *
 * ```typescript
 * import { throwError } from 'rxjs';
 *
 * // Exact message match
 * await expectAsync(
 *   throwError(() => new Error('oops')),
 *   'to emit error',
 *   'oops',
 * ); // passes
 *
 * // RegExp match
 * await expectAsync(
 *   throwError(() => new Error('something went wrong')),
 *   'to emit error',
 *   /went wrong/,
 * ); // passes
 * ```
 */
const toEmitErrorWithMessageAssertion = createAsyncAssertion(
  [
    ObservableSchema,
    'to emit error',
    schema.StringSchema.or(schema.RegexpSchema),
  ],
  async (observable: Observable<unknown>, expected: RegExp | string) => {
    const result = await collectObservable(observable);

    if (result.error === undefined) {
      if (result.completed) {
        return {
          actual: 'completed successfully',
          expected: `an error with message matching ${inspect(expected)}`,
          message: `Expected Observable to emit an error, but it completed successfully`,
        };
      }
      return {
        message: `Expected Observable to emit an error, but it did not terminate`,
      };
    }

    // Get the error message
    const errorMessage =
      result.error instanceof Error
        ? result.error.message
        : inspect(result.error);

    if (typeof expected === 'string') {
      // Exact string match
      if (errorMessage !== expected) {
        return {
          actual: errorMessage,
          expected,
          message: `Expected error message to be ${inspect(expected)}, but got ${inspect(errorMessage)}`,
        };
      }
    } else {
      // RegExp match
      if (!expected.test(errorMessage)) {
        return {
          actual: errorMessage,
          expected: expected.toString(),
          message: `Expected error message to match ${expected}, but got ${inspect(errorMessage)}`,
        };
      }
    }
  },
);

/**
 * Asserts that an Observable emits an error satisfying the given specification.
 *
 * The specification is a partial object that the error must match. All
 * properties in the spec must be present on the error with matching values.
 *
 * @example
 *
 * ```typescript
 * import { throwError } from 'rxjs';
 *
 * await expectAsync(
 *   throwError(() => new TypeError('type error')),
 *   'to emit error satisfying',
 *   { name: 'TypeError' },
 * ); // passes
 *
 * await expectAsync(
 *   throwError(() => new Error('oops')),
 *   'to emit error satisfying',
 *   { message: 'oops' },
 * ); // passes
 * ```
 */
const toEmitErrorSatisfyingAssertion = createAsyncAssertion(
  [ObservableSchema, 'to emit error satisfying', schema.UnknownSchema],
  async (observable: Observable<unknown>, spec: unknown) => {
    const result = await collectObservable(observable);

    if (result.error === undefined) {
      if (result.completed) {
        return {
          actual: 'completed successfully',
          expected: `an error satisfying ${inspect(spec)}`,
          message: `Expected Observable to emit an error, but it completed successfully`,
        };
      }
      return {
        message: `Expected Observable to emit an error, but it did not terminate`,
      };
    }

    // Partial object match
    if (spec !== null && typeof spec === 'object') {
      const error = result.error as Record<string, unknown>;
      const specObj = spec as Record<string, unknown>;

      for (const key of keys(specObj)) {
        if (!is(error[key], specObj[key])) {
          return {
            actual: error[key],
            expected: specObj[key],
            message: `Expected error.${key} to be ${inspect(specObj[key])}, but got ${inspect(error[key])}`,
          };
        }
      }
    }
  },
);

// #endregion

// #region Value Assertions

/**
 * Checks if two arrays are deeply equal using Object.is for element comparison.
 *
 * @function
 * @param actual - The actual array
 * @param expected - The expected array
 * @returns True if arrays are deeply equal
 */
const arraysDeepEqual = (actual: unknown[], expected: unknown[]): boolean => {
  if (actual.length !== expected.length) {
    return false;
  }
  for (let i = 0; i < actual.length; i++) {
    if (!is(actual[i], expected[i])) {
      return false;
    }
  }
  return true;
};

/**
 * Asserts that an Observable emits specific values in order.
 *
 * The Observable must complete successfully and emit exactly the specified
 * values in the same order. Uses strict equality (Object.is) for comparison.
 *
 * @example
 *
 * ```typescript
 * import { of } from 'rxjs';
 *
 * await expectAsync(of('foo', 'bar'), 'to emit values', ['foo', 'bar']); // passes
 * await expectAsync(of(1, 2, 3), 'to emit values', [1, 2]); // fails - different length
 * await expectAsync(of(1, 2), 'to emit values', [2, 1]); // fails - different order
 * ```
 */
const toEmitValuesAssertion = createAsyncAssertion(
  [ObservableSchema, 'to emit values', schema.UnknownArraySchema],
  async (observable: Observable<unknown>, expected: unknown[]) => {
    const result = await collectObservable(observable);

    if (result.error !== undefined) {
      return {
        actual: result.error,
        expected: `values ${inspect(expected)}`,
        message: `Expected Observable to emit values, but it emitted an error`,
      };
    }

    if (!result.completed) {
      return {
        message: `Expected Observable to emit values, but it did not terminate`,
      };
    }

    if (!arraysDeepEqual(result.values, expected)) {
      return {
        actual: result.values,
        expected,
        message: `Expected Observable to emit ${inspect(expected)}, but got ${inspect(result.values)}`,
      };
    }
  },
);

// #endregion

// #region Count Assertions

/**
 * Asserts that an Observable emits a specific number of values before
 * completing.
 *
 * @example
 *
 * ```typescript
 * import { of } from 'rxjs';
 *
 * await expectAsync(of(1, 2, 3), 'to emit times', 3); // passes
 * await expectAsync(of(1, 2, 3), 'to emit times', 2); // fails
 * ```
 */
const toEmitTimesAssertion = createAsyncAssertion(
  [ObservableSchema, 'to emit times', schema.NonNegativeIntegerSchema],
  async (observable: Observable<unknown>, expected: number) => {
    const result = await collectObservable(observable);

    if (result.error !== undefined) {
      return {
        actual: result.error,
        expected: `${expected} emission(s)`,
        message: `Expected Observable to emit ${expected} time(s), but it emitted an error`,
      };
    }

    if (!result.completed) {
      return {
        message: `Expected Observable to emit ${expected} time(s), but it did not terminate`,
      };
    }

    if (result.values.length !== expected) {
      return {
        actual: result.values.length,
        expected,
        message: `Expected Observable to emit ${expected} time(s), but it emitted ${result.values.length} time(s)`,
      };
    }
  },
);

/**
 * Asserts that an Observable emits exactly one value before completing.
 *
 * @example
 *
 * ```typescript
 * import { of } from 'rxjs';
 *
 * await expectAsync(of(42), 'to emit once'); // passes
 * await expectAsync(of(1, 2), 'to emit once'); // fails
 * ```
 */
const toEmitOnceAssertion = createAsyncAssertion(
  [ObservableSchema, 'to emit once'],
  async (observable: Observable<unknown>) => {
    const result = await collectObservable(observable);

    if (result.error !== undefined) {
      return {
        actual: result.error,
        expected: '1 emission',
        message: `Expected Observable to emit once, but it emitted an error`,
      };
    }

    if (!result.completed) {
      return {
        message: `Expected Observable to emit once, but it did not terminate`,
      };
    }

    if (result.values.length !== 1) {
      return {
        actual: result.values.length,
        expected: 1,
        message: `Expected Observable to emit exactly once, but it emitted ${result.values.length} time(s)`,
      };
    }
  },
);

/**
 * Asserts that an Observable emits exactly two values before completing.
 *
 * @example
 *
 * ```typescript
 * import { of } from 'rxjs';
 *
 * await expectAsync(of(1, 2), 'to emit twice'); // passes
 * await expectAsync(of(1), 'to emit twice'); // fails
 * ```
 */
const toEmitTwiceAssertion = createAsyncAssertion(
  [ObservableSchema, 'to emit twice'],
  async (observable: Observable<unknown>) => {
    const result = await collectObservable(observable);

    if (result.error !== undefined) {
      return {
        actual: result.error,
        expected: '2 emissions',
        message: `Expected Observable to emit twice, but it emitted an error`,
      };
    }

    if (!result.completed) {
      return {
        message: `Expected Observable to emit twice, but it did not terminate`,
      };
    }

    if (result.values.length !== 2) {
      return {
        actual: result.values.length,
        expected: 2,
        message: `Expected Observable to emit exactly twice, but it emitted ${result.values.length} time(s)`,
      };
    }
  },
);

/**
 * Asserts that an Observable emits exactly three values before completing.
 *
 * @example
 *
 * ```typescript
 * import { of } from 'rxjs';
 *
 * await expectAsync(of(1, 2, 3), 'to emit thrice'); // passes
 * await expectAsync(of(1, 2), 'to emit thrice'); // fails
 * ```
 */
const toEmitThriceAssertion = createAsyncAssertion(
  [ObservableSchema, 'to emit thrice'],
  async (observable: Observable<unknown>) => {
    const result = await collectObservable(observable);

    if (result.error !== undefined) {
      return {
        actual: result.error,
        expected: '3 emissions',
        message: `Expected Observable to emit thrice, but it emitted an error`,
      };
    }

    if (!result.completed) {
      return {
        message: `Expected Observable to emit thrice, but it did not terminate`,
      };
    }

    if (result.values.length !== 3) {
      return {
        actual: result.values.length,
        expected: 3,
        message: `Expected Observable to emit exactly three times, but it emitted ${result.values.length} time(s)`,
      };
    }
  },
);

/**
 * Asserts that an Observable completes without emitting any values.
 *
 * This is an alias for checking that the Observable emits zero values and
 * completes successfully.
 *
 * @example
 *
 * ```typescript
 * import { EMPTY, of } from 'rxjs';
 *
 * await expectAsync(EMPTY, 'to be empty'); // passes
 * await expectAsync(of(1), 'to be empty'); // fails
 * ```
 */
const toBeEmptyAssertion = createAsyncAssertion(
  [ObservableSchema, ['to be empty', 'to complete without emitting']],
  async (observable: Observable<unknown>) => {
    const result = await collectObservable(observable);

    if (result.error !== undefined) {
      return {
        actual: result.error,
        expected: 'empty Observable',
        message: `Expected Observable to be empty, but it emitted an error`,
      };
    }

    if (!result.completed) {
      return {
        message: `Expected Observable to be empty, but it did not terminate`,
      };
    }

    if (result.values.length !== 0) {
      return {
        actual: result.values.length,
        expected: 0,
        message: `Expected Observable to be empty, but it emitted ${result.values.length} value(s)`,
      };
    }
  },
);

// #endregion

// #region Completion Value Assertions

/**
 * Asserts that an Observable completes with a specific final value.
 *
 * Checks that the last emitted value before completion matches the expected
 * value using strict equality (Object.is).
 *
 * @example
 *
 * ```typescript
 * import { of } from 'rxjs';
 *
 * await expectAsync(of(1, 2, 'final'), 'to complete with value', 'final'); // passes
 * await expectAsync(of(1, 2, 3), 'to complete with value', 3); // passes
 * await expectAsync(of(1, 2, 3), 'to complete with value', 2); // fails
 * ```
 */
const toCompleteWithValueAssertion = createAsyncAssertion(
  [ObservableSchema, 'to complete with value', schema.UnknownSchema],
  async (observable: Observable<unknown>, expected: unknown) => {
    const result = await collectObservable(observable);

    if (result.error !== undefined) {
      return {
        actual: result.error,
        expected: `completion with value ${inspect(expected)}`,
        message: `Expected Observable to complete with value, but it emitted an error`,
      };
    }

    if (!result.completed) {
      return {
        message: `Expected Observable to complete with value, but it did not terminate`,
      };
    }

    if (result.values.length === 0) {
      return {
        actual: 'no values',
        expected,
        message: `Expected Observable to complete with value ${inspect(expected)}, but it emitted no values`,
      };
    }

    const lastValue = result.values[result.values.length - 1];
    if (!is(lastValue, expected)) {
      return {
        actual: lastValue,
        expected,
        message: `Expected Observable to complete with value ${inspect(expected)}, but the last value was ${inspect(lastValue)}`,
      };
    }
  },
);

/**
 * Asserts that an Observable completes with specific values.
 *
 * This is an alias for `to emit values` that emphasizes completion semantics.
 * The Observable must complete successfully and emit exactly the specified
 * values in the same order.
 *
 * @example
 *
 * ```typescript
 * import { of } from 'rxjs';
 *
 * await expectAsync(of('foo', 'bar', 'baz'), 'to complete with values', [
 *   'foo',
 *   'bar',
 *   'baz',
 * ]); // passes
 * ```
 */
const toCompleteWithValuesAssertion = createAsyncAssertion(
  [ObservableSchema, 'to complete with values', schema.UnknownArraySchema],
  async (observable: Observable<unknown>, expected: unknown[]) => {
    const result = await collectObservable(observable);

    if (result.error !== undefined) {
      return {
        actual: result.error,
        expected: `completion with values ${inspect(expected)}`,
        message: `Expected Observable to complete with values, but it emitted an error`,
      };
    }

    if (!result.completed) {
      return {
        message: `Expected Observable to complete with values, but it did not terminate`,
      };
    }

    if (!arraysDeepEqual(result.values, expected)) {
      return {
        actual: result.values,
        expected,
        message: `Expected Observable to complete with ${inspect(expected)}, but got ${inspect(result.values)}`,
      };
    }
  },
);

/**
 * Asserts that an Observable completes with a final value satisfying the given
 * specification.
 *
 * Checks that the last emitted value before completion partially matches the
 * expected specification object. All properties in the spec must be present on
 * the value with matching values.
 *
 * @example
 *
 * ```typescript
 * import { of } from 'rxjs';
 *
 * await expectAsync(
 *   of({ status: 'pending' }, { status: 'done', result: 42 }),
 *   'to complete with value satisfying',
 *   { status: 'done' },
 * ); // passes
 * ```
 */
const toCompleteWithValueSatisfyingAssertion = createAsyncAssertion(
  [ObservableSchema, 'to complete with value satisfying', schema.UnknownSchema],
  async (observable: Observable<unknown>, spec: unknown) => {
    const result = await collectObservable(observable);

    if (result.error !== undefined) {
      return {
        actual: result.error,
        expected: `completion with value satisfying ${inspect(spec)}`,
        message: `Expected Observable to complete with value satisfying spec, but it emitted an error`,
      };
    }

    if (!result.completed) {
      return {
        message: `Expected Observable to complete with value satisfying spec, but it did not terminate`,
      };
    }

    if (result.values.length === 0) {
      return {
        actual: 'no values',
        expected: `value satisfying ${inspect(spec)}`,
        message: `Expected Observable to complete with value satisfying spec, but it emitted no values`,
      };
    }

    const lastValue = result.values[result.values.length - 1];

    // Partial object match
    if (spec !== null && typeof spec === 'object') {
      const value = lastValue as Record<string, unknown>;
      const specObj = spec as Record<string, unknown>;

      for (const key of keys(specObj)) {
        if (!is(value[key], specObj[key])) {
          return {
            actual: value[key],
            expected: specObj[key],
            message: `Expected last value.${key} to be ${inspect(specObj[key])}, but got ${inspect(value[key])}`,
          };
        }
      }
    }
  },
);

// #endregion

/**
 * All RxJS assertions for use with `expectAsync.use()`.
 *
 * @example
 *
 * ```typescript
 * import { expectAsync } from 'bupkis';
 * import { rxjsAssertions } from '@bupkis/rxjs';
 *
 * const { expectAsync: e } = expectAsync.use(rxjsAssertions);
 *
 * await e(of(1, 2, 3), 'to complete');
 * ```
 */
export const rxjsAssertions = [
  toCompleteAssertion,
  toEmitErrorAssertion,
  toEmitErrorWithMessageAssertion,
  toEmitErrorSatisfyingAssertion,
  toEmitValuesAssertion,
  toEmitTimesAssertion,
  toEmitOnceAssertion,
  toEmitTwiceAssertion,
  toEmitThriceAssertion,
  toBeEmptyAssertion,
  toCompleteWithValueAssertion,
  toCompleteWithValuesAssertion,
  toCompleteWithValueSatisfyingAssertion,
] as const;

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
