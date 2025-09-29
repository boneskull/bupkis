/**
 * Error snapshot testing utilities for capturing and serializing assertion
 * errors.
 *
 * @packageDocumentation
 */

import { type it } from 'node:test';
import { inspect } from 'node:util';

import { type AssertionError, FailAssertionError } from '../../src/error.js';
import { isError, isPromiseLike } from '../../src/guards.js';
import { expect } from '../custom-assertions.js';
const { stringify } = JSON;

/**
 * Serializes an Error suitable for snapshot testing.
 *
 * - Calls `error`'s `toJSON` method if available.
 * - Truncates the stack trace to only include the message and the first stack
 *   frame (best effort).
 *
 * @param error Error
 * @returns Serializer
 */
export const errorSerializer = (error: Error): string => {
  if (isError(error)) {
    const { stack: _stack, ...rest } = error;
    // @ts-expect-error - message is not enumerable on NodeAssertionError
    return stringify({ message: error.message, ...rest }, null, 2);
  }

  throw new TypeError(
    `Unexpected type (${typeof error}) of error: ${inspect(error)}`,
  );
};

/**
 * Takes a snapshot of an error thrown by a sync assertion function.
 *
 * @param failingAssertion - Sync function that should throw an AssertionError
 * @param t - Node.js test context for snapshot operations
 */
export function takeErrorSnapshot(
  failingAssertion: () => void,
): (t: it.TestContext) => void;
/**
 * Takes a snapshot of an error thrown by an async assertion function.
 *
 * @param failingAssertion - Sync function that should throw an AssertionError
 * @param t - Node.js test context for snapshot operations
 */
export function takeErrorSnapshot(
  failingAssertion: () => Promise<void>,
): (t: it.TestContext) => Promise<void>;
export function takeErrorSnapshot(
  failingAssertion: () => Promise<void> | void,
) {
  return async (t: it.TestContext) => {
    const captureError = (err: unknown): AssertionError => {
      if (FailAssertionError.isFailAssertionError(err)) {
        // Rethrow FailAssertionError to avoid capturing its snapshot
        throw err;
      }
      return err as AssertionError;
    };

    const takeSnapshot = (error: AssertionError): void => {
      t.assert.snapshot(error, {
        serializers: [errorSerializer],
      });
    };

    let result: Promise<void> | void;
    try {
      result = failingAssertion();
    } catch (err) {
      // Synchronous error - capture it immediately
      const error = captureError(err);
      takeSnapshot(error);
      return;
    }

    if (isPromiseLike(result)) {
      return result.then(
        () => {
          expect.fail('Expected assertion to throw, but it did not');
        },
        (err) => {
          const error = captureError(err);
          takeSnapshot(error);
        },
      );
    } else {
      // Synchronous function that didn't throw - this shouldn't happen
      expect.fail('Expected assertion to throw, but it did not');
    }
  };
}
