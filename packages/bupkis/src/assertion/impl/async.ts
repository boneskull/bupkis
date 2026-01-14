/**
 * Re-exports all asynchronous assertions as assertion collections.
 *
 * @packageDocumentation
 * @groupDescription Assertion Collections
 * Collections of individual assertions. For those building on top of <span class="bupkis">BUPKIS</span>.
 * @showGroups
 */

import { AsyncIterableAssertions } from './async-iterable.js';
import {
  functionFulfillWithValueSatisfyingAssertion,
  functionRejectAssertion,
  functionRejectWithErrorSatisfyingAssertion,
  functionRejectWithTypeAssertion,
  functionResolveAssertion,
  promiseRejectAssertion,
  promiseRejectWithErrorSatisfyingAssertion,
  promiseRejectWithTypeAssertion,
  promiseResolveAssertion,
  promiseResolveWithValueSatisfyingAssertion,
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
  promiseResolveWithValueSatisfyingAssertion,
  functionFulfillWithValueSatisfyingAssertion,
] as const;

/**
 * Tuple of all built-in async assertions (Promise and async iterables).
 *
 * @group Assertion Collections
 */
export const AsyncAssertions = [
  ...AsyncParametricAssertions,
  ...AsyncIterableAssertions,
] as const;

export * from './async-iterable.js';
export * from './async-parametric.js';
