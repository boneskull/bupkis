/**
 * Type guards for MSW tracked server detection.
 *
 * @packageDocumentation
 */

import type { TrackedServer } from './types.js';

/**
 * Symbol used to mark tracked servers.
 *
 * @internal
 */
const { for: symbolFor } = Symbol;

export const kTrackedServer = symbolFor('@bupkis/msw:trackedServer');

/**
 * Checks if a value is a TrackedServer instance.
 *
 * Tracked servers are created via {@link createTrackedServer} and have request
 * tracking capabilities attached.
 *
 * @example
 *
 * ```ts
 * import { isTrackedServer, createTrackedServer } from '@bupkis/msw';
 * import { setupServer } from 'msw/node';
 *
 * const plainServer = setupServer();
 * const trackedServer = createTrackedServer();
 *
 * isTrackedServer(plainServer); // false
 * isTrackedServer(trackedServer); // true
 * ```
 *
 * @function
 * @param value - Value to check
 * @returns `true` if the value is a TrackedServer
 */
export const isTrackedServer = (value: unknown): value is TrackedServer => {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  return (
    kTrackedServer in value &&
    (value as Record<symbol, boolean>)[kTrackedServer] === true
  );
};
