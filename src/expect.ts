import Debug from 'debug';
import { inspect } from 'util';

import {
  type AnyAsyncAssertion,
  type AnyAsyncAssertions,
  type AnySyncAssertion,
  type AnySyncAssertions,
  type AssertionAsync,
  type AssertionImplAsync,
  type AssertionImplSync,
  type AssertionParts,
  type AssertionSlots,
  type AssertionSync,
  type ParsedResult,
  type ParsedValues,
} from './assertion/assertion-types.js';
import { createAssertion, createAsyncAssertion } from './assertion/create.js';
import { AssertionError, NegatedAssertionError } from './error.js';
import { isString } from './guards.js';
import {
  type Expect,
  type ExpectAsync,
  type ExpectAsyncFunction,
  type ExpectAsyncProps,
  type ExpectFunction,
  type ExpectSyncProps,
} from './types.js';
import { createUse } from './use.js';

export const debug = Debug('bupkis:expect');

export function createExpectAsyncFunction<
  T extends AnyAsyncAssertions,
  U extends ExpectAsync<AnyAsyncAssertions>,
>(assertions: T, expect: U): ExpectAsyncFunction<T & U['assertions']>;
export function createExpectAsyncFunction<T extends AnyAsyncAssertions>(
  assertions: T,
): ExpectAsyncFunction<T>;
export function createExpectAsyncFunction<
  T extends AnyAsyncAssertions,
  U extends ExpectAsync<AnyAsyncAssertions>,
>(assertions: T, expect?: U) {
  debug(
    'Creating expectAsync function with %d assertions',
    assertions.length + (expect?.assertions.length ?? 0),
  );
  const expectAsyncFunction = async (...args: readonly unknown[]) => {
    await Promise.resolve();
    const [isNegated, processedArgs] = maybeProcessNegation(args);
    const candidates: Array<{
      assertion: AnyAsyncAssertion;
      parseResult: ParsedResult<AssertionParts>;
    }> = [];
    for (const assertion of [...(expect?.assertions ?? []), ...assertions]) {
      const parseResult = await assertion.parseValuesAsync(processedArgs);
      const { exactMatch, parsedValues, success } = parseResult;

      if (success) {
        if (exactMatch) {
          return executeAsync(
            assertion,
            parsedValues,
            [...args],
            expectAsyncFunction,
            isNegated,
            parseResult,
          );
        }
        candidates.push({ assertion, parseResult });
      }
    }
    if (candidates.length) {
      const { assertion, parseResult } = candidates[0]!;
      return executeAsync(
        assertion as any,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        parseResult.parsedValues as any,
        [...args],
        expectAsyncFunction,
        isNegated,
        parseResult,
      );
    }
    throwInvalidParametersError(args);
  };
  return expectAsyncFunction;
}

export function createExpectSyncFunction<
  T extends AnySyncAssertions,
  U extends Expect<AnySyncAssertions>,
>(assertions: T, expect: U): ExpectFunction<T & U['assertions']>;

export function createExpectSyncFunction<T extends AnySyncAssertions>(
  assertions: T,
): ExpectFunction<T>;
export function createExpectSyncFunction<
  T extends AnySyncAssertions,
  U extends Expect<AnySyncAssertions>,
>(assertions: T, expect?: U) {
  debug(
    'Creating expect function with %d assertions',
    assertions.length + (expect?.assertions.length ?? 0),
  );
  const expectFunction = (...args: readonly unknown[]) => {
    const [isNegated, processedArgs] = maybeProcessNegation(args);
    const candidates: Array<{
      assertion: AnySyncAssertion;
      parseResult: ParsedResult<AssertionParts>;
    }> = [];
    for (const assertion of [...(expect?.assertions ?? []), ...assertions]) {
      const parseResult = assertion.parseValues(processedArgs);
      const { exactMatch, parsedValues, success } = parseResult;

      if (success) {
        if (exactMatch) {
          return execute(
            assertion,
            parsedValues,
            [...args],
            expectFunction,
            isNegated,
            parseResult,
          );
        }
        candidates.push({ assertion, parseResult });
      }
    }
    if (candidates.length) {
      const { assertion, parseResult } = candidates[0]!;
      return execute(
        assertion as any,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        parseResult.parsedValues as any,
        [...args],
        expectFunction,
        isNegated,
        parseResult,
      );
    }
    throwInvalidParametersError(args);
  };
  return expectFunction;
}

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
export const executeAsync = async <
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
): never => {
  const inspectedArgs = inspect(args, { depth: 1 });
  debug(`Invalid arguments. No assertion matched: ${inspectedArgs}`);
  throw new TypeError(
    `Invalid arguments. No assertion matched: ${inspectedArgs}`,
  );
};

/**
 * Detects if an assertion phrase starts with "not " and returns the cleaned
 * phrase.
 *
 * @param phrase - The assertion phrase to check
 * @returns Object with `isNegated` flag and `cleanedPhrase`
 */

export const detectNegation = (
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

const fail = (reason?: string): never => {
  throw new AssertionError({ message: reason });
};

export function createBaseExpect<
  T extends AnySyncAssertions,
  U extends AnyAsyncAssertions,
>(syncAssertions: T, asyncAssertions: U, type: 'sync'): ExpectSyncProps<T, U>;
export function createBaseExpect<
  T extends AnySyncAssertions,
  U extends AnyAsyncAssertions,
>(syncAssertions: T, asyncAssertions: U, type: 'async'): ExpectAsyncProps<U, T>;
export function createBaseExpect<
  T extends AnySyncAssertions,
  U extends AnyAsyncAssertions,
>(syncAssertions: T, asyncAssertions: U, type: 'async' | 'sync') {
  return type === 'sync'
    ? {
        assertions: syncAssertions,
        createAssertion,
        createAsyncAssertion,
        fail,
        use: createUse(syncAssertions, asyncAssertions),
      }
    : {
        assertions: asyncAssertions,
        createAssertion,
        createAsyncAssertion,
        fail,
        use: createUse(syncAssertions, asyncAssertions),
      };
}
