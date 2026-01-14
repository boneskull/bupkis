/**
 * Utility functions for working with sync and async iterables/iterators.
 *
 * These helpers normalize the various forms of iterables (arrays, generators,
 * streams, raw iterators) into a consistent iterator interface for use in
 * assertions.
 *
 * @module assertion/impl/iteration-util
 * @internal
 */

const { asyncIterator: asyncIteratorSymbol, iterator: iteratorSymbol } = Symbol;

// =============================================================================
// Types
// =============================================================================

/**
 * Type representing anything that can be async-iterated.
 *
 * @internal
 */
export type AsyncIterableInput<T> =
  | AsyncIterable<T>
  | AsyncIterator<T>
  | Iterable<T>;

/**
 * Result type for async iteration with metadata.
 *
 * @internal
 */
export interface AsyncIterationResult<T> {
  /** Whether iteration completed successfully (no error) */
  completed: boolean;
  /** The total count of items */
  count: number;
  /** Error thrown during iteration (if any) */
  error?: unknown;
  /** Whether the iterator had any values */
  hasValue: boolean;
  /** The last yielded value (if any) */
  lastValue: T | undefined;
}

/**
 * Result type for sync iteration with metadata.
 *
 * @internal
 */
export interface SyncIterationResult<T> {
  /** The total count of items */
  count: number;
  /** Whether the iterator had any values */
  hasValue: boolean;
  /** The last yielded value (if any) */
  lastValue: T | undefined;
}

// =============================================================================
// Sync Iteration Helpers
// =============================================================================

/**
 * Collects all values from an iterable/iterator into an array.
 *
 * @function
 * @param source - An iterable or iterator to collect from
 * @returns Array containing all yielded values
 * @internal
 */
export const collectSync = <T>(source: Iterable<T> | Iterator<T>): T[] => {
  const result: T[] = [];
  const iterator = toIterator(source);
  let next = iterator.next();
  while (!next.done) {
    result.push(next.value);
    next = iterator.next();
  }
  return result;
};

/**
 * Counts items yielded by an iterable/iterator.
 *
 * Note: This fully consumes the iterator.
 *
 * @function
 * @param source - An iterable or iterator to count
 * @returns The number of items yielded
 * @internal
 */
export const countSync = (
  source: Iterable<unknown> | Iterator<unknown>,
): number => {
  let count = 0;
  const iterator = toIterator(source);
  while (!iterator.next().done) {
    count++;
  }
  return count;
};

/**
 * Gets the first value from an iterable/iterator.
 *
 * @function
 * @param source - An iterable or iterator
 * @returns The first yielded value, or undefined if empty
 * @internal
 */
export const firstSync = <T>(
  source: Iterable<T> | Iterator<T>,
): T | undefined => {
  const iterator = toIterator(source);
  const next = iterator.next();
  return next.done ? undefined : next.value;
};

/**
 * Gets the last value from an iterable/iterator.
 *
 * Note: This fully consumes the iterator.
 *
 * @function
 * @param source - An iterable or iterator
 * @returns The last yielded value, or undefined if empty
 * @internal
 */
export const lastSync = <T>(
  source: Iterable<T> | Iterator<T>,
): T | undefined => {
  const iterator = toIterator(source);
  let lastValue: T | undefined;
  let hasValue = false;
  let next = iterator.next();
  while (!next.done) {
    lastValue = next.value;
    hasValue = true;
    next = iterator.next();
  }
  return hasValue ? lastValue : undefined;
};

/**
 * Iterates fully and returns metadata about the iteration.
 *
 * @function
 * @param source - An iterable or iterator
 * @returns Iteration result with count and last value
 * @internal
 */
export const iterateFullySync = <T>(
  source: Iterable<T> | Iterator<T>,
): SyncIterationResult<T> => {
  const iterator = toIterator(source);
  let count = 0;
  let lastValue: T | undefined;
  let hasValue = false;
  let next = iterator.next();

  while (!next.done) {
    lastValue = next.value;
    hasValue = true;
    count++;
    next = iterator.next();
  }

  return { count, hasValue, lastValue };
};

/**
 * Normalizes an iterable or iterator to an iterator.
 *
 * If the source has `Symbol.iterator`, calls it to get an iterator. Otherwise,
 * assumes the source is already an iterator.
 *
 * @function
 * @param source - An iterable or iterator
 * @returns An iterator
 * @internal
 */
export const toIterator = <T>(
  source: Iterable<T> | Iterator<T>,
): Iterator<T> => {
  if (isIterable<T>(source)) {
    return source[iteratorSymbol as typeof Symbol.iterator]();
  }
  return source;
};

// =============================================================================
// Async Iteration Helpers
// =============================================================================

/**
 * Collects all values from an async iterable/iterator into an array.
 *
 * @function
 * @param source - An async iterable, async iterator, or sync iterable
 * @returns Promise resolving to array of all yielded values
 * @internal
 */
