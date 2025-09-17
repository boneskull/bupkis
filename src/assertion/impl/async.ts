/**
 * Re-exports all asynchronous assertions as assertion collections.
 *
 * @packageDocumentation
 * @groupDescription Assertion Collections
 * Collections of individual assertions. For those building on top of <span class="bupkis">BUPKIS</span>.
 * @showGroups
 */

import {
  functionEventuallyCallCallbackAssertion,
  functionEventuallyCallCallbackWithExactValueAssertion,
  functionEventuallyCallCallbackWithValueAssertion,
  functionEventuallyCallCallbackWithValueSatisfyingAssertion,
  functionEventuallyCallNodebackAssertion,
  functionEventuallyCallNodebackWithErrorAssertion,
  functionEventuallyCallNodebackWithErrorClassAssertion,
  functionEventuallyCallNodebackWithErrorPatternAssertion,
  functionEventuallyCallNodebackWithExactValueAssertion,
  functionEventuallyCallNodebackWithValueAssertion,
  functionEventuallyCallNodebackWithValueSatisfyingAssertion,
} from './async-callback.js';
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
 * Tuple of all built-in async callback assertions.
 *
 * @group Assertion Collections
 */
export const AsyncCallbackAssertions = [
  functionEventuallyCallCallbackAssertion,
  functionEventuallyCallNodebackAssertion,
  functionEventuallyCallCallbackWithValueAssertion,
  functionEventuallyCallCallbackWithExactValueAssertion,
  functionEventuallyCallNodebackWithValueAssertion,
  functionEventuallyCallNodebackWithExactValueAssertion,
  functionEventuallyCallNodebackWithErrorAssertion,
  functionEventuallyCallNodebackWithErrorClassAssertion,
  functionEventuallyCallNodebackWithErrorPatternAssertion,
  functionEventuallyCallCallbackWithValueSatisfyingAssertion,
  functionEventuallyCallNodebackWithValueSatisfyingAssertion,
] as const;

/**
 * Tuple of all built-in async assertions (Promise + Callback).
 *
 * @group Assertion Collections
 */
export const AsyncAssertions = [
  ...AsyncParametricAssertions,
  ...AsyncCallbackAssertions,
] as const;
