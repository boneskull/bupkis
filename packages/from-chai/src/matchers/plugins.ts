import type { MatcherTransform } from '../types.js';

/**
 * Matchers from popular Chai plugins and their bupkis equivalents.
 *
 * Supports:
 *
 * - Chai-as-promised: Promise assertion matchers
 * - Chai-string: String utility matchers
 * - Chai-subset: Deep object subset matching
 *
 * @see {@link https://www.npmjs.com/package/chai-as-promised}
 * @see {@link https://www.npmjs.com/package/chai-string}
 * @see {@link https://www.npmjs.com/package/chai-subset}
 */
export const pluginMatchers: MatcherTransform[] = [
  // ============================================
  // chai-as-promised
  // ============================================

  // eventually.xxx - transforms promise assertion chains
  {
    bupkisPhrase: 'to be fulfilled with',
    chaiMatcher: 'eventually.equal',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be fulfilled with',
    chaiMatcher: 'eventually.eql',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be fulfilled with',
    chaiMatcher: 'eventually.deep.equal',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be fulfilled with value satisfying',
    chaiMatcher: 'eventually.be.true',
    style: 'bdd',
    /**
     * @function
     */
    transform: ({ negated, subject }) => {
      const phrase = negated
        ? 'not to be fulfilled with value satisfying'
        : 'to be fulfilled with value satisfying';
      return `expect(${subject}, '${phrase}', (v) => v === true)`;
    },
  },
  {
    bupkisPhrase: 'to be fulfilled with value satisfying',
    chaiMatcher: 'eventually.be.false',
    style: 'bdd',
    /**
     * @function
     */
    transform: ({ negated, subject }) => {
      const phrase = negated
        ? 'not to be fulfilled with value satisfying'
        : 'to be fulfilled with value satisfying';
      return `expect(${subject}, '${phrase}', (v) => v === false)`;
    },
  },
  {
    bupkisPhrase: 'to be fulfilled with value satisfying',
    chaiMatcher: 'eventually.be.null',
    style: 'bdd',
    /**
     * @function
     */
    transform: ({ negated, subject }) => {
      const phrase = negated
        ? 'not to be fulfilled with value satisfying'
        : 'to be fulfilled with value satisfying';
      return `expect(${subject}, '${phrase}', (v) => v === null)`;
    },
  },
  {
    bupkisPhrase: 'to be fulfilled with value satisfying',
    chaiMatcher: 'eventually.be.undefined',
    style: 'bdd',
    /**
     * @function
     */
    transform: ({ negated, subject }) => {
      const phrase = negated
        ? 'not to be fulfilled with value satisfying'
        : 'to be fulfilled with value satisfying';
      return `expect(${subject}, '${phrase}', (v) => v === undefined)`;
    },
  },
  {
    bupkisPhrase: 'to be fulfilled with value satisfying',
    chaiMatcher: 'eventually.have.property',
    style: 'bdd',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      const phrase = negated
        ? 'not to be fulfilled with value satisfying'
        : 'to be fulfilled with value satisfying';
      const key = matcherArgs[0];
      return `expect(${subject}, '${phrase}', (v) => ${key} in v)`;
    },
  },
  {
    bupkisPhrase: 'to be fulfilled with value satisfying',
    chaiMatcher: 'eventually.have.length',
    style: 'bdd',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      const phrase = negated
        ? 'not to be fulfilled with value satisfying'
        : 'to be fulfilled with value satisfying';
      const len = matcherArgs[0];
      return `expect(${subject}, '${phrase}', (v) => v.length === ${len})`;
    },
  },
  {
    bupkisPhrase: 'to be fulfilled with',
    chaiMatcher: 'eventually.include',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be fulfilled with',
    chaiMatcher: 'eventually.contain',
    style: 'bdd',
  },

  // Fulfillment/Rejection
  {
    bupkisPhrase: 'to be fulfilled',
    chaiMatcher: 'be.fulfilled',
    style: 'bdd',
  },
  { bupkisPhrase: 'to be fulfilled', chaiMatcher: 'fulfilled', style: 'bdd' },
  { bupkisPhrase: 'to be rejected', chaiMatcher: 'be.rejected', style: 'bdd' },
  { bupkisPhrase: 'to be rejected', chaiMatcher: 'rejected', style: 'bdd' },
  {
    bupkisPhrase: 'to be rejected with',
    chaiMatcher: 'be.rejectedWith',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be rejected with',
    chaiMatcher: 'rejectedWith',
    style: 'bdd',
  },

  // ============================================
  // chai-string
  // ============================================
  { bupkisPhrase: 'to start with', chaiMatcher: 'startWith', style: 'bdd' },
  { bupkisPhrase: 'to start with', chaiMatcher: 'startsWith', style: 'bdd' },
  { bupkisPhrase: 'to end with', chaiMatcher: 'endWith', style: 'bdd' },
  { bupkisPhrase: 'to end with', chaiMatcher: 'endsWith', style: 'bdd' },
  {
    bupkisPhrase: 'to equal ignoring case',
    chaiMatcher: 'equalIgnoreCase',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to equal ignoring spaces',
    chaiMatcher: 'equalIgnoreSpaces',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to contain ignoring case',
    chaiMatcher: 'containIgnoreCase',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to contain ignoring spaces',
    chaiMatcher: 'containIgnoreSpaces',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be single line',
    chaiMatcher: 'singleLine',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to reverse to',
    chaiMatcher: 'reverseOf',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be palindrome',
    chaiMatcher: 'palindrome',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to have entropy greater than',
    chaiMatcher: 'entropyGreaterThan',
    style: 'bdd',
  },

  // ============================================
  // chai-subset
  // ============================================
  {
    bupkisPhrase: 'to satisfy',
    chaiMatcher: 'containSubset',
    style: 'bdd',
  },

  // ============================================
  // chai-datetime
  // ============================================
  {
    bupkisPhrase: 'to equal date',
    chaiMatcher: 'equalDate',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to equal time',
    chaiMatcher: 'equalTime',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be before date',
    chaiMatcher: 'beforeDate',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be after date',
    chaiMatcher: 'afterDate',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be before time',
    chaiMatcher: 'beforeTime',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be after time',
    chaiMatcher: 'afterTime',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be within date',
    chaiMatcher: 'withinDate',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be within time',
    chaiMatcher: 'withinTime',
    style: 'bdd',
  },

  // ============================================
  // chai-json-schema
  // ============================================
  {
    bupkisPhrase: 'to match JSON schema',
    chaiMatcher: 'jsonSchema',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to match JSON schema',
    chaiMatcher: 'matchSchema',
    style: 'bdd',
  },
];

/**
 * Map of plugin matcher names to their transforms for quick lookup.
 */
const pluginMatcherMap = new Map<string, MatcherTransform>(
  pluginMatchers.map((m) => [m.chaiMatcher, m]),
);

/**
 * Get a plugin matcher transform by its Chai chain name.
 *
 * @function
 * @param chaiMatcher - The Chai plugin matcher chain (e.g., 'eventually.equal',
 *   'startWith')
 * @returns The matcher transform or undefined if not found
 */
export const getPluginMatcher = (
  chaiMatcher: string,
): MatcherTransform | undefined => {
  return pluginMatcherMap.get(chaiMatcher);
};

