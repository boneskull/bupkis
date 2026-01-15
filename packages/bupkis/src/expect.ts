import createDebug from 'debug';
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
import {
  AssertionError,
  AssertionImplementationError,
  FailAssertionError,
  NegatedAssertionError,
  UnknownAssertionError,
} from './error.js';
import { isString } from './guards.js';
import {
  type Expect,
  type ExpectAsync,
  type ExpectAsyncFunction,
  type ExpectAsyncProps,
  type ExpectFunction,
  type ExpectSyncProps,
  type FailFn,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type UseFn,
} from './types.js';
import { createUse } from './use.js';

const debug = createDebug('bupkis:expect');

/**
 * Creates an asynchronous expect function by extending a parent expectAsync
 * function with additional assertions.
 *
 * This overload combines assertions from an existing parent expectAsync
 * function with new assertions, creating a unified expectAsync function that
 * supports both sets of assertions. The resulting function inherits all type
 * information from both the parent and new assertions, providing complete
 * TypeScript intellisense and type safety for Promise-based testing scenarios.
 *
 * @example
 *
 * ```typescript
 * const baseExpectAsync = createExpectAsyncFunction(basicAsyncAssertions);
 * const extendedExpectAsync = createExpectAsyncFunction(
 *   customAsyncAssertions,
 *   baseExpectAsync,
 * );
 *
 * // Can use both basic and custom async assertions
 * await extendedExpectAsync(promise, 'to resolve'); // From basic assertions
 * await extendedExpectAsync(promise, 'to resolve with custom data'); // From custom assertions
 * ```
 *
 * @param assertions - Array of new asynchronous assertion objects to add
 * @param expect - Parent expectAsync function whose assertions will be
 *   inherited
 * @returns ExpectAsync function with combined assertion types from both parent
 *   and new assertions
 * @throws {@link AssertionError} When an assertion fails in normal
 *   (non-negated) mode
 * @throws {@link NegatedAssertionError} When a negated assertion fails
 * @throws {Error} When no matching assertion can be found for the provided
 *   arguments
 */
export function createExpectAsyncFunction<
  T extends AnyAsyncAssertions,
  U extends ExpectAsync<AnyAsyncAssertions>,
>(assertions: T, expect: U): ExpectAsyncFunction<T & U['assertions']>;

/**
 * Creates a new asynchronous expect function with the provided assertions.
 *
 * This overload creates a standalone expectAsync function from the provided
 * assertions without inheriting from any parent function. This is typically
 * used to create the initial expectAsync function or when you want a clean
 * slate without any inherited assertions for Promise-based testing.
 *
 * @example
 *
 * ```typescript
 * const expectAsync = createExpectAsyncFunction(asyncAssertions);
 * await expectAsync(promise, 'to resolve');
 * await expectAsync(rejectedPromise, 'to reject');
 * await expectAsync(promise, 'to resolve to', expectedValue);
 * ```
 *
 * @param assertions - Array of asynchronous assertion objects that define the
 *   available assertion phrases and Promise-based logic
 * @returns An asynchronous expect function that can execute the provided
 *   assertions using natural language syntax
 * @throws {@link AssertionError} When an assertion fails in normal
 *   (non-negated) mode
 * @throws {@link NegatedAssertionError} When a negated assertion fails
 * @throws {Error} When no matching assertion can be found for the provided
 *   arguments
 */
export function createExpectAsyncFunction<T extends AnyAsyncAssertions>(
  assertions: T,
): ExpectAsyncFunction<T>;

