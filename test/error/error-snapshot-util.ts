/**
 * Error snapshot testing utilities for capturing and serializing assertion
 * errors.
 *
 * @packageDocumentation
 */

import path from 'node:path';
import { type it } from 'node:test';

import { type AssertionError, FailAssertionError } from '../../src/error.js';
import {
  isFunction,
  isNonNullObject,
  isPromiseLike,
} from '../../src/guards.js';
import { expect } from '../custom-assertions.js';
const { stringify } = JSON;
/**
 * Serializes an Error suitable for snapshot testing.
 *
 * @param error Error
 * @returns Serializer
 */
export const errorSerializer = (error: Error): string => {
  const serialized: unknown =
    'toJSON' in error && isFunction(error.toJSON)
      ? error.toJSON()
      : { ...error, stack: error.stack };

  if (isNonNullObject(serialized)) {
    // This file is at test/error/error-snapshot-util.ts, so workspace root is ../..
    const workspaceRoot = path.resolve(import.meta.dirname, '../..');

    // Keep the message and first stack frame (first "  at" line)
    let processedStack: string | undefined;
    if (error.stack) {
      const stackLines = error.stack.split('\n');
      const firstAtIndex = stackLines.findIndex((line) =>
        /^\s*at\s+/.test(line),
      );

      if (firstAtIndex !== -1) {
        // Keep everything up to and including the first "at" line
        const truncatedLines = stackLines.slice(0, firstAtIndex + 1);
        processedStack = truncatedLines
          .join('\n')
          .replace(
            new RegExp(workspaceRoot.replace(/[/\\]/g, '[/\\\\]'), 'g'),
            '.',
          );
      } else {
        // No "at" line found, just apply path replacement to full stack
        processedStack = error.stack.replace(
          new RegExp(workspaceRoot.replace(/[/\\]/g, '[/\\\\]'), 'g'),
          '.',
        );
      }
    }

    const err = {
      ...serialized,
      stack: processedStack,
    };
    return stringify(err, null, 2);
  }
  return stringify(serialized, null, 2);
};

/**
 * Takes a snapshot of an error thrown by an async assertion function.
 *
 * @param failingAssertion - Async function that should throw an AssertionError
 * @param t - Node.js test context for snapshot operations
 * @returns Promise that resolves when the error snapshot is captured
 */
export function takeErrorSnapshot(
  failingAssertion: () => Promise<void>,
): (t: it.TestContext) => Promise<void>;
/**
 * Takes a snapshot of an error thrown by a sync assertion function.
 *
 * @param failingAssertion - Sync function that should throw an AssertionError
 * @param t - Node.js test context for snapshot operations
 */
export function takeErrorSnapshot(
  failingAssertion: () => void,
): (t: it.TestContext) => void;
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
