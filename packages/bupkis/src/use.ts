/**
 * Contains {@link createUse} and which is consumed by the bootstrapper and any
 * subsequent calls to {@link bupkis!expect.use}.
 *
 * @packageDocumentation
 */

import { BupkisAssertionAsync } from './assertion/assertion-async.js';
import { BupkisAssertionSync } from './assertion/assertion-sync.js';
import {
  type AnyAssertion,
  type AnyAsyncAssertions,
  type AnySyncAssertions,
} from './assertion/assertion-types.js';
import { kExpectIt } from './constant.js';
import {
  createBaseExpect,
  createExpectAsyncFunction,
  createExpectSyncFunction,
} from './expect.js';
import {
  type Concat,
  type ExpectIt,
  type ExpectItAsync,
  type FilterAsyncAssertions,
  type FilterSyncAssertions,
  type UseFn,
} from './types.js';

const { assign } = Object;

/**
 * Creates an `expect.it()` factory function for generating embeddable assertion
 * executors.
 *
 * This function produces a factory that creates embeddable assertion executors
 * from natural language assertion phrases. The resulting executors can be
 * embedded within object patterns for use with `'to satisfy'` assertions,
 * enabling type-safe pattern matching for complex nested validations.
 *
 * @remarks
 * The returned executors are marked with the {@link kExpectIt} symbol to
 * distinguish them from regular functions during pattern validation. They are
 * designed exclusively for use within `'to satisfy'` assertion contexts and
 * should not be executed directly outside of pattern matching scenarios.
 * @example
 *
 * ```typescript
 * const expectIt = createExpectIt(expect);
 *
 * // Create embeddable assertion executors
 * const isString = expectIt('to be a string');
 * const isPositive = expectIt('to be greater than', 0);
 *
 * // Use within 'to satisfy' patterns
 * expect(user, 'to satisfy', {
 *   name: isString, // Validates that user.name is a string
 *   age: isPositive, // Validates that user.age > 0
 *   email: /\S+@\S+/, // Standard regex pattern
 * });
 * ```
 *
 * @template SyncAssertions - Array of synchronous assertion objects that define
 *   the available assertion logic for the embeddable functions
 * @function
 * @param expect - The underlying expect function that will execute the
 *   assertions when the returned executors are called
 * @returns A factory function that creates {@link ExpectItExecutor} instances
 *   for embedding within object patterns
 * @internal
 * @see {@link ExpectIt} for the complete factory function interface
 * @see {@link ExpectItExecutor} for the executor function interface
 * @see {@link kExpectIt} for the internal marking symbol
 */
const createExpectIt = <SyncAssertions extends AnySyncAssertions>(
  expect: any,
): ExpectIt<SyncAssertions> => {
  /**
   * @function
   */
  const expectIt = (...args: readonly unknown[]) => {
    const func = assign(
      (subject: unknown) => {
        const allArgs = [subject, ...args];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        expect(...allArgs);
      },
      {
        [kExpectIt]: true,
      },
    );
    return func;
  };
  return expectIt as unknown as ExpectIt<SyncAssertions>;
};

/**
 * Creates an `expectAsync.it()` factory function for generating embeddable
 * async assertion executors.
 *
 * This function produces a factory that creates embeddable async assertion
 * executors from natural language assertion phrases. The resulting executors
 * can be embedded within async object patterns for use with `'to satisfy'`
 * assertions, enabling type-safe pattern matching for complex nested
 * validations with Promise support.
 *
 * @remarks
 * The returned async executors are marked with the {@link kExpectIt} symbol to
 * distinguish them from regular functions during pattern validation. They are
 * designed exclusively for use within async `'to satisfy'` assertion contexts
 * and should not be executed directly outside of pattern matching scenarios.
 * @example
 *
 * ```typescript
 * const expectItAsync = createExpectItAsync(expectAsync);
 *
 * // Create embeddable async assertion executors
 * const isAsyncString = expectItAsync('to be a string');
 * const resolvesFast = expectItAsync('to resolve quickly');
 *
 * // Use within async 'to satisfy' patterns
 * await expectAsync(asyncUser, 'to satisfy', {
 *   name: isAsyncString, // Async validation that user.name is a string
 *   loadPromise: resolvesFast, // Async validation that loadPromise resolves quickly
 * });
 * ```
 *
 * @template AsyncAssertions - Array of asynchronous assertion objects that
 *   define the available assertion logic for the embeddable async functions
 * @function
 * @param expectAsync - The underlying expectAsync function that will execute
 *   the assertions when the returned executors are called
 * @returns A factory function that creates {@link ExpectItExecutorAsync}
 *   instances for embedding within async object patterns
 * @internal
 * @see {@link ExpectItAsync} for the complete factory function interface
 * @see {@link ExpectItExecutorAsync} for the executor function interface
 * @see {@link kExpectIt} for the internal marking symbol
 * @see {@link createExpectIt} for the synchronous equivalent
 */
const createExpectItAsync = <AsyncAssertions extends AnyAsyncAssertions>(
  expectAsync: any,
): ExpectItAsync<AsyncAssertions> => {
  /**
   * @function
   */
  const expectItAsync = (...args: readonly unknown[]) => {
    const func = assign(
      async (subject: unknown) => {
        const allArgs = [subject, ...args];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await expectAsync(...allArgs);
      },
      {
        [kExpectIt]: true,
      },
    );
    return func;
  };
  return expectItAsync as unknown as ExpectItAsync<AsyncAssertions>;
};

