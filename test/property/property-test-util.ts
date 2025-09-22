/**
 * Utilities for property-based tests.
 *
 * @packageDocumentation
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import fc from 'fast-check';
import { z } from 'zod/v4';

import type {
  AnyAssertion,
  AssertionParts,
} from '../../src/assertion/assertion-types.js';

import { hasKeyDeep, hasValueDeep } from '../../src/util.js';

/**
 * Extracts phrase literals from {@link Assertion.parts AssertionParts}.
 *
 * Used with {@link fc.constantFrom} to generate phrases for testing with
 * `expect()`.
 *
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
 * @param value Arbitrary value
 * @returns `true` if the array does not have `__proto__` key somewhere deep
 *   within it
 */
export const valueToSchemaFilter = (value: unknown) =>
  // these two seem to break Zod parsing
  !hasKeyDeep(value, '__proto__') &&
  !hasKeyDeep(value, 'valueOf') &&
  // empty loose objects match any object
  !hasValueDeep(value, {}) &&
  // https://github.com/colinhacks/zod/issues/5265
  !hasKeyDeep(value, 'toString');

/**
 * Filters strings to remove characters that could cause regex syntax errors.
 * Removes: [ ] ( ) { } ^ $ * + ? . \ |
 *
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
