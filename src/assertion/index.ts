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
  AssertionPart,
  AssertionParts,
  AssertionPartsToSlots,
  AssertionSlot,
  AssertionSlots,
  ParsedResult,
  ParsedResultFailure,
  ParsedResultSuccess,
  ParsedSubject,
  ParsedValues,
  Phrase,
  PhraseLiteral,
  PhraseLiteralChoice,
  PhraseLiteralChoiceSlot,
  PhraseLiteralSlot,
} from './assertion-types.js';
export { BupkisAssertion } from './assertion.js';
export { createAssertion, createAsyncAssertion } from './create.js';
export { AsyncAssertions } from './impl/async.js';
export { SyncAssertions } from './impl/sync.js';
