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

const { freeze } = Object;

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
 * Symbol used to flag a `FailAssertionError`
 *
 * @internal
 */
export const kBupkisFailAssertionError: unique symbol =
  Symbol('bupkis-fail-error');

/**
 * Symbol used to flag a `NegatedAssertionError`
 *
 * @internal
 */

export const kBupkisNegatedAssertionError: unique symbol = Symbol(
  'bupkis-negated-error',
);

/**
 * Symbol used to flag a function as an `expect.it` executor.
 *
 * @internal
 */
export const kExpectIt: unique symbol = Symbol('bupkis-expect-it');

/**
 * Regular expression that matches valid keypath syntax.
 *
 * Matches patterns like:
 *
 * - Simple identifiers: `foo`
 * - Dot notation: `foo.bar`, `foo.bar.baz`
 * - Bracket notation with numbers: `foo[0]`, `bar[123]`
 * - Bracket notation with quoted strings: `foo["key"]`, `bar['prop']`
 * - Mixed notation: `foo.bar[0].baz`, `obj[0]["key"].prop`
 *
 * The regex breaks down as:
 *
 * - `^[a-zA-Z_$][a-zA-Z0-9_$]*` - Valid identifier start
 * - `(?:` - Non-capturing group for additional segments
 *
 *   - `\.` - Dot followed by identifier
 *   - `|` - OR
 *   - `\[(?:\d+|"[^"]*"|'[^']*')\]` - Bracket notation (number or quoted string)
 * - `)*$` - Zero or more additional segments, end of string
 *
 * @public
 */

export const KEYPATH_REGEX =
  /^[a-zA-Z_$][-a-zA-Z0-9_$]*(?:(?:\.[a-zA-Z_$][-a-zA-Z0-9_$]*)|(?:\[(?:\d+|"[^"]*"|'[^']*')\]))*$/;

/**
 * Symbol used to flag a function as a Bupkis-thrown error.
 *
 * @internal
 */
export const kBupkisError: unique symbol = Symbol('bupkis-error');

/**
 * Assertion ID of a `FailAssertionError`.
 *
 * @internal
 */
export const FAIL = 'FAIL' as const;

export const DAY_NAMES = freeze([
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const);
