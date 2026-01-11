/**
 * Utility for formatting AssertionFailure objects with custom diff support.
 *
 * @packageDocumentation
 */

import type { AssertionFailure } from './assertion-types.js';

import { generateDiff, shouldGenerateDiff } from '../diff.js';

/**
 * Formats an AssertionFailure into a diff string for error output.
 *
 * Precedence:
 *
 * 1. `diff` property - returned as-is
 * 2. `formatActual`/`formatExpected` - used to serialize values for jest-diff
 * 3. Default - uses jest-diff with raw actual/expected values
 *
 * @function
 * @param failure - The AssertionFailure to format
 * @returns Formatted diff string, or null if no diff can be generated
 */
export const formatAssertionFailure = (
  failure: AssertionFailure,
): null | string => {
  const { actual, diff, diffOptions, expected, formatActual, formatExpected } =
    failure;

  // Precedence 1: Pre-computed diff string
  if (diff !== undefined) {
    return diff;
  }

  // Need both actual and expected for diff generation
  if (!shouldGenerateDiff(actual, expected)) {
    return null;
  }

  // Precedence 2: Custom formatters
  const formattedActual = formatActual ? formatActual(actual) : actual;
  const formattedExpected = formatExpected
    ? formatExpected(expected)
    : expected;

  // Precedence 3: Default jest-diff
  return generateDiff(formattedExpected, formattedActual, {
    aAnnotation: 'expected',
    bAnnotation: 'actual',
    expand: false,
    includeChangeCounts: true,
    ...diffOptions,
  });
};
