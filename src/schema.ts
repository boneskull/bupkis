import type { Constructor } from 'type-fest';

import { z } from 'zod/v4';

import { isConstructable, isPromiseLike } from './guards.js';

export const ClassSchema = z
  .custom<Constructor<unknown>>(isConstructable)
  .describe('Class / Constructor');

export const FunctionSchema = z
  .custom<(...args: any[]) => any>((fn) => typeof fn === 'function')
  .describe('Any function; similar to z.function() in Zod v3.x');

export const PropertyKeySchema = z
  .union([z.string(), z.number(), z.symbol()])
  .describe('PropertyKey');

export const WrappedPromiseLikeSchema = z
  .custom<PromiseLike<unknown>>((value) => isPromiseLike(value))
  .describe(
    'PromiseLike; unlike z.promise(), does not unwrap the resolved value',
  );

export const StringableMessagePropSchema = z.object({
  message: z.coerce.string(),
});

export const StringableSchema = z.coerce.string();
