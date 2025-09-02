/**
 * Bootstrap functionality for creating extensible expect and expectAsync
 * functions.
 *
 * This module provides the core bootstrapping functionality that creates expect
 * and expectAsync functions with built-in assertions and the ability to extend
 * them with custom assertions via the use() function.
 *
 * @packageDocumentation
 */

import Debug from 'debug';
import { inspect } from 'node:util';

import {
  type AnyParsedValues,
  type AssertionAsync,
  type AssertionImplAsync,
  type AssertionImplSync,
  type AssertionParts,
  type AssertionSlots,
  type AssertionSync,
  type BuiltinAssertion,
  type BuiltinAsyncAssertion,
  type ParsedResult,
  type ParsedValues,
} from './assertion/assertion-types.js';
import { createAssertion, createAsyncAssertion } from './assertion/create.js';
import { AsyncAssertions, SyncAssertions } from './assertion/impl/index.js';
import { AssertionError, NegatedAssertionError } from './error.js';
import { isString } from './guards.js';
import {
  type Expect,
  type ExpectAsync,
  type ExpectAsyncFunction,
  type ExpectFunction,
} from './types.js';

const debug = Debug('bupkis:bootstrap');

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
 * Processes assertion arguments to detect and handle negation.
 *
 * @param args - The assertion arguments
 * @returns Tuple of [isNegated, processedArgs]
 * @internal
 */
