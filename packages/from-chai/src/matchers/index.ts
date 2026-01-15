import type { MatcherTransform } from '../types.js';

import { bddMatchers } from './bdd.js';
import { pluginMatchers } from './plugins.js';
import { tddMatchers } from './tdd.js';

export { bddMatchers, pluginMatchers, tddMatchers };

/**
 * All matchers combined (BDD + TDD + plugins).
 */
export const allMatchers: MatcherTransform[] = [
  ...bddMatchers,
  ...tddMatchers,
  ...pluginMatchers,
];

/**
 * Combined map of all matcher names to their transforms.
 */
const allMatcherMap = new Map<string, MatcherTransform>(
  allMatchers.map((m) => [m.chaiMatcher, m]),
);

/**
 * Get a matcher transform by its Chai name (BDD chain, TDD method, or plugin).
 *
 * @function
 * @param chaiMatcher - The Chai matcher identifier
 * @returns The matcher transform or undefined if not found
 */
export const getMatcherTransform = (
  chaiMatcher: string,
): MatcherTransform | undefined => {
  return allMatcherMap.get(chaiMatcher);
};

/**
 * Check if a matcher is supported (BDD, TDD, or plugin).
 *
 * @function
 * @param chaiMatcher - The Chai matcher identifier
 * @returns True if the matcher is supported
 */
export const isMatcherSupported = (chaiMatcher: string): boolean => {
  return allMatcherMap.has(chaiMatcher);
};
