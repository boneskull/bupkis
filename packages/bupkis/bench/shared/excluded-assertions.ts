/**
 * Assertions intentionally omitted from the benchmark suites.
 *
 * These families have no fast-check generators in `test-data/`, so the
 * benchmark harness cannot synthesize inputs for them:
 *
 * - **Snapshot assertions** are stateful and coupled to a test runner's snapshot
 *   lifecycle, so benchmarking them in isolation is meaningless.
 * - **Iterable assertions** (sync and async) were deliberately left out of
 *   property testing due to the effort involved, and benchmarking the iteration
 *   protocol offers little value.
 *
 * @packageDocumentation
 */

import type { AnyAssertion } from '../../src/assertion/index.js';

import {
  AsyncIterableAssertions,
  SyncIterableAssertions,
  SyncSnapshotAssertions,
} from '../../src/assertion/index.js';

const excludedAssertions: ReadonlySet<AnyAssertion> = new Set<AnyAssertion>([
  ...SyncSnapshotAssertions,
  ...SyncIterableAssertions,
  ...AsyncIterableAssertions,
]);

/**
 * Returns `true` if the given assertion should be omitted from benchmarks.
 *
 * @function
 */
export const isExcludedFromBenchmarks = (assertion: AnyAssertion): boolean =>
  excludedAssertions.has(assertion);