const maybeProcessNegation = (
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
 * Throws a TypeError with detailed information about assertion matching
 * failures.
 *
 * @param args - The assertion arguments that failed to match
 * @param failureReasons - Array of assertion representations and their failure
 *   reasons
 * @throws {TypeError} Always throws with detailed error message
 * @internal
 */
const throwInvalidParametersError = (
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
 * Ensures only one exact matching assertion is found during assertion
 * resolution.
 *
 * @param found The previously found assertion match
 * @param assertion The current matching `Assertion`
 * @param exactMatch Whether the current match is an exact match
 * @throws {TypeError} If multiple exact matching assertions are found
 * @internal
 */
const assertSingleExactMatch = <
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

/**
 * Executes an assertion with optional negation logic.
 */
const execute = <
  T extends AssertionSync<Parts, AssertionImplSync<Parts>, Slots>,
  Parts extends AssertionParts,
  Slots extends AssertionSlots<Parts>,
>(
  assertion: T,
  parsedValues: ParsedValues<Parts>,
  args: unknown[],
  stackStartFn: (...args: any[]) => any,
  isNegated: boolean,
  parseResult?: ParsedResult<Parts>,
): void => {
  if (!isNegated) {
    return assertion.execute(parsedValues, args, stackStartFn, parseResult);
  }

  try {
    debug('Executing negated assertion: %s', assertion);
    assertion.execute(parsedValues, args, stackStartFn, parseResult);
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
 * Executes an assertion with optional negation logic (async version).
 */
const executeAsync = async <
  T extends AssertionAsync<Parts, AssertionImplAsync<Parts>, Slots>,
  Parts extends AssertionParts,
  Slots extends AssertionSlots<Parts>,
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

/**
 * Bootstraps the expect and expectAsync functions with built-in assertions.
 *
 * @returns Object containing the initial expect and expectAsync functions
 */
export function bootstrap() {
  debug('Bootstrapping expect and expectAsync with built-in assertions');
  return createExpectFunctions(SyncAssertions, AsyncAssertions);
}

/**
 * Creates expect and expectAsync functions with the given assertions.
 *
 * @param syncAssertions - Synchronous assertions to use
 * @param asyncAssertions - Asynchronous assertions to use
 * @returns Object with expect and expectAsync functions
 */
function createExpectFunctions<
  TSyncAssertions extends readonly BuiltinAssertion[],
  TAsyncAssertions extends readonly BuiltinAsyncAssertion[],
>(syncAssertions: TSyncAssertions, asyncAssertions: TAsyncAssertions) {
  // Create the use function for these assertions
  const use = createUseFunction(syncAssertions, asyncAssertions);

  // Create the expectFunction
  const expectFunction: ExpectFunction = (...args: readonly unknown[]) => {
    const [isNegated, processedArgs] = maybeProcessNegation(args);

    // Ambiguity check: ensure only one match
    let found:
      | undefined
      | {
          assertion: BuiltinAssertion;
          exactMatch: boolean;
          parsedValues: AnyParsedValues;
          parseResult: ParsedResult<AssertionParts>;
        };

    /**
     * This is used for debugging purposes only.
     */
    const parseFailureReasons: [assertionRepr: string, reason: string][] = [];
    for (const assertion of syncAssertions) {
      const parseResult = assertion.parseValues(processedArgs);
      const { exactMatch, parsedValues, reason, success } = parseResult;
      if (success) {
        if (found) {
          assertSingleExactMatch(found, assertion, exactMatch);
        }
        found = {
          assertion,
          exactMatch,
          parsedValues: parsedValues as readonly [unknown, any],
          parseResult,
        };
      } else {
        parseFailureReasons.push([`${assertion}`, reason]);
      }
    }
    if (found) {
      const { assertion, parsedValues, parseResult } = found;

      return execute(
        assertion as unknown as AssertionSync,
        parsedValues as unknown as ParsedValues,
        [...args],
        expectFunction,
        isNegated,
        parseResult,
      );
    }
    throwInvalidParametersError(args, parseFailureReasons);
  };

  // Create the expectAsyncFunction
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
          parseResult: ParsedResult;
        };
    const failureReasons: [assertionRepor: string, reason: string][] = [];
    for (const assertion of asyncAssertions) {
      const parseResult = await assertion.parseValuesAsync(processedArgs);
      const { exactMatch, parsedValues, reason, success } = parseResult;
      if (success) {
        if (found) {
          assertSingleExactMatch(found, assertion, exactMatch);
        }
        found = {
          assertion,
          exactMatch,
          parsedValues,
          parseResult,
        };
      } else {
        failureReasons.push([`${assertion}`, reason]);
      }
    }
    if (found) {
      const { assertion, parsedValues, parseResult } = found;
      return executeAsync(
        assertion as unknown as AssertionAsync,
        parsedValues as unknown as ParsedValues,
        [...args],
        expectAsyncFunction,
        isNegated,
        parseResult,
      );
    }
    throwInvalidParametersError(args, failureReasons);
  };

  // Create the expect object with properties
  const expect: Expect = Object.assign(expectFunction, {
    createAssertion,
    createAsyncAssertion,
    fail(reason?: string): never {
      throw new AssertionError({ message: reason });
    },
    use,
  });

  // Create the expectAsync object with properties
  const expectAsync: ExpectAsync = Object.assign(expectAsyncFunction, {
    createAssertion,
    createAsyncAssertion,
    fail(reason?: string): never {
      throw new AssertionError({ message: reason });
    },
    use,
  });

  return { expect, expectAsync };
}

/**
 * Creates the use function that allows extending assertions.
 *
 * @param currentSyncAssertions - Current synchronous assertions
 * @param currentAsyncAssertions - Current asynchronous assertions
 * @returns The use function that can extend assertions
 */
function createUseFunction<
  TSyncAssertions extends readonly BuiltinAssertion[],
  TAsyncAssertions extends readonly BuiltinAsyncAssertion[],
>(
  currentSyncAssertions: TSyncAssertions,
  currentAsyncAssertions: TAsyncAssertions,
) {
  return function use<T extends readonly [any, ...any[]]>(assertions: T) {
    // Separate sync and async assertions
    const newSyncAssertions: AssertionSync[] = [];
    const newAsyncAssertions: AssertionAsync[] = [];

    for (const assertion of assertions) {
      // Check if assertion has executeAsync method to determine if it's async
      if (
        'executeAsync' in assertion &&
        typeof assertion.executeAsync === 'function'
      ) {
        newAsyncAssertions.push(assertion as AssertionAsync);
      } else {
        newSyncAssertions.push(assertion as AssertionSync);
      }
    }

    // Combine with existing assertions
    const allSyncAssertions = [
      ...currentSyncAssertions,
      ...newSyncAssertions,
    ] as const;
    const allAsyncAssertions = [
      ...currentAsyncAssertions,
      ...newAsyncAssertions,
    ] as const;

    return createExpectFunctions(
      allSyncAssertions as any,
      allAsyncAssertions as any,
    );
  };
}

// Export the bootstrapped functions for use in the main index
const { expect, expectAsync } = bootstrap();
export { expect, expectAsync };
