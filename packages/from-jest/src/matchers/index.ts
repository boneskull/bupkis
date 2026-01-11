import type { MatcherTransform } from '../types.js';

import { coreMatchers } from './core.js';
import { jestExtendedMatchers } from './jest-extended.js';
import { testingLibraryMatchers } from './testing-library.js';

const allMatchers = new Map<string, MatcherTransform>();

// Register all matcher sets
for (const matcher of [
  ...coreMatchers,
  ...jestExtendedMatchers,
  ...testingLibraryMatchers,
]) {
  allMatchers.set(matcher.jestMatcher, matcher);
}

/**
 * Get all core Jest matchers.
 *
 * @function
 */
export const getCoreMatchers = (): Record<string, MatcherTransform> => {
  const result: Record<string, MatcherTransform> = {};
  for (const matcher of coreMatchers) {
    result[matcher.jestMatcher] = matcher;
  }
  return result;
};

/**
 * Get transform for a specific Jest matcher.
 *
 * @function
 */
export const getMatcherTransform = (
  jestMatcher: string,
): MatcherTransform | undefined => allMatchers.get(jestMatcher);

/**
 * Check if a matcher is supported.
 *
 * @function
 */
export const isMatcherSupported = (jestMatcher: string): boolean =>
  allMatchers.has(jestMatcher);

export { coreMatchers } from './core.js';
export { jestExtendedMatchers } from './jest-extended.js';
export { testingLibraryMatchers } from './testing-library.js';
