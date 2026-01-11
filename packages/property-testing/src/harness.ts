/**
 * Property test harness factory and helpers.
 *
 * @packageDocumentation
 */

import type { AnyAssertion, AssertionPart, AssertionParts } from 'bupkis/types';

import fc from 'fast-check';
import { inspect } from 'util';
import { z } from 'zod';

import {
  type InferPropertyTestConfigVariantProperty,
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
  type PropertyTestConfigVariant,
  type PropertyTestConfigVariantAsyncGenerators,
  type PropertyTestConfigVariantAsyncProperty,
  type PropertyTestConfigVariantProperty,
  type PropertyTestConfigVariantSyncGenerators,
} from './config.js';
import { calculateNumRuns } from './util.js';

const { isArray } = Array;

/**
 * @function
 */
const isFunction = (value: unknown): value is (...args: any[]) => any =>
  typeof value === 'function';

/**
 * @function
 */
const isError = (value: unknown): value is Error => value instanceof Error;

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
 * Context for creating a property test harness.
 *
 * Contains the expect functions that will be used to test assertions.
 */
export interface PropertyTestHarnessContext {
  expect: (value: unknown, ...args: unknown[]) => void;
  expectAsync: (value: unknown, ...args: unknown[]) => Promise<void>;
}

/**
 * Global defaults for property test configurations.
 */
const GLOBAL_PROP_TEST_CONFIG_DEFAULTS =
  {} as const satisfies PropertyTestConfigParameters;

/**
 * @function
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
 * @function
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
 * @function
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
 * @function
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
  isArray(value) &&
  value.length >= 2 &&
  value.every((v) => v instanceof fc.Arbitrary);

/**
 * Extracts phrase literals from assertion parts.
 *
 * Used with {@link fc.constantFrom} to generate phrases for testing with
 * `expect()`.
 *
 * @function
 * @param assertion Assertion to extract phrases from
 * @returns One or more phrase literals
 */
export const extractPhrases = (
  assertion: AnyAssertion,
): readonly [string, ...string[]] =>
  (assertion.parts as AssertionParts)
    .filter((part: AssertionPart) => !(part instanceof z.ZodType))
    .flatMap((part: AssertionPart) =>
      isArray(part) ? part : [part],
    ) as unknown as readonly [string, ...string[]];

/**
 * Extracts variants from a property test configuration.
 *
 * @function
 * @param testConfig Property test configuration
 * @returns Object containing params and a map of variant names to variants
 */
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
 * Creates a property test harness with the provided expect functions.
 *
 * @function
 * @param ctx Context containing expect and expectAsync functions
 * @returns Object containing all the harness functions
 */
export const createPropertyTestHarness = (ctx: PropertyTestHarnessContext) => {
  const { expect, expectAsync } = ctx;

  /**
   * @function
   */
  const validExpectation = (
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
   * @function
   */
  const validNegatedExpectation = (
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
   * @function
   */
  const invalidNegatedExpectation = (
    value: unknown,
    ...args: unknown[]
  ): ExpectationResult => {
    try {
      expect(value, `not ${args[0]}`, ...args.slice(1));
      return {
        error: new Error(
          'Expected negated assertion to fail but it passed instead',
        ),
        failed: true,
      };
    } catch {
      return { failed: false };
    }
  };

  /**
   * @function
   */
  const invalidExpectation = (
    value: unknown,
    ...args: unknown[]
  ): ExpectationResult => {
    try {
      expect(value, ...args);
      return {
        error: new Error('Expected assertion to fail but it passed instead'),
        failed: true,
      };
    } catch {
      return { failed: false };
    }
  };

  /**
   * @function
   */
  const invalidAsyncExpectation = async (
    value: unknown,
    ...args: unknown[]
  ): Promise<ExpectationResult> => {
    try {
      await expectAsync(value, ...args);
      return {
        error: new Error('Expected assertion to fail but it passed instead'),
        failed: true,
      };
    } catch {
      return { failed: false };
    }
  };

  /**
   * @function
   */
  const validAsyncExpectation = async (
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
   * @function
   */
  const validNegatedAsyncExpectation = async (
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
   * @function
   */
  const invalidNegatedAsyncExpectation = async (
    value: unknown,
    ...args: unknown[]
  ): Promise<ExpectationResult> => {
    try {
      await expectAsync(value, `not ${args[0]}`, ...args.slice(1));
      return {
        error: new Error(
          'Expected negated assertion to fail but it passed instead',
        ),
        failed: true,
      };
    } catch {
      return { failed: false };
    }
  };

  /**
   * @function
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
          if (failed) {
            throw error;
          }
          break;
        }
        case 'invalidNegated': {
          const { error, failed } = invalidNegatedExpectation(value, ...part);
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
          const { error, failed } = validNegatedExpectation(value, ...part);
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
    const asyncPredicate = async <
      Subject,
      Parts extends [unknown, ...unknown[]],
    >(
      value: Subject,
      ...part: Parts
    ) => {
      switch (variantName) {
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
          const { error, failed } = await invalidNegatedAsyncExpectation(
            value,
            ...part,
          );
          if (failed) {
            throw error;
          }
          break;
        }
        case 'valid': {
          const { error, failed } = await validAsyncExpectation(value, ...part);
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
    };
    return asyncPredicate;
  };

  /**
   * @function
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
    if (result.failed) {
      let message = `Expected test to pass, but it failed: ${inspect(result)}`;
      if (isError(err)) {
        message += `\nUnderlying error: ${err.message}`;
      }
      throw new Error(message);
    }
  };

  /**
   * @function
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
    if (result.failed) {
      let message = `Expected test to pass, but it failed:`;
      message += `\n👉 CAUSE: ${inspect(result)}`;
      if (finalParams.verbose) {
        message += `\n\n❌ FAILURES:\n${inspect(result.failures.slice(0, 3), { depth: null })}`;
      }
      throw new Error(message);
    }
  };

  /**
   * @function
   */
  const runVariant = async (
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

  return {
    invalidAsyncExpectation,
    invalidExpectation,
    invalidNegatedAsyncExpectation,
    invalidNegatedExpectation,
    runVariant,
    validAsyncExpectation,
    validExpectation,
    validNegatedAsyncExpectation,
    validNegatedExpectation,
  };
};
