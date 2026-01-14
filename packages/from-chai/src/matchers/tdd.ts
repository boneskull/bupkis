import type { MatcherTransform } from '../types.js';

/**
 * TDD-style Chai matchers (assert.xxx) and their bupkis equivalents.
 *
 * Chai's TDD API uses function calls like `assert.equal(actual, expected)`. The
 * `chaiMatcher` field represents the assertion method name after `assert.`.
 *
 * Note: Many assert methods have `notXxx` variants which are handled by the
 * transformer detecting the `not` prefix and setting negated=true.
 *
 * @see {@link https://www.chaijs.com/api/assert/}
 */
export const tddMatchers: MatcherTransform[] = [
  // Equality
  { bupkisPhrase: 'to be', chaiMatcher: 'equal', style: 'tdd' },
  { bupkisPhrase: 'to be', chaiMatcher: 'notEqual', style: 'tdd' },
  { bupkisPhrase: 'to be', chaiMatcher: 'strictEqual', style: 'tdd' },
  { bupkisPhrase: 'to be', chaiMatcher: 'notStrictEqual', style: 'tdd' },
  { bupkisPhrase: 'to deep equal', chaiMatcher: 'deepEqual', style: 'tdd' },
  { bupkisPhrase: 'to deep equal', chaiMatcher: 'notDeepEqual', style: 'tdd' },

  // Truthiness
  { bupkisPhrase: 'to be true', chaiMatcher: 'isTrue', style: 'tdd' },
  { bupkisPhrase: 'to be false', chaiMatcher: 'isFalse', style: 'tdd' },
  { bupkisPhrase: 'to be true', chaiMatcher: 'isNotTrue', style: 'tdd' },
  { bupkisPhrase: 'to be false', chaiMatcher: 'isNotFalse', style: 'tdd' },
  { bupkisPhrase: 'to be truthy', chaiMatcher: 'isOk', style: 'tdd' },
  { bupkisPhrase: 'to be truthy', chaiMatcher: 'ok', style: 'tdd' },
  { bupkisPhrase: 'to be truthy', chaiMatcher: 'isNotOk', style: 'tdd' },
  { bupkisPhrase: 'to be truthy', chaiMatcher: 'notOk', style: 'tdd' },

  // Null/Undefined
  { bupkisPhrase: 'to be null', chaiMatcher: 'isNull', style: 'tdd' },
  { bupkisPhrase: 'to be null', chaiMatcher: 'isNotNull', style: 'tdd' },
  { bupkisPhrase: 'to be undefined', chaiMatcher: 'isUndefined', style: 'tdd' },
  {
    bupkisPhrase: 'to be undefined',
    chaiMatcher: 'isNotUndefined',
    style: 'tdd',
  },
  { bupkisPhrase: 'to be defined', chaiMatcher: 'isDefined', style: 'tdd' },
  { bupkisPhrase: 'to be NaN', chaiMatcher: 'isNaN', style: 'tdd' },
  { bupkisPhrase: 'to be NaN', chaiMatcher: 'isNotNaN', style: 'tdd' },
  { bupkisPhrase: 'to exist', chaiMatcher: 'exists', style: 'tdd' },
  { bupkisPhrase: 'to exist', chaiMatcher: 'notExists', style: 'tdd' },

  // Type checking
  { bupkisPhrase: 'to be a', chaiMatcher: 'typeOf', style: 'tdd' },
  { bupkisPhrase: 'to be a', chaiMatcher: 'notTypeOf', style: 'tdd' },
  {
    bupkisPhrase: 'to be an instance of',
    chaiMatcher: 'instanceOf',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to be an instance of',
    chaiMatcher: 'notInstanceOf',
    style: 'tdd',
  },

  // Specific type assertions
  { bupkisPhrase: 'to be a', chaiMatcher: 'isObject', style: 'tdd' },
  { bupkisPhrase: 'to be a', chaiMatcher: 'isNotObject', style: 'tdd' },
  { bupkisPhrase: 'to be a', chaiMatcher: 'isArray', style: 'tdd' },
  { bupkisPhrase: 'to be a', chaiMatcher: 'isNotArray', style: 'tdd' },
  { bupkisPhrase: 'to be a', chaiMatcher: 'isString', style: 'tdd' },
  { bupkisPhrase: 'to be a', chaiMatcher: 'isNotString', style: 'tdd' },
  { bupkisPhrase: 'to be a', chaiMatcher: 'isNumber', style: 'tdd' },
  { bupkisPhrase: 'to be a', chaiMatcher: 'isNotNumber', style: 'tdd' },
  { bupkisPhrase: 'to be finite', chaiMatcher: 'isFinite', style: 'tdd' },
  { bupkisPhrase: 'to be a', chaiMatcher: 'isBoolean', style: 'tdd' },
  { bupkisPhrase: 'to be a', chaiMatcher: 'isNotBoolean', style: 'tdd' },
  { bupkisPhrase: 'to be a', chaiMatcher: 'isFunction', style: 'tdd' },
  { bupkisPhrase: 'to be a', chaiMatcher: 'isNotFunction', style: 'tdd' },

  // Numbers
  { bupkisPhrase: 'to be greater than', chaiMatcher: 'isAbove', style: 'tdd' },
  { bupkisPhrase: 'to be less than', chaiMatcher: 'isBelow', style: 'tdd' },
  {
    bupkisPhrase: 'to be greater than or equal to',
    chaiMatcher: 'isAtLeast',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to be less than or equal to',
    chaiMatcher: 'isAtMost',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to be close to',
    chaiMatcher: 'closeTo',
    style: 'tdd',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      // assert.closeTo(actual, expected, delta)
      const phrase = negated ? 'not to be close to' : 'to be close to';
      const [expected, delta] = matcherArgs;
      return `expect(${subject}, '${phrase}', ${expected}, ${delta})`;
    },
  },
  {
    bupkisPhrase: 'to be close to',
    chaiMatcher: 'approximately',
    style: 'tdd',
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
  { bupkisPhrase: 'to match', chaiMatcher: 'match', style: 'tdd' },
  { bupkisPhrase: 'to match', chaiMatcher: 'notMatch', style: 'tdd' },
  { bupkisPhrase: 'to contain', chaiMatcher: 'include', style: 'tdd' },
  { bupkisPhrase: 'to contain', chaiMatcher: 'notInclude', style: 'tdd' },

  // Arrays/Collections
  { bupkisPhrase: 'to have length', chaiMatcher: 'lengthOf', style: 'tdd' },
  { bupkisPhrase: 'to be empty', chaiMatcher: 'isEmpty', style: 'tdd' },
  { bupkisPhrase: 'to be empty', chaiMatcher: 'isNotEmpty', style: 'tdd' },
  {
    bupkisPhrase: 'to contain',
    chaiMatcher: 'includeMembers',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to contain',
    chaiMatcher: 'notIncludeMembers',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to have members',
    chaiMatcher: 'sameMembers',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to have members',
    chaiMatcher: 'notSameMembers',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to have ordered members',
    chaiMatcher: 'sameOrderedMembers',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to have ordered members',
    chaiMatcher: 'notSameOrderedMembers',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to have deep ordered members',
    chaiMatcher: 'sameDeepOrderedMembers',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to have deep ordered members',
    chaiMatcher: 'notSameDeepOrderedMembers',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to contain',
    chaiMatcher: 'includeDeepMembers',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to contain',
    chaiMatcher: 'notIncludeDeepMembers',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to only contain',
    chaiMatcher: 'oneOf',
    style: 'tdd',
  },

  // Objects
  {
    bupkisPhrase: 'to have property',
    chaiMatcher: 'property',
    style: 'tdd',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      // assert.property(object, property) or assert.propertyVal(object, prop, value)
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
    bupkisPhrase: 'to have property',
    chaiMatcher: 'notProperty',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to satisfy',
    chaiMatcher: 'propertyVal',
    style: 'tdd',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      const phrase = negated ? 'not to satisfy' : 'to satisfy';
      const key = matcherArgs[0];
      const value = matcherArgs[1];
      const keyStr =
        key?.startsWith("'") || key?.startsWith('"') ? key.slice(1, -1) : key;
      return `expect(${subject}, '${phrase}', { ${keyStr}: ${value} })`;
    },
  },
  {
    bupkisPhrase: 'to satisfy',
    chaiMatcher: 'notPropertyVal',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to deep equal',
    chaiMatcher: 'deepPropertyVal',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to deep equal',
    chaiMatcher: 'notDeepPropertyVal',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to have own property',
    chaiMatcher: 'ownProperty',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to have own property',
    chaiMatcher: 'notOwnProperty',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to have keys',
    chaiMatcher: 'hasAllKeys',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to have keys',
    chaiMatcher: 'doesNotHaveAllKeys',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to have any keys',
    chaiMatcher: 'hasAnyKeys',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to have any keys',
    chaiMatcher: 'doesNotHaveAnyKeys',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to contain',
    chaiMatcher: 'containsAllKeys',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to contain',
    chaiMatcher: 'doesNotContainAllKeys',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to have nested property',
    chaiMatcher: 'nestedProperty',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to have nested property',
    chaiMatcher: 'notNestedProperty',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to satisfy',
    chaiMatcher: 'nestedPropertyVal',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to satisfy',
    chaiMatcher: 'notNestedPropertyVal',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to deep equal',
    chaiMatcher: 'deepNestedPropertyVal',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to deep equal',
    chaiMatcher: 'notDeepNestedPropertyVal',
    style: 'tdd',
  },

  // Errors/Exceptions
  { bupkisPhrase: 'to throw', chaiMatcher: 'throws', style: 'tdd' },
  { bupkisPhrase: 'to throw', chaiMatcher: 'throw', style: 'tdd' },
  { bupkisPhrase: 'to throw', chaiMatcher: 'Throw', style: 'tdd' },
  { bupkisPhrase: 'to throw', chaiMatcher: 'doesNotThrow', style: 'tdd' },

  // Frozen/Sealed
  { bupkisPhrase: 'to be frozen', chaiMatcher: 'isFrozen', style: 'tdd' },
  { bupkisPhrase: 'to be frozen', chaiMatcher: 'isNotFrozen', style: 'tdd' },
  { bupkisPhrase: 'to be sealed', chaiMatcher: 'isSealed', style: 'tdd' },
  { bupkisPhrase: 'to be sealed', chaiMatcher: 'isNotSealed', style: 'tdd' },
  {
    bupkisPhrase: 'to be extensible',
    chaiMatcher: 'isExtensible',
    style: 'tdd',
  },
  {
    bupkisPhrase: 'to be extensible',
    chaiMatcher: 'isNotExtensible',
    style: 'tdd',
  },

  // Comparison operators
  { bupkisPhrase: 'to be', chaiMatcher: 'operator', style: 'tdd' },

  // General assertions
  { bupkisPhrase: 'to fail', chaiMatcher: 'fail', style: 'tdd' },

  // Change tracking
  { bupkisPhrase: 'to change', chaiMatcher: 'changes', style: 'tdd' },
  { bupkisPhrase: 'to change', chaiMatcher: 'doesNotChange', style: 'tdd' },
  { bupkisPhrase: 'to increase', chaiMatcher: 'increases', style: 'tdd' },
  {
    bupkisPhrase: 'to increase',
    chaiMatcher: 'doesNotIncrease',
    style: 'tdd',
  },
  { bupkisPhrase: 'to decrease', chaiMatcher: 'decreases', style: 'tdd' },
  {
    bupkisPhrase: 'to decrease',
    chaiMatcher: 'doesNotDecrease',
    style: 'tdd',
  },
];

/**
 * Map of TDD matcher names to their transforms for quick lookup.
 */
const tddMatcherMap = new Map<string, MatcherTransform>(
  tddMatchers.map((m) => [m.chaiMatcher, m]),
);

/**
 * Get a TDD matcher transform by its Chai assertion name.
 *
 * @function
 * @param chaiMatcher - The Chai assertion method name (e.g., 'equal', 'isTrue')
 * @returns The matcher transform or undefined if not found
 */
export const getTddMatcher = (
  chaiMatcher: string,
): MatcherTransform | undefined => {
  return tddMatcherMap.get(chaiMatcher);
};

