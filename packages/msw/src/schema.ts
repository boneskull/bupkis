/**
 * Zod schemas for MSW types.
 *
 * @packageDocumentation
 */

import { z } from 'bupkis';

import type { PathMatcher, TrackedServer } from './types.js';

import { isTrackedServer } from './guards.js';

/**
 * Schema that validates TrackedServer instances.
 *
 * Use with bupkis assertions to validate that a value is a tracked MSW server.
 *
 * @example
 *
 * ```ts
 * import { TrackedServerSchema } from '@bupkis/msw';
 *
 * TrackedServerSchema.parse(server); // Throws if not a TrackedServer
 * ```
 *
 * @group Zod Schemas
 */
export const TrackedServerSchema = z.custom<TrackedServer>(
  isTrackedServer,
  'Expected a TrackedServer (created via createTrackedServer)',
);

/**
 * Schema that validates path matchers (string or RegExp).
 *
 * @example
 *
 * ```ts
 * import { PathMatcherSchema } from '@bupkis/msw';
 *
 * PathMatcherSchema.parse('/api/users'); // Valid
 * PathMatcherSchema.parse(/\/api\/users\/\d+/); // Valid
 * PathMatcherSchema.parse(123); // Throws
 * ```
 *
 * @group Zod Schemas
 */
export const PathMatcherSchema = z.custom<PathMatcher>(
  (value): value is PathMatcher =>
    typeof value === 'string' || value instanceof RegExp,
  'Expected a string or RegExp path matcher',
);

/**
 * Schema for RequestMatchOptions.
 *
 * Validates the options object passed to request matching assertions.
 */
export const RequestMatchOptionsSchema = z
  .object({
    body: z.unknown().optional(),
    headers: z
      .record(z.string(), z.union([z.string(), z.instanceof(RegExp)]))
      .optional(),
    method: z.string().optional(),
    once: z.boolean().optional(),
    times: z.number().int().nonnegative().optional(),
  })
  .strict();
