/**
 * Utility functions for assertion implementations
 *
 * @internal
 * @packageDocumentation
 */

type TrapResult =
  | { error: unknown; result?: never }
  | { error?: never; result: unknown };

/**
 * Executes & traps a `Promise` rejected from an async function, capturing the
 * error.
 *
 * @function
 * @param fn The function to execute that may throw an error or return a
 *   `Promise`
 * @returns Rejection or whatever was fulfilled
 */
export const trapAsyncFnError = async (
  fn: () => unknown,
): Promise<TrapResult> => {
  try {
    const result = await fn();
    return { result };
  } catch (error) {
    return {
      error: error ?? new TypeError(`Function rejected with undefined: ${fn}`),
    };
  }
};

/**
 * Awaits & traps a Promise, capturing any rejection error.
 *
 * @function
 * @param promise The `Promise` to trap
 * @returns Result object
 */
export const trapPromiseError = async (
  promise: PromiseLike<unknown>,
): Promise<TrapResult> => {
  try {
    const result = await promise;
    return { result };
  } catch (error) {
    return { error: error ?? new TypeError('Promise rejected with undefined') };
  }
};

/**
 * Executes & traps a synchronous function that may throw, capturing any thrown
 * error and discarding the result.
 *
 * @remarks
 * Avoids throwing `undefined` for some reason.
 * @function
 * @param fn Function to execute
 * @returns Result object
 */
export const trapError = (fn: () => unknown): TrapResult => {
  try {
    const result = fn();
    return { result };
  } catch (error) {
    return { error: error ?? new TypeError(`Function threw undefined: ${fn}`) };
  }
};
