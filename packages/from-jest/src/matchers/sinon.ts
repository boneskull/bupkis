import type { MatcherTransform } from '../types.js';

/**
 * Sinon spy/mock matchers for transforming Jest mock assertions to
 * `@bupkis/sinon`.
 */
export const sinonMatchers: MatcherTransform[] = [
  // toHaveBeenCalled / toBeCalled
  {
    bupkisPhrase: 'was called',
    jestMatcher: 'toHaveBeenCalled',
  },
  {
    bupkisPhrase: 'was called',
    jestMatcher: 'toBeCalled',
  },

  // toHaveBeenCalledTimes / toBeCalledTimes
  {
    bupkisPhrase: 'was called times',
    jestMatcher: 'toHaveBeenCalledTimes',
  },
  {
    bupkisPhrase: 'was called times',
    jestMatcher: 'toBeCalledTimes',
  },

  // toHaveBeenCalledWith / toBeCalledWith - args need array wrapping
  {
    bupkisPhrase: 'was called with',
    jestMatcher: 'toHaveBeenCalledWith',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      const phrase = negated ? 'not was called with' : 'was called with';
      const argsArray = `[${matcherArgs.join(', ')}]`;
      return `expect(${subject}, '${phrase}', ${argsArray})`;
    },
  },
  {
    bupkisPhrase: 'was called with',
    jestMatcher: 'toBeCalledWith',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      const phrase = negated ? 'not was called with' : 'was called with';
      const argsArray = `[${matcherArgs.join(', ')}]`;
      return `expect(${subject}, '${phrase}', ${argsArray})`;
    },
  },

  // toHaveBeenLastCalledWith / lastCalledWith - subject restructure
  {
    bupkisPhrase: 'to have args',
    jestMatcher: 'toHaveBeenLastCalledWith',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      const phrase = negated ? 'not to have args' : 'to have args';
      const argsArray = `[${matcherArgs.join(', ')}]`;
      return `expect(${subject}.lastCall, '${phrase}', ${argsArray})`;
    },
  },
  {
    bupkisPhrase: 'to have args',
    jestMatcher: 'lastCalledWith',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      const phrase = negated ? 'not to have args' : 'to have args';
      const argsArray = `[${matcherArgs.join(', ')}]`;
      return `expect(${subject}.lastCall, '${phrase}', ${argsArray})`;
    },
  },

  // toHaveBeenNthCalledWith / nthCalledWith - subject restructure + index fix
  {
    bupkisPhrase: 'to have args',
    jestMatcher: 'toHaveBeenNthCalledWith',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      // Jest's nthCalledWith is 1-indexed, Sinon's getCall is 0-indexed
      const [nthArg, ...restArgs] = matcherArgs;
      if (!nthArg) {
        return null;
      }
      const phrase = negated ? 'not to have args' : 'to have args';
      const argsArray = `[${restArgs.join(', ')}]`;
      // Convert 1-based to 0-based index
      const callIndex = `${nthArg} - 1`;
      return `expect(${subject}.getCall(${callIndex}), '${phrase}', ${argsArray})`;
    },
  },
  {
    bupkisPhrase: 'to have args',
    jestMatcher: 'nthCalledWith',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      const [nthArg, ...restArgs] = matcherArgs;
      if (!nthArg) {
        return null;
      }
      const phrase = negated ? 'not to have args' : 'to have args';
      const argsArray = `[${restArgs.join(', ')}]`;
      const callIndex = `${nthArg} - 1`;
      return `expect(${subject}.getCall(${callIndex}), '${phrase}', ${argsArray})`;
    },
  },

  // toHaveReturned / toReturn - spy-level
  {
    bupkisPhrase: 'to have returned',
    jestMatcher: 'toHaveReturned',
  },
  {
    bupkisPhrase: 'to have returned',
    jestMatcher: 'toReturn',
  },

  // toHaveReturnedTimes / toReturnTimes - spy-level
  {
    bupkisPhrase: 'to have returned times',
    jestMatcher: 'toHaveReturnedTimes',
  },
  {
    bupkisPhrase: 'to have returned times',
    jestMatcher: 'toReturnTimes',
  },

  // toHaveReturnedWith / toReturnWith - spy-level
  {
    bupkisPhrase: 'to have returned with',
    jestMatcher: 'toHaveReturnedWith',
  },
  {
    bupkisPhrase: 'to have returned with',
    jestMatcher: 'toReturnWith',
  },

  // toHaveLastReturnedWith / lastReturnedWith - subject restructure
  {
    bupkisPhrase: 'to have returned',
    jestMatcher: 'toHaveLastReturnedWith',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      const phrase = negated ? 'not to have returned' : 'to have returned';
      return `expect(${subject}.lastCall, '${phrase}', ${matcherArgs[0]})`;
    },
  },
  {
    bupkisPhrase: 'to have returned',
    jestMatcher: 'lastReturnedWith',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      const phrase = negated ? 'not to have returned' : 'to have returned';
      return `expect(${subject}.lastCall, '${phrase}', ${matcherArgs[0]})`;
    },
  },

  // toHaveNthReturnedWith / nthReturnedWith - subject restructure + index fix
  {
    bupkisPhrase: 'to have returned',
    jestMatcher: 'toHaveNthReturnedWith',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      const [nthArg, valueArg] = matcherArgs;
      if (!nthArg || !valueArg) {
        return null;
      }
      const phrase = negated ? 'not to have returned' : 'to have returned';
      const callIndex = `${nthArg} - 1`;
      return `expect(${subject}.getCall(${callIndex}), '${phrase}', ${valueArg})`;
    },
  },
  {
    bupkisPhrase: 'to have returned',
    jestMatcher: 'nthReturnedWith',
    /**
     * @function
     */
    transform: ({ matcherArgs, negated, subject }) => {
      const [nthArg, valueArg] = matcherArgs;
      if (!nthArg || !valueArg) {
        return null;
      }
      const phrase = negated ? 'not to have returned' : 'to have returned';
      const callIndex = `${nthArg} - 1`;
      return `expect(${subject}.getCall(${callIndex}), '${phrase}', ${valueArg})`;
    },
  },
];
