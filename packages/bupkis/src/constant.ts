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
const { for: symbolFor } = Symbol;

/**
 * Symbol flagging the value as a Bupkis-created string literal, which will be
 * omitted from the parameters to an `AssertionImpl`.
 */

export const kStringLiteral: symbol = symbolFor('bupkis-string-literal');

/**
 * Symbol used to flag an `AssertionError` as our own.
 *
 * Uses `symbolFor()` to ensure the symbol is shared across module instances,
 * which is important in monorepo setups where the same package may be loaded
 * from different paths.
 */

export const kBupkisAssertionError: symbol = symbolFor(
  'bupkis-assertion-error',
);

/**
 * Symbol used to flag a `FailAssertionError`
 */
export const kBupkisFailAssertionError: symbol = symbolFor(
  'bupkis-fail-assertion-error',
);

/**
 * Symbol used to flag a `NegatedAssertionError`
 */

export const kBupkisNegatedAssertionError: symbol = symbolFor(
  'bupkis-negated-assertion-error',
);

/**
 * Symbol used to flag a function as an `expect.it` executor.
 */
export const kExpectIt: symbol = symbolFor('bupkis-expect-it');

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
 */
export const kBupkisError: symbol = symbolFor('bupkis-error');

/**
 * Assertion ID of a `FailAssertionError`.
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
