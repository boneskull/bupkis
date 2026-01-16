/**
 * Property test harness factory and helpers.
 *
 * @packageDocumentation
 */

import type {
  AnyAssertion,
  AnyAsyncAssertion,
  AnySyncAssertion,
  AssertionPart,
  AssertionParts,
} from 'bupkis/types';

import { AssertionError, NegatedAssertionError } from 'bupkis';
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

/**
 * Error thrown when property test arguments don't match the expected assertion.
 *
 * This indicates a bug in the property test generator - it's producing inputs
 * that don't match the assertion being tested.
 */
export class PropertyTestGeneratorError extends Error {
  override name = 'PropertyTestGeneratorError';

  constructor(
    public readonly assertionId: string,
    public readonly args: unknown[],
    message?: string,
  ) {
    super(
      message ??
        `Generator bug: Arguments don't parse for assertion '${assertionId}'. ` +
          `Args: ${inspect(args)}`,
    );
  }
}

/**
 * Error thrown when a different assertion than expected handled the input.
 *
 * This indicates that the property generator produced input that matched a
 * different assertion than the one being tested.
 */
export class WrongAssertionError extends Error {
  override name = 'WrongAssertionError';

  constructor(
    public readonly expectedAssertionId: string,
    public readonly actualAssertionId: string,
    public readonly args: unknown[],
  ) {
    super(
      `Wrong assertion failed: expected '${expectedAssertionId}', ` +
        `but '${actualAssertionId}' failed instead. Args: ${inspect(args)}`,
    );
  }
}

const { isArray } = Array;

/**
 * @function
 */
const isFunction = (value: unknown): value is (...args: any[]) => any =>
  typeof value === 'function';

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
 * Options for expectUsing functions.
 */
export interface ExpectUsingOptions {
  /**
   * Whether to run the assertion in negated mode. When true, the assertion is
   * expected to fail (which means success for negated).
   */
  negated?: boolean;
}

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
 * Directly executes a sync assertion, bypassing phrase matching.
 *
 * Use this to verify that an assertion actually executes on given inputs,
 * independent of whether expect() matched the correct assertion.
 *
 * @function
 * @param assertion The assertion to execute
 * @param args Arguments to pass (subject, phrase, ...params)
 * @param options Options including negation
 * @throws {PropertyTestGeneratorError} If args don't parse for the assertion
 * @throws {AssertionError} If assertion fails (in non-negated mode)
 * @throws {NegatedAssertionError} If assertion passes (in negated mode)
 */
export const expectUsing = <A extends AnySyncAssertion>(
  assertion: A,
  args: unknown[],
  options?: ExpectUsingOptions,
): void => {
  const { negated = false } = options ?? {};
  const parseResult = assertion.parseValues(args);

  if (!parseResult.success) {
    throw new PropertyTestGeneratorError(assertion.id, args);
  }

  try {
    assertion.execute(parseResult.parsedValues, args, expectUsing, parseResult);
  } catch (error) {
    if (negated && AssertionError.isAssertionError(error)) {
      // Negated assertion - error means the underlying check failed, which is success
      return;
    }
    throw error;
  }

  // If we get here without throwing, assertion passed
  if (negated) {
    throw new NegatedAssertionError({
      id: assertion.id,
      message: `Expected negated assertion '${assertion.id}' to fail, but it passed`,
    });
  }
};

/**
 * Directly executes an async assertion, bypassing phrase matching.
 *
 * Use this to verify that an assertion actually executes on given inputs,
 * independent of whether expectAsync() matched the correct assertion.
 *
 * @function
 * @param assertion The assertion to execute
 * @param args Arguments to pass (subject, phrase, ...params)
 * @param options Options including negation
 * @throws {PropertyTestGeneratorError} If args don't parse for the assertion
 * @throws {AssertionError} If assertion fails (in non-negated mode)
 * @throws {NegatedAssertionError} If assertion passes (in negated mode)
 */
export const expectUsingAsync = async <A extends AnyAsyncAssertion>(
  assertion: A,
  args: unknown[],
  options?: ExpectUsingOptions,
): Promise<void> => {
  const { negated = false } = options ?? {};
  const parseResult = await assertion.parseValuesAsync(args);

  if (!parseResult.success) {
    throw new PropertyTestGeneratorError(assertion.id, args);
  }

  try {
    await assertion.executeAsync(
      parseResult.parsedValues,
      args,
      expectUsingAsync,
      parseResult,
    );
  } catch (error) {
    if (negated && AssertionError.isAssertionError(error)) {
      // Negated assertion - error means the underlying check failed, which is success
      return;
    }
    throw error;
  }

  // If we get here without throwing, assertion passed
  if (negated) {
    throw new NegatedAssertionError({
      id: assertion.id,
      message: `Expected negated assertion '${assertion.id}' to fail, but it passed`,
    });
  }
};

/**
 * Global defaults for property test configurations.
 */
const GLOBAL_PROP_TEST_CONFIG_DEFAULTS =
  {} as const satisfies PropertyTestConfigParameters;

/**
 * @function
 */
