/**
 * Utilities for property-based tests.
 *
 * @packageDocumentation
 */

import fc from 'fast-check';
import { inspect } from 'util';
import { z } from 'zod/v4';

import type {
  AnyAssertion,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Assertion,
  AssertionParts,
} from '../../src/assertion/assertion-types.js';

import { FailAssertionError } from '../../src/error.js';
import { isError, isFunction } from '../../src/guards.js';
import { hasKeyDeep, hasValueDeep } from '../../src/util.js';
import { expect, expectAsync } from '../custom-assertions.js';
import {
  type InferPropertyTestConfigVariantProperty,
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
  type PropertyTestConfigVariant,
  type PropertyTestConfigVariantAsyncGenerators,
  type PropertyTestConfigVariantAsyncProperty,
  type PropertyTestConfigVariantProperty,
  type PropertyTestConfigVariantSyncGenerators,
} from './property-test-config.js';

/**
 * Extracts phrase literals from {@link Assertion.parts AssertionParts}.
 *
 * Used with {@link fc.constantFrom} to generate phrases for testing with
 * `expect()`.
 *
 * @function
 * @param assertion Assertion to extract phrases from
 * @param indices One or more indices of parts to extract. Indices are based on
 *   the {@link bupkis!types.PhraseLiteral | PhraseLiterals}; only (no `ZodType`
 *   parts).
 * @returns One or more phrase literals
 */
export const extractPhrases = (
  assertion: AnyAssertion,
): readonly [string, ...string[]] =>
  (assertion.parts as AssertionParts)
    .filter((part) => !(part instanceof z.ZodType))
    .flatMap((part) =>
      Array.isArray(part) ? part : [part],
    ) as unknown as readonly [string, ...string[]];

/**
 * Filters objects for use with "deep equal"-or-"satisfies"-based assertions.
 *
 * @function
 * @param value Arbitrary value
 * @returns `true` if the array does not have `__proto__` key somewhere deep
 *   within it
 */
export const objectFilter = (value: unknown) =>
  // these two seem to break Zod parsing
  !hasKeyDeep(value, '__proto__') &&
  !hasKeyDeep(value, 'valueOf') &&
  // empty loose objects match any object
  !hasValueDeep(value, {}) &&
  // https://github.com/colinhacks/zod/issues/5265
  !hasKeyDeep(value, 'toString');

/**
 * Arbitrary that generates any value except objects with `__proto__` or
 * `valueOf` keys somewhere deep within them.
 */
export const filteredAnything = fc.anything().filter(objectFilter);

/**
 * Arbitrary that generates only objects without `__proto__` or `valueOf` keys
 * somewhere deep within them.
 */
export const filteredObject = fc.object().filter(objectFilter);

/**
 * Filters strings to remove characters that could cause regex syntax errors.
 * Removes: [ ] ( ) { } ^ $ * + ? . \ |
 *
 * @function
 * @param str Input string
 * @returns String with problematic regex characters removed
 */
export const safeRegexStringFilter = (str: string) =>
  str.replace(/[[\](){}^$*+?.\\|]/g, '');

/**
 * Predefined run sizes for property-based tests.
 */
const RUN_SIZES = Object.freeze({
  large: 500,
  medium: 250,
  small: 50,
} as const);

/**
 * Calculates the number of runs for property-based tests based on the
 * environment and the desired run size.
 *
 * The resulting value will be set as the {@link Parameters.numRuns} parameter to
 * {@link fc.assert} or {@link fc.check}.
 *
 * @function
 * @param runSize One of 'small', 'medium', or 'large' to indicate the desired
 *   number of runs
 * @returns The calculated number of runs
 */
export const calculateNumRuns = (
  runSize: keyof typeof RUN_SIZES = 'medium',
) => {
  if (process.env.WALLABY) {
    return Math.floor(RUN_SIZES[runSize] / 10);
  }
  if (process.env.CI) {
    return Math.floor(RUN_SIZES[runSize] / 5);
  }
  if (process.env.NUM_RUNS) {
    return Number.parseInt(process.env.NUM_RUNS, 10);
  }
  return RUN_SIZES[runSize];
};

