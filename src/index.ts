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
 *
 * @showGroups
 */

import { z } from 'zod/v4';

import { expect as sacrificialExpect } from './bootstrap.js';
export { expect, expectAsync } from './bootstrap.js';

export { AssertionError } from './error.js';

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
 * Re-export of {@link https://zod.dev Zod v4} for use in custom assertion
 * implementations.
 */
export { z };

/**
 * @primaryExport
 */
export type {
  Bupkis,
  CreateAssertionFn,
  CreateAsyncAssertionFn,
  Expect,
  ExpectAsync,
  FailFn,
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
   */
  createAssertion,
  /**
   * The main factory function for creating asynchronous assertions.
   *
   * Exported from the entry point; is also a property of {@link Expect} and
   * {@link ExpectAsync}.
   *
   * @function
   */
  createAsyncAssertion,
  /**
   * {@inheritDoc FailFn}
   *
   * @function
   */
  fail,
  /**
   * {@inheritDoc UseFn}
   *
   * @function
   */
  use,
  ..._rest
} = sacrificialExpect;