export const isPropertyTestConfigVariantGenerators = (
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
export const isPropertyTestConfigVariantAsyncGenerators = (
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
export const isPropertyTestConfigVariantProperty = (
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
export const isPropertyTestConfigVariantAsyncProperty = (
  value: PropertyTestConfigVariant,
): value is InferPropertyTestConfigVariantProperty<typeof value> =>
  typeof value === 'object' &&
  value !== null &&
  'asyncProperty' in value &&
  isFunction(value.asyncProperty);

/**
 * @function
 */
export const isGeneratorsTuple = (
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
   * Verifies that a caught error is from the expected assertion.
   *
   * @function
   * @param error The caught error
   * @param expectedAssertionId The ID of the assertion we expect to have failed
   * @param args The arguments that were passed
   * @returns ExpectationResult indicating if the right assertion failed
   */
  const verifyAssertionError = (
    error: unknown,
    expectedAssertionId: string,
    args: unknown[],
  ): ExpectationResult => {
    if (AssertionError.isAssertionError(error)) {
      if (error.assertionId === expectedAssertionId) {
        return { failed: false }; // Correct assertion failed
      }
      return {
        error: new WrongAssertionError(
          expectedAssertionId,
          error.assertionId,
          args,
        ),
        failed: true,
      };
    }

    // Not an AssertionError - could be UnknownAssertionError or other error
    return { error, failed: true };
  };

  /**
   * @function
   */
  const validExpectation = (
    assertion: AnySyncAssertion,
    value: unknown,
    ...args: unknown[]
  ): ExpectationResult => {
    try {
      expect(value, ...args);
      // Also verify with expectUsing to ensure correct assertion executed
      expectUsing(assertion, [value, ...args]);
      return { failed: false };
    } catch (err) {
      return { error: err, failed: true };
    }
  };

  /**
   * @function
   */
  const validNegatedExpectation = (
    assertion: AnySyncAssertion,
    value: unknown,
    ...args: unknown[]
  ): ExpectationResult => {
    try {
      expect(value, `not ${args[0]}`, ...args.slice(1));
      // Also verify with expectUsing in negated mode
      expectUsing(assertion, [value, ...args], { negated: true });
      return { failed: false };
    } catch (err) {
      return { error: err, failed: true };
    }
  };

  /**
   * @function
   */
  const invalidNegatedExpectation = (
    assertion: AnySyncAssertion,
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
    } catch (error) {
      return verifyAssertionError(error, assertion.id, [
        value,
        `not ${args[0]}`,
        ...args.slice(1),
      ]);
    }
  };

  /**
   * @function
   */
  const invalidExpectation = (
    assertion: AnySyncAssertion,
    value: unknown,
    ...args: unknown[]
  ): ExpectationResult => {
    try {
      expect(value, ...args);
      return {
        error: new Error('Expected assertion to fail but it passed instead'),
        failed: true,
      };
    } catch (error) {
      return verifyAssertionError(error, assertion.id, [value, ...args]);
    }
  };

  /**
   * @function
   */
  const invalidAsyncExpectation = async (
    assertion: AnyAsyncAssertion,
    value: unknown,
    ...args: unknown[]
  ): Promise<ExpectationResult> => {
    try {
      await expectAsync(value, ...args);
      return {
        error: new Error('Expected assertion to fail but it passed instead'),
        failed: true,
      };
    } catch (error) {
      return verifyAssertionError(error, assertion.id, [value, ...args]);
    }
  };

  /**
   * @function
   */
  const validAsyncExpectation = async (
    assertion: AnyAsyncAssertion,
    value: unknown,
    ...args: unknown[]
  ): Promise<ExpectationResult> => {
    try {
      await expectAsync(value, ...args);
      // Also verify with expectUsingAsync to ensure correct assertion executed
      await expectUsingAsync(assertion, [value, ...args]);
      return { failed: false };
    } catch (err) {
      return { error: err, failed: true };
    }
  };

  /**
   * @function
   */
  const validNegatedAsyncExpectation = async (
    assertion: AnyAsyncAssertion,
    value: unknown,
    ...args: unknown[]
  ): Promise<ExpectationResult> => {
    try {
      await expectAsync(value, `not ${args[0]}`, ...args.slice(1));
      // Also verify with expectUsingAsync in negated mode
      await expectUsingAsync(assertion, [value, ...args], { negated: true });
      return { failed: false };
    } catch (err) {
      return { error: err, failed: true };
    }
  };

  /**
   * @function
   */
  const invalidNegatedAsyncExpectation = async (
    assertion: AnyAsyncAssertion,
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
    } catch (error) {
      return verifyAssertionError(error, assertion.id, [
        value,
        `not ${args[0]}`,
        ...args.slice(1),
      ]);
    }
  };

  /**
   * @function
   */
  const createSyncPredicate = (
    variantName: string,
    assertion: AnySyncAssertion,
  ) => {
    /**
     * @function
     */
    const syncPredicate = <Subject, Parts extends [unknown, ...unknown[]]>(
      value: Subject,
      ...part: Parts
    ) => {
      switch (variantName) {
        case 'invalid': {
          const { error, failed } = invalidExpectation(
            assertion,
            value,
            ...part,
          );
          if (failed) {
            throw error;
          }
          break;
        }
        case 'invalidNegated': {
          const { error, failed } = invalidNegatedExpectation(
            assertion,
            value,
            ...part,
          );
          if (failed) {
            throw error;
          }
          break;
        }
        case 'valid': {
          const { error, failed } = validExpectation(assertion, value, ...part);
          if (failed) {
            throw error;
          }
          break;
        }
        case 'validNegated': {
          const { error, failed } = validNegatedExpectation(
            assertion,
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
    return syncPredicate;
  };

  /**
   * @function
   */
  const createAsyncPredicate = (
    variantName: string,
    assertion: AnyAsyncAssertion,
  ) => {
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
            assertion,
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
            assertion,
            value,
            ...part,
          );
          if (failed) {
            throw error;
          }
          break;
        }
        case 'valid': {
          const { error, failed } = await validAsyncExpectation(
            assertion,
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
            assertion,
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
    assertion: AnyAsyncAssertion,
  ) => {
    const { generators, ...propFcParams } = variant;
    const finalParams = {
      ...GLOBAL_PROP_TEST_CONFIG_DEFAULTS,
      ...testConfigDefaults,
      ...params,
      ...propFcParams,
    };

    const numRuns = calculateNumRuns(finalParams.runSize);

    let result: fc.RunDetails<any>;
    const predicate = createAsyncPredicate(variantName, assertion);
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
  const runSyncGeneratorsTest = (
    variant: PropertyTestConfigVariantSyncGenerators,
    testConfigDefaults: PropertyTestConfigParameters,
    params: PropertyTestConfigParameters,
    variantName: string,
    assertion: AnySyncAssertion,
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
    const predicate = createSyncPredicate(variantName, assertion);
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
   * Runs a property test variant for a specific assertion.
   *
   * @function
   * @param variant The variant configuration
   * @param testConfigDefaults Default parameters for all tests
   * @param params Parameters specific to this test
   * @param variantName Name of the variant (valid, invalid, validNegated,
   *   invalidNegated)
   * @param assertion The assertion being tested (enables assertion ID checking
   *   and direct execution verification)
   */
  const runVariant = async (
    variant: PropertyTestConfigVariant,
    testConfigDefaults: PropertyTestConfigParameters,
    params: PropertyTestConfigParameters,
    variantName: string,
    assertion: AnyAssertion,
  ): Promise<void> => {
    if (isPropertyTestConfigVariantGenerators(variant)) {
      runSyncGeneratorsTest(
        variant,
        testConfigDefaults,
        params,
        variantName,
        assertion as AnySyncAssertion,
      );
    } else if (isPropertyTestConfigVariantAsyncGenerators(variant)) {
      await runAsyncGeneratorsTest(
        variant,
        testConfigDefaults,
        params,
        variantName,
        assertion as AnyAsyncAssertion,
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

  /**
   * Extracts a standalone fast-check property from a variant configuration.
   *
   * Useful for running properties outside the normal test harness context, such
   * as fuzzing scenarios where you want to run individual properties with
   * custom iteration counts, in separate processes, or with different fc.check
   * options.
   *
   * @function
   * @param variant The variant configuration to extract from
   * @param variantName The name of the variant (valid, invalid, validNegated,
   *   invalidNegated)
   * @param assertion The assertion being tested (enables assertion ID checking
   *   and direct execution verification)
   * @returns Object containing the property and whether it's async
   */
  const extractProperty = (
    variant: PropertyTestConfigVariant,
    variantName: string,
    assertion: AnyAssertion,
  ): {
    isAsync: boolean;
    property: fc.IAsyncProperty<any> | fc.IProperty<any>;
  } => {
    if (isPropertyTestConfigVariantGenerators(variant)) {
      const { generators } = variant;
      const predicate = createSyncPredicate(
        variantName,
        assertion as AnySyncAssertion,
      );
      if (isGeneratorsTuple(generators)) {
        return {
          isAsync: false,
          property: fc.property(...generators, predicate),
        };
      }
      return {
        isAsync: false,
        property: fc.property(generators, ([subject, ...part]) =>
          predicate(subject, ...part),
        ),
      };
    }

    if (isPropertyTestConfigVariantAsyncGenerators(variant)) {
      const { generators } = variant;
      const predicate = createAsyncPredicate(
        variantName,
        assertion as AnyAsyncAssertion,
      );
      if (isGeneratorsTuple(generators)) {
        return {
          isAsync: true,
          property: fc.asyncProperty(...generators, predicate),
        };
      }
      return {
        isAsync: true,
        property: fc.asyncProperty(generators, async ([subject, ...part]) => {
          await predicate(subject, ...part);
        }),
      };
    }

    if (isPropertyTestConfigVariantProperty(variant)) {
      return { isAsync: false, property: variant.property() };
    }

    if (isPropertyTestConfigVariantAsyncProperty(variant)) {
      return {
        isAsync: true,
        property: (
          variant as PropertyTestConfigVariantAsyncProperty
        ).asyncProperty(),
      };
    }

    throw new Error(`Unknown variant type: ${inspect(variant)}`);
  };

  return {
    extractProperty,
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