/**
 * Global defaults for property test configurations.
 *
 * Adjusts the number of test runs based on the environment:
 *
 * - Wallaby: 10 runs (for fast feedback during development)
 * - CI: 100 runs (balanced speed vs coverage)
 * - Local development: 200 runs (thorough testing)
 */
const GLOBAL_PROP_TEST_CONFIG_DEFAULTS =
  {} as const satisfies PropertyTestConfigParameters;

/**
 * Type guard to check if a property test config variant uses generators.
 *
 * @function
 * @param value The property test config variant to check
 * @returns True if the variant has a `generators` array and is not async
 */
const isPropertyTestConfigVariantGenerators = (
  value: PropertyTestConfigVariant,
): value is PropertyTestConfigVariantSyncGenerators => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'generators' in value &&
    !('async' in value)
  );
};

/**
 * Type guard to check if a property test config variant uses async generators.
 *
 * @function
 * @param value The property test config variant to check
 * @returns True if the variant has a `generators` array and is marked as async
 */
const isPropertyTestConfigVariantAsyncGenerators = (
  value: PropertyTestConfigVariant,
): value is PropertyTestConfigVariantAsyncGenerators => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'generators' in value &&
    'async' in value &&
    !!value.async
  );
};

/**
 * Type guard to check if a property test config variant uses a sync property
 * function.
 *
 * @function
 * @param value The property test config variant to check
 * @returns True if the variant has a `property` function
 */
const isPropertyTestConfigVariantProperty = (
  value: PropertyTestConfigVariant,
): value is InferPropertyTestConfigVariantProperty<typeof value> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'property' in value &&
    isFunction(value.property)
  );
};

/**
 * Type guard to check if a property test config variant uses an async property
 * function.
 *
 * @function
 * @param value The property test config variant to check
 * @returns True if the variant has an `asyncProperty` function
 */
const isPropertyTestConfigVariantAsyncProperty = (
  value: PropertyTestConfigVariant,
): value is InferPropertyTestConfigVariantProperty<typeof value> =>
  typeof value === 'object' &&
  value !== null &&
  'asyncProperty' in value &&
  isFunction(value.asyncProperty);

/**
 * @function
 */
const isGeneratorsTuple = (
  value: PropertyTestConfigVariantAsyncGenerators['generators'],
): value is readonly [
  fc.Arbitrary<any>,
  fc.Arbitrary<string>,
  ...fc.Arbitrary<any>[],
] =>
  !!value &&
  !(value instanceof fc.Arbitrary) &&
  Array.isArray(value) &&
  value.length >= 2 &&
  value.every((v) => v instanceof fc.Arbitrary);

/**
 * Result type for expectation functions used in property-based tests.
 *
 * Represents either a successful expectation (failed: false) or a failed
 * expectation with error details (failed: true, error: unknown).
 */
export type ExpectationResult =
  | { error: unknown; failed: true }
  | {
      error?: never;
      failed?: false;
    };

/**
 * Tests that a synchronous assertion should pass with the given arguments.
 *
 * @function
 * @param value The value to test
 * @param args The assertion arguments (phrase and parameters)
 * @returns ExpectationResult indicating success or failure with error details
 */
export const validExpectation = (
  value: unknown,
  ...args: unknown[]
): ExpectationResult => {
  try {
    expect(value, ...args);
    return { failed: false };
  } catch (err) {
    /* c8 ignore next */
    return { error: err, failed: true };
  }
};

/**
 * Tests that a negated synchronous assertion should pass with the given
 * arguments.
 *
 * Prepends "not " to the assertion phrase to test the negated form.
 *
 * @function
 * @param value The value to test
 * @param args The assertion arguments (phrase and parameters)
 * @returns ExpectationResult indicating success or failure with error details
 */
export const validNegatedExpectation = (
  value: unknown,
  ...args: unknown[]
): ExpectationResult => {
  try {
    expect(value, `not ${args[0]}`, ...args.slice(1));
    return { failed: false };
  } catch (err) {
    /* c8 ignore next */
    return { error: err, failed: true };
  }
};

