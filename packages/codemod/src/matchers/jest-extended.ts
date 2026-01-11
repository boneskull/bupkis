import type { MatcherTransform } from '../types.js';

/**
 * Jest-extended matchers and their bupkis equivalents.
 *
 * Reference: https://jest-extended.jestcommunity.dev/docs/matchers
 */
export const jestExtendedMatchers: MatcherTransform[] = [
  // Truthiness
  { bupkisPhrase: 'to be true', jestMatcher: 'toBeTrue' },
  { bupkisPhrase: 'to be false', jestMatcher: 'toBeFalse' },

  // Arrays
  { bupkisPhrase: 'to be an array', jestMatcher: 'toBeArray' },
  { bupkisPhrase: 'to have length', jestMatcher: 'toBeArrayOfSize' },
  { bupkisPhrase: 'to be empty', jestMatcher: 'toBeEmpty' },
  { bupkisPhrase: 'to contain', jestMatcher: 'toInclude' },
  {
    bupkisPhrase: 'to contain',
    jestMatcher: 'toIncludeAllMembers',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: 'to contain',
    jestMatcher: 'toIncludeAnyMembers',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: 'to contain',
    jestMatcher: 'toIncludeSameMembers',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: 'to have items satisfying',
    jestMatcher: 'toSatisfyAll',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toSatisfyAny',
    /**
     * @function
     */
    transform: () => null,
  },

  // Strings
  { bupkisPhrase: 'to be a string', jestMatcher: 'toBeString' },
  { bupkisPhrase: 'to start with', jestMatcher: 'toStartWith' },
  { bupkisPhrase: 'to end with', jestMatcher: 'toEndWith' },
  {
    bupkisPhrase: '',
    jestMatcher: 'toEqualIgnoringCase',
    /**
     * @function
     */
    transform: () => null,
  },

  // Numbers
  { bupkisPhrase: 'to be a number', jestMatcher: 'toBeNumber' },
  { bupkisPhrase: 'to be positive', jestMatcher: 'toBePositive' },
  { bupkisPhrase: 'to be negative', jestMatcher: 'toBeNegative' },
  { bupkisPhrase: 'to be an integer', jestMatcher: 'toBeInteger' },
  { bupkisPhrase: 'to be finite', jestMatcher: 'toBeFinite' },
  { bupkisPhrase: 'to be within', jestMatcher: 'toBeWithin' },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeEven',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeOdd',
    /**
     * @function
     */
    transform: () => null,
  },

  // Objects
  { bupkisPhrase: 'to be an object', jestMatcher: 'toBeObject' },
  { bupkisPhrase: 'to have property', jestMatcher: 'toContainKey' },
  { bupkisPhrase: 'to have properties', jestMatcher: 'toContainKeys' },
  {
    bupkisPhrase: '',
    jestMatcher: 'toContainValue',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toContainValues',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toContainEntry',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toContainEntries',
    /**
     * @function
     */
    transform: () => null,
  },
  { bupkisPhrase: 'to be extensible', jestMatcher: 'toBeExtensible' },
  { bupkisPhrase: 'to be frozen', jestMatcher: 'toBeFrozen' },
  { bupkisPhrase: 'to be sealed', jestMatcher: 'toBeSealed' },

  // Functions
  { bupkisPhrase: 'to be a function', jestMatcher: 'toBeFunction' },
  {
    bupkisPhrase: 'to throw',
    jestMatcher: 'toThrowWithMessage',
    /**
     * @function
     */
    transform: () => null,
  },

  // Dates
  { bupkisPhrase: 'to be a date', jestMatcher: 'toBeDate' },
  { bupkisPhrase: 'to be a valid date', jestMatcher: 'toBeValidDate' },
  { bupkisPhrase: 'to be before', jestMatcher: 'toBeBefore' },
  { bupkisPhrase: 'to be after', jestMatcher: 'toBeAfter' },

  // Booleans
  { bupkisPhrase: 'to be a boolean', jestMatcher: 'toBeBoolean' },

  // Symbols
  { bupkisPhrase: 'to be a symbol', jestMatcher: 'toBeSymbol' },

  // One of
  { bupkisPhrase: 'to be one of', jestMatcher: 'toBeOneOf' },

  // Type checking
  { bupkisPhrase: 'to be nullish', jestMatcher: 'toBeNil' },
];
