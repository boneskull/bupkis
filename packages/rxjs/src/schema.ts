/**
 * Zod schemas for RxJS types.
 *
 * @packageDocumentation
 */

import type { Observable } from 'rxjs';

import { z } from 'bupkis';

import { isObservable } from './guards.js';

/**
 * Schema that validates RxJS Observables.
 *
 * @example
 *
 * ```typescript
 * import { of } from 'rxjs';
 *
 * ObservableSchema.parse(of(1, 2, 3)); // passes
 * ObservableSchema.parse(Promise.resolve()); // throws ZodError
 * ```
 */
export const ObservableSchema = z.custom<Observable<unknown>>(
  isObservable,
  'Expected an RxJS Observable',
);
