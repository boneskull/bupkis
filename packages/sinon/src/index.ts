/**
 * Sinon assertions for Bupkis.
 *
 * @module @bupkis/sinon
 * @example
 *
 * ```ts
 * import { use } from 'bupkis';
 * import sinonAssertions from '@bupkis/sinon';
 * import sinon from 'sinon';
 *
 * const { expect } = use(sinonAssertions);
 *
 * const spy = sinon.spy();
 * spy(42);
 * expect(spy, 'was called');
 * ```
 */

export { sinonAssertions as default, sinonAssertions } from './assertions.js';
