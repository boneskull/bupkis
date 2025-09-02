/**
 * Main entry point for the Bupkis assertion library.
 *
 * This module exports all public APIs including the main `expect` function,
 * asynchronous `expectAsync` function, assertion creation utilities, type
 * guards, schema definitions, and error types.
 *
 * @packageDocumentation
 */

export * as assertion from './assertion/index.js';
export { expect, expectAsync } from './bootstrap.js';
export * as error from './error.js';
export * as guards from './guards.js';
export * as schema from './schema.js';
export type * as types from './types.js';
