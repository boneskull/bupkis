/**
 * Main synchronous assertion engine implementation.
 *
 * This module provides the core `expect` function for writing assertions in
 * tests. It handles assertion parsing, validation, execution, and error
 * reporting with rich type-safe APIs for various assertion patterns.
 *
 * @packageDocumentation
 */

import Debug from 'debug';
import { inspect } from 'node:util';

import {
  type AnyParsedValues,
  type Assertion,
  type AssertionImpl,
  type AssertionParts,
  type BuiltinAssertion,
  type BuiltinAsyncAssertion,
  type ParsedValues,
} from './assertion/assertion-types.js';
import { BupkisAssertion } from './assertion/assertion.js';
import { SyncAssertions } from './assertion/sync.js';
import { AssertionError, NegatedAssertionError } from './error.js';
import { isString } from './guards.js';
import { type Expect, type ExpectFunction } from './types.js';

const debug = Debug('bupkis:expect');

/**
 * Detects if an assertion phrase starts with "not " and returns the cleaned
 * phrase.
 *
 * @param phrase - The assertion phrase to check
 * @returns Object with `isNegated` flag and `cleanedPhrase`
 */
const detectNegation = (
  phrase: string,
): {
  cleanedPhrase: string;
  isNegated: boolean;
} => {
  if (phrase.startsWith('not ')) {
    return {
      cleanedPhrase: phrase.substring(4), // Remove "not "
      isNegated: true,
    };
  }
  return {
    cleanedPhrase: phrase,
    isNegated: false,
  };
};

/**
 * Executes an assertion with optional negation logic.
 *
 * @privateRemarks
 * This is here because `Assertion` doesn't know anything about negation and
 * probably shouldn't.
 * @param assertion - The assertion to execute
 * @param parsedValues - Parsed values for the assertion
 * @param args - Original arguments passed to expect
 * @param stackStartFn - Function for stack trace management
 * @param isNegated - Whether the assertion should be negated
 */
const execute = <
  T extends Assertion<AssertionImpl<Parts>, Parts>,
  Parts extends AssertionParts,
>(
  assertion: T,
  parsedValues: ParsedValues<Parts>,
  args: unknown[],
  stackStartFn: (...args: any[]) => any,
  isNegated: boolean,
): void => {
  if (!isNegated) {
    return assertion.execute(parsedValues, args, stackStartFn);
  }

  try {
    debug('Executing negated assertion: %s', assertion);
    assertion.execute(parsedValues, args, stackStartFn);
    // If we reach here, the assertion passed but we expected it to fail
    throw new NegatedAssertionError({
      message: `Expected assertion to fail (due to negation), but it passed: ${assertion}`,
      stackStartFn,
    });
  } catch (error) {
    // Check if this is the negation error we just threw
    if (NegatedAssertionError.isNegatedAssertionError(error)) {
      // This is our negation error, re-throw it
      throw error;
    }

    if (AssertionError.isAssertionError(error)) {
      // The assertion failed as expected for negation - this is success
      return;
    }
    debug('Non-assertion error thrown during negated assertion: %O', error);
    // Re-throw non-assertion errors (like TypeErrors, etc.)
    throw error;
  }
};

/**
 * @internal
 */
export const maybeProcessNegation = (
  args: readonly unknown[],
): [isNegated: boolean, processedArgs: readonly unknown[]] => {
  let isNegated = false;
  let processedArgs = args;

  if (args.length >= 2 && isString(args[1])) {
    const { cleanedPhrase, isNegated: detected } = detectNegation(args[1]);
    if (detected) {
      isNegated = true;
      processedArgs = [args[0], cleanedPhrase, ...args.slice(2)];
    }
  }
  return [isNegated, processedArgs];
};
/**
 * @internal
 */
export const throwInvalidParametersError = (
  args: readonly unknown[],
  failureReasons: [assertionRepr: string, reason: string][],
): never => {
  const inspectedArgs = inspect(args, { depth: 1 });
  debug(
    `Invalid arguments. No assertion matched: ${inspectedArgs}\\n${failureReasons
      .map(([assertion, reason]) => `  • ${assertion}: ${reason}`)
      .join('\\n')}`,
  );
  throw new TypeError(
    `Invalid arguments. No assertion matched: ${inspectedArgs}`,
  );
};

const expectFunction: ExpectFunction = (...args: readonly unknown[]) => {
  const [isNegated, processedArgs] = maybeProcessNegation(args);

  // Ambiguity check: ensure only one match
  let found:
    | undefined
    | {
        assertion: BuiltinAssertion;
        exactMatch: boolean;
        parsedValues: AnyParsedValues;
      };

  /**
   * This is used for debugging purposes only.
   */
  const parseFailureReasons: [assertionRepr: string, reason: string][] = [];
  for (const assertion of SyncAssertions) {
    const { exactMatch, parsedValues, reason, success } =
      assertion.parseValues(processedArgs);
    if (success) {
      if (found) {
        assertSingleExactMatch(found, assertion, exactMatch);
      }
      found = {
        assertion,
        exactMatch,
        parsedValues: parsedValues as readonly [unknown, any],
      };
    } else {
      parseFailureReasons.push([`${assertion}`, reason]);
    }
  }
  if (found) {
    const { assertion, parsedValues } = found;

    return execute(
      assertion as unknown as Assertion<
        AssertionImpl<AssertionParts>,
        AssertionParts
      >,
      parsedValues as unknown as ParsedValues<AssertionParts>,
      [...args],
      expectFunction,
      isNegated,
    );
  }
  throwInvalidParametersError(args, parseFailureReasons);
};

/** {@inheritDoc Expect} */
export const expect: Expect = Object.assign(expectFunction, {
  createAssertion: BupkisAssertion.create,
  fail(reason?: string): never {
    throw new AssertionError({ message: reason });
  },
});

/**
 * Used by `expect` and `expectAsync` to ensure only one exact matching
 * `Assertion` is found.
 *
 * @param found Object containing information about a previously found matching
 *   `Assertion`
 * @param assertion The current matching `Assertion`
 * @param exactMatch Whether the current match is an exact match
 * @throws {TypeError} If multiple exact matching assertions are found
 * @internal
 */
export const assertSingleExactMatch = <
  T extends BuiltinAssertion | BuiltinAsyncAssertion,
>(
  found: {
    assertion: T;
    exactMatch: boolean;
  },
  assertion: T,
  exactMatch: boolean,
): void => {
  // if we have an exact match already and this match is not exact, keep the current one.
  // if we have an exact match already and this match is also exact, throw an error.
  if (found.exactMatch && exactMatch) {
    throw new TypeError(
      `Multiple exact matching assertions found: ${found.assertion} and ${assertion}`,
    );
  }
};
