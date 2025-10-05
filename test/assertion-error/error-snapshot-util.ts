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
 * - Discards the stack.
 * - Handles Error objects that don't serialize properly to JSON by extracting
 *   their non-enumerable properties.
 *
 * @param error Error
 * @returns Serializer
 */
export const errorSerializer = (error: Error): string => {
  if (isError(error)) {
    const { stack: _stack, ...rest } = error;

    // Handle the actual and expected properties specially if they are Error objects
    const processErrorValue = (value: unknown): unknown => {
      if (isError(value)) {
        // Error objects don't serialize to JSON properly, so extract their properties
        const errorProps: Record<string, unknown> = {};
        for (const prop of Object.getOwnPropertyNames(value)) {
          if (prop !== 'stack') {
            // Skip stack to reduce noise
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            errorProps[prop] = (value as any)[prop];
          }
        }
        return errorProps;
      }
      return value;
    };

    const result: Record<string, unknown> = {
      // @ts-expect-error - message is not enumerable on NodeAssertionError
      message: error.message,
      ...rest,
    };

    // Process actual and expected values to handle Error objects
    if ('actual' in error) {
      result.actual = processErrorValue(error.actual);
    }
    if ('expected' in error) {
      result.expected = processErrorValue(error.expected);
    }

    return stringify(result, null, 2);
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
