/**
 * Contains "macros" for property-based tests.
 *
 * A "macro", for our purposes, is a function that contains suites, tests,
 * and/or hooks.
 *
 * @packageDocumentation
 */

import fc from 'fast-check';
import { describe, it } from 'node:test';
import { inspect } from 'node:util';
import setDifference from 'set.prototype.difference';

import { type AnyAssertion } from '../../src/assertion/assertion-types.js';
import { expect, expectAsync } from '../../src/bootstrap.js';
import { AssertionError, FailAssertionError } from '../../src/error.js';
import { isError, isFunction } from '../../src/guards.js';
import { keyBy } from '../../src/util.js';
import {
  type InferPropertyTestConfigVariantModel,
  type InferPropertyTestConfigVariantProperty,
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
  type PropertyTestConfigVariant,
  type PropertyTestConfigVariantAsyncGenerators,
  type PropertyTestConfigVariantModel,
  type PropertyTestConfigVariantSyncGenerators,
} from './property-test-config.js';

/**
 * Checks that all `assertions` have an corresponding entry in `testConfigs`.
 *
 * @param collectionName Name of the collection being tested; used in error
 *   message
 * @param assertions Assertions to check
 * @param testConfigs Config to check
 */
export function assertExhaustiveTestConfigs(
  collectionName: string,
  assertions: readonly AnyAssertion[],
  testConfigs: Map<AnyAssertion, any>,
): void {
  it(`should test all available assertions in ${collectionName}`, () => {
    const assertionsById = keyBy(assertions, 'id');
    const allCollectionIds = new Set(Object.keys(assertionsById));
    const testedIds = new Set([...testConfigs.keys()].map(({ id }) => id));
    const diff = setDifference(allCollectionIds, testedIds);
    try {
      expect(diff, 'to be empty');
    } catch {
      throw new AssertionError({
        message: `Some assertions in collection "${collectionName}" are missing property test configurations:\n${[
          ...diff,
        ]
          .map((id) => `  ❌ ${assertionsById[id]} [${id}]`)
          .join('\n')}`,
      });
    }
  });
}

/**
 * Global defaults for property test configurations.
 *
 * Adjusts the number of test runs based on the environment:
 *
 * - Wallaby: 10 runs (for fast feedback during development)
 * - CI: 100 runs (balanced speed vs coverage)
 * - Local development: 200 runs (thorough testing)
 */
const globalTestConfigDefaults = {
  numRuns: process.env.WALLABY ? 10 : process.env.CI ? 100 : 200,
} as const satisfies PropertyTestConfigParameters;

/**
 * Type guard to check if a property test config variant uses generators.
 *
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
    Array.isArray((value as any).generators) &&
    !('async' in value)
  );
};

/**
 * Type guard to check if a property test config variant uses async generators.
 *
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
    Array.isArray((value as any).generators) &&
    'async' in value &&
    value.async
  );
};

/**
 * Type guard to check if a property test config variant uses model-based
 * testing.
 *
 * @param value The property test config variant to check
 * @returns True if the variant has a `commands` array for model-based testing
 */
const isPropertyTestConfigVariantModel = (
  value: PropertyTestConfigVariant,
): value is InferPropertyTestConfigVariantModel<typeof value> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'commands' in value &&
    Array.isArray((value as any).commands)
  );
};

/**
 * Type guard to check if a property test config variant uses a sync property
 * function.
 *
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
 * @param value The property test config variant to check
 * @returns True if the variant has an `asyncProperty` function
 */
const isPropertyTestConfigVariantAsyncProperty = (
  value: PropertyTestConfigVariant,
): value is InferPropertyTestConfigVariantProperty<typeof value> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'asyncProperty' in value &&
    isFunction(value.asyncProperty)
  );
};

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
    return { error: err, failed: true };
  }
};

/**
 * Tests that a negated synchronous assertion should pass with the given
 * arguments.
 *
 * Prepends "not " to the assertion phrase to test the negated form.
 *
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
    return { error: err, failed: true };
  }
};

/**
 * Tests that a negated asynchronous assertion should pass with the given
 * arguments.
 *
 * Prepends "not " to the assertion phrase to test the negated form.
 *
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
 * Runs a single property test for an assertion configured by a
 * {@link PropertyTestConfig} object.
 *
 * @param assertion Assertion to test
 * @param testConfig Test configuration
 * @param testConfigDefaults Defaults to apply
 */
