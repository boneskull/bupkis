import setDifference from 'set.prototype.difference';

import { BupkisAssertion } from '../src/assertion/assertion.js';
import { AssertionError } from '../src/error.js';
import { expect, z } from '../src/index.js';
import { FunctionSchema } from '../src/schema.js';
import { type AnyAssertion, type AssertionFailure } from '../src/types.js';
import { keyBy } from '../src/util.js';

const { keys } = Object;

/**
 * Matches any assertion instance.
 *
 * Uses z.custom() with explicit type annotation because z.instanceof() infers
 * overly specific generic parameters that don't align with AnyAssertion's use
 * of `any` type parameters.
 */
const AnyAssertionSchema = z.custom<AnyAssertion>(
  (val): val is AnyAssertion => val instanceof BupkisAssertion,
);

/**
 * Helper function to validate assertion coverage against a collection.
 *
 * @param configMap - Map of assertion configurations being tested
 * @param collectionName - Name of the collection for error messages
 * @param assertions - All assertions in the collection
 * @param exceptedAssertions - Assertions to exclude from the check (optional)
 * @returns Assertion result or undefined if validation passes
 */
const validateAssertionCoverage = (
  configMap: Map<AnyAssertion, unknown>,
  collectionName: string,
  assertions: AnyAssertion[],
  exceptedAssertions: AnyAssertion[] = [],
): AssertionFailure | void => {
  const assertionsById = keyBy(assertions, 'id');
  const exceptedIds = new Set(exceptedAssertions.map(({ id }) => id));
  const allCollectionIds = new Set(
    keys(assertionsById).filter((id) => !exceptedIds.has(id)),
  );
  const testedIds = new Set([...configMap.keys()].map(({ id }) => id));
  const diff = setDifference(allCollectionIds, testedIds);

  try {
    expect(diff, 'to be empty');
  } catch {
    /* c8 ignore next */
    const suffix =
      exceptedAssertions.length > 0
        ? ` (excepting ${exceptedAssertions.length} assertion${exceptedAssertions.length === 1 ? '' : 's'})`
        : '';
    return {
      actual: testedIds,
      expected: allCollectionIds,
      message: `Some assertions in collection "${collectionName}" are missing property test configurations${suffix}`,
    };
  }
};

/**
 * Asserts that a configuration map exhaustively tests all assertions in a
 * collection.
 */
const exhaustiveAssertionTestAssertion = expect.createAssertion(
  [
    z.map(AnyAssertionSchema, z.unknown()),
    'to exhaustively test collection',
    z.string(),
    'from',
    z.array(AnyAssertionSchema),
  ],
  (configMap, collectionName, assertions) => {
    return validateAssertionCoverage(configMap, collectionName, assertions);
  },
);

/**
 * Asserts that a configuration map exhaustively tests all assertions in a
 * collection, excluding specified assertions.
 */
const exhaustiveAssertionTestExceptingAssertion = expect.createAssertion(
  [
    z.map(AnyAssertionSchema, z.unknown()),
    'to exhaustively test collection',
    z.string(),
    'from',
    z.array(AnyAssertionSchema),
    'excepting',
    z.array(AnyAssertionSchema),
  ],
  (configMap, collectionName, assertions, exceptedAssertions) => {
    return validateAssertionCoverage(
      configMap,
      collectionName,
      assertions,
      exceptedAssertions,
    );
  },
);

/**
 * Asserts that a function (thunk) executes without throwing an
 * {@link AssertionError}.
 *
 * Use this for testing that assertions pass as expected. Non-assertion errors
 * are re-thrown.
 *
 * @example
 *
 * ```ts
 * expect(
 *   () => expect('hello', 'to be a string'),
 *   'to be a passing assertion',
 * );
 * expect(() => expect('hello', 'to be a string'), 'to pass');
 * ```
 */
const passingAssertionSync = expect.createAssertion(
  [FunctionSchema, ['to be a passing assertion', 'to pass']],
  (fn) => {
    try {
      fn();
      return true;
    } catch (err) {
      if (AssertionError.isAssertionError(err)) {
        // No actual/expected here - there's no meaningful diff between
        // "passed" and "failed". The message contains the relevant info.
        return {
          message: `Expected assertion to pass, but it threw:\n${err.message}`,
        };
      }
      throw err; // Re-throw non-assertion errors
    }
  },
);

/**
 * Asserts that a function (thunk) throws an {@link AssertionError}.
 *
 * Use this for testing that assertions fail as expected. More semantic than
 * `'to throw'` because it specifically expects an AssertionError, not just any
 * error.
 *
 * @example
 *
 * ```ts
 * expect(() => expect(42, 'to be a string'), 'to be a failing assertion');
 * expect(() => expect(42, 'to be a string'), 'to fail');
 * ```
 */
const failingAssertionSync = expect.createAssertion(
  [FunctionSchema, ['to be a failing assertion', 'to fail']],
  (fn) => {
    try {
      fn();
      // No actual/expected - "passed" vs "failed" isn't meaningfully diffable
      return {
        message:
          'Expected assertion to fail with AssertionError, but it passed',
      };
    } catch (err) {
      if (AssertionError.isAssertionError(err)) {
        return true;
      }
      // Show error type mismatch - these are comparable strings
      const actualType = (err as Error)?.constructor?.name ?? typeof err;
      return {
        actual: actualType,
        expected: 'AssertionError',
        message: `Expected AssertionError but got ${actualType}`,
      };
    }
  },
);

/**
 * Asserts that a function (thunk) throws an {@link AssertionError} whose message
 * matches the provided pattern.
 *
 * Combines failure testing with error message inspection, eliminating try/catch
 * boilerplate.
 *
 * @example
 *
 * ```ts
 * expect(
 *   () => expect(42, 'to be a string'),
 *   'to be a failing assertion with message matching',
 *   /expected string/,
 * );
 * expect(
 *   () => expect(42, 'to be a string'),
 *   'to fail with message matching',
 *   /expected string/,
 * );
 * ```
 */
const failingAssertionWithMessageSync = expect.createAssertion(
  [
    FunctionSchema,
    [
      'to be a failing assertion with message matching',
      'to fail with message matching',
    ],
    z.instanceof(RegExp),
  ],
  (fn, pattern) => {
    try {
      fn();
      // No actual/expected - "passed" vs "failed" isn't meaningfully diffable
      return {
        message: `Expected assertion to fail with AssertionError matching ${pattern}, but it passed`,
      };
    } catch (err) {
      if (AssertionError.isAssertionError(err)) {
        if (pattern.test(err.message)) {
          return true;
        }
        // Show message vs pattern - message is a string, pattern string repr
        // is comparable for understanding what didn't match
        return {
          actual: err.message,
          expected: String(pattern),
          message: 'AssertionError message did not match pattern',
        };
      }
      // Show error type mismatch - comparable strings
      const actualType = (err as Error)?.constructor?.name ?? typeof err;
      return {
        actual: actualType,
        expected: 'AssertionError',
        message: `Expected AssertionError but got ${actualType}`,
      };
    }
  },
);

const {
  expect: customExpect,
  expectAsync: customExpectAsync,
  use: customUse,
} = expect.use([
  exhaustiveAssertionTestAssertion,
  exhaustiveAssertionTestExceptingAssertion,
  passingAssertionSync,
  failingAssertionSync,
  failingAssertionWithMessageSync,
]);

export {
  customExpect as expect,
  customExpectAsync as expectAsync,
  customUse as use,
};
