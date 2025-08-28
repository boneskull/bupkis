/**
 * Error handling and assertion error types.
 *
 * This module re-exports Node.js AssertionError for consistent error handling
 * across the assertion library.
 *
 * @packageDocumentation
 */

import { AssertionError as NodeAssertionError } from 'node:assert';

import { isA } from './guards.js';

/**
 * @internal
 */
export const kBupkisNegatedAssertionError: unique symbol = Symbol(
  'bupkis-negated-error',
);

/**
 * @internal
 */
export const kBupkisAssertionError: unique symbol = Symbol('bupkis-error');

export class AssertionError extends NodeAssertionError {
  [kBupkisAssertionError] = true;

  static isAssertionError(err: unknown): err is AssertionError {
    return (
      isA(err, NodeAssertionError) && Object.hasOwn(err, kBupkisAssertionError)
    );
  }
}

export class NegatedAssertionError extends AssertionError {
  [kBupkisNegatedAssertionError] = true;

  static isNegatedAssertionError(err: unknown): err is NegatedAssertionError {
    return (
      isA(err, AssertionError) &&
      Object.hasOwn(err, kBupkisNegatedAssertionError)
    );
  }
}
