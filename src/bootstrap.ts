/**
 * Factory function for creating the main assertion functions.
 *
 * This module provides the `bootstrap()` function that creates both synchronous
 * and asynchronous assertion engines. It contains the core implementation
 * previously split between `expect.ts` and `expect-async.ts`.
 *
 * @packageDocumentation
 */

import Debug from 'debug';
import { inspect } from 'node:util';

import { SyncAssertions } from './assertion/impl/sync.js';
import { AsyncAssertions } from './assertion/index.js';
import {
  createBaseExpect,
  createExpectAsyncFunction,
  createExpectSyncFunction,
} from './expect.js';
import { isString } from './guards.js';
import { type Expect, type ExpectAsync } from './types.js';

const debug = Debug('bupkis:expect');
// const debugAsync = Debug('bupkis:expect-async');

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

// /**
//  * Executes an assertion with optional negation logic.
//  *
//  * @privateRemarks
//  * This is here because `Assertion` doesn't know anything about negation and
//  * probably shouldn't.
//  * @param assertion - The assertion to execute
//  * @param parsedValues - Parsed values for the assertion
//  * @param args - Original arguments passed to expect
//  * @param stackStartFn - Function for stack trace management
//  * @param isNegated - Whether the assertion should be negated
//  */
// const execute = <
//   T extends AssertionSync<Parts, AssertionImplSync<Parts>, Slots>,
//   Parts extends AssertionParts,
//   Slots extends AssertionSlots<Parts>,
// >(
//   assertion: T,
//   parsedValues: ParsedValues<Parts>,
//   args: unknown[],
//   stackStartFn: (...args: any[]) => any,
//   isNegated: boolean,
//   parseResult?: ParsedResult<Parts>,
// ): void => {
//   if (!isNegated) {
//     return assertion.execute(parsedValues, args, stackStartFn, parseResult);
//   }

//   try {
//     debug('Executing negated assertion: %s', assertion);
//     assertion.execute(parsedValues, args, stackStartFn, parseResult);
//     // If we reach here, the assertion passed but we expected it to fail
//     throw new NegatedAssertionError({
//       message: `Expected assertion to fail (due to negation), but it passed: ${assertion}`,
//       stackStartFn,
//     });
//   } catch (error) {
//     // Check if this is the negation error we just threw
//     if (NegatedAssertionError.isNegatedAssertionError(error)) {
//       // This is our negation error, re-throw it
//       throw error;
//     }

//     if (AssertionError.isAssertionError(error)) {
//       // The assertion failed as expected for negation - this is success
//       return;
//     }
//     debug('Non-assertion error thrown during negated assertion: %O', error);
//     // Re-throw non-assertion errors (like TypeErrors, etc.)
//     throw error;
//   }
// };

// /**
//  * Executes an assertion with optional negation logic (async version).
//  *
//  * @privateRemarks
//  * This is here because `Assertion` doesn't know anything about negation and
//  * probably shouldn't.
//  * @param assertion - The assertion to execute
//  * @param parsedValues - Parsed values for the assertion
//  * @param args - Original arguments passed to expectAsync
//  * @param stackStartFn - Function for stack trace management
//  * @param isNegated - Whether the assertion should be negated
//  */
// const executeAsync = async <
//   T extends AssertionAsync<Parts, AssertionImplAsync<Parts>, Slots>,
//   Parts extends AssertionParts,
//   Slots extends AssertionSlots<Parts>,
// >(
//   assertion: T,
//   parsedValues: ParsedValues<Parts>,
//   args: unknown[],
//   stackStartFn: (...args: any[]) => any,
//   isNegated: boolean,
//   parseResult?: ParsedResult<Parts>,
// ): Promise<void> => {
//   if (!isNegated) {
//     return assertion.executeAsync(
//       parsedValues,
//       args,
//       stackStartFn,
//       parseResult,
//     );
//   }

//   try {
//     debugAsync('Executing negated async assertion: %s', assertion);
//     await assertion.executeAsync(parsedValues, args, stackStartFn, parseResult);
//     // If we reach here, the assertion passed but we expected it to fail
//     throw new NegatedAssertionError({
//       message: `Expected assertion to fail (due to negation), but it passed: ${assertion}`,
//       stackStartFn,
//     });
//   } catch (error) {
//     // Check if this is the negation error we just threw
//     if (NegatedAssertionError.isNegatedAssertionError(error)) {
//       // This is our negation error, re-throw it
//       throw error;
//     }

//     if (AssertionError.isAssertionError(error)) {
//       // The assertion failed as expected for negation - this is success
//       return;
//     }
//     debugAsync(
//       'Non-assertion error thrown during negated async assertion: %O',
//       error,
//     );
//     // Re-throw non-assertion errors (like TypeErrors, etc.)
//     throw error;
//   }
// };

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

/**
 * Factory function that creates both synchronous and asynchronous assertion
 * engines.
 *
 * @returns Object containing `expect` and `expectAsync` functions
 */
export const bootstrap = (): {
  expect: Expect<typeof SyncAssertions>;
  expectAsync: ExpectAsync<typeof AsyncAssertions>;
} => {
  /** {@inheritDoc Expect} */

  const expect: Expect<typeof SyncAssertions, typeof AsyncAssertions> =
    Object.assign(
      createExpectSyncFunction(SyncAssertions),
      createBaseExpect(SyncAssertions, AsyncAssertions, 'sync'),
    );

  /** {@inheritDoc ExpectAsync} */

  const expectAsync: ExpectAsync<
    typeof AsyncAssertions,
    typeof SyncAssertions
  > = Object.assign(
    createExpectAsyncFunction(AsyncAssertions),
    createBaseExpect(SyncAssertions, AsyncAssertions, 'async'),
  );

  return { expect, expectAsync };
};

// Create and export the default instances
const { expect, expectAsync } = bootstrap();

export { expect, expectAsync };
