/**
 * Chain generators for compositional property testing with 'and'.
 *
 * Provides fast-check arbitraries that generate valid and invalid assertion
 * chains using the data-first strategy: generate a value, then derive
 * assertions that would pass or fail for it.
 *
 * @packageDocumentation
 */

import fc from 'fast-check';

import {
  type AssertionApplicability,
  getApplicableAssertions,
  getInapplicableAssertions,
} from './applicability.js';
import { filteredAnything, objectFilter } from './util.js';

const { min } = Math;

/**
 * Represents a generated 'and' chain ready to be passed to `expect()`.
 *
 * The args array is structured as `[subject, phrase1, 'and', phrase2, ...]`.
 */
export interface ChainArgs {
  /**
   * The args to pass to `expect()`.
   */
  args: readonly unknown[];

  /**
   * Number of assertions in the chain.
   */
  chainLength: number;

  /**
   * The generated subject value.
   */
  subject: unknown;
}

/**
 * Configuration for chain generation.
 */
export interface ChainGeneratorConfig {
  /**
   * Maximum number of assertions in the chain.
   *
   * @defaultValue 4
   */
  maxChainLength?: number;

  /**
   * Minimum number of assertions in the chain.
   *
   * @defaultValue 1
   */
  minChainLength?: number;
}

const DEFAULT_CONFIG: Required<ChainGeneratorConfig> = {
  maxChainLength: 4,
  minChainLength: 1,
};

/**
 * Builds expect() args from a subject and selected assertions.
 *
 * @function
 * @param subject The subject value
 * @param assertions The assertions to chain together
 * @returns ChainArgs ready for expect()
 */
export const buildChainArgs = (
  subject: unknown,
  assertions: AssertionApplicability[],
): ChainArgs => {
  if (assertions.length === 0) {
    throw new Error('At least one assertion required to build chain args');
  }

  const args: unknown[] = [subject];

  for (let i = 0; i < assertions.length; i++) {
    const assertion = assertions[i]!;
    // Pick a random phrase from the assertion's available phrases
    const phrase = assertion.phrases[0];
    args.push(phrase);

    // Add 'and' between assertions (but not after the last one)
    if (i < assertions.length - 1) {
      args.push('and');
    }
  }

  return {
    args,
    chainLength: assertions.length,
    subject,
  };
};

/**
 * Creates an arbitrary that generates diverse values suitable for type
 * assertion testing.
 *
 * The values cover multiple type categories to ensure good coverage of
 * applicable/inapplicable assertion combinations.
 *
 * @function
 */
export const diverseValueArbitrary = () =>
  fc
    .oneof(
      // Strings
      fc.string(),
      fc.constant(''),

      // Numbers (various subcategories)
      fc.integer(),
      fc.double({ noDefaultInfinity: true, noNaN: true }),
      fc.constant(0),
      fc.constant(Infinity),
      fc.constant(-Infinity),
      fc.constant(NaN),

      // Booleans
      fc.boolean(),
      fc.constant(true),
      fc.constant(false),

      // Null/undefined
      fc.constant(null),
      fc.constant(undefined),

      // BigInt
      fc.bigInt(),

      // Symbol
      fc.constant(Symbol('test')),

      // Functions
      fc.constant(() => {}),
      fc.constant(async () => {}),

      // Arrays
      fc.array(filteredAnything, { maxLength: 5 }),
      fc.constant([]),

      // Objects
      fc.dictionary(fc.string({ maxLength: 10 }), filteredAnything, {
        maxKeys: 5,
      }),
      fc.constant({}),

      // Special object types
      fc.date(),
      fc.constant(new Error('test')),
      fc.constant(/test/),
      fc.constant(new Set()),
      fc.constant(new Map()),
      fc.constant(new WeakMap()),
      fc.constant(new WeakSet()),

      // Classes
      fc.constant(class TestClass {}),
      fc.constant(Date),
      fc.constant(Error),
    )
    .filter(objectFilter);

/**
 * Creates an arbitrary that generates VALID 'and' chains.
 *
 * All assertions in the chain are applicable to the generated subject, so the
 * expect() call should pass.
 *
 * @function
 * @param registry The assertion applicability registry
 * @param config Chain generation configuration
 * @returns Arbitrary producing valid chain args
 */
export const validChainArbitrary = (
  registry: AssertionApplicability[],
  config: ChainGeneratorConfig = {},
): fc.Arbitrary<ChainArgs> => {
  const { maxChainLength, minChainLength } = { ...DEFAULT_CONFIG, ...config };

  return diverseValueArbitrary()
    .filter((value) => {
      // Filter to values that have enough applicable assertions
      const applicable = getApplicableAssertions(value, registry);
      return applicable.length >= minChainLength;
    })
    .chain((subject) => {
      const applicable = getApplicableAssertions(subject, registry);

      // Generate a random subset of applicable assertions
      return fc
        .shuffledSubarray(applicable, {
          maxLength: min(maxChainLength, applicable.length),
          minLength: minChainLength,
        })
        .map((selectedAssertions) =>
          buildChainArgs(subject, selectedAssertions),
        );
    });
};

