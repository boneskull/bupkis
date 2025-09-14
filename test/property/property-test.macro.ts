/**
 * Contains "macros" for property-based tests.
 *
 * A "macro", for our purposes, is a function that contains suites, tests,
 * and/or hooks.
 *
 * @packageDocumentation
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
import fc from 'fast-check';
import { describe, it } from 'node:test';
import { inspect } from 'node:util';

import { type AnyAssertion } from '../../src/assertion/assertion-types.js';
import { expect, expectAsync } from '../../src/bootstrap.js';
import { AssertionError, FailAssertionError } from '../../src/error.js';
import { isError, isFunction } from '../../src/guards.js';
import {
  type InferPropertyTestConfigVariantModel,
  type InferPropertyTestConfigVariantProperty,
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
  type PropertyTestConfigVariant,
  type PropertyTestConfigVariantAsyncGenerators,
  type PropertyTestConfigVariantGenerators,
} from './property-test-config.js';

/**
 * Checks that all `assertions` have an corresponding entry in `testConfigs`.
 *
 * @param collectionName Name of the collection being tested; used in error
 *   message
 * @param assertions Assertions to check
 * @param testConfigs Config to check
 */
export const assertExhaustiveTestConfig = (
  collectionName: string,
  assertions: Record<string, AnyAssertion>,
  testConfigs: Record<string, PropertyTestConfig>,
): void => {
  it(`should test all available assertions in ${collectionName}`, () => {
    const allCollectionIds = new Set(Object.keys(assertions));
    const testedIds = new Set(Object.keys(testConfigs));
    const diff = allCollectionIds.difference(testedIds);
    try {
      expect(diff, 'to be empty');
    } catch {
      throw new AssertionError({
        message: `Some assertions in collection "${collectionName}" are missing property test configurations: ${[
          ...diff,
        ].join(', ')}`,
      });
    }
  });
};

const globalTestConfigDefaults = {
  numRuns: process.env.WALLABY ? 10 : process.env.CI ? 100 : 200,
} as const satisfies PropertyTestConfigParameters;

const isPropertyTestConfigVariantGenerators = (
  value: PropertyTestConfigVariant,
): value is PropertyTestConfigVariantGenerators => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'generators' in value &&
    Array.isArray((value as any).generators) &&
    !('async' in value)
  );
};

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

type ExpectationResult =
  | { error: unknown; failed: true }
  | {
      failed?: false;
    };

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

export const negatedValidExpectation = (
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
export const runPropertyTests = <
  const T extends Record<string, PropertyTestConfig>,
>(
  testConfigs: T,
  assertions: Record<keyof T, AnyAssertion>,
  testConfigDefaults: PropertyTestConfigParameters = {},
): void => {
  for (const [id, config] of Object.entries(testConfigs)) {
    const {
      invalid,
      valid,
      invalidNegated = valid,
      validNegated = invalid,
      ...fcParams
    } = config;

    describe(`Assertion: ${assertions[id]}`, () => {
      for (const [name, variant] of [
        ['invalid', invalid],
        ['valid', valid],
        ['invalidNegated', invalidNegated],
        ['validNegated', validNegated],
      ] as const) {
        it(`should pass ${name} checks [${id}]`, async () => {
          if (isPropertyTestConfigVariantModel(variant)) {
            const {
              afterEach = () => {},
              beforeEach = () => {},
              commands,
              commandsConstraints,
              initialState,
              ...propFcParams
            } = variant;
            const finalParams = {
              ...globalTestConfigDefaults,
              ...testConfigDefaults,
              ...fcParams,
              ...propFcParams,
            };
            fc.assert(
              fc
                .asyncProperty(
                  fc.commands(commands, commandsConstraints),
                  async (cmds) => {
                    fc.modelRun(initialState, cmds);
                  },
                )
                .beforeEach(beforeEach)
                .afterEach(afterEach),
              finalParams,
            );
          } else if (isPropertyTestConfigVariantGenerators(variant)) {
            const {
              afterEach = () => {},
              beforeEach = () => {},
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
            const property = fc
              .property(...generators, (value, ...part) => {
                switch (name) {
                  case 'valid': {
                    try {
                      expect(value, ...part);
                      return true;
                    } catch (e) {
                      err = e;
                      return false;
                    }
                  }
                  case 'invalid': {
                    try {
                      expect(value, ...part);
                      return false;
                    } catch {
                      return true;
                    }
                  }
                  case 'invalidNegated': {
                    try {
                      expect(value, `not ${part[0]}`, ...part.slice(1));
                      return false;
                    } catch {
                      return true;
                    }
                  }
                  case 'validNegated': {
                    try {
                      expect(value, `not ${part[0]}`, ...part.slice(1));
                      return true;
                    } catch (e) {
                      err = e;
                      return false;
                    }
                  }
                }
              })
              .beforeEach(beforeEach)
              .afterEach(afterEach);

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
              afterEach = () => {},
              beforeEach = () => {},
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

            const asyncProperty = fc
              .asyncProperty(...generators, async (value, ...part) => {
                switch (name) {
                  case 'valid': {
                    try {
                      await expectAsync(value, ...part);
                      return true;
                    } catch (e) {
                      err = e;
                      return false;
                    }
                  }
                  case 'invalid': {
                    try {
                      await expectAsync(value, ...part);
                      return false;
                    } catch {
                      return true;
                    }
                  }
                  case 'invalidNegated': {
                    try {
                      await expectAsync(
                        value,
                        `not ${part[0]}`,
                        ...part.slice(1),
                      );
                      return false;
                    } catch {
                      return true;
                    }
                  }
                  case 'validNegated': {
                    try {
                      await expectAsync(
                        value,
                        `not ${part[0]}`,
                        ...part.slice(1),
                      );
                      return true;
                    } catch (e) {
                      err = e;
                      return false;
                    }
                  }
                }
              })
              .beforeEach(beforeEach)
              .afterEach(afterEach);

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
  }
};
