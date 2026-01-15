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
 * This schema is used internally by the assertions to validate that the subject
 * is an HTTP response object. It uses duck typing to accept any object with a
 * numeric `status` property.
 *
 * @internal
 */
export const HttpResponseSchema = z.custom<HttpResponse>(
  isHttpResponse,
  'Expected an HTTP response object with a status property',
);
