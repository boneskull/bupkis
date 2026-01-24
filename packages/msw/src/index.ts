/**
 * MSW request verification assertions for Bupkis.
 *
 * _See also:_ **[README](/documents/_bupkis_msw/)**
 *
 * @module @bupkis/msw
 * @category Extension APIs
 * @example
 *
 * ```ts
 * import { use } from 'bupkis';
 * import mswAssertions, { createTrackedServer } from '@bupkis/msw';
 * import { http, HttpResponse } from 'msw';
 *
 * const { expect } = use(mswAssertions);
 *
 * {
 *   using server = createTrackedServer(
 *     http.get('/api/users', () => HttpResponse.json([])),
 *   );
 *
 *   server.listen();
 *   await fetch('http://localhost/api/users');
 *   expect(server, 'to have handled request to', '/api/users');
 *   // server.close() called automatically
 * }
 * ```
 *
 * @groupDescription Tracked Server
 * Factory, types, and utilities for MSW servers with request tracking.
 */

export { mswAssertions as default, mswAssertions } from './assertions.js';
export { isTrackedServer } from './guards.js';
export { createTrackedServer, waitForBodies } from './tracker.js';
export type {
  RequestMatchOptions,
  TrackedRequest,
  TrackedServer,
} from './types.js';
