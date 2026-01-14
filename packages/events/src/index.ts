/**
 * `EventEmitter` and `EventTarget` assertions for **bupkis**.
 *
 * @module @bupkis/events
 * @example
 *
 * ```ts
 * import { use, expectAsync } from 'bupkis';
 * import { eventAssertions } from '@bupkis/events';
 * import { EventEmitter } from 'node:events';
 *
 * const { expect } = use(eventAssertions);
 *
 * // Sync assertions
 * const emitter = new EventEmitter();
 * emitter.on('data', () => {});
 * expect(emitter, 'to have listener for', 'data');
 *
 * // Async assertions
 * await expectAsync(
 *   () => emitter.emit('ready'),
 *   'to emit from',
 *   emitter,
 *   'ready',
 * );
 * ```
 */

export { eventAssertions as default, eventAssertions } from './assertions.js';