const runPropertyTest = <T extends AnyAssertion>(
  assertion: T,
  testConfig: PropertyTestConfig,
  testConfigDefaults: PropertyTestConfigParameters = {},
): void => {
  const {
    invalid,
    valid,
    invalidNegated = valid,
    validNegated = invalid,
    ...fcParams
  } = testConfig;
  const { id } = assertion;

  describe(`Assertion: ${assertion} [${id}]`, () => {
    for (const [name, variant] of [
      ['invalid', invalid],
      ['valid', valid],
      ['invalidNegated', invalidNegated],
      ['validNegated', validNegated],
    ] as const) {
      it(`should pass ${name} checks [${id}]`, async () => {
        if (isPropertyTestConfigVariantModel(variant)) {
          runModelTest(variant, testConfigDefaults, fcParams);
        } else if (isPropertyTestConfigVariantGenerators(variant)) {
          const {
            generators,
            shouldInterrupt = false,
            ...propFcParams
          } = variant;
          const finalParams = {
            ...globalTestConfigDefaults,
            ...testConfigDefaults,
            ...fcParams,
            ...propFcParams,
          };

          let err: unknown;
          const property = fc.property(...generators, (value, ...part) => {
            switch (name) {
              case 'invalid': {
                const { error, failed } = invalidExpectation(value, ...part);
                if (failed) {
                  throw error;
                }
                break;
              }
              case 'invalidNegated': {
                const { error, failed } = invalidNegatedExpectation(
                  value,
                  ...part,
                );
                if (failed) {
                  throw error;
                }
                break;
              }
              case 'valid': {
                const { error, failed } = validExpectation(value, ...part);
                if (failed) {
                  throw error;
                }
                break;
              }
              case 'validNegated': {
                const { error, failed } = validNegatedExpectation(
                  value,
                  ...part,
                );
                if (failed) {
                  throw error;
                }
                break;
              }
            }
          });

          const result = fc.check(property, finalParams);

          // TODO: there are some flags to control fc's timeout behavior
          // that we could use instead of inspecting the error message
          if (shouldInterrupt) {
            // Check if the failure was due to a timeout
            const isTimeout =
              result.failed &&
              isError(result.errorInstance) &&
              result.errorInstance.message.includes(
                'Property timeout: exceeded limit',
              );
            if (!isTimeout) {
              let message = `Expected test to timeout/interrupt, but it failed for another reason: ${inspect(result)}`;
              if (isError(err)) {
                message += `\nUnderlying error: ${err.message}`;
              }
              expect.fail(message);
            }
          } else if (result.failed) {
            let message = `Expected test to pass, but it failed: ${inspect(result)}`;
            if (isError(err)) {
              message += `\nUnderlying error: ${err.message}`;
            }
            expect.fail(message);
          }
        } else if (isPropertyTestConfigVariantAsyncGenerators(variant)) {
          const {
            generators,
            shouldInterrupt = false,
            ...propFcParams
          } = variant;
          const finalParams = {
            ...globalTestConfigDefaults,
            ...testConfigDefaults,
            ...fcParams,
            ...propFcParams,
          };
          let err: unknown;

          const asyncProperty = fc.asyncProperty(
            ...generators,
            async (value, ...part) => {
              switch (name) {
                case 'invalid': {
                  const { error, failed } = await invalidAsyncExpectation(
                    value,
                    ...part,
                  );
                  if (failed) {
                    throw error;
                  }
                  break;
                }
                case 'invalidNegated': {
                  const { error, failed } =
                    await invalidNegatedAsyncExpectation(value, ...part);
                  if (failed) {
                    throw error;
                  }
                  break;
                }
                case 'valid': {
                  const { error, failed } = await validAsyncExpectation(
                    value,
                    ...part,
                  );
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
                  if (failed) {
                    throw error;
                  }
                  break;
                }
              }
            },
          );

          const result = await fc.check(asyncProperty, finalParams);

          if (shouldInterrupt) {
            // Check if the failure was due to a timeout
            const isTimeout =
              result.failed &&
              isError(result.errorInstance) &&
              result.errorInstance.message.includes(
                'Property timeout: exceeded limit',
              );
            if (!isTimeout) {
              let message = `Expected test to timeout/interrupt, but it failed for another reason: ${inspect(result)}`;
              if (isError(err)) {
                message += `\nUnderlying error: ${err.message}`;
              }
              expect.fail(message);
            }
          } else if (result.failed) {
            let message = `Expected test to pass, but it failed: ${inspect(result)}`;
            if (isError(err)) {
              message += `\nUnderlying error: ${err.message}`;
            }
            expect.fail(message);
          }
        } else if (isPropertyTestConfigVariantProperty(variant)) {
          const { property, ...propFcParams } = variant;
          const finalParams = {
            ...globalTestConfigDefaults,
            ...testConfigDefaults,
            ...fcParams,
            ...propFcParams,
          };
          fc.assert(property(), finalParams);
        } else if (isPropertyTestConfigVariantAsyncProperty(variant)) {
          const { asyncProperty, ...propFcParams } = variant;
          const finalParams = {
            ...globalTestConfigDefaults,
            ...testConfigDefaults,
            ...fcParams,
            ...propFcParams,
          };
          await fc.assert(asyncProperty(), finalParams);
        }
      });
    }
  });
};

/**
 * Runs property tests across four (4) sets of inputs for some subset of
 * assertions.
 *
 * - Valid (should pass)
 * - Invalid (should fail)
 * - ValidNegated (should pass)
 * - InvalidNegated (should fail)
 *
 * @param testConfigs Test configurations, keyed on ID
 * @param assertions Assertions, keyed on ID
 * @param testConfigDefaults Defaults to apply to each test variant, if any
 */
export function runPropertyTests<
  const T extends Map<AnyAssertion, PropertyTestConfig | PropertyTestConfig[]>,
>(testConfigs: T, testConfigDefaults: PropertyTestConfigParameters = {}): void {
  for (const [assertion, testConfig] of testConfigs) {
    if (Array.isArray(testConfig)) {
      for (const singleTestConfig of testConfig) {
        runPropertyTest(assertion, singleTestConfig, testConfigDefaults);
      }
    } else {
      runPropertyTest(assertion, testConfig, testConfigDefaults);
    }
  }
}

function runModelTest(
  variant: PropertyTestConfigVariantModel<object, any>,
  testConfigDefaults: PropertyTestConfigParameters,
  fcParams: PropertyTestConfigParameters,
) {
  const { commands, commandsConstraints, initialState, ...propFcParams } =
    variant;
  const finalParams = {
    ...globalTestConfigDefaults,
    ...testConfigDefaults,
    ...(fcParams as Record<string, unknown>),
    ...propFcParams,
  };
  fc.assert(
    fc.asyncProperty(
      fc.commands(commands, commandsConstraints),
      async (cmds) => {
        fc.modelRun(initialState, cmds);
      },
    ),
    finalParams,
  );
}
