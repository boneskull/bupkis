/**
 * Main entry point for the Bupkis assertion library.
 *
 * This module exports all public APIs including the main `expect` function,
 * asynchronous `expectAsync` function, assertion creation utilities, type
 * guards, schema definitions, utility functions, and error types.
 *
 * @module bupkis
 * @category API
 * @example
 *
 * ```ts
 * import { expect, expectAsync, z, createAssertion } from 'bupkis';
 * ```
 */

import { z } from 'zod/v4';

import { expect as sacrificialExpect } from './bootstrap.js';
export * as assertions from './assertion/impl/index.js';
export { expect, expectAsync } from './bootstrap.js';
export * from './error.js';
export * as schema from './schema.js';

/**
 * Re-export of Standard Schema v1 types for use in custom assertion
 * implementations.
 *
 * @see {@link https://standardschema.dev | Standard Schema Specification}
 */
export type { StandardSchemaV1 } from './standard-schema.js';

/**
 * Re-export of {@link https://zod.dev Zod v4} for use in custom assertion
 * implementations.
 */
export { z };

/**
 * Re-export of most (all?) types defined within <span
 * class="bupkis">Bupkis</span>.
 *
 * @example
 *
 * ```ts
 * import { types } from 'bupkis';
 * ```
 */
export type * as types from './types.js';

/**
 * @primaryExport
 */
export type {
  AssertionFailure,
  AssertionStandardSchemaAsync,
  AssertionStandardSchemaSync,
  Bupkis,
  CreateAssertionFn,
  CreateAsyncAssertionFn,
  Expect,
  ExpectAsync,
  ExpectIt,
  ExpectItAsync,
  FailFn,
  Keypath,
  UseFn,
} from './types.js';
export { createAssertion, createAsyncAssertion, fail, use };
const {
  /**
   * The main factory function for creating asynchronous assertions.
   *
   * Exported from the entry point; is also a property of {@link Expect} and
   * {@link ExpectAsync}.
   *
   * @function
   * @primaryExport
   * @group Core API
   */
  createAssertion,
  /**
   * The main factory function for creating asynchronous assertions.
   *
   * Exported from the entry point; is also a property of {@link Expect} and
   * {@link ExpectAsync}.
   *
   * @function
   * @primaryExport
   * @group Core API
   */
  createAsyncAssertion,
  /**
   * {@inheritDoc FailFn}
   *
   * @function
   * @primaryExport
   * @group Core API
   */
  fail,
  /**
   * {@inheritDoc UseFn}
   *
   * @function
   * @primaryExport
   * @group Core API
   */
  use,
  ..._rest
} = sacrificialExpect;
