/**
 * Factory function for creating the main assertion functions.
 *
 * This module provides the `bootstrap()` function that creates both synchronous
 * and asynchronous assertion engines. It contains the core implementation
 * previously split between `expect.ts` and `expect-async.ts`.
 *
 * @packageDocumentation
 */

import { type Expect, type ExpectAsync } from './api.js';
import { SyncAssertions } from './assertion/impl/sync.js';
import { AsyncAssertions } from './assertion/index.js';
import {
  createBaseExpect,
  createExpectAsyncFunction,
  createExpectSyncFunction,
} from './expect.js';

/**
 * Factory function that creates both synchronous and asynchronous assertion
 * engines.
 *
 * @returns Object containing `expect` and `expectAsync` functions
 * @internal
 */
const bootstrap = (): {
  expect: Expect<typeof SyncAssertions>;
  expectAsync: ExpectAsync<typeof AsyncAssertions>;
} => {
  const expect: Expect<typeof SyncAssertions, typeof AsyncAssertions> =
    Object.assign(
      createExpectSyncFunction(SyncAssertions),
      createBaseExpect(SyncAssertions, AsyncAssertions, 'sync'),
    );

  const expectAsync: ExpectAsync<
    typeof AsyncAssertions,
    typeof SyncAssertions
  > = Object.assign(
    createExpectAsyncFunction(AsyncAssertions),
    createBaseExpect(SyncAssertions, AsyncAssertions, 'async'),
  );

  return { expect, expectAsync };
};

const api = bootstrap();

/** {@inheritDoc Expect} */
const { expect } = api;
/** {@inheritDoc ExpectAsync} */
const { expectAsync } = api;

export { expect, expectAsync };
