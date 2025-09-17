/**
 * Assertion creation and management utilities.
 *
 * This module provides the main `Assertion` class and factory functions for
 * creating custom assertions. It serves as the primary interface for assertion
 * construction and configuration.
 *
 * @showGroups
 *
 * @packageDocumentation
 */

export type * from './assertion-types.js';
export { BupkisAssertion } from './assertion.js';
export { createAssertion, createAsyncAssertion } from './create.js';
export * from './impl/async.js';
export * from './impl/sync.js';
