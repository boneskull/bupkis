/**
 * Assertion creation and management utilities.
 *
 * This module provides the main `Assertion` class and factory functions for
 * creating custom assertions. It serves as the primary interface for assertion
 * construction and configuration.
 *
 * @packageDocumentation
 */

import { Assertion } from './assertion.js';
export { FunctionAssertion, SchemaAssertion } from './assertion.js';
export type {
  AssertionImpl,
  AssertionImplAsyncFn,
  AssertionImplFn,
  AssertionPart,
  AssertionParts,
  AssertionPartsToSlots,
  AssertionSlot,
  AssertionSlots,
  HoleyParsedValues,
  ParsedResult,
  ParsedResultFailure,
  ParsedResultSuccess,
  ParsedSubject,
  ParsedValues,
  Phrase,
  PhraseLiteral,
  PhraseLiteralEnum,
  PhraseLiteralEnumSlot,
  PhraseLiteralSlot,
} from './types.js';
export { Assertion };

export const { fromParts: createAssertion } = Assertion;
