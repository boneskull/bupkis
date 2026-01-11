import type { MatcherTransform } from '../types.ts';

/**
 * Core Jest matchers and their bupkis equivalents.
 *
 * Reference: https://jestjs.io/docs/expect
 */
export const coreMatchers: MatcherTransform[] = [
  // Equality
  { bupkisPhrase: 'to be', jestMatcher: 'toBe' },
  { bupkisPhrase: 'to deep equal', jestMatcher: 'toEqual' },
  { bupkisPhrase: 'to deep equal', jestMatcher: 'toStrictEqual' },

  // Truthiness
  { bupkisPhrase: 'to be truthy', jestMatcher: 'toBeTruthy' },
  { bupkisPhrase: 'to be falsy', jestMatcher: 'toBeFalsy' },
  { bupkisPhrase: 'to be null', jestMatcher: 'toBeNull' },
  { bupkisPhrase: 'to be undefined', jestMatcher: 'toBeUndefined' },
  { bupkisPhrase: 'to be defined', jestMatcher: 'toBeDefined' },
  { bupkisPhrase: 'to be NaN', jestMatcher: 'toBeNaN' },

  // Type checking
  {
    bupkisPhrase: 'to be an instance of',
    jestMatcher: 'toBeInstanceOf',
  },

  // Numbers
  { bupkisPhrase: 'to be greater than', jestMatcher: 'toBeGreaterThan' },
  {
    bupkisPhrase: 'to be greater than or equal to',
    jestMatcher: 'toBeGreaterThanOrEqual',
  },
  { bupkisPhrase: 'to be less than', jestMatcher: 'toBeLessThan' },
  {
    bupkisPhrase: 'to be less than or equal to',
    jestMatcher: 'toBeLessThanOrEqual',
  },
  {
    bupkisPhrase: 'to be close to',
    jestMatcher: 'toBeCloseTo',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      // Jest: toBeCloseTo(expected, numDigits?) where numDigits defaults to 2
      // Bupkis: 'to be close to', expected, tolerance (absolute)
      // Conversion: tolerance = 10^(-numDigits) / 2
      const phrase = negated ? 'not to be close to' : 'to be close to';
      const expected = matcherArgs[0];
      const numDigits = matcherArgs.length === 2 ? Number(matcherArgs[1]) : 2;
      const { pow } = Math;
      const tolerance = pow(10, -numDigits) / 2;
      return `expect(${subject}, '${phrase}', ${expected}, ${tolerance})`;
    },
  },

  // Strings
  {
    bupkisPhrase: 'to match',
    jestMatcher: 'toMatch',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      // toMatch can take regex or string
      // Regex: use 'to match'
      // String: use 'to contain' (substring matching)
      const arg = matcherArgs[0];
      const isRegex = arg.startsWith('/');
      const phrase = isRegex
        ? negated
          ? 'not to match'
          : 'to match'
        : negated
          ? 'not to contain'
          : 'to contain';
      return `expect(${subject}, '${phrase}', ${arg})`;
    },
  },
  { bupkisPhrase: 'to contain', jestMatcher: 'toContain' },

  // Arrays/Iterables
  { bupkisPhrase: 'to have length', jestMatcher: 'toHaveLength' },
  {
    bupkisPhrase: '',
    jestMatcher: 'toContainEqual',
    /**
     * @function
     */
    transform: () => null, // No bupkis equivalent - 'to contain' uses reference equality
  },

  // Objects
  {
    bupkisPhrase: 'to have property',
    jestMatcher: 'toHaveProperty',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      // toHaveProperty(keyPath, value?) -> 'to have property', key or 'to satisfy'
      if (matcherArgs.length === 1) {
        const phrase = negated ? 'not to have property' : 'to have property';
        return `expect(${subject}, '${phrase}', ${matcherArgs[0]})`;
      }
      // With value: toHaveProperty('key', value) -> 'to satisfy', {key: value}
      const phrase = negated ? 'not to satisfy' : 'to satisfy';
      const key = matcherArgs[0];
      const value = matcherArgs[1];
      // Handle string keys (remove quotes for object literal)
      const keyStr =
        typeof key === 'string' && key.startsWith("'")
          ? key.slice(1, -1)
          : typeof key === 'string' && key.startsWith('"')
            ? key.slice(1, -1)
            : key;
      return `expect(${subject}, '${phrase}', { ${keyStr}: ${value} })`;
    },
  },
  {
    bupkisPhrase: 'to satisfy',
    jestMatcher: 'toMatchObject',
  },

  // Errors/Exceptions
  { bupkisPhrase: 'to throw', jestMatcher: 'toThrow' },
  {
    bupkisPhrase: 'to throw',
    jestMatcher: 'toThrowError',
  },

  // Promises (these need expectAsync)
  {
    bupkisPhrase: 'to be fulfilled',
    jestMatcher: 'resolves',
    /**
     * @function
     */
    transform: () => null, // Complex - needs restructuring to expectAsync
  },
  {
    bupkisPhrase: 'to reject',
    jestMatcher: 'rejects',
    /**
     * @function
     */
    transform: () => null, // Complex - needs restructuring to expectAsync
  },

  // Mocks/Spies (mark as unsupported)
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveBeenCalled' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveBeenCalledTimes',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveBeenCalledWith',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveBeenLastCalledWith',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveBeenNthCalledWith',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveReturned' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveReturnedTimes',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveReturnedWith',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveLastReturnedWith',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveNthReturnedWith',
    /**
     * @function
     */
    transform: () => null,
  },
];