/**
 * Tests that a negated synchronous assertion should fail with the given
 * arguments.
 *
 * If the negated assertion passes when it should fail, returns a
 * FailAssertionError.
 *
 * @function
 * @param value The value to test
 * @param args The assertion arguments (phrase and parameters)
 * @returns ExpectationResult indicating success (assertion failed as expected)
 *   or failure
 */
export const invalidNegatedExpectation = (
  value: unknown,
  ...args: unknown[]
): ExpectationResult => {
  try {
    expect(value, `not ${args[0]}`, ...args.slice(1));
    /* c8 ignore next */
    return {
      error: new FailAssertionError({
        actual: 'success',
        expected: 'failure',
        message: 'Expected negated assertion to fail but it passed instead',
      }),
      failed: true,
    };
  } catch {
    return { failed: false };
  }
};

/**
 * Tests that a synchronous assertion should fail with the given arguments.
 *
 * If the assertion passes when it should fail, returns a FailAssertionError.
 *
 * @function
 * @param value The value to test
 * @param args The assertion arguments (phrase and parameters)
 * @returns ExpectationResult indicating success (assertion failed as expected)
 *   or failure
 */
export const invalidExpectation = (
  value: unknown,
  ...args: unknown[]
): ExpectationResult => {
  try {
    expect(value, ...args);
    /* c8 ignore next */
    return {
      error: new FailAssertionError({
        actual: 'success',
        expected: 'failure',
        message: 'Expected assertion to fail but it passed instead',
      }),
      failed: true,
    };
  } catch {
    return { failed: false };
  }
};

/**
 * Tests that an asynchronous assertion should fail with the given arguments.
 *
 * If the assertion passes when it should fail, returns a FailAssertionError.
 *
 * @function
 * @param value The value to test
 * @param args The assertion arguments (phrase and parameters)
 * @returns Promise<ExpectationResult> indicating success (assertion failed as
 *   expected) or failure
 */
export const invalidAsyncExpectation = async (
  value: unknown,
  ...args: unknown[]
): Promise<ExpectationResult> => {
  try {
    await expectAsync(value, ...args);
    /* c8 ignore next */
    return {
      error: new FailAssertionError({
        actual: 'success',
        expected: 'failure',
        message: 'Expected assertion to fail but it passed instead',
      }),
      failed: true,
    };
  } catch {
    return { failed: false };
  }
};

/**
 * Tests that an asynchronous assertion should pass with the given arguments.
 *
 * @function
 * @param value The value to test
 * @param args The assertion arguments (phrase and parameters)
 * @returns Promise<ExpectationResult> indicating success or failure with error
 *   details
 */
export const validAsyncExpectation = async (
  value: unknown,
  ...args: unknown[]
): Promise<ExpectationResult> => {
  try {
    await expectAsync(value, ...args);
    return { failed: false };
  } catch (err) {
    /* c8 ignore next */
    return { error: err, failed: true };
  }
};

/**
 * Tests that a negated asynchronous assertion should pass with the given
 * arguments.
 *
 * Prepends "not " to the assertion phrase to test the negated form.
 *
 * @function
 * @param value The value to test
 * @param args The assertion arguments (phrase and parameters)
 * @returns Promise<ExpectationResult> indicating success or failure with error
 *   details
 */
export const validNegatedAsyncExpectation = async (
  value: unknown,
  ...args: unknown[]
): Promise<ExpectationResult> => {
  try {
    await expectAsync(value, `not ${args[0]}`, ...args.slice(1));
    return { failed: false };
  } catch (err) {
    /* c8 ignore next */
    return { error: err, failed: true };
  }
};

/**
 * Tests that a negated asynchronous assertion should fail with the given
 * arguments.
 *
 * If the negated assertion passes when it should fail, returns a
 * FailAssertionError.
 *
 * @function
 * @param value The value to test
 * @param args The assertion arguments (phrase and parameters)
 * @returns Promise<ExpectationResult> indicating success (assertion failed as
 *   expected) or failure
 */
