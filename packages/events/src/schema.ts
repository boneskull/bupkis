/**
 * Zod schemas for EventEmitter and EventTarget types.
 *
 * @packageDocumentation
 */

import { z } from 'bupkis';

import type { EventEmitterLike, TimeoutOptions } from './types.js';

import { isEventEmitter, isEventTarget } from './guards.js';

/**
 * Schema that validates EventEmitter-like objects.
 *
 * Uses duck-typing via {@link isEventEmitter} to support custom implementations
 * and cross-realm objects.
 */
export const EventEmitterSchema = z.custom<EventEmitterLike>(
  isEventEmitter,
  'Expected an EventEmitter-like object',
);

/**
 * Schema that validates EventTarget objects.
 *
 * Uses duck-typing via {@link isEventTarget} to support custom implementations
 * and cross-realm objects.
 */
export const EventTargetSchema = z.custom<EventTarget>(
  isEventTarget,
  'Expected an EventTarget',
);

/**
 * Schema for event names (string or symbol).
 */
export const EventNameSchema = z.union([z.string(), z.symbol()]);

/**
 * Schema for timeout options when required (non-optional variant).
 */
export const RequiredTimeoutOptionsSchema = z.object({
  within: z.number().positive().optional(),
}) as z.ZodType<TimeoutOptions>;

/**
 * Schema for a trigger (function or Promise) that causes an event.
 */
export const TriggerSchema = z.union([
  z.function(),
  z.custom<Promise<unknown>>(
    (val): val is Promise<unknown> =>
      val !== null &&
      typeof val === 'object' &&
      typeof (val as Promise<unknown>).then === 'function',
    'Expected a Promise',
  ),
]);

/**
 * Schema for an array of event names (for sequence assertions).
 */
export const EventSequenceSchema = z.array(EventNameSchema);
