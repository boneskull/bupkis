/**
 * Utility functions for assertion implementations
 *
 * @internal
 * @packageDocumentation
 */

/**
 * Executes & traps a `Promise` rejected from an async function, capturing the
 * error.
 *
 * @param fn The function to execute that may throw an error or return a
 *   `Promise`
 * @returns Rejection
 */
export const trapAsyncFnError = async (fn: () => unknown) => {
  try {
    await fn();
  } catch (err) {
    return err;
  }
};

/**
 * Awaits & traps a Promise, capturing any rejection error.
 *
 * @param promise The `Promise` to trap
 * @returns Rejection
 */
export const trapPromiseError = async (promise: PromiseLike<unknown>) => {
  try {
    await promise;
  } catch (err) {
    return err;
  }
};

/**
 * Executes & traps a synchronous function that may throw, capturing any thrown
 * error and discarding the result.
 *
 * @remarks
 * Avoids throwing `undefined` for some reason.
 * @param fn Function to execute
 * @returns Error
 */
export const trapError = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (err) {
    if (err === undefined) {
      return new Error('Function threw undefined');
    }
    return err;
  }
};
