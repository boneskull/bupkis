/**
 * Re-exports all asynchronous assertions as assertion collections.
 *
 * @packageDocumentation
 * @groupDescription Assertion Collections
 * Collections of individual assertions. For those building on top of <span class="bupkis">BUPKIS</span>.
 * @showGroups
 */

import {
  functionFulfillWithValueSatisfyingAssertion,
  functionRejectAssertion,
  functionRejectWithErrorSatisfyingAssertion,
  functionRejectWithTypeAssertion,
  functionResolveAssertion,
  promiseFulfillWithValueSatisfyingAssertion,
  promiseRejectAssertion,
  promiseRejectWithErrorSatisfyingAssertion,
  promiseRejectWithTypeAssertion,
  promiseResolveAssertion,
} from './async-parametric.js';

/**
 * Tuple of all built-in `Promise`-based parametric assertions.
 *
 * @group Assertion Collections
 */
export const AsyncParametricAssertions = [
  functionResolveAssertion,
  promiseResolveAssertion,
  functionRejectAssertion,
  promiseRejectAssertion,
  functionRejectWithTypeAssertion,
  promiseRejectWithTypeAssertion,
  functionRejectWithErrorSatisfyingAssertion,
  promiseRejectWithErrorSatisfyingAssertion,
  promiseFulfillWithValueSatisfyingAssertion,
  functionFulfillWithValueSatisfyingAssertion,
] as const;

/**
 * Tuple of all built-in async assertions (Promise only).
 *
 * @group Assertion Collections
 */
export const AsyncAssertions = [...AsyncParametricAssertions] as const;

export * from './async-parametric.js';
