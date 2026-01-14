import type { MatcherTransform } from '../types.js';

import { bddMatchers, getBddMatcher, isBddMatcherSupported } from './bdd.js';
import {
  getPluginMatcher,
  isPluginMatcherSupported,
  pluginMatchers,
} from './plugins.js';
import { getTddMatcher, isTddMatcherSupported, tddMatchers } from './tdd.js';

export {
  bddMatchers,
  getBddMatcher,
  getPluginMatcher,
  getTddMatcher,
  isBddMatcherSupported,
  isPluginMatcherSupported,
  isTddMatcherSupported,
  pluginMatchers,
  tddMatchers,
};

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
