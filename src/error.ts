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
  kBupkisFailAssertionError,
  kBupkisNegatedAssertionError,
} from './constant.js';
import { isA } from './guards.js';

/**
 * _BUPKIS_' s custom `AssertionError` class, which is just a thin wrapper
 * around Node.js' {@link NodeAssertionError AssertionError}.
 *
 * @group Core API
 */
export class AssertionError extends NodeAssertionError {
  /**
   * @internal
   */
  [kBupkisAssertionError] = true;

  override name = 'AssertionError';

  /**
   * Type guard for an instance of this error.
   *
   * @param value Some value
   * @returns `true` if `value` is an instance of `AssertionError`
   */
  static isAssertionError(value: unknown): value is AssertionError {
    return (
      isA(value, NodeAssertionError) &&
      Object.hasOwn(value, kBupkisAssertionError)
    );
  }
}

/**
 * Variant of an {@link AssertionError} that is thrown when
 * {@link bupkis!expect.fail} is called.
 */
export class FailAssertionError extends AssertionError {
  /**
   * @internal
   */
  [kBupkisFailAssertionError] = true;

  override name = 'FailAssertionError';

  static isFailAssertionError(err: unknown): err is FailAssertionError {
    return (
      isA(err, FailAssertionError) &&
      Object.hasOwn(err, kBupkisFailAssertionError)
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

  override name = 'NegatedAssertionError';

  static isNegatedAssertionError(err: unknown): err is NegatedAssertionError {
    return (
      isA(err, AssertionError) &&
      Object.hasOwn(err, kBupkisNegatedAssertionError)
    );
  }
}
