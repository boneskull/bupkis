/**
 * Shared constants and symbols used throughout the library.
 *
 * This module defines unique symbols and constants that are used internally for
 * marking and identifying special values and types within the assertion
 * system.
 *
 * @packageDocumentation
 * @internal
 */

/**
 * Symbol flagging the value as a Bupkis-created string literal, which will be
 * omitted from the parameters to an `AssertionImpl`.
 *
 * @internal
 */

export const kStringLiteral: unique symbol = Symbol('bupkis:string-literal');

/**
 * Symbol used to flag an `AssertionError` as our own.
 *
 * @internal
 */

export const kBupkisAssertionError: unique symbol = Symbol('bupkis-error');

/**
 * Symbol used to flag a `NegatedAssertionError`
 *
 * @internal
 */

export const kBupkisNegatedAssertionError: unique symbol = Symbol(
  'bupkis-negated-error',
);
