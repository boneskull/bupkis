/**
 * Type guards for EventEmitter and EventTarget detection.
 *
 * Uses duck-typing rather than `instanceof` to support custom EventEmitter
 * implementations and cross-realm objects.
 *
 * @packageDocumentation
 */

import type { EventEmitterLike } from './types.js';

/**
 * Checks if a value is an EventEmitter-like object.
 *
 * Uses duck-typing to detect EventEmitter by checking for required methods:
 * `on`, `once`, `emit`, `removeListener`, and `listenerCount`.
 *
 * @example
 *
 * ```ts
 * import { EventEmitter } from 'node:events';
 * import { isEventEmitter } from '@bupkis/events';
 *
 * isEventEmitter(new EventEmitter()); // true
 * isEventEmitter({}); // false
 * ```
 *
 * @function
 * @param value - The value to check
 * @returns `true` if the value has the required EventEmitter methods
 */
export const isEventEmitter = (value: unknown): value is EventEmitterLike => {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.on === 'function' &&
    typeof obj.once === 'function' &&
    typeof obj.emit === 'function' &&
    typeof obj.removeListener === 'function' &&
    typeof obj.listenerCount === 'function'
  );
};

/**
 * Checks if a value is an EventTarget.
 *
 * Uses duck-typing to detect EventTarget by checking for required methods:
 * `addEventListener`, `removeEventListener`, and `dispatchEvent`.
 *
 * @example
 *
 * ```ts
 * import { isEventTarget } from '@bupkis/events';
 *
 * isEventTarget(new EventTarget()); // true
 * isEventTarget({}); // false
 * ```
 *
 * @function
 * @param value - The value to check
 * @returns `true` if the value has the required EventTarget methods
 */
export const isEventTarget = (value: unknown): value is EventTarget => {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.addEventListener === 'function' &&
    typeof obj.removeEventListener === 'function' &&
    typeof obj.dispatchEvent === 'function'
  );
};
