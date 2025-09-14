/**
 * Error types thrown by _BUPKIS_, including {@link AssertionError}.
 *
 * @privateRemarks
 * Other custom errors should go here.
 * @packageDocumentation
 */

import { AssertionError as NodeAssertionError } from 'node:assert';
import { z } from 'zod/v4';

import {
  kBupkisAssertionError,
  kBupkisFailAssertionError,
  kBupkisNegatedAssertionError,
} from './constant.js';
import { isA } from './guards.js';
import { type AssertionParts, type ParsedValues } from './types.js';

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
   * Translates a {@link z.ZodError} into an {@link AssertionError} with a
   * human-friendly message.
   *
   * @remarks
   * This does not handle parameterized assertions with more than one parameter
   * too cleanly; it's unclear how a test runner would display the expected
   * values. This will probably need a fix in the future.
   * @param stackStartFn The function to start the stack trace from
   * @param zodError The original `ZodError`
   * @param values Values which caused the error
   * @returns New `AssertionError`
   */
  static fromZodError<Parts extends AssertionParts>(
    zodError: z.ZodError,
    stackStartFn: (...args: any[]) => any,
    values: ParsedValues<Parts>,
  ): AssertionError {
    const flat = z.flattenError(zodError);

    let pretty = flat.formErrors.join('; ');
    for (const [keypath, errors] of Object.entries(flat.fieldErrors)) {
      pretty += `; ${keypath}: ${(errors as unknown[]).join('; ')}`;
    }

    const [actual, ...expected] = values as unknown as [unknown, ...unknown[]];

    return new AssertionError({
      actual,
      expected: expected.length === 1 ? expected[0] : expected,
      message: `Assertion ${this} failed: ${pretty}`,
      operator: `${this}`,
      stackStartFn,
    });
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
