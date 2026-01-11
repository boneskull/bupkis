/**
 * Sinon assertions for Bupkis.
 *
 * @example
 *
 * ```ts
 * import { use } from 'bupkis';
 * import { sinonAssertions } from '@bupkis/sinon';
 * import sinon from 'sinon';
 *
 * const { expect } = use(sinonAssertions);
 *
 * const spy = sinon.spy();
 * spy(42);
 * expect(spy, 'was called');
 * ```
 *
 * @packageDocumentation
 */

export {
  alwaysThrewAssertion,
  callHasArgsAssertion,
  callHasThisAssertion,
  callReturnedAssertion,
  callThrewAssertion,
  givenCallOrderAssertion,
  sinonAssertions,
  threwAssertion,
  threwWithAssertion,
  toHaveCallsSatisfyingAssertion,
  wasAlwaysCalledOnAssertion,
  wasAlwaysCalledWithAssertion,
  wasCalledAfterAssertion,
  wasCalledAssertion,
  wasCalledBeforeAssertion,
  wasCalledOnAssertion,
  wasCalledOnceAssertion,
  wasCalledThriceAssertion,
  wasCalledTimesAssertion,
  wasCalledTwiceAssertion,
  wasCalledWithAssertion,
  wasCalledWithExactlyAssertion,
  wasNeverCalledWithAssertion,
  wasNotCalledAssertion,
} from './assertions.js';
export { isSpy, isSpyCall } from './guards.js';
export { SpyCallSchema, SpySchema } from './schema.js';