/**
 * Implementation function that creates an asynchronous expect function with
 * optional parent inheritance.
 *
 * This is the concrete implementation that handles both overload cases for
 * Promise-based assertions. It creates an expectAsync function that uses a
 * two-phase matching algorithm: first seeking exact phrase matches for optimal
 * performance, then falling back to partial matches if needed. The function
 * processes negation keywords, combines parent assertions with new ones, and
 * ensures all operations are properly awaited.
 *
 * The matching algorithm prioritizes exact matches to minimize performance
 * overhead, but provides flexibility through partial matching when exact
 * phrases don't align. This enables natural language flexibility while
 * maintaining execution speed for common async assertion patterns.
 *
 * @remarks
 * The function performs async assertion matching in the following order:
 *
 * 1. Awaits `Promise.resolve()` to ensure the function is always asynchronous
 * 2. Processes negation keywords ('not', 'to not') to determine assertion mode
 * 3. Combines parent assertions (if provided) with new assertions in execution
 *    order
 * 4. Attempts to parse arguments against each assertion's expected phrase pattern
 *    using `parseValuesAsync`
 * 5. Prioritizes exact phrase matches over partial matches for performance
 * 6. Executes the first successful match using {@link executeAsync} or throws an
 *    error if none found
 *
 * Performance considerations: The function loops through all available
 * assertions for each call, but uses early termination when exact matches are
 * found. For performance-critical code, consider using assertion functions with
 * fewer total assertions or more specific phrase patterns to reduce matching
 * overhead.
 *
 * All assertion execution is properly awaited to handle Promise-based
 * validation logic, error handling, and negation scenarios in asynchronous
 * contexts.
 * @example
 *
 * ```typescript
 * // Used internally by both public overloads
 * const expectAsync1 = createExpectAsyncFunction(assertions); // No parent
 * const expectAsync2 = createExpectAsyncFunction(assertions, parent); // With parent
 * ```
 *
 * @param assertions - Array of asynchronous assertion objects to make available
 * @param expect - Optional parent expectAsync function to inherit assertions
 *   from
 * @returns Asynchronous expect function that processes natural language
 *   assertions with Promise support
 * @throws {@link AssertionError} When an assertion fails in normal
 *   (non-negated) mode
 * @throws {@link NegatedAssertionError} When a negated assertion fails (e.g.,
 *   `await expectAsync(promise, 'not to resolve')`)
 * @throws {Error} When no matching assertion can be found for the provided
 *   arguments
 * @internal This is the concrete implementation used by the public overloads
 * @see {@link createExpectSyncFunction} for creating synchronous expect functions
 * @see {@link createAsyncAssertion} for creating individual async assertion objects
 * @see {@link ExpectAsync} for the main expectAsync interface
 */
export function createExpectAsyncFunction<
  T extends AnyAsyncAssertions,
  U extends ExpectAsync<AnyAsyncAssertions>,
>(assertions: T, expect?: U) {
  // Combine all assertions once at creation time
  const allAssertions: AnyAsyncAssertion[] = [
    ...(expect?.assertions ?? []),
    ...assertions,
  ];

  // Build phrase index for fast dispatch
  const phraseIndex = buildPhraseIndex(allAssertions);

  debug(
    'ℹ Creating expectAsync function with %d new assertions and %d existing assertions (%d total, %d indexed phrases)',
    assertions.length,
    expect?.assertions.length ?? 0,
    allAssertions.length,
    phraseIndex.size,
  );

  /**
   * @function
   */
  const expectAsyncFunction = async (...args: readonly unknown[]) => {
    await Promise.resolve();
    const argsMatrix = conjunctify(args);

    // First, try all conjunctified argument sets
    let foundCount = 0;
    for (const args of argsMatrix) {
      const { isNegated, processedArgs } = maybeProcessNegation(args);
      const candidates: Array<{
        assertion: AnyAsyncAssertion;
        parseResult: ParsedResult<AssertionParts>;
      }> = [];

      // Use phrase index for O(1) candidate lookup, fall back to full scan
      const assertionsToCheck = getCandidateAssertions(
        processedArgs,
        phraseIndex,
        allAssertions,
      );

      for (const assertion of assertionsToCheck) {
        const parseResult = await assertion.parseValuesAsync(processedArgs);
        const { exactMatch, parsedValues, success } = parseResult;

        if (success) {
          if (exactMatch) {
            foundCount++;
            await executeAsync(
              assertion,
              parsedValues,
              [...args],
              expectAsyncFunction,
              isNegated,
              parseResult,
            );
            break;
          }
          candidates.push({ assertion, parseResult });
        }
      }
      if (candidates.length) {
        const { assertion, parseResult } = candidates[0]!;
        foundCount++;
        await executeAsync(
          assertion as any,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          parseResult.parsedValues as any,
          [...args],
          expectAsyncFunction,
          isNegated,
          parseResult,
        );
      }
    }

    if (foundCount >= argsMatrix.length) {
      return;
    }

    // Fallback: if all conjunctified attempts failed and we actually split on "and",
    // try different permutations of rejoining the split parts
    if (argsMatrix.length > 1) {
      const rejoinPermutations = generateRejoinPermutations(argsMatrix, args);

      for (const permutation of rejoinPermutations) {
        const { isNegated, processedArgs } = maybeProcessNegation(permutation);
        const candidates: Array<{
          assertion: AnyAsyncAssertion;
          parseResult: ParsedResult<AssertionParts>;
        }> = [];

        // Use phrase index for O(1) candidate lookup, fall back to full scan
        const assertionsToCheck = getCandidateAssertions(
          processedArgs,
          phraseIndex,
          allAssertions,
        );

        for (const assertion of assertionsToCheck) {
          const parseResult = await assertion.parseValuesAsync(processedArgs);
          const { exactMatch, parsedValues, success } = parseResult;

          if (success) {
            if (exactMatch) {
              await executeAsync(
                assertion,
                parsedValues,
                [...permutation],
                expectAsyncFunction,
                isNegated,
                parseResult,
              );
              return;
            }
            candidates.push({ assertion, parseResult });
          }
        }

        if (candidates.length) {
          const { assertion, parseResult } = candidates[0]!;
          await executeAsync(
            assertion as any,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            parseResult.parsedValues as any,
            [...permutation],
            expectAsyncFunction,
            isNegated,
            parseResult,
          );
          return;
        }
      }
    }

    throwInvalidParametersError(args);
  };
  return expectAsyncFunction;
}

