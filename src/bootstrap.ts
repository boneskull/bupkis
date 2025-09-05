/**
 * Factory function for creating the main assertion functions.
 *
 * This module provides the `bootstrap()` function that creates both synchronous
 * and asynchronous assertion engines. It contains the core implementation
 * previously split between `expect.ts` and `expect-async.ts`.
 *
 * @packageDocumentation
 */

import { SyncAssertions } from './assertion/impl/sync.js';
import { AsyncAssertions } from './assertion/index.js';
import {
  createBaseExpect,
  createExpectAsyncFunction,
  createExpectSyncFunction,
} from './expect.js';
import { type Expect, type ExpectAsync } from './types.js';

/**
 * Factory function that creates both synchronous and asynchronous assertion
 * engines.
 *
 * @returns Object containing `expect` and `expectAsync` functions
 */
export const bootstrap = (): {
  expect: Expect<typeof SyncAssertions>;
  expectAsync: ExpectAsync<typeof AsyncAssertions>;
} => {
  /** {@inheritDoc Expect} */

  const expect: Expect<typeof SyncAssertions, typeof AsyncAssertions> =
    Object.assign(
      createExpectSyncFunction(SyncAssertions),
      createBaseExpect(SyncAssertions, AsyncAssertions, 'sync'),
    );

  /** {@inheritDoc ExpectAsync} */

  const expectAsync: ExpectAsync<
    typeof AsyncAssertions,
    typeof SyncAssertions
  > = Object.assign(
    createExpectAsyncFunction(AsyncAssertions),
    createBaseExpect(SyncAssertions, AsyncAssertions, 'async'),
  );

  return { expect, expectAsync };
};

// Create and export the default instances
const { expect, expectAsync } = bootstrap();

export { expect, expectAsync };
