/**
 * Zod schemas for HTTP response types.
 *
 * @packageDocumentation
 */

import { z } from 'bupkis';

import { type HttpResponse, isHttpResponse } from './guards.js';

/**
 * Schema that validates HTTP response objects.
 *
 * @example
 *
 * ```ts
 * import { HttpResponseSchema } from '@bupkis/supertest';
 *
 * const result = HttpResponseSchema.safeParse(response);
 * if (result.success) {
 *   // result.data is typed as HttpResponse
 * }
 * ```
 */
export const HttpResponseSchema = z.custom<HttpResponse>(
  isHttpResponse,
  'Expected an HTTP response object with a status property',
);