/**
 * Creates a synchronous expect function by extending a parent expect function
 * with additional assertions.
 *
 * This overload combines assertions from an existing parent expect function
 * with new assertions, creating a unified expect function that supports both
 * sets of assertions. The resulting function inherits all type information from
 * both the parent and new assertions, providing complete TypeScript
 * intellisense and type safety.
 *
 * @example
 *
 * ```typescript
 * const baseExpect = createExpectSyncFunction(basicAssertions);
 * const extendedExpect = createExpectSyncFunction(
 *   customAssertions,
 *   baseExpect,
 * );
 *
 * // Can use both basic and custom assertions
 * extendedExpect(42, 'to be a number'); // From basic assertions
 * extendedExpect(obj, 'to have custom prop'); // From custom assertions
 * ```
 *
 * @param assertions - Array of new synchronous assertion objects to add
 * @param expect - Parent expect function whose assertions will be inherited
 * @returns Expect function with combined assertion types from both parent and
 *   new assertions
 * @throws {@link AssertionError} When an assertion fails in normal
 *   (non-negated) mode
 * @throws {@link NegatedAssertionError} When a negated assertion fails
 * @throws {Error} When no matching assertion can be found for the provided
 *   arguments
 */
export function createExpectSyncFunction<
  Assertions extends AnySyncAssertions,
  ParentExpect extends Expect<AnySyncAssertions>,
>(
  assertions: Assertions,
  expect: ParentExpect,
): ExpectFunction<Assertions & ParentExpect['assertions']>;

/**
 * Creates a new synchronous expect function with the provided assertions.
 *
 * This overload creates a standalone expect function from the provided
 * assertions without inheriting from any parent function. This is typically
 * used to create the initial expect function or when you want a clean slate
 * without any inherited assertions.
 *
 * @example
 *
 * ```typescript
 * const expect = createExpectSyncFunction(basicAssertions);
 * expect(42, 'to be a number');
 * expect('hello', 'to be a string');
 * expect([], 'to be empty');
 * ```
 *
 * @param assertions - Array of synchronous assertion objects that define the
 *   available assertion phrases and logic
 * @returns A synchronous expect function that can execute the provided
 *   assertions using natural language syntax
 * @throws {@link AssertionError} When an assertion fails in normal
 *   (non-negated) mode
 * @throws {@link NegatedAssertionError} When a negated assertion fails
 * @throws {Error} When no matching assertion can be found for the provided
 *   arguments
 */
