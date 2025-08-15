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

import { type AnyAssertion } from '../../src/assertion/assertion-types.js';
import { expect, expectAsync } from '../../src/bootstrap.js';
import { AssertionError } from '../../src/error.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './config.js';

/**
 * Checks that all `assertions` have an corresponding entry in `testConfigs`.
 *
 * @param assertions Assertions to check
 * @param testConfigs Config to check
 */
export const assertExhaustiveTestConfig = (
  assertions: Record<string, AnyAssertion>,
  testConfigs: Record<string, PropertyTestConfig>,
): void => {
  it('should test all available assertions', () => {
    const allCollectionIds = new Set(Object.keys(assertions));
    const testedIds = new Set(Object.keys(testConfigs));
    expect(allCollectionIds.difference(testedIds), 'to be empty');
  });
};

const globalTestConfigDefaults = {
  numRuns: process.env.WALLABY ? 5 : 100,
} as const satisfies PropertyTestConfigParameters;

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
      it(`should pass for all valid inputs [${id}]`, () => {
        const { generators, ...propFcParams } = valid;
        const finalParams = {
          ...globalTestConfigDefaults,
          ...testConfigDefaults,
          ...fcParams,
          ...propFcParams,
        };
        fc.assert(
          fc.property(...generators, (value, ...part) => {
            expect(value, ...part);
            return true;
          }),
          finalParams,
        );
      });

      if (invalid) {
        it(`should fail for all invalid inputs [${id}]`, () => {
          const { generators, ...propFcParams } = invalid;
          const finalParams = {
            ...globalTestConfigDefaults,
            ...testConfigDefaults,
            ...fcParams,
            ...propFcParams,
          };
          fc.assert(
            fc.property(...generators, (value, ...part) => {
              let error: unknown;
              try {
                expect(value, ...part);
              } catch (err) {
                error = err;
              }
              if (!error) {
                throw new AssertionError({
                  message: 'Expected assertion to fail but it passed',
                });
              }
            }),
            finalParams,
          );
        });
      } else {
        it.skip('should fail for all invalid inputs [no config]');
      }

      if (validNegated) {
        it(`should pass for all valid inputs (negated) [${id}]`, () => {
          const { generators, ...propFcParams } = validNegated;
          const finalParams = {
            ...globalTestConfigDefaults,
            ...testConfigDefaults,
            ...fcParams,
            ...propFcParams,
          };
          fc.assert(
            fc.property(...generators, (value, ...part) => {
              return expect(value, `not ${part[0]}`, ...part.slice(1));
            }),
            finalParams,
          );
        });
      } else {
        it.skip('should pass for all valid inputs (negated) [no config]');
      }

      if (invalidNegated) {
        it(`should fail for all invalid inputs (negated) [${id}]`, () => {
          const { generators, ...propFcParams } = invalidNegated;
          const finalParams = {
            ...globalTestConfigDefaults,
            ...testConfigDefaults,
            ...fcParams,
            ...propFcParams,
          };
          fc.assert(
            fc.property(...generators, (value, ...part) => {
              let error: unknown;
              try {
                expect(value, `not ${part[0]}`, ...part.slice(1));
              } catch (err) {
                error = err;
              }
              if (!error) {
                throw new AssertionError({
                  message: 'Expected assertion to fail but it passed',
                });
              }
            }),
            finalParams,
          );
        });
      } else {
        it.skip('should fail for all invalid inputs (negated) [no config]');
      }
    });
  }
};

/**
 * Runs async property tests across four (4) sets of inputs for some subset of
 * assertions.
 *
 * Similar to `runPropertyTests` but uses `fc.asyncProperty` for async
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
export const runPropertyTestsAsync = <
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
      it(`should pass for all valid inputs [${id}]`, async () => {
        const { generators, ...propFcParams } = valid;
        const finalParams = {
          ...globalTestConfigDefaults,
          ...testConfigDefaults,
          ...fcParams,
          ...propFcParams,
        };
        await fc.assert(
          fc.asyncProperty(...generators, async (value, ...part) => {
            await expectAsync(value, ...part);
            return true;
          }),
          finalParams,
        );
      });

      if (invalid) {
        it(`should fail for all invalid inputs [${id}]`, async () => {
          const { generators, ...propFcParams } = invalid;
          const finalParams = {
            ...globalTestConfigDefaults,
            ...testConfigDefaults,
            ...fcParams,
            ...propFcParams,
          };
          await fc.assert(
            fc.asyncProperty(...generators, async (value, ...part) => {
              let error: unknown;
              try {
                await expectAsync(value, ...part);
              } catch (err) {
                error = err;
              }
              if (!error) {
                throw new AssertionError({
                  message: 'Expected assertion to fail but it passed',
                });
              }
            }),
            finalParams,
          );
        });
      } else {
        it.skip('should fail for all invalid inputs [no config]');
      }

      if (validNegated) {
        it(`should pass for all valid inputs (negated) [${id}]`, async () => {
          const { generators, ...propFcParams } = validNegated;
          const finalParams = {
            ...globalTestConfigDefaults,
            ...testConfigDefaults,
            ...fcParams,
            ...propFcParams,
          };
          await fc.assert(
            fc.asyncProperty(...generators, async (value, ...part) => {
              return await expectAsync(
                value,
                `not ${part[0]}`,
                ...part.slice(1),
              );
            }),
            finalParams,
          );
        });
      } else {
        it.skip('should pass for all valid inputs (negated) [no config]');
      }

      if (invalidNegated) {
        it(`should fail for all invalid inputs (negated) [${id}]`, async () => {
          const { generators, ...propFcParams } = invalidNegated;
          const finalParams = {
            ...globalTestConfigDefaults,
            ...testConfigDefaults,
            ...fcParams,
            ...propFcParams,
          };
          await fc.assert(
            fc.asyncProperty(...generators, async (value, ...part) => {
              let error: unknown;
              try {
                await expectAsync(value, `not ${part[0]}`, ...part.slice(1));
              } catch (err) {
                error = err;
              }
              if (!error) {
                throw new AssertionError({
                  message: 'Expected assertion to fail but it passed',
                });
              }
            }),
            finalParams,
          );
        });
      } else {
        it.skip('should fail for all invalid inputs (negated) [no config]');
      }
    });
  }
};