export const invalidNegatedAsyncExpectation = async (
  value: unknown,
  ...args: unknown[]
): Promise<ExpectationResult> => {
  try {
    await expectAsync(value, `not ${args[0]}`, ...args.slice(1));
    /* c8 ignore next */
    return {
      error: new FailAssertionError({
        actual: 'success',
        expected: 'failure',
        message: 'Expected negated assertion to fail but it passed instead',
      }),
      failed: true,
    };
  } catch {
    return { failed: false };
  }
};

/**
 * Creates a predicate for a synchronous property.
 *
 * @function
 * @param variantName Name of variant
 */
const createSyncPredicate = (variantName: string) => {
  /**
   * @function
   */
  const syncPredicate = <Subject, Parts extends [unknown, ...unknown[]]>(
    value: Subject,
    ...part: Parts
  ) => {
    switch (variantName) {
      case 'invalid': {
        const { error, failed } = invalidExpectation(value, ...part);
        /* c8 ignore next */
        if (failed) {
          throw error;
        }
        break;
      }
      case 'invalidNegated': {
        const { error, failed } = invalidNegatedExpectation(value, ...part);
        /* c8 ignore next */
        if (failed) {
          throw error;
        }
        break;
      }
      case 'valid': {
        const { error, failed } = validExpectation(value, ...part);
        /* c8 ignore next */
        if (failed) {
          throw error;
        }
        break;
      }
      case 'validNegated': {
        const { error, failed } = validNegatedExpectation(value, ...part);
        /* c8 ignore next */
        if (failed) {
          throw error;
        }
        break;
      }
    }
  };
  return syncPredicate;
};

/**
 * @function
 */
const createAsyncPredicate = (variantName: string) => {
  /**
   * @function
   */
  const asyncPredicate = async <Subject, Parts extends [unknown, ...unknown[]]>(
    value: Subject,
    ...part: Parts
  ) => {
    switch (variantName) {
      case 'invalid': {
        const { error, failed } = await invalidAsyncExpectation(value, ...part);
        /* c8 ignore next */
        if (failed) {
          throw error;
        }
        break;
      }
      case 'invalidNegated': {
        const { error, failed } = await invalidNegatedAsyncExpectation(
          value,
          ...part,
        );
        /* c8 ignore next */
        if (failed) {
          throw error;
        }
        break;
      }
      case 'valid': {
        const { error, failed } = await validAsyncExpectation(value, ...part);
        /* c8 ignore next */
        if (failed) {
          throw error;
        }
        break;
      }
      case 'validNegated': {
        const { error, failed } = await validNegatedAsyncExpectation(
          value,
          ...part,
        );
        /* c8 ignore next */
        if (failed) {
          throw error;
        }
        break;
      }
    }
  };
  return asyncPredicate;
};

/**
 * Runs a property test for a variant using async
 * {@link PropertyTestConfigVariantAsyncGenerators}.
 *
 * @function
 * @param variant Property test config variant
 * @param testConfigDefaults Default params
 * @param params Params from the test config
 * @param variantName Variant name
 */
const runAsyncGeneratorsTest = async (
  variant: PropertyTestConfigVariantAsyncGenerators &
    (
      | PropertyTestConfigVariantAsyncProperty<any>
      | PropertyTestConfigVariantProperty<any>
    ),
  testConfigDefaults: PropertyTestConfigParameters,
  params: PropertyTestConfigParameters,
  variantName: string,
) => {
  const { generators, ...propFcParams } = variant;
  const finalParams = {
    ...GLOBAL_PROP_TEST_CONFIG_DEFAULTS,
    ...testConfigDefaults,
    ...params,
    ...propFcParams,
  };

  const numRuns = calculateNumRuns(finalParams.runSize);

  let err: unknown;

  let result: fc.RunDetails<any>;
  const predicate = createAsyncPredicate(variantName);
  if (isGeneratorsTuple(generators)) {
    const asyncProperty = fc.asyncProperty(...generators, predicate);
    result = await fc.check(asyncProperty, { ...finalParams, numRuns });
  } else {
    const asyncProperty = fc.asyncProperty(
      generators,
      async ([subject, ...part]) => {
        await predicate(subject, ...part);
      },
    );
    result = await fc.check(asyncProperty, { ...finalParams, numRuns });
  }
  /* c8 ignore next */
  if (result.failed) {
    let message = `Expected test to pass, but it failed: ${inspect(result)}`;
    if (isError(err)) {
      message += `\nUnderlying error: ${err.message}`;
    }
    expect.fail(message);
  }
};

