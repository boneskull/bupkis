/**
 * Provides {@link runErrorSnapshotTests} to generate snapshot tests for
 * assertion error messages.
 *
 * @packageDocumentation
 */

import { describe, it } from 'node:test';

import { expect } from '../../src/bootstrap.js';
import { type AnyAssertion } from '../../src/types.js';

/**
 * Runs snapshot tests for assertion error messages to ensure consistent error
 * formatting.
 *
 * This function generates test suites that verify assertion errors throw
 * consistently formatted messages. Each assertion gets its own test suite, and
 * failing assertions are executed to capture their error snapshots for
 * regression testing.
 *
 * @remarks
 * Each assertion must have a corresponding failing function in the
 * `failingAssertions` map. The function will create individual test suites for
 * each assertion using the Node.js test framework's snapshot functionality to
 * capture and compare error messages.
 * @example
 *
 * ```typescript
 * import { runErrorSnapshotTests } from './error-snapshot.macro.js';
 * import * as syncAssertions from '../assertion/impl/sync-basic.js';
 *
 * const failingAssertions = new Map([
 *   [syncAssertions.toBeAString, () => expect(42, 'to be a string')],
 * ]);
 *
 * runErrorSnapshotTests(syncAssertions, failingAssertions);
 * ```
 *
 * @example
 *
 * ```typescript
 * // For async assertions
 * import { runErrorSnapshotTests } from './error-snapshot.macro.js';
 * import * as asyncAssertions from '../assertion/impl/async.js';
 *
 * const failingAsyncAssertions = new Map([
 *   [
 *     asyncAssertions.toResolve,
 *     () => expectAsync(Promise.reject('error'), 'to resolve'),
 *   ],
 * ]);
 *
 * runErrorSnapshotTests(asyncAssertions, failingAsyncAssertions, {
 *   async: true,
 * });
 * ```
 *
 * @defaultValue options.async `false`
 *
 * @param assertions - A record mapping assertion names to {@link AnyAssertion}
 *   instances
 * @param failingAssertions - A map of assertions to functions that should throw
 *   when executed
 * @param options - Configuration options for test execution
 * @param options.async - Whether the failing assertions are async and should be
 *   awaited
 * @throws {ReferenceError} When a failing assertion function is not found for
 *   an assertion
 * @see {@link AnyAssertion} for assertion type definitions
 */
export const runErrorSnapshotTests = (
  assertions: Record<string, AnyAssertion>,
  failingAssertions: Map<AnyAssertion, () => Promise<void> | void>,
  { async: isAsync = false }: { async?: boolean } = {},
) => {
  for (const [_name, assertion] of Object.entries(assertions)) {
    describe(`${assertion}`, () => {
      const failingAssertion = failingAssertions.get(assertion);

      if (!failingAssertion) {
        throw new ReferenceError(
          `No failing assertion found for ${assertion} [${assertion.id}]`,
        );
      }

      // <snapshot> is here for use with --test-name-pattern
      it(`should throw a consistent AssertionError [${assertion.id}] <snapshot>`, async (t) => {
        let error: unknown;
        try {
          if (isAsync) {
            await failingAssertion();
          } else {
            failingAssertion();
          }
          expect.fail('Expected assertion to throw, but it did not');
        } catch (err) {
          error = err;
        }
        t.assert.snapshot(error);
      });
    });
  }
};