export const collectAsync = async <T>(
  source: AsyncIterableInput<T>,
): Promise<T[]> => {
  const result: T[] = [];
  const iterator = toAsyncIterator(source);
  let next = await iterator.next();
  while (!next.done) {
    result.push(next.value);
    next = await iterator.next();
  }
  return result;
};

/**
 * Counts items yielded by an async iterable/iterator.
 *
 * Note: This fully consumes the iterator.
 *
 * @function
 * @param source - An async iterable, async iterator, or sync iterable
 * @returns Promise resolving to the number of items yielded
 * @internal
 */
export const countAsync = async (
  source: AsyncIterableInput<unknown>,
): Promise<number> => {
  let count = 0;
  const iterator = toAsyncIterator(source);
  while (!(await iterator.next()).done) {
    count++;
  }
  return count;
};

/**
 * Gets the first value from an async iterable/iterator.
 *
 * @function
 * @param source - An async iterable, async iterator, or sync iterable
 * @returns Promise resolving to the first yielded value, or undefined if empty
 * @internal
 */
export const firstAsync = async <T>(
  source: AsyncIterableInput<T>,
): Promise<T | undefined> => {
  const iterator = toAsyncIterator(source);
  const next = await iterator.next();
  return next.done ? undefined : next.value;
};

/**
 * Gets the last value from an async iterable/iterator.
 *
 * Note: This fully consumes the iterator.
 *
 * @function
 * @param source - An async iterable, async iterator, or sync iterable
 * @returns Promise resolving to the last yielded value, or undefined if empty
 * @internal
 */
export const lastAsync = async <T>(
  source: AsyncIterableInput<T>,
): Promise<T | undefined> => {
  const iterator = toAsyncIterator(source);
  let lastValue: T | undefined;
  let hasValue = false;
  let next = await iterator.next();
  while (!next.done) {
    lastValue = next.value;
    hasValue = true;
    next = await iterator.next();
  }
  return hasValue ? lastValue : undefined;
};

/**
 * Iterates fully and returns metadata about the async iteration.
 *
 * Unlike the sync version, this catches errors during iteration and returns
 * them in the result, allowing assertions to check for expected failures.
 *
 * @function
 * @param source - An async iterable, async iterator, or sync iterable
 * @returns Promise resolving to iteration result with count, last value, and
 *   error info
 * @internal
 */
export const iterateFullyAsync = async <T>(
  source: AsyncIterableInput<T>,
): Promise<AsyncIterationResult<T>> => {
  const iterator = toAsyncIterator(source);
  let count = 0;
  let lastValue: T | undefined;
  let hasValue = false;

  try {
    let next = await iterator.next();
    while (!next.done) {
      lastValue = next.value;
      hasValue = true;
      count++;
      next = await iterator.next();
    }
    return { completed: true, count, hasValue, lastValue };
  } catch (error) {
    return { completed: false, count, error, hasValue, lastValue };
  }
};

/**
 * Normalizes an async iterable/iterator to an async iterator. Also handles sync
 * iterables for convenience.
 *
 * @function
 * @param source - An async iterable, async iterator, or sync iterable
 * @returns An async iterator
 * @internal
 */
export const toAsyncIterator = <T>(
  source: AsyncIterableInput<T>,
): AsyncIterator<T> => {
  // Check for async iterable first (Symbol.asyncIterator)
  if (isAsyncIterable<T>(source)) {
    return (source as AsyncIterable<T>)[
      asyncIteratorSymbol as typeof Symbol.asyncIterator
    ]();
  }

  // Check for sync iterable (Symbol.iterator) - wrap as async
  if (isIterable<T>(source)) {
    const syncIterator = (source as Iterable<T>)[
      iteratorSymbol as typeof Symbol.iterator
    ]();
    return {
      async next(): Promise<IteratorResult<T>> {
        return syncIterator.next();
      },
    };
  }

  // Assume it's already an async iterator (has next() method)
  return source as AsyncIterator<T>;
};

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Checks if a value is async iterable (has Symbol.asyncIterator).
 *
 * @function
 * @param value - Value to check
 * @returns True if the value is async iterable
 * @internal
 */
const isAsyncIterable = <T>(value: unknown): value is AsyncIterable<T> =>
  value != null &&
  typeof (value as AsyncIterable<T>)[
    asyncIteratorSymbol as typeof Symbol.asyncIterator
  ] === 'function';

/**
 * Checks if a value is iterable (has Symbol.iterator).
 *
 * Works with both objects and primitives (like strings).
 *
 * @function
 * @param value - Value to check
 * @returns True if the value is iterable
 * @internal
 */
const isIterable = <T>(value: unknown): value is Iterable<T> =>
  value != null &&
  typeof (value as Iterable<T>)[iteratorSymbol as typeof Symbol.iterator] ===
    'function';
