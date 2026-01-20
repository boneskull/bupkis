/**
 * HTTP response assertions for Bupkis.
 *
 * @module @bupkis/http
 * @example
 *
 * ```ts
 * import { use } from 'bupkis';
 * import httpAssertions from '@bupkis/http';
 * import request from 'supertest';
 *
 * const { expect } = use(httpAssertions);
 *
 * const response = await request(app).get('/api/users');
 * expect(response, 'to have status', 200);
 * ```
 */

export { httpAssertions as default, httpAssertions } from './assertions.js';