/**
 * Creates a factory function for composing assertion functions with custom
 * assertions.
 *
 * This function implements the core plugin system for Bupkis, enabling users to
 * extend the built-in assertion library with custom assertions. It creates a
 * `use()` function that accepts mixed arrays of assertions and returns new
 * `expect` and `expectAsync` functions that include both the base assertions
 * and the newly added ones.
 *
 * The function separates synchronous and asynchronous assertions from the input
 * array, combines them with existing assertions, and constructs fully-featured
 * expect functions with all necessary properties including assertion creation
 * utilities, failure functions, and recursive composition via the `use`
 * property.
 *
 * @remarks
 * The returned function filters input assertions by type using `instanceof`
 * checks against {@link BupkisAssertionSync} and {@link BupkisAssertionAsync}
 * classes. It then creates new expect functions using
 * {@link createExpectSyncFunction} and {@link createExpectAsyncFunction}, and
 * attaches all necessary properties including recursive `use` functionality.
 *
 * The composition is recursive - the returned object's `use` property creates a
 * new `createUse` instance with the combined assertion sets, enabling unlimited
 * chaining of custom assertions.
 * @example
 *
 * ```typescript
 * // Create custom assertions
 * const customSyncAssertion = expect.createAssertion(
 *   ['to be even'],
 *   (n) => n % 2 === 0,
 * );
 * const customAsyncAssertion = expect.createAsyncAssertion(
 *   ['to resolve quickly'],
 *   async (promise) => {
 *     const start = Date.now();
 *     await promise;
 *     return Date.now() - start < 100;
 *   },
 * );
 *
 * // Use createUse to compose with existing assertions
 * const use = createUse(existingSyncAssertions, existingAsyncAssertions);
 * const { expect: newExpect, expectAsync: newExpectAsync } = use([
 *   customSyncAssertion,
 *   customAsyncAssertion,
 * ]);
 *
 * // Now both built-in and custom assertions are available
 * newExpect(4, 'to be even'); // Custom assertion
 * newExpect('hello', 'to be a string'); // Built-in assertion
 * await newExpectAsync(fastPromise, 'to resolve quickly'); // Custom async assertion
 * ```
 *
 * @template SyncAssertions - Array of base synchronous assertions that will be
 *   available in the composed functions
 * @template AsyncAssertions - Array of base asynchronous assertions that will
 *   be available in the composed functions
 * @function
 * @param syncAssertions - Base synchronous assertions to include in all
 *   composed expect functions
 * @param asyncAssertions - Base asynchronous assertions to include in all
 *   composed expect functions
 * @returns A {@link UseFn} that accepts additional assertions and returns
 *   composed expect functions
 * @internal
 * @see {@link UseFn} for the interface of the returned function
 * @see {@link Bupkis} for the structure of the returned object
 * @see {@link FilterSyncAssertions} for how sync assertions are extracted
 * @see {@link FilterAsyncAssertions} for how async assertions are extracted
 * @see {@link Concat} for how assertion arrays are combined
 */
export const createUse = <
  const SyncAssertions extends AnySyncAssertions,
  const AsyncAssertions extends AnyAsyncAssertions,
>(
  syncAssertions: SyncAssertions,
  asyncAssertions: AsyncAssertions,
): UseFn<SyncAssertions, AsyncAssertions> => {
  const syncAssertionsIn = syncAssertions ?? [];
  const asyncAssertionsIn = asyncAssertions ?? [];
  /**
   * @function
   */
  const use: UseFn<SyncAssertions, AsyncAssertions> = <
    AllAssertions extends readonly AnyAssertion[],
    FilteredSyncAssertions extends FilterSyncAssertions<AllAssertions>,
    FilteredAsyncAssertions extends FilterAsyncAssertions<AllAssertions>,
  >(
    assertions: AllAssertions,
  ) => {
    const newSyncAssertions = assertions.filter(
      (a) => a instanceof BupkisAssertionSync,
    ) as unknown as FilteredSyncAssertions;
    const newAsyncAssertions = assertions.filter(
      (a) => a instanceof BupkisAssertionAsync,
    ) as unknown as FilteredAsyncAssertions;
    const allSyncAssertions = [
      ...syncAssertionsIn,
      ...newSyncAssertions,
    ] as unknown as Concat<typeof syncAssertionsIn, typeof newSyncAssertions>;
    const allAsyncAssertions = [
      ...asyncAssertionsIn,
      ...newAsyncAssertions,
    ] as unknown as Concat<typeof asyncAssertionsIn, typeof newAsyncAssertions>;
    const expectFunction = createExpectSyncFunction(allSyncAssertions);
    const expectAsyncFunction = createExpectAsyncFunction(allAsyncAssertions);

    const expect = assign(
      expectFunction,
      createBaseExpect(allSyncAssertions, allAsyncAssertions, 'sync'),
      { it: createExpectIt(expectFunction) },
    );
    const expectAsync = assign(
      expectAsyncFunction,
      createBaseExpect(allSyncAssertions, allAsyncAssertions, 'async'),
      { it: createExpectItAsync(expectAsyncFunction) },
    );

    return {
      expect,
      expectAsync,
      get use() {
        return createUse(allSyncAssertions, allAsyncAssertions);
      },
    };
  };
  return use;
};