export function createExpectSyncFunction<Assertions extends AnySyncAssertions>(
  assertions: Assertions,
): ExpectFunction<Assertions>;

/**
 * Implementation function that creates a synchronous expect function with
 * optional parent inheritance.
 *
 * This is the concrete implementation that handles both overload cases. It
 * creates an expect function that uses a two-phase matching algorithm: first
 * seeking exact phrase matches for optimal performance, then falling back to
 * partial matches if needed. The function processes negation keywords and
 * combines parent assertions with new ones.
 *
 * The matching algorithm prioritizes exact matches to minimize performance
 * overhead, but provides flexibility through partial matching when exact
 * phrases don't align. This enables natural language flexibility while
 * maintaining execution speed for common assertion patterns.
 *
 * @remarks
 * The function performs assertion matching in the following order:
 *
 * 1. Processes negation keywords ('not', 'to not') to determine assertion mode
 * 2. Combines parent assertions (if provided) with new assertions in execution
 *    order
 * 3. Attempts to parse arguments against each assertion's expected phrase pattern
 * 4. Prioritizes exact phrase matches over partial matches for performance
 * 5. Executes the first successful match or throws an error if none found
 *
 * Performance considerations: The function loops through all available
 * assertions for each call, but uses early termination when exact matches are
 * found. For performance-critical code, consider using assertion functions with
 * fewer total assertions or more specific phrase patterns to reduce matching
 * overhead.
 * @example
 *
 * ```typescript
 * // Used internally by both public overloads
 * const expect1 = createExpectSyncFunction(assertions); // No parent
 * const expect2 = createExpectSyncFunction(assertions, parent); // With parent
 * ```
 *
 * @param assertions - Array of synchronous assertion objects to make available
 * @param expect - Optional parent expect function to inherit assertions from
 * @returns Synchronous expect function that processes natural language
 *   assertions
 * @throws {@link AssertionError} When an assertion fails in normal
 *   (non-negated) mode
 * @throws {@link NegatedAssertionError} When a negated assertion fails (e.g.,
 *   `expect(42, 'not to be a number')`)
 * @throws {Error} When no matching assertion can be found for the provided
 *   arguments
 * @internal This is the concrete implementation used by the public overloads
 * @see {@link createExpectAsyncFunction} for creating asynchronous expect functions
 * @see {@link createAssertion} for creating individual assertion objects
 * @see {@link Expect} for the main expect interface
 */
export function createExpectSyncFunction<
  Assertions extends AnySyncAssertions,
  ParentExpect extends Expect<AnySyncAssertions>,
