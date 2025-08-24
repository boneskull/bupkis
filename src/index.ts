/**
 * Main entry point for the Bupkis assertion library.
 *
 * This module exports all public APIs including the main `expect` function,
 * asynchronous `expectAsync` function, assertion creation utilities, type
 * guards, schema definitions, and error types.
 *
 * @packageDocumentation
 */

export { Assertion, createAssertion } from './assertion/index.js';
export * from './error.js';
export { expectAsync, type ExpectAsync } from './expect-async.js';
export { expect, type Expect } from './expect.js';

export * as guards from './guards.js';
export * as schema from './schema.js';