/**
 * Runs a property test for a variant using
 * {@link PropertyTestConfigVariantSyncGenerators}
 *
 * @function
 * @param variant Property test config variant
 * @param testConfigDefaults Default params
 * @param params Params from the test config
 * @param variantName Variant name
 */
const runSyncGeneratorsTest = (
  variant: PropertyTestConfigVariantSyncGenerators,
  testConfigDefaults: PropertyTestConfigParameters,
  params: PropertyTestConfigParameters,
  variantName: string,
): void => {
  const { generators, ...propFcParams } = variant;
  const finalParams = {
    ...GLOBAL_PROP_TEST_CONFIG_DEFAULTS,
    ...testConfigDefaults,
    ...params,
    ...propFcParams,
  };
  const numRuns = calculateNumRuns(finalParams.runSize);

  let result: fc.RunDetails<any>;
  const predicate = createSyncPredicate(variantName);
  if (isGeneratorsTuple(generators)) {
    const property = fc.property(...generators, predicate);
    result = fc.check(property, { ...finalParams, numRuns });
  } else {
    const property = fc.property(generators, ([subject, ...part]) =>
      predicate(subject, ...part),
    );
    result = fc.check(property, { ...finalParams, numRuns });
  }
  /* c8 ignore next */
  if (result.failed) {
    let message = `Expected test to pass, but it failed:`;
    message += `\n👉 CAUSE: ${inspect(result)}`;
    if (finalParams.verbose) {
      message += `\n\n❌ FAILURES:\n${inspect(result.failures.slice(0, 3), { depth: null })}`;
    }

    expect.fail(message);
  }
};
export const getVariants = (testConfig: PropertyTestConfig) => {
  const {
    invalid,
    valid,
    invalidNegated = valid,
    validNegated = invalid,
    ...params
  } = testConfig;

  return {
    params,
    variants: new Map([
      ['invalid', invalid],
      ['invalidNegated', invalidNegated],
      ['valid', valid],
      ['validNegated', validNegated],
    ]),
  };
};

/**
 * Runs property tests for a given config variant.
 *
 * @param variant Property test configuration variant
 * @param testConfigDefaults Default parameters
 * @param params Additional parameters
 * @param variantName Variant name
 */

export const runVariant = async (
  variant: PropertyTestConfigVariant,
  testConfigDefaults: PropertyTestConfigParameters,
  params: PropertyTestConfigParameters,
  variantName: string,
): Promise<void> => {
  if (isPropertyTestConfigVariantGenerators(variant)) {
    runSyncGeneratorsTest(variant, testConfigDefaults, params, variantName);
  } else if (isPropertyTestConfigVariantAsyncGenerators(variant)) {
    await runAsyncGeneratorsTest(
      variant,
      testConfigDefaults,
      params,
      variantName,
    );
  } else if (isPropertyTestConfigVariantProperty(variant)) {
    const { property, ...propFcParams } = variant;
    const finalParams = {
      ...GLOBAL_PROP_TEST_CONFIG_DEFAULTS,
      ...testConfigDefaults,
      ...params,
      ...propFcParams,
    };
    fc.assert(property(), {
      ...finalParams,
      numRuns: calculateNumRuns(finalParams.runSize),
    });
  } else if (isPropertyTestConfigVariantAsyncProperty(variant)) {
    const { asyncProperty, ...propFcParams } = variant;
    const finalParams = {
      ...GLOBAL_PROP_TEST_CONFIG_DEFAULTS,
      ...testConfigDefaults,
      ...params,
      ...propFcParams,
    };
    await fc.assert(asyncProperty(), {
      ...finalParams,
      numRuns: calculateNumRuns(finalParams.runSize),
    });
  }
};
