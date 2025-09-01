/**
 * Asynchronous assertion engine implementation.
 *
 * This module provides the `expectAsync` function for writing assertions that
 * work with Promises and asynchronous operations. It handles Promise
 * resolution, rejection, and provides async-specific assertion patterns.
 *
 * @packageDocumentation
 */

import Debug from 'debug';

import {
  type AnyParsedValues,
  type Assertion,
  type AssertionImpl,
  type AssertionParts,
  type BuiltinAsyncAssertion,
  type ParsedResult,
  type ParsedValues,
} from './assertion/assertion-types.js';
import { AsyncAssertions, BupkisAssertion } from './assertion/index.js';
import { AssertionError, NegatedAssertionError } from './error.js';
import {
  assertSingleExactMatch,
  maybeProcessNegation,
  throwInvalidParametersError,
} from './expect.js';
import { type ExpectAsync, type ExpectAsyncFunction } from './types.js';

const debug = Debug('bupkis:expect-async');

const expectAsyncFunction: ExpectAsyncFunction = async (
  ...args: readonly unknown[]
): Promise<void> => {
  const [isNegated, processedArgs] = maybeProcessNegation(args);
  /**
   * This value will be set if we find a matching assertion
   */
  let found:
    | undefined
    | {
        assertion: BuiltinAsyncAssertion;
        exactMatch: boolean;
        parsedValues: AnyParsedValues;
        parseResult: ParsedResult<AssertionParts>;
      };
  const failureReasons: [assertionRepor: string, reason: string][] = [];
  for (const assertion of AsyncAssertions) {
    const parseResult = await assertion.parseValuesAsync(processedArgs);
    const { exactMatch, parsedValues, reason, success } = parseResult;
    if (success) {
      if (found) {
        assertSingleExactMatch(found, assertion, exactMatch);
      }
      found = { assertion, exactMatch, parsedValues, parseResult };
    } else {
      failureReasons.push([`${assertion}`, reason]);
    }
  }
  if (found) {
    const { assertion, parsedValues, parseResult } = found;
    await executeAsync(
      assertion as unknown as Assertion<
        AssertionImpl<AssertionParts>,
        AssertionParts
      >,
      parsedValues as unknown as ParsedValues<AssertionParts>,
      [...args],
      expectAsyncFunction,
      isNegated,
      parseResult,
    );
    return;
  }
  throwInvalidParametersError(args, failureReasons);
};

/** {@inheritDoc ExpectAsync} */
export const expectAsync: ExpectAsync = Object.assign(expectAsyncFunction, {
  createAssertion: BupkisAssertion.create,
  fail(reason?: string): never {
    throw new AssertionError({ message: reason });
  },
});

/**
 * Executes an assertion with optional negation logic (async version).
 *
 * @privateRemarks
 * This is here because `Assertion` doesn't know anything about negation and
 * probably shouldn't.
 * @param assertion - The assertion to execute
 * @param parsedValues - Parsed values for the assertion
 * @param args - Original arguments passed to expectAsync
 * @param stackStartFn - Function for stack trace management
 * @param isNegated - Whether the assertion should be negated
 */

const executeAsync = async <
  T extends Assertion<AssertionImpl<Parts>, Parts>,
  Parts extends AssertionParts,
>(
  assertion: T,
  parsedValues: ParsedValues<Parts>,
  args: unknown[],
  stackStartFn: (...args: any[]) => any,
  isNegated: boolean,
  parseResult?: ParsedResult<Parts>,
): Promise<void> => {
  if (!isNegated) {
    return assertion.executeAsync(
      parsedValues,
      args,
      stackStartFn,
      parseResult,
    );
  }

  try {
    debug('Executing negated async assertion: %s', assertion);
    await assertion.executeAsync(parsedValues, args, stackStartFn, parseResult);
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
    debug(
      'Non-assertion error thrown during negated async assertion: %O',
      error,
    );
    // Re-throw non-assertion errors (like TypeErrors, etc.)
    throw error;
  }
};
