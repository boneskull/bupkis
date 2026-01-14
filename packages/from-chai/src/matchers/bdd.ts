import type { MatcherTransform } from '../types.js';

/**
 * BDD-style Chai matchers (expect/should) and their bupkis equivalents.
 *
 * Chai's BDD API uses chainable properties like `.to.be.true` or
 * `.to.deep.equal(x)`. The `chaiMatcher` field represents the terminal part of
 * the chain that determines the assertion.
 *
 * @see {@link https://www.chaijs.com/api/bdd/}
 */
export const bddMatchers: MatcherTransform[] = [
  // Equality
  { bupkisPhrase: 'to be', chaiMatcher: 'equal', style: 'bdd' },
  { bupkisPhrase: 'to be', chaiMatcher: 'eq', style: 'bdd' },
  { bupkisPhrase: 'to deep equal', chaiMatcher: 'eql', style: 'bdd' },
  { bupkisPhrase: 'to deep equal', chaiMatcher: 'eqls', style: 'bdd' },
  { bupkisPhrase: 'to deep equal', chaiMatcher: 'deep.equal', style: 'bdd' },
  { bupkisPhrase: 'to deep equal', chaiMatcher: 'deep.equals', style: 'bdd' },

  // Truthiness
  { bupkisPhrase: 'to be true', chaiMatcher: 'be.true', style: 'bdd' },
  { bupkisPhrase: 'to be false', chaiMatcher: 'be.false', style: 'bdd' },
  { bupkisPhrase: 'to be null', chaiMatcher: 'be.null', style: 'bdd' },
  {
    bupkisPhrase: 'to be undefined',
    chaiMatcher: 'be.undefined',
    style: 'bdd',
  },
  { bupkisPhrase: 'to be NaN', chaiMatcher: 'be.NaN', style: 'bdd' },
  { bupkisPhrase: 'to be truthy', chaiMatcher: 'be.ok', style: 'bdd' },
  { bupkisPhrase: 'to be truthy', chaiMatcher: 'ok', style: 'bdd' },
  { bupkisPhrase: 'to be defined', chaiMatcher: 'exist', style: 'bdd' },

  // Type checking
  { bupkisPhrase: 'to be a', chaiMatcher: 'be.a', style: 'bdd' },
  { bupkisPhrase: 'to be a', chaiMatcher: 'be.an', style: 'bdd' },
  { bupkisPhrase: 'to be a', chaiMatcher: 'a', style: 'bdd' },
  { bupkisPhrase: 'to be a', chaiMatcher: 'an', style: 'bdd' },
  {
    bupkisPhrase: 'to be an instance of',
    chaiMatcher: 'be.instanceof',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be an instance of',
    chaiMatcher: 'be.instanceOf',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be an instance of',
    chaiMatcher: 'instanceof',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be an instance of',
    chaiMatcher: 'instanceOf',
    style: 'bdd',
  },

  // Numbers
  { bupkisPhrase: 'to be greater than', chaiMatcher: 'be.above', style: 'bdd' },
  {
    bupkisPhrase: 'to be greater than',
    chaiMatcher: 'be.greaterThan',
    style: 'bdd',
  },
  { bupkisPhrase: 'to be greater than', chaiMatcher: 'above', style: 'bdd' },
  { bupkisPhrase: 'to be greater than', chaiMatcher: 'gt', style: 'bdd' },
  {
    bupkisPhrase: 'to be greater than or equal to',
    chaiMatcher: 'be.at.least',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be greater than or equal to',
    chaiMatcher: 'least',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be greater than or equal to',
    chaiMatcher: 'gte',
    style: 'bdd',
  },
  { bupkisPhrase: 'to be less than', chaiMatcher: 'be.below', style: 'bdd' },
  {
    bupkisPhrase: 'to be less than',
    chaiMatcher: 'be.lessThan',
    style: 'bdd',
  },
  { bupkisPhrase: 'to be less than', chaiMatcher: 'below', style: 'bdd' },
  { bupkisPhrase: 'to be less than', chaiMatcher: 'lt', style: 'bdd' },
  {
    bupkisPhrase: 'to be less than or equal to',
    chaiMatcher: 'be.at.most',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be less than or equal to',
    chaiMatcher: 'most',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be less than or equal to',
    chaiMatcher: 'lte',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be within',
    chaiMatcher: 'be.within',
    style: 'bdd',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      // Chai: within(start, finish) checks start <= value <= finish
      // Bupkis: 'to be within', start, finish
      const phrase = negated ? 'not to be within' : 'to be within';
      const [start, finish] = matcherArgs;
      return `expect(${subject}, '${phrase}', ${start}, ${finish})`;
    },
  },
  {
    bupkisPhrase: 'to be within',
    chaiMatcher: 'within',
    style: 'bdd',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      const phrase = negated ? 'not to be within' : 'to be within';
      const [start, finish] = matcherArgs;
      return `expect(${subject}, '${phrase}', ${start}, ${finish})`;
    },
  },
  {
    bupkisPhrase: 'to be close to',
    chaiMatcher: 'be.closeTo',
    style: 'bdd',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      // Chai: closeTo(expected, delta) checks |value - expected| <= delta
      // Bupkis: 'to be close to', expected, tolerance
      const phrase = negated ? 'not to be close to' : 'to be close to';
      const [expected, delta] = matcherArgs;
      return `expect(${subject}, '${phrase}', ${expected}, ${delta})`;
    },
  },
  {
    bupkisPhrase: 'to be close to',
    chaiMatcher: 'closeTo',
    style: 'bdd',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      const phrase = negated ? 'not to be close to' : 'to be close to';
      const [expected, delta] = matcherArgs;
      return `expect(${subject}, '${phrase}', ${expected}, ${delta})`;
    },
  },

  // Strings
  { bupkisPhrase: 'to match', chaiMatcher: 'match', style: 'bdd' },
  { bupkisPhrase: 'to match', chaiMatcher: 'matches', style: 'bdd' },
  { bupkisPhrase: 'to contain', chaiMatcher: 'contain', style: 'bdd' },
  { bupkisPhrase: 'to contain', chaiMatcher: 'contains', style: 'bdd' },
  { bupkisPhrase: 'to contain', chaiMatcher: 'include', style: 'bdd' },
  { bupkisPhrase: 'to contain', chaiMatcher: 'includes', style: 'bdd' },
  {
    bupkisPhrase: 'to start with',
    chaiMatcher: 'string',
    style: 'bdd',
  },

  // Arrays/Collections
  {
    bupkisPhrase: 'to have length',
    chaiMatcher: 'have.length',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to have length',
    chaiMatcher: 'have.lengthOf',
    style: 'bdd',
  },
  { bupkisPhrase: 'to have length', chaiMatcher: 'length', style: 'bdd' },
  { bupkisPhrase: 'to have length', chaiMatcher: 'lengthOf', style: 'bdd' },
  { bupkisPhrase: 'to be empty', chaiMatcher: 'be.empty', style: 'bdd' },
  { bupkisPhrase: 'to be empty', chaiMatcher: 'empty', style: 'bdd' },
  {
    bupkisPhrase: 'to contain',
    chaiMatcher: 'deep.include',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to have members',
    chaiMatcher: 'have.members',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to have members',
    chaiMatcher: 'members',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to have ordered members',
    chaiMatcher: 'have.ordered.members',
    style: 'bdd',
  },

  // Objects
  {
    bupkisPhrase: 'to have property',
    chaiMatcher: 'have.property',
    style: 'bdd',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      // .have.property(key) or .have.property(key, value)
      if (matcherArgs.length === 1) {
        const phrase = negated ? 'not to have property' : 'to have property';
        return `expect(${subject}, '${phrase}', ${matcherArgs[0]})`;
      }
      // With value check: use 'to satisfy' with object literal
      const phrase = negated ? 'not to satisfy' : 'to satisfy';
      const key = matcherArgs[0];
      const value = matcherArgs[1];
      // Handle string keys
      const keyStr =
        key?.startsWith("'") || key?.startsWith('"') ? key.slice(1, -1) : key;
      return `expect(${subject}, '${phrase}', { ${keyStr}: ${value} })`;
    },
  },
  {
    bupkisPhrase: 'to have property',
    chaiMatcher: 'property',
    style: 'bdd',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      if (matcherArgs.length === 1) {
        const phrase = negated ? 'not to have property' : 'to have property';
        return `expect(${subject}, '${phrase}', ${matcherArgs[0]})`;
      }
      const phrase = negated ? 'not to satisfy' : 'to satisfy';
      const key = matcherArgs[0];
      const value = matcherArgs[1];
      const keyStr =
        key?.startsWith("'") || key?.startsWith('"') ? key.slice(1, -1) : key;
      return `expect(${subject}, '${phrase}', { ${keyStr}: ${value} })`;
    },
  },
  {
    bupkisPhrase: 'to have own property',
    chaiMatcher: 'have.own.property',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to have own property',
    chaiMatcher: 'haveOwnProperty',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to have keys',
    chaiMatcher: 'have.keys',
    style: 'bdd',
  },
  { bupkisPhrase: 'to have keys', chaiMatcher: 'have.key', style: 'bdd' },
  { bupkisPhrase: 'to have keys', chaiMatcher: 'keys', style: 'bdd' },
  { bupkisPhrase: 'to have keys', chaiMatcher: 'key', style: 'bdd' },
  {
    bupkisPhrase: 'to have all keys',
    chaiMatcher: 'have.all.keys',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to have any keys',
    chaiMatcher: 'have.any.keys',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to satisfy',
    chaiMatcher: 'deep.property',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to satisfy',
    chaiMatcher: 'nested.property',
    style: 'bdd',
  },

  // Errors/Exceptions
  { bupkisPhrase: 'to throw', chaiMatcher: 'throw', style: 'bdd' },
  { bupkisPhrase: 'to throw', chaiMatcher: 'throws', style: 'bdd' },
  { bupkisPhrase: 'to throw', chaiMatcher: 'Throw', style: 'bdd' },

  // Function-specific
  {
    bupkisPhrase: 'to increase',
    chaiMatcher: 'increase',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to decrease',
    chaiMatcher: 'decrease',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to change',
    chaiMatcher: 'change',
    style: 'bdd',
  },

  // Frozen/Sealed
  { bupkisPhrase: 'to be frozen', chaiMatcher: 'be.frozen', style: 'bdd' },
  { bupkisPhrase: 'to be frozen', chaiMatcher: 'frozen', style: 'bdd' },
  { bupkisPhrase: 'to be sealed', chaiMatcher: 'be.sealed', style: 'bdd' },
  { bupkisPhrase: 'to be sealed', chaiMatcher: 'sealed', style: 'bdd' },
  {
    bupkisPhrase: 'to be extensible',
    chaiMatcher: 'be.extensible',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to be extensible',
    chaiMatcher: 'extensible',
    style: 'bdd',
  },

  // Respond to / Satisfy
  {
    bupkisPhrase: 'to satisfy',
    chaiMatcher: 'satisfy',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to satisfy',
    chaiMatcher: 'satisfies',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to have property',
    chaiMatcher: 'respondTo',
    style: 'bdd',
  },
  {
    bupkisPhrase: 'to have property',
    chaiMatcher: 'respondsTo',
    style: 'bdd',
  },
];

/**
 * Map of BDD matcher names to their transforms for quick lookup.
 */
const bddMatcherMap = new Map<string, MatcherTransform>(
  bddMatchers.map((m) => [m.chaiMatcher, m]),
);

/**
 * Get a BDD matcher transform by its Chai chain name.
 *
 * @function
 * @param chaiMatcher - The Chai matcher chain (e.g., 'equal', 'deep.equal',
 *   'be.true')
 * @returns The matcher transform or undefined if not found
 */
export const getBddMatcher = (
  chaiMatcher: string,
): MatcherTransform | undefined => {
  return bddMatcherMap.get(chaiMatcher);
};

