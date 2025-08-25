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
  type BuiltinAsyncAssertion,
} from './assertion/assertion-types.js';
import { AsyncAssertions } from './assertion/async.js';
import { BupkisAssertion } from './assertion/index.js';
import { AssertionError } from './error.js';
import {
  assertSingleExactMatch,
  executeWithNegationAsync,
  maybeProcessNegation,
  throwInvalidParametersError,
} from './expect.js';
import { type ExpectAsync, type ExpectAsyncFunction } from './types.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      };
  const failureReasons: [assertionRepor: string, reason: string][] = [];
  for (const assertion of AsyncAssertions) {
    const { exactMatch, parsedValues, reason, success } =
      await assertion.parseValuesAsync(processedArgs);
    if (success) {
      // Ambiguity check: ensure only one match
      if (found) {
        assertSingleExactMatch(found, assertion, exactMatch);
      }
      found = { assertion, exactMatch, parsedValues };
    } else {
      failureReasons.push([`${assertion}`, reason]);
    }
  }
  if (found) {
    const { assertion, parsedValues } = found;
    await executeWithNegationAsync(
      assertion,
      parsedValues,
      [...args],
      expectAsyncFunction,
      isNegated,
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
