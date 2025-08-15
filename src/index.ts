/**
 * Main entry point for the Bupkis assertion library.
 *
 * This module exports all public APIs including the main `expect` function,
 * asynchronous `expectAsync` function, assertion creation utilities, type
 * guards, schema definitions, utility functions, and error types.
 *
 * @module bupkis
 */

import { expect as sacrificialExpect } from './bootstrap.js';
export type * from './api.js';

export * as assertion from './assertion/index.js';
export { expect, expectAsync } from './bootstrap.js';

export * as error from './error.js';
export * as guards from './guards.js';

export type * as metadata from './metadata.js';
export * as schema from './schema.js';
export type * as types from './types.js';
export * as util from './util.js';

export { z } from 'zod/v4';

export { createAssertion, createAsyncAssertion, fail, use };
const { createAssertion, createAsyncAssertion, fail, use, ..._rest } =
  sacrificialExpect;
