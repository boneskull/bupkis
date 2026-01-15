import type { MatcherTransform } from '../types.js';

import { coreMatchers } from './core.js';
import { jestExtendedMatchers } from './jest-extended.js';
import { sinonMatchers } from './sinon.js';
import { testingLibraryMatchers } from './testing-library.js';

/**
 * Mock/spy matchers that require @bupkis/sinon to transform.
 */
const MOCK_MATCHERS = new Set([
  'lastCalledWith',
  'lastReturnedWith',
  'nthCalledWith',
  'nthReturnedWith',
  // Jest 29 aliases (removed in Jest 30)
  'toBeCalled',
  'toBeCalledTimes',
  'toBeCalledWith',
  // Jest canonical names
  'toHaveBeenCalled',
  'toHaveBeenCalledTimes',
  'toHaveBeenCalledWith',
  'toHaveBeenLastCalledWith',
  'toHaveBeenNthCalledWith',
  'toHaveLastReturnedWith',
  'toHaveNthReturnedWith',
  'toHaveReturned',
  'toHaveReturnedTimes',
  'toHaveReturnedWith',
  'toReturn',
  'toReturnTimes',
  'toReturnWith',
]);

const allMatchers = new Map<string, MatcherTransform>();
const sinonMatchersMap = new Map<string, MatcherTransform>();

// Register core matcher sets
for (const matcher of [
  ...coreMatchers,
  ...jestExtendedMatchers,
  ...testingLibraryMatchers,
]) {
  allMatchers.set(matcher.jestMatcher, matcher);
}

// Register sinon matchers separately
for (const matcher of sinonMatchers) {
  sinonMatchersMap.set(matcher.jestMatcher, matcher);
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
 * Get sinon transform for a specific Jest mock matcher.
 *
 * @function
 */
export const getSinonMatcherTransform = (
  jestMatcher: string,
): MatcherTransform | undefined => sinonMatchersMap.get(jestMatcher);

/**
 * Check if a matcher is supported.
 *
 * @function
 */
export const isMatcherSupported = (jestMatcher: string): boolean =>
  allMatchers.has(jestMatcher);

/**
 * Check if a matcher is a mock/spy matcher requiring @bupkis/sinon.
 *
 * @function
 */
export const isMockMatcher = (jestMatcher: string): boolean =>
  MOCK_MATCHERS.has(jestMatcher);

export { coreMatchers } from './core.js';
export { jestExtendedMatchers } from './jest-extended.js';
export { testingLibraryMatchers } from './testing-library.js';
