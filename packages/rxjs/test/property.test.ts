/**
 * Property-based tests for @bupkis/rxjs assertions.
 *
 * Uses fast-check to generate random inputs and validates that assertions
 * behave correctly across the input space.
 */

import {
  createPropertyTestHarness,
  extractPhrases,
  getVariants,
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from '@bupkis/property-testing';
import { use } from 'bupkis';
import fc from 'fast-check';
import { describe, it } from 'node:test';
import { EMPTY as _EMPTY, of, throwError } from 'rxjs';

import * as assertions from '../src/assertions.js';

const { expect, expectAsync } = use(assertions.rxjsAssertions);
const { runVariant } = createPropertyTestHarness({ expect, expectAsync });

// Use 'small' run size to keep tests fast
const testConfigDefaults: PropertyTestConfigParameters = {
  runSize: 'small',
} as const;

// ─────────────────────────────────────────────────────────────
// HELPER ARBITRARIES
// ─────────────────────────────────────────────────────────────

// Diverse values for Observable emissions
const valueArbitrary = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.boolean(),
  fc.double({ noNaN: true }),
  fc.constant(null),
  fc.constant(undefined),
);

// Array of diverse values (for multi-emission tests)
const _valuesArbitrary = fc.array(valueArbitrary, {
  maxLength: 10,
  minLength: 0,
});

// Non-empty array of values
const nonEmptyValuesArbitrary = fc.array(valueArbitrary, {
  maxLength: 10,
  minLength: 1,
});

// Random Error instances with varied types
const errorArbitrary = fc
  .tuple(
    fc.string(),
    fc.constantFrom(Error, TypeError, RangeError, SyntaxError),
  )
  .map(([msg, ErrorClass]) => new ErrorClass(msg));

// ─────────────────────────────────────────────────────────────
// ASYNC ASSERTION CONFIGS
// ─────────────────────────────────────────────────────────────

// Note: All RxJS assertions are async since Observable operations
// are inherently asynchronous.

const asyncTestConfigs = new Map<
  (typeof assertions.rxjsAssertions)[number],
  PropertyTestConfig
>([
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
        generators: nonEmptyValuesArbitrary.chain((values) =>
          fc.tuple(
            fc.constant(of(...values)),
            fc.constantFrom(...extractPhrases(assertions.toCompleteAssertion)),
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
