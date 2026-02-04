import type { MatcherTransform } from '../types.js';

/**
 * Node:assert matchers and their bupkis equivalents.
 *
 * @see {@link https://nodejs.org/api/assert.html}
 */
export const assertMatchers: MatcherTransform[] = [
  // Strict equality assertions
  { assertMethod: 'strictEqual', bupkisPhrase: 'to be' },
  { assertMethod: 'notStrictEqual', bupkisPhrase: 'to be' },
  { assertMethod: 'deepStrictEqual', bupkisPhrase: 'to deep equal' },
  { assertMethod: 'notDeepStrictEqual', bupkisPhrase: 'to deep equal' },

  // Legacy loose equality (with warning in legacy mode)
  { assertMethod: 'equal', bupkisPhrase: 'to be', isLegacy: true },
  { assertMethod: 'notEqual', bupkisPhrase: 'to be', isLegacy: true },
  { assertMethod: 'deepEqual', bupkisPhrase: 'to deep equal', isLegacy: true },
  {
    assertMethod: 'notDeepEqual',
    bupkisPhrase: 'to deep equal',
    isLegacy: true,
  },

  // Truthiness
  { assertMethod: 'ok', bupkisPhrase: 'to be truthy' },

  // Throws
  { assertMethod: 'throws', bupkisPhrase: 'to throw' },
  { assertMethod: 'doesNotThrow', bupkisPhrase: 'to throw' },

  // Async (rejects/doesNotReject)
  { assertMethod: 'rejects', bupkisPhrase: 'to reject', isAsync: true },
  { assertMethod: 'doesNotReject', bupkisPhrase: 'to reject', isAsync: true },

  // String matching
  { assertMethod: 'match', bupkisPhrase: 'to match' },
  { assertMethod: 'doesNotMatch', bupkisPhrase: 'to match' },

  // Fail
  {
    assertMethod: 'fail',
    bupkisPhrase: 'to fail',
    /**
     * Transform assert.fail() to expect.fail().
     *
     * Note: The subject contains the first argument (message) since assert.fail
     * takes 0-3 arguments with different semantics.
     *
     * @function
     */
    transform: ({ matcherArgs, subject }) => {
      // assert.fail() has several signatures:
      // - assert.fail() - no args
      // - assert.fail(message) - one arg (message is in subject)
      // - assert.fail(actual, expected, message?) - deprecated form
      if (!subject) {
        return 'expect.fail()';
      }
      // If we have a subject but no matcherArgs, the subject IS the message
      if (matcherArgs.length === 0) {
        return `expect.fail(${subject})`;
      }
      // Deprecated form with actual, expected, message - just pass message if present
      if (matcherArgs.length >= 2) {
        const message = matcherArgs[1];
        return message ? `expect.fail(${message})` : 'expect.fail()';
      }
      return `expect.fail(${subject})`;
    },
  },
];

/**
 * Negated assertion methods that need special handling.
 */
export const NEGATION_MAPPINGS: Record<string, string> = {
  doesNotMatch: 'match',
  doesNotReject: 'rejects',
  doesNotThrow: 'throws',
  notDeepEqual: 'deepEqual',
  notDeepStrictEqual: 'deepStrictEqual',
  notEqual: 'equal',
  notStrictEqual: 'strictEqual',
};

/**
 * Methods that require manual migration.
 */
export const UNSUPPORTED_METHODS = new Set(['CallTracker', 'ifError']);

/**
 * Map of assert method names to their transforms for quick lookup.
 */
const assertMatcherMap = new Map<string, MatcherTransform>(
  assertMatchers.map((m) => [m.assertMethod, m]),
);

/**
 * Get a matcher transform by its assert method name.
 *
 * @function
 * @param assertMethod - The node:assert method name (e.g., 'strictEqual', 'ok')
 * @returns The matcher transform or undefined if not found
 */
export const getMatcherTransform = (
  assertMethod: string,
): MatcherTransform | undefined => {
  return assertMatcherMap.get(assertMethod);
};

/**
 * Check if an assert method is supported for transformation.
 *
 * @function
 * @param assertMethod - The node:assert method name
 * @returns Whether the method can be transformed
 */
export const isMatcherSupported = (assertMethod: string): boolean => {
  if (UNSUPPORTED_METHODS.has(assertMethod)) {
    return false;
  }
  return assertMatcherMap.has(assertMethod);
};

/**
 * Check if an assert method is negated.
 *
 * @function
 * @param assertMethod - The node:assert method name
 * @returns Whether the method is a negated form
 */
export const isNegatedMethod = (assertMethod: string): boolean => {
  return assertMethod in NEGATION_MAPPINGS;
};

/**
 * Get the base (non-negated) method name.
 *
 * @function
 * @param assertMethod - The node:assert method name
 * @returns The base method name (e.g., 'strictEqual' for 'notStrictEqual')
 */
export const getBaseMethod = (assertMethod: string): string => {
  return NEGATION_MAPPINGS[assertMethod] ?? assertMethod;
};

/**
 * Check if an assert method requires expectAsync.
 *
 * @function
 * @param assertMethod - The node:assert method name
 * @returns Whether the method is async (rejects/doesNotReject)
 */
export const isAsyncMethod = (assertMethod: string): boolean => {
  const matcher = assertMatcherMap.get(assertMethod);
  return matcher?.isAsync === true;
};

/**
 * Check if an assert method is a legacy loose equality assertion.
 *
 * @function
 * @param assertMethod - The node:assert method name
 * @returns Whether the method uses loose equality semantics
 */
export const isLegacyMethod = (assertMethod: string): boolean => {
  const matcher = assertMatcherMap.get(assertMethod);
  return matcher?.isLegacy === true;
};
