/**
 * Error types thrown by _BUPKIS_, including {@link AssertionError}.
 *
 * @privateRemarks
 * Other custom errors should go here.
 * @packageDocumentation
 */

import { AssertionError as NodeAssertionError } from 'node:assert';

import {
  kBupkisAssertionError,
  kBupkisNegatedAssertionError,
} from './constant.js';
import { isA } from './guards.js';

/**
 * _BUPKIS_' s custom `AssertionError` class, which is just a thin wrapper
 * around Node.js' {@link NodeAssertionError AssertionError}.
 *
 * @public
 */
export class AssertionError extends NodeAssertionError {
  [kBupkisAssertionError] = true;

  static isAssertionError(err: unknown): err is AssertionError {
    return (
      isA(err, NodeAssertionError) && Object.hasOwn(err, kBupkisAssertionError)
    );
  }
}

/**
 * Error type used internally to catch failed negated assertions.
 *
 * @internal
 */
export class NegatedAssertionError extends AssertionError {
  [kBupkisNegatedAssertionError] = true;

  static isNegatedAssertionError(err: unknown): err is NegatedAssertionError {
    return (
      isA(err, AssertionError) &&
      Object.hasOwn(err, kBupkisNegatedAssertionError)
    );
  }
}
