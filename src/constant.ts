/**
 * Shared constants and symbols used throughout the library.
 *
 * This module defines unique symbols and constants that are used internally for
 * marking and identifying special values and types within the assertion
 * system.
 *
 * @packageDocumentation
 */

// ————————————————————————————————————————————————————————————————
// Types
// ————————————————————————————————————————————————————————————————
/**
 * Symbol flagging the value as a string literal
 */

export const kStringLiteral: unique symbol = Symbol('bupkis:string-literal');
