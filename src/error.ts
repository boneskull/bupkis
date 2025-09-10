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
 */
export class AssertionError extends NodeAssertionError {
  /**
   * @internal
   */
  [kBupkisAssertionError] = true;

  override name = 'AssertionError';

  /**
   * @param options Options passed to {@link NodeAssertionError}'s constructor
   */
  constructor(options?: ConstructorParameters<typeof NodeAssertionError>[0]) {
    super(options);
  }

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
