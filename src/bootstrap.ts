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
import { createUse } from './use.js';

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
  const { expect, expectAsync } = createUse(
    SyncAssertions,
    AsyncAssertions,
  )([...SyncAssertions, ...AsyncAssertions]);

  return { expect, expectAsync };
};

const api = bootstrap();

/** {@inheritDoc Expect} */
const { expect } = api;
/** {@inheritDoc ExpectAsync} */
const { expectAsync } = api;

export { expect, expectAsync };
