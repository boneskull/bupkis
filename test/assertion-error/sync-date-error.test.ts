/**
 * Snapshot tests for sync-date assertion errors.
 *
 * These tests capture the error output format for failing assertions to ensure
 * consistent error messages across versions.
 */

import { describe, it } from 'node:test';

import * as assertions from '../../src/assertion/impl/sync-date.js';
import { SyncDateAssertions } from '../../src/assertion/index.js';
import { type AnyAssertion } from '../../src/types.js';
import { expect } from '../custom-assertions.js';
import { takeErrorSnapshot } from './error-snapshot-util.js';

const failingAssertions = new Map<AnyAssertion, () => void>([
  [
    assertions.afterAssertion,
    () => {
      expect(new Date('2024-01-01'), 'to be after', new Date('2025-01-01'));
    },
  ],
  [
    assertions.beforeAssertion,
    () => {
      expect(new Date('2025-01-01'), 'to be before', new Date('2024-01-01'));
    },
  ],
  [
    assertions.betweenAssertion,
    () => {
      expect(
        new Date('2025-06-01'),
        'to be between',
        new Date('2024-01-01'),
        'and',
        new Date('2024-12-31'),
      );
    },
  ],
  [
    assertions.equalWithinAssertion,
    () => {
      const date1 = new Date('2025-01-01T10:00:00.000Z');
      const date2 = new Date('2025-01-01T10:01:00.000Z'); // 1 minute difference
      expect(date1, 'to equal', date2, 'within', '30 seconds');
    },
  ],
  [
    assertions.sameDateAssertion,
    () => {
      expect(
        new Date('2025-01-01T10:00:00'),
        'to be the same date as',
        new Date('2025-01-02T10:00:00'),
      );
    },
  ],
  [
    assertions.validDateAssertion,
    () => {
      expect('not-a-date', 'to be a valid date');
    },
  ],
  [
    assertions.weekdayAssertion,
    () => {
      // Sunday (January 5, 2025 is a Sunday)
      expect(new Date('2025-01-05T00:00:00.000Z'), 'to be a weekday');
    },
  ],
  [
    assertions.weekendAssertion,
    () => {
      // Monday (January 7, 2025 is a Monday - weekday, so should fail)
      expect(new Date('2025-01-07T00:00:00.000Z'), 'to be a weekend');
    },
  ],
]);

describe('Sync Date Assertion Error Snapshots', () => {
  it(`should test all available assertions in SyncDateAssertions excepting time-relative ones`, () => {
    expect(
      failingAssertions,
      'to exhaustively test collection',
      'SyncDateAssertions',
      'from',
      SyncDateAssertions,
    );
  });

  for (const assertion of Object.values(assertions)) {
    const { id } = assertion;
    const failingAssertion = failingAssertions.get(assertion);

    // Skip time-relative assertions that can't be snapshot tested
    if (!failingAssertion) {
      continue;
    }

    describe(`${assertion} [${id}]`, () => {
      it(
        `should throw a consistent AssertionError [${assertion.id}] <snapshot>`,
        takeErrorSnapshot(failingAssertion),
      );
    });
  }
});
