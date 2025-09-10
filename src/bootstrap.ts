/**
 * Factory function for creating the main assertion functions.
 *
 * This module provides the {@link bootstrap} function that creates both
 * synchronous and asynchronous assertion engines.
 *
 * @packageDocumentation
 */

import { AsyncAssertions } from './assertion/impl/async.js';
import { SyncAssertions } from './assertion/impl/sync.js';
import { type Expect, type ExpectAsync } from './types.js';
import { createUse } from './use.js';

/**
 * Factory function that creates both synchronous and asynchronous assertion
 * engines.
 *
 * @returns Object containing {@link expect} and {@link expectAsync} functions
 * @internal
 */
const bootstrap = (): {
  expect: Expect<typeof SyncAssertions>;
  expectAsync: ExpectAsync<typeof AsyncAssertions>;
} => {
  const { expect, expectAsync } = createUse(
    SyncAssertions,
    AsyncAssertions,
  )([...SyncAssertions, ...AsyncAssertions]);

  return { expect, expectAsync };
};

const api = bootstrap();

const {
  /**
   * The main synchronous assertion function which can execute only built-in
   * assertions.
   *
   * @function
   */
  expect,
  /**
   * The main asynchronous assertion function which can execute only built-in
   * assertions.
   *
   * @function
   */
  expectAsync,
} = api;

export { expect, expectAsync };