>(assertions: Assertions, expect?: ParentExpect) {
  // Combine all assertions once at creation time
  const allAssertions: AnySyncAssertion[] = [
    ...(expect?.assertions ?? []),
    ...assertions,
  ];

  // Build phrase index for fast dispatch
  const phraseIndex = buildPhraseIndex(allAssertions);

  debug(
    'ℹ Creating expect function with %d new assertions and %d existing assertions (%d total, %d indexed phrases)',
    assertions.length,
    expect?.assertions.length ?? 0,
    allAssertions.length,
    phraseIndex.size,
  );

  /**
   * @function
   */
  const expectFunction = (...args: readonly unknown[]) => {
    const argsMatrix = conjunctify(args);

    // First, try all conjunctified argument sets
    let foundCount = 0;
    for (const args of argsMatrix) {
      const { isNegated, processedArgs } = maybeProcessNegation(args);
      const candidates: Array<{
        assertion: AnySyncAssertion;
        parseResult: ParsedResult<AssertionParts>;
      }> = [];

      // Use phrase index for O(1) candidate lookup, fall back to full scan
      const assertionsToCheck = getCandidateAssertions(
        processedArgs,
        phraseIndex,
        allAssertions,
      );

      for (const assertion of assertionsToCheck) {
        const parseResult = assertion.parseValues(processedArgs);
        const { exactMatch, parsedValues, success } = parseResult;

        if (success) {
          if (exactMatch) {
            foundCount++;
            execute(
              assertion,
              parsedValues,
              [...args],
              expectFunction,
              isNegated,
              parseResult,
            );
            break;
          }
          candidates.push({ assertion, parseResult });
        }
      }
      if (candidates.length) {
        const { assertion, parseResult } = candidates[0]!;
        foundCount++;
        execute(
          assertion as any,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          parseResult.parsedValues as any,
          [...args],
          expectFunction,
          isNegated,
          parseResult,
        );
      }
    }

    if (foundCount >= argsMatrix.length) {
      return;
    }

    // Fallback: if all conjunctified attempts failed and we actually split on "and",
    // try different permutations of rejoining the split parts
    if (argsMatrix.length > 1) {
      const rejoinPermutations = generateRejoinPermutations(argsMatrix, args);

      for (const permutation of rejoinPermutations) {
        const { isNegated, processedArgs } = maybeProcessNegation(permutation);
        const candidates: Array<{
          assertion: AnySyncAssertion;
          parseResult: ParsedResult<AssertionParts>;
        }> = [];

        // Use phrase index for O(1) candidate lookup, fall back to full scan
        const assertionsToCheck = getCandidateAssertions(
          processedArgs,
          phraseIndex,
          allAssertions,
        );

        for (const assertion of assertionsToCheck) {
          const parseResult = assertion.parseValues(processedArgs);
          const { exactMatch, parsedValues, success } = parseResult;

          if (success) {
            if (exactMatch) {
              execute(
                assertion,
                parsedValues,
                [...permutation],
                expectFunction,
                isNegated,
                parseResult,
              );
              return;
            }
            candidates.push({ assertion, parseResult });
          }
        }

        if (candidates.length) {
          const { assertion, parseResult } = candidates[0]!;
          execute(
            assertion as any,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            parseResult.parsedValues as any,
            [...permutation],
            expectFunction,
            isNegated,
            parseResult,
          );
          return;
        }
      }
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
 * @function
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
  try {
    assertion.execute(parsedValues, args, stackStartFn, parseResult);
  } catch (error) {
    handleAssertionError(error, assertion, isNegated);
    return;
  }

  if (isNegated) {
    throwNegatedAssertionPassedError(assertion, stackStartFn);
  }
};

/**
 * Executes an assertion with optional negation logic (async version).
 *
 * @privateRemarks
 * This is here because `Assertion` doesn't know anything about negation and
 * probably shouldn't.
 * @function
 * @param assertion - The assertion to execute
 * @param parsedValues - Parsed values for the assertion
 * @param args - Original arguments passed to expectAsync
 * @param stackStartFn - Function for stack trace management
 * @param isNegated - Whether the assertion should be negated
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
  try {
    await assertion.executeAsync(parsedValues, args, stackStartFn, parseResult);
  } catch (error) {
    handleAssertionError(error, assertion, isNegated);
    return;
  }

  if (isNegated) {
    throwNegatedAssertionPassedError(assertion, stackStartFn);
  }
};

/**
 * Handles errors thrown during assertion execution.
 *
 * @function
 * @param error - The error that was thrown
 * @param assertion - The assertion that threw the error
 * @param isNegated - Whether the assertion was negated
 * @returns Void if error should be swallowed (negated assertion success)
 * @throws The original error if it's an AssertionError (non-negated case)
 * @throws AssertionImplementationError if error is unexpected
 */
const handleAssertionError = (
  error: unknown,
  assertion: { id: string; toString(): string },
  isNegated: boolean,
): void => {
  if (AssertionError.isAssertionError(error)) {
    if (isNegated) {
      return;
    }
    throw error;
  }

  if (AssertionImplementationError.isAssertionImplementationError(error)) {
    throw error;
  }

  throw new AssertionImplementationError(
    `Assertion ${assertion} threw a non-AssertionError`,
    { cause: error },
  );
};

/**
 * Throws a NegatedAssertionError when a negated assertion unexpectedly passes.
 *
 * @function
 * @param assertion - The assertion that passed
 * @param stackStartFn - Function for stack trace management
 */
const throwNegatedAssertionPassedError = (
  assertion: { id: string; toString(): string },
  stackStartFn: (...args: any[]) => any,
): never => {
  throw new NegatedAssertionError({
    id: assertion.id,
    message: `Expected assertion ${assertion} to fail (due to negation), but it passed`,
    stackStartFn,
  });
};

/**
 * Processes negation keywords in the arguments and returns whether negation is
 * requested along with arguments stripped of the leading negation (to enable
 * assertion matching).
 *
 * @function
 * @internal
 */
const maybeProcessNegation = (
  args: readonly unknown[],
): { isNegated: boolean; processedArgs: readonly unknown[] } => {
  let isNegated = false;
  let processedArgs = args;

  // note: args[1] should always be a string
  if (args.length >= 2 && isString(args[1])) {
    const { cleanedPhrase, isNegated: detected } = detectNegation(args[1]);
    if (detected) {
      isNegated = true;
      processedArgs = [args[0], cleanedPhrase, ...args.slice(2)];
    }
  }
  return { isNegated, processedArgs };
};

/**
 * Given some args, create a matrix of args based on the presence of the
 * conjunction operator ("and").
 *
 * If no "and" is present, returns the original args wrapped in an array.
 *
 * @function
 */
const conjunctify = (args: readonly unknown[]): (readonly unknown[])[] => {
  let argsMatrix = [args];

  if (args.length >= 2) {
    // partition args by the string "and"; there may be multiple "and"s
    const andIndices = args
      .map((arg, index) => (arg === 'and' ? index : -1))
      .filter((index) => index !== -1);

    if (andIndices.length > 0) {
      const parts: unknown[][] = [];
      let lastIndex = 0;
      for (const andIndex of andIndices) {
        const partsArgs =
          lastIndex > 0
            ? [args[0], ...args.slice(lastIndex, andIndex)]
            : [...args.slice(lastIndex, andIndex)];
        parts.push(partsArgs);
        lastIndex = andIndex + 1;
      }
      const finalPartsArgs = [args[0], ...args.slice(lastIndex)];
      parts.push(finalPartsArgs);
      argsMatrix = parts;
    }
  }
  return argsMatrix;
};

/**
 * Generates all possible ways to rejoin args that were split on "and".
 *
 * This is used as a fallback when conjunctified attempts fail - we try
 * different permutations of rejoining the split parts to handle assertions that
 * use "and" as part of their phrase (e.g., "to be greater than X and less than
 * Y").
 *
 * @function
 * @param argsMatrix The matrix of split arguments
 * @param originalArgs The original unsplit arguments
 * @returns Array of permutations to try
 * @internal
 */
const generateRejoinPermutations = (
  argsMatrix: (readonly unknown[])[],
  originalArgs: readonly unknown[],
): (readonly unknown[])[] => {
  const permutations: (readonly unknown[])[] = [];

  for (let i = 0; i < argsMatrix.length - 1; i++) {
    const rejoinedParts: unknown[][] = [];

    // Add parts before the join point
    for (let j = 0; j < i; j++) {
      rejoinedParts.push([...argsMatrix[j]!]);
    }

    // Join the two parts at the split point
    const leftPart = argsMatrix[i]!;
    const rightPart = argsMatrix[i + 1]!;
    const joinedPart = [...leftPart, 'and', ...rightPart.slice(1)];
    rejoinedParts.push(joinedPart);

    // Add parts after the join point
    for (let j = i + 2; j < argsMatrix.length; j++) {
      rejoinedParts.push([...argsMatrix[j]!]);
    }

    if (rejoinedParts.length === 1) {
      permutations.push(rejoinedParts[0]!);
    } else {
      for (const part of rejoinedParts) {
        permutations.push(part);
      }
    }
  }

  // Also try the original unsplit arguments as the final permutation
  permutations.push(originalArgs);

  return permutations;
};

/**
 * Assertion type with getIndexPhrases method for phrase indexing.
 */
type IndexableAssertion = {
  getIndexPhrases(): readonly string[];
};

/**
 * Builds a phrase-keyed index for fast assertion dispatch.
 *
 * Maps phrase literals to the assertions that use them, enabling O(1) lookup
 * instead of O(n) iteration over all assertions during dispatch.
 *
 * @function
 * @param assertions - Array of assertions to index
 * @returns Map from phrase string to array of assertions using that phrase
 */
const buildPhraseIndex = <T extends IndexableAssertion>(
  assertions: readonly T[],
): Map<string, T[]> => {
  const index = new Map<string, T[]>();
  for (const assertion of assertions) {
    const phrases = assertion.getIndexPhrases();
    for (const phrase of phrases) {
      const existing = index.get(phrase);
      if (existing) {
        existing.push(assertion);
      } else {
        index.set(phrase, [assertion]);
      }
    }
  }
  return index;
};

/**
 * Extracts the phrase from processed arguments for index lookup.
 *
 * Looks at position 1 (subject-first assertions) and position 0 (phrase-first).
 * Returns the first string found, or undefined if no phrase is present.
 *
 * @function
 * @param args - Processed arguments (after negation handling)
 * @returns The phrase string if found, undefined otherwise
 */
const extractPhraseFromArgs = (
  args: readonly unknown[],
): string | undefined => {
  // Most common: subject at 0, phrase at 1
  if (args.length > 1 && isString(args[1])) {
    return args[1];
  }
  // Less common: phrase at 0
  if (args.length > 0 && isString(args[0])) {
    return args[0];
  }
  return undefined;
};

/**
 * Gets candidate assertions for dispatch using phrase index lookup.
 *
 * Extracts the phrase from processed arguments and looks it up in the phrase
 * index for O(1) candidate retrieval. Falls back to the full assertion list if
 * no phrase is found or the phrase isn't indexed.
 *
 * @function
 * @param processedArgs - Arguments after negation processing
 * @param phraseIndex - Map from phrase strings to assertion arrays
 * @param allAssertions - Complete assertion list for fallback
 * @returns Array of candidate assertions to check
 */
const getCandidateAssertions = <T extends IndexableAssertion>(
  processedArgs: readonly unknown[],
  phraseIndex: Map<string, T[]>,
  allAssertions: readonly T[],
): readonly T[] => {
  const phrase = extractPhraseFromArgs(processedArgs);
  return (
    (phrase !== undefined ? phraseIndex.get(phrase) : undefined) ??
    allAssertions
  );
};

/**
 * Throws an error indicating that no valid assertion could be found for the
 * provided arguments.
 *
 * @function
 * @param args The arguments that were passed to the expect function
 * @internal
 */
const throwInvalidParametersError = (args: readonly unknown[]): never => {
  const inspectedArgs = inspect(args, { depth: 1 });
  debug('Invalid arguments. No assertion matched: %s', inspectedArgs);
  throw new UnknownAssertionError(
    `Invalid arguments. No assertion matched: ${inspectedArgs}`,
    { args },
  );
};

/**
 * Detects if an assertion phrase starts with "not " and returns the cleaned
 * phrase.
 *
 * @function
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
 * {@inheritDoc FailFn}
 *
 * @function
 */
const fail: FailFn = (reason?: string): never => {
  throw new FailAssertionError({ message: reason });
};

/**
 * Used by a {@link UseFn} to create base properties of {@link Expect}.
 */
export function createBaseExpect<
  T extends AnySyncAssertions,
  U extends AnyAsyncAssertions,
>(syncAssertions: T, asyncAssertions: U, type: 'sync'): ExpectSyncProps<T, U>;
/**
 * Used by a {@link UseFn} to create base properties of {@link ExpectAsync}.
 */
export function createBaseExpect<
  T extends AnySyncAssertions,
  U extends AnyAsyncAssertions,
>(syncAssertions: T, asyncAssertions: U, type: 'async'): ExpectAsyncProps<U, T>;
/**
 * Used by a {@link UseFn} to create base properties of {@link Expect} or
 * {@link ExpectAsync}.
 */
export function createBaseExpect<
  T extends AnySyncAssertions,
  U extends AnyAsyncAssertions,
>(syncAssertions: T, asyncAssertions: U, type: 'async' | 'sync') {
  const assertions = type === 'sync' ? syncAssertions : asyncAssertions;
  return {
    assertions,
    createAssertion,
    createAsyncAssertion,
    fail,
    use: createUse(syncAssertions, asyncAssertions),
  };
}
