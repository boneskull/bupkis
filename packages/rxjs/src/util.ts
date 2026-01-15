/**
 * Utility functions for working with RxJS Observables in assertions.
 *
 * @packageDocumentation
 */

import type { Observable } from 'rxjs';

/**
 * Result of collecting all emissions from an Observable until completion or
 * error.
 *
 * @typeParam T - The type of values emitted by the Observable
 */
export interface CollectResult<T> {
  /**
   * Whether the Observable completed successfully (called the `complete`
   * callback).
   */
  completed: boolean;

  /**
   * The error emitted by the Observable, if any. `undefined` if the Observable
   * completed successfully or is still pending.
   */
  error: unknown;

  /**
   * All values emitted by the Observable before completion or error.
   */
  values: T[];
}

/**
 * Subscribes to an Observable and collects all emitted values until it
 * completes or errors.
 *
 * This utility handles the Observable lifecycle correctly:
 *
 * - Collects all `next` emissions into an array
 * - Captures the `error` if the Observable errors
 * - Records whether the Observable `completed`
 *
 * @remarks
 * The returned Promise only resolves when the Observable terminates (either
 * completes or errors). For Observables that never terminate, this will hang
 * indefinitely. Use test framework timeouts to handle such cases.
 * @example
 *
 * ```typescript
 * import { of, throwError } from 'rxjs';
 *
 * // Successful completion
 * const result = await collectObservable(of(1, 2, 3));
 * console.log(result);
 * // { completed: true, error: undefined, values: [1, 2, 3] }
 *
 * // Error case
 * const errorResult = await collectObservable(
 *   throwError(() => new Error('oops')),
 * );
 * console.log(errorResult);
 * // { completed: false, error: Error('oops'), values: [] }
 * ```
 *
 * @typeParam T - The type of values emitted by the Observable
 * @function
 * @param observable - The Observable to collect emissions from
 * @returns A Promise resolving to the collection result
 */
export const collectObservable = <T>(
  observable: Observable<T>,
): Promise<CollectResult<T>> =>
  new Promise((resolve) => {
    const values: T[] = [];
    let completed = false;
    let error: unknown;

    observable.subscribe({
      // eslint-disable-next-line custom/require-function-tag-in-arrow-functions
      complete: () => {
        completed = true;
        resolve({ completed, error, values });
      },
      // eslint-disable-next-line custom/require-function-tag-in-arrow-functions
      error: (err: unknown) => {
        error = err;
        resolve({ completed, error, values });
      },
      // eslint-disable-next-line custom/require-function-tag-in-arrow-functions
      next: (value) => {
        values.push(value);
      },
    });
  });
