import type { Constructor } from 'type-fest';
import { z } from 'zod/v4';
import { isConstructable } from './guards.js';

export const classSchema = z.custom<Constructor<unknown>>(isConstructable);
export const functionSchema = z.custom<(...args: any[]) => any>(
  (fn) => typeof fn === 'function',
);
