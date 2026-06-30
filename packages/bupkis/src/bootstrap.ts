/**
 * Factory function for creating the main assertion functions.
 *
 * This module provides the {@link bootstrap} function that creates both
 * synchronous and asynchronous assertion engines.
 *
 * @packageDocumentation
 */

import { AsyncAssertions, SyncAssertions } from './assertion/index.js';
import {
  type BuiltinAsyncAssertionWrapper,
  type BuiltinSyncAssertionWrapper,
  type Expect,
  type ExpectAsync,
} from './types.js';
import { createUse } from './use.js';

/**
 * Factory function that creates both synchronous and asynchronous assertion
 * engines.
 *
 * @function
 * @returns Object containing {@link expect} and {@link expectAsync} functions
 * @internal
 */
const bootstrap = (): {
  expect: Expect<BuiltinSyncAssertionWrapper>;
  expectAsync: ExpectAsync<BuiltinAsyncAssertionWrapper>;
} => {
  const { expect, expectAsync } = createUse(
    SyncAssertions,
    AsyncAssertions,
  )([...SyncAssertions, ...AsyncAssertions]);

  return { expect, expectAsync };
};

const api = bootstrap();

/**
 * The main synchronous assertion function which can execute only built-in
 * assertions.
 *
 * @function
 * @group Core API
 */
export const expect: Expect<BuiltinSyncAssertionWrapper> = api.expect;

/**
 * The main asynchronous assertion function which can execute only built-in
 * assertions.
 *
 * @function
 * @group Core API
 */
export const expectAsync: ExpectAsync<BuiltinAsyncAssertionWrapper> =
  api.expectAsync;
