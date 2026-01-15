/**
 * HTTP response assertions for Bupkis.
 *
 * @module @bupkis/supertest
 * @example
 *
 * ```ts
 * import { use } from 'bupkis';
 * import supertestAssertions from '@bupkis/supertest';
 * import request from 'supertest';
 *
 * const { expect } = use(supertestAssertions);
 *
 * const response = await request(app).get('/api/users');
 * expect(response, 'to have status', 200);
 * ```
 */

export {
  supertestAssertions as default,
  supertestAssertions,
} from './assertions.js';
