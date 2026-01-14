/**
 * Property-based tests for compositional 'and' chains.
 *
 * These tests verify that chained assertions using 'and' work correctly by:
 *
 * 1. Generating diverse runtime values
 * 2. Querying which assertions apply to each value
 * 3. Building valid/invalid chains using 'and'
 * 4. Verifying expect() passes/fails as expected
 *
 * @packageDocumentation
 */

import {
  type AssertionApplicability,
  calculateNumRuns,
  type ChainArgs,
  getApplicabilityRegistry,
  invalidChainArbitrary,
  invalidNegatedChainArbitrary,
  validChainArbitrary,
  validNegatedChainArbitrary,
} from '@bupkis/property-testing';
import fc from 'fast-check';
import { before, describe, it } from 'node:test';
import { inspect } from 'node:util';

import { AssertionError } from '../../src/error.js';
import { expect } from '../custom-assertions.js';

const numRuns = calculateNumRuns();

/**
 * The assertion applicability registry.
 *
 * Loaded once before all tests.
 */
let registry: AssertionApplicability[];

/**
 * Runs expect with the given chain args.
 *
 * @param args Args to pass to expect()
 */
const runExpect = (args: readonly unknown[]): void => {
  const [subject, ...rest] = args;
  expect(subject, ...rest);
};

/**
 * Asserts that a chain passes (should not throw).
 *
 * @param chain The chain args to test
 */
const assertPasses = (chain: ChainArgs): void => {
  const { args, chainLength, subject } = chain;

  try {
    runExpect(args);
  } catch (error) {
    throw new Error(
      `Expected valid chain to pass but it failed:\n` +
        `  Subject: ${inspect(subject)}\n` +
        `  Chain length: ${chainLength}\n` +
        `  Args: ${inspect(args)}\n` +
        `  Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

/**
 * Asserts that a chain fails with AssertionError.
 *
 * @param chain The chain args to test
 */
const assertFails = (chain: ChainArgs): void => {
  const { args, chainLength, subject } = chain;

  try {
    runExpect(args);
    throw new Error(
      `Expected invalid chain to fail but it passed:\n` +
        `  Subject: ${inspect(subject)}\n` +
        `  Chain length: ${chainLength}\n` +
        `  Args: ${inspect(args)}`,
    );
  } catch (error) {
    if (!AssertionError.isAssertionError(error)) {
      throw error;
    }
    // Success: the assertion failed as expected
  }
};

describe('Property-Based Tests for Compositional "and" Chains', () => {
  before(async () => {
    registry = await getApplicabilityRegistry();
  });

  describe('valid chains (should pass)', () => {
    it('should pass when all chained assertions are applicable to the subject', () => {
      const arbitrary = validChainArbitrary(registry);

      fc.assert(
        fc.property(arbitrary, (chain) => {
          assertPasses(chain);
        }),
        { numRuns },
      );
    });

    it('should pass with single-assertion chains', () => {
      const arbitrary = validChainArbitrary(registry, {
        maxChainLength: 1,
        minChainLength: 1,
      });

      fc.assert(
        fc.property(arbitrary, (chain) => {
          assertPasses(chain);
        }),
        { numRuns },
      );
    });

    it('should pass with multi-assertion chains (2-4 assertions)', () => {
      const arbitrary = validChainArbitrary(registry, {
        maxChainLength: 4,
        minChainLength: 2,
      });

      fc.assert(
        fc.property(arbitrary, (chain) => {
          assertPasses(chain);
        }),
        { numRuns },
      );
    });
  });

  describe('invalid chains (should fail)', () => {
    it('should fail when at least one chained assertion is inapplicable', () => {
      const arbitrary = invalidChainArbitrary(registry);

      fc.assert(
        fc.property(arbitrary, (chain) => {
          assertFails(chain);
        }),
        { numRuns },
      );
    });
  });

  describe('valid negated chains (should pass)', () => {
    it('should pass when all negated assertions are inapplicable to the subject', () => {
      const arbitrary = validNegatedChainArbitrary(registry);

      fc.assert(
        fc.property(arbitrary, (chain) => {
          assertPasses(chain);
        }),
        { numRuns },
      );
    });
  });

  describe('invalid negated chains (should fail)', () => {
    it('should fail when negated assertions are applicable to the subject', () => {
      const arbitrary = invalidNegatedChainArbitrary(registry);

      fc.assert(
        fc.property(arbitrary, (chain) => {
          assertFails(chain);
        }),
        { numRuns },
      );
    });
  });

  describe('chain structure verification', () => {
    it('should generate chains with "and" separators between assertions', () => {
      const arbitrary = validChainArbitrary(registry, {
        maxChainLength: 4,
        minChainLength: 2,
      });

      fc.assert(
        fc.property(arbitrary, (chain) => {
          const { args, chainLength } = chain;

          // Count 'and' occurrences - should be chainLength - 1
          const andCount = args.filter((arg) => arg === 'and').length;
          const expectedAndCount = chainLength - 1;

          if (andCount !== expectedAndCount) {
            throw new Error(
              `Expected ${expectedAndCount} 'and' separators for chain length ${chainLength}, ` +
                `but found ${andCount}. Args: ${inspect(args)}`,
            );
          }
        }),
        { numRuns },
      );
    });

    it('should always have subject as first argument', () => {
      const arbitrary = validChainArbitrary(registry);

      fc.assert(
        fc.property(arbitrary, (chain) => {
          const { args, subject } = chain;

          // Use Object.is() to correctly compare NaN values
          if (!Object.is(args[0], subject)) {
            throw new Error(
              `Expected first arg to be subject ${inspect(subject)}, ` +
                `but got ${inspect(args[0])}`,
            );
          }
        }),
        { numRuns },
      );
    });
  });
});

/**
 * Direct test helper to verify chain generation without fast-check wrapping.
 *
 * Useful for debugging specific chain generation issues.
 *
 * @param chainArgs The chain args to debug
 */
const debugChainGeneration = async (chainArgs: ChainArgs): Promise<void> => {
  const { args, chainLength, subject } = chainArgs;

  console.log('Chain Debug Info:');
  console.log(`  Subject: ${inspect(subject)}`);
  console.log(`  Subject type: ${typeof subject}`);
  console.log(`  Chain length: ${chainLength}`);
  console.log(`  Args: ${inspect(args)}`);

  try {
    runExpect(args);
    console.log('  Result: PASSED');
  } catch (error) {
    console.log(
      `  Result: FAILED - ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

// Export for manual debugging
export { debugChainGeneration };