/**
 * Creates an arbitrary that generates INVALID 'and' chains.
 *
 * The chain contains at least one inapplicable assertion, so the expect() call
 * should fail.
 *
 * @function
 * @param registry The assertion applicability registry
 * @param config Chain generation configuration
 * @returns Arbitrary producing invalid chain args
 */
export const invalidChainArbitrary = (
  registry: AssertionApplicability[],
  config: ChainGeneratorConfig = {},
): fc.Arbitrary<ChainArgs> => {
  const { maxChainLength, minChainLength } = { ...DEFAULT_CONFIG, ...config };

  return diverseValueArbitrary()
    .filter((value) => {
      // Filter to values that have at least one inapplicable assertion
      const inapplicable = getInapplicableAssertions(value, registry);
      return inapplicable.length >= 1;
    })
    .chain((subject) => {
      const applicable = getApplicableAssertions(subject, registry);
      const inapplicable = getInapplicableAssertions(subject, registry);

      // Strategy: pick at least one inapplicable assertion, optionally mix with applicable ones
      return fc
        .tuple(
          // At least one inapplicable assertion
          fc.shuffledSubarray(inapplicable, {
            maxLength: min(2, inapplicable.length),
            minLength: 1,
          }),
          // Optionally some applicable assertions
          fc.shuffledSubarray(applicable, {
            maxLength: min(maxChainLength - 1, applicable.length),
            minLength: 0,
          }),
        )
        .filter(
          ([inapplicablePart, applicablePart]) =>
            inapplicablePart.length + applicablePart.length >= minChainLength &&
            inapplicablePart.length + applicablePart.length <= maxChainLength,
        )
        .chain(([inapplicablePart, applicablePart]) => {
          // Combine and shuffle the order
          const combined = [...inapplicablePart, ...applicablePart];
          return fc
            .shuffledSubarray(combined, {
              maxLength: combined.length,
              minLength: combined.length,
            })
            .map((shuffled) => buildChainArgs(subject, shuffled));
        });
    });
};

/**
 * Creates an arbitrary that generates VALID NEGATED chains.
 *
 * Uses inapplicable assertions with 'not ' prefix, so the negated expect() call
 * should pass.
 *
 * @function
 * @param registry The assertion applicability registry
 * @param config Chain generation configuration
 * @returns Arbitrary producing chain args for negated assertions
 */
export const validNegatedChainArbitrary = (
  registry: AssertionApplicability[],
  config: ChainGeneratorConfig = {},
): fc.Arbitrary<ChainArgs> => {
  const { maxChainLength, minChainLength } = { ...DEFAULT_CONFIG, ...config };

  return diverseValueArbitrary()
    .filter((value) => {
      // Filter to values that have enough inapplicable assertions
      const inapplicable = getInapplicableAssertions(value, registry);
      return inapplicable.length >= minChainLength;
    })
    .chain((subject) => {
      const inapplicable = getInapplicableAssertions(subject, registry);

      // Generate a random subset of inapplicable assertions (will be negated)
      return fc
        .shuffledSubarray(inapplicable, {
          maxLength: min(maxChainLength, inapplicable.length),
          minLength: minChainLength,
        })
        .map((selectedAssertions) => {
          // Build args with 'not ' prefix on each phrase
          const args: unknown[] = [subject];

          for (let i = 0; i < selectedAssertions.length; i++) {
            const assertion = selectedAssertions[i]!;
            const phrase = `not ${assertion.phrases[0]}`;
            args.push(phrase);

            if (i < selectedAssertions.length - 1) {
              args.push('and');
            }
          }

          return {
            args,
            chainLength: selectedAssertions.length,
            subject,
          } satisfies ChainArgs;
        });
    });
};

/**
 * Creates an arbitrary that generates INVALID NEGATED chains.
 *
 * Uses applicable assertions with 'not ' prefix, so the negated expect() call
 * should fail.
 *
 * @function
 * @param registry The assertion applicability registry
 * @param config Chain generation configuration
 * @returns Arbitrary producing chain args for negated assertions that should
 *   fail
 */
export const invalidNegatedChainArbitrary = (
  registry: AssertionApplicability[],
  config: ChainGeneratorConfig = {},
): fc.Arbitrary<ChainArgs> => {
  const { maxChainLength, minChainLength } = { ...DEFAULT_CONFIG, ...config };

  return diverseValueArbitrary()
    .filter((value) => {
      // Filter to values that have enough applicable assertions
      const applicable = getApplicableAssertions(value, registry);
      return applicable.length >= minChainLength;
    })
    .chain((subject) => {
      const applicable = getApplicableAssertions(subject, registry);

      // Generate a random subset of applicable assertions (will be negated, causing failure)
      return fc
        .shuffledSubarray(applicable, {
          maxLength: min(maxChainLength, applicable.length),
          minLength: minChainLength,
        })
        .map((selectedAssertions) => {
          // Build args with 'not ' prefix on each phrase
          const args: unknown[] = [subject];

          for (let i = 0; i < selectedAssertions.length; i++) {
            const assertion = selectedAssertions[i]!;
            const phrase = `not ${assertion.phrases[0]}`;
            args.push(phrase);

            if (i < selectedAssertions.length - 1) {
              args.push('and');
            }
          }

          return {
            args,
            chainLength: selectedAssertions.length,
            subject,
          } satisfies ChainArgs;
        });
    });
};
