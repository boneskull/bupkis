/**
 * Assertion creation and management utilities.
 *
 * This module provides the main `Assertion` class and factory functions for
 * creating custom assertions. It serves as the primary interface for assertion
 * construction and configuration.
 *
 * @packageDocumentation
 */

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
  PhraseLiteralChoice as PhraseLiteralEnum,
  PhraseLiteralChoiceSlot as PhraseLiteralEnumSlot,
  PhraseLiteralSlot,
} from './assertion-types.js';
export {
  BupkisAssertion,
  createAssertion,
  FunctionAssertion,
  SchemaAssertion as OptimizedSchemaAssertion,
  SchemaAssertion,
} from './assertion.js';
export { AsyncAssertions } from './async.js';
export { SyncAssertions } from './sync.js';
