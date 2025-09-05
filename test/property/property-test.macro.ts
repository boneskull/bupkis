/**
 * Contains "macros" for property-based tests.
 *
 * A "macro" is a function that contains suites, tests, and/or hooks.
 *
 * @packageDocumentation
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
import fc from 'fast-check';
import { before, describe, it } from 'node:test';

import { type AnyAssertion } from '../../src/assertion/assertion-types.js';
import { expect } from '../../src/bootstrap.js';
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
  before(() => {
    it('should test all available assertions', () => {
      const allCollectionIds = new Set(Object.keys(assertions));
      const testedIds = new Set(Object.keys(testConfigs));
      expect(
        allCollectionIds.difference(testedIds).size,
        'to be greater than',
        0,
      );
    });
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
