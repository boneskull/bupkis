import type { MatcherTransform } from '../types.js';

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
      if (!arg) {
        return null;
      }
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
      // Note: matcherArgs elements are always strings from the AST
      if (!key) {
        return null;
      }
      const keyStr =
        key.startsWith("'") || key.startsWith('"') ? key.slice(1, -1) : key;
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

  // Note: resolves/rejects are handled as modifiers in expect-transformer.ts,
  // not as standalone matchers. See transformPromiseChain().

  // Mock/spy matchers are handled separately via @bupkis/sinon
  // See: matchers/sinon.ts and the --sinon CLI flag
];

/**
 * Matchers that pass their argument directly as the expected value.
 *
 * For these matchers, we can use `'to fulfill with value satisfying', value`
 * directly without wrapping in `expect.it()`.
 */
const DIRECT_VALUE_MATCHERS = new Set([
  'toBe',
  'toEqual',
  'toMatchObject',
  'toStrictEqual',
]);

/**
 * Look up the bupkis phrase for a Jest matcher.
 *
 * @function
 */
const jestMatcherToBupkisPhrase = (jestMatcher: string): null | string => {
  const transform = coreMatchers.find((m) => m.jestMatcher === jestMatcher);
  return transform?.bupkisPhrase ?? null;
};

/**
 * Handle `rejects.toThrow()` special cases.
 *
 * - No args: `'to reject'`
 * - Error class: `'to reject with a', ErrorClass`
 * - String/regex: `'to reject with error satisfying', arg`
 *
 * @function
 */
const handleRejectsToThrow = (
  subject: string,
  matcherArgs: string[],
  negated: boolean,
): string => {
  if (matcherArgs.length === 0) {
    const phrase = negated ? 'not to reject' : 'to reject';
    return `expectAsync(${subject}, '${phrase}')`;
  }

  const arg = matcherArgs[0]!;

  // Check if arg is an Error class (starts with uppercase, no quotes/regex/template literal)
  // Limitations of this heuristic:
  // - UPPERCASE_CONSTANTS like MAX_VALUE will be incorrectly treated as Error classes
  // - Variable references like `const Err = TypeError; toThrow(Err)` will work correctly
  //   (variable starts with uppercase, which is intentional for error class variables)
  // - Property access like CustomErrors.NetworkError will be correctly treated as Error class
  //   (this is the expected behavior since you'd want `to reject with a, CustomErrors.NetworkError`)
  const isErrorClass =
    /^[A-Z]/.test(arg) &&
    !arg.startsWith('/') &&
    !arg.startsWith("'") &&
    !arg.startsWith('"') &&
    !arg.startsWith('`');

  if (isErrorClass) {
    const phrase = negated ? 'not to reject with a' : 'to reject with a';
    return `expectAsync(${subject}, '${phrase}', ${arg})`;
  }

  // String or regex - use 'to reject with error satisfying'
  const phrase = negated
    ? 'not to reject with error satisfying'
    : 'to reject with error satisfying';
  return `expectAsync(${subject}, '${phrase}', ${arg})`;
};

export interface PromiseChainTransformResult {
  /** The transformed code */
  code: string;
  /** Whether the transformation was successful */
  success: boolean;
}

/**
 * Transform a Jest promise modifier chain to bupkis `expectAsync`.
 *
 * Handles patterns like:
 *
 * - `expect(p).resolves.toBe(v)` → `expectAsync(p, 'to fulfill with value
 *   satisfying', v)`
 * - `expect(p).resolves.toBeTruthy()` → `expectAsync(p, 'to fulfill with value
 *   satisfying', expect.it('to be truthy'))`
 * - `expect(p).rejects.toThrow()` → `expectAsync(p, 'to reject')`
 *
 * @function
 */
export const transformPromiseChain = (
  subject: string,
  modifier: 'rejects' | 'resolves',
  matcher: string,
  matcherArgs: string[],
  negated: boolean,
): PromiseChainTransformResult => {
  const bupkisPhrase = jestMatcherToBupkisPhrase(matcher);

  // If we don't have a mapping for this matcher, we can't transform it
  if (!bupkisPhrase) {
    return { code: '', success: false };
  }

  const negatedPhrase = negated ? `not ${bupkisPhrase}` : bupkisPhrase;

  if (modifier === 'resolves') {
    // Direct value matchers - pass the value directly
    if (DIRECT_VALUE_MATCHERS.has(matcher) && matcherArgs.length > 0) {
      const phrase = negated
        ? 'not to fulfill with value satisfying'
        : 'to fulfill with value satisfying';
      return {
        code: `expectAsync(${subject}, '${phrase}', ${matcherArgs[0]})`,
        success: true,
      };
    }

    // All other matchers - wrap in expect.it()
    const expectItArgs =
      matcherArgs.length > 0 ? `, ${matcherArgs.join(', ')}` : '';
    const phrase = negated
      ? 'not to fulfill with value satisfying'
      : 'to fulfill with value satisfying';
    return {
      code: `expectAsync(${subject}, '${phrase}', expect.it('${negatedPhrase}'${expectItArgs}))`,
      success: true,
    };
  }

  // rejects handling
  if (matcher === 'toThrow' || matcher === 'toThrowError') {
    return {
      code: handleRejectsToThrow(subject, matcherArgs, negated),
      success: true,
    };
  }

  // All other rejects matchers - wrap in expect.it()
  const expectItArgs =
    matcherArgs.length > 0 ? `, ${matcherArgs.join(', ')}` : '';
  const phrase = negated
    ? 'not to reject with error satisfying'
    : 'to reject with error satisfying';
  return {
    code: `expectAsync(${subject}, '${phrase}', expect.it('${negatedPhrase}'${expectItArgs}))`,
    success: true,
  };
};
