/**
 * Type guards for RxJS Observable detection.
 *
 * @packageDocumentation
 */

import type { Observable } from 'rxjs';

/**
 * Checks if a value is an RxJS Observable.
 *
 * RxJS Observables are identified by the presence of a `subscribe` method. This
 * is a duck-type check that works with both RxJS 7.x and 8.x.
 *
 * @example
 *
 * ```typescript
 * import { of, Subject } from 'rxjs';
 *
 * isObservable(of(1, 2, 3)); // true
 * isObservable(new Subject()); // true
 * isObservable(Promise.resolve()); // false
 * isObservable(null); // false
 * ```
 *
 * @function
 * @param value - The value to check
 * @returns `true` if the value is an Observable
 */
export const isObservable = (value: unknown): value is Observable<unknown> => {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return typeof obj.subscribe === 'function';
};
