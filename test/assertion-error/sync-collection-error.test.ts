/**
 * Snapshot tests for sync-collection assertion errors.
 *
 * These tests capture the error output format for failing assertions to ensure
 * consistent error messages across versions.
 */

import { describe, it } from 'node:test';

import * as assertions from '../../src/assertion/impl/sync-collection.js';
import { SyncCollectionAssertions } from '../../src/assertion/index.js';
import { type AnyAssertion } from '../../src/types.js';
import { expect } from '../custom-assertions.js';
import { takeErrorSnapshot } from './error-snapshot-util.js';

const failingAssertions = new Map<AnyAssertion, () => void>([
  [
    assertions.arrayContainsAssertion,
    () => {
      expect([1, 2, 3], 'to contain', 4);
    },
  ],
  [
    assertions.arrayLengthAssertion,
    () => {
      expect([1, 2, 3], 'to have length', 5);
    },
  ],
  [
    assertions.arraySizeAssertion,
    () => {
      expect([1, 2, 3], 'to have size', 5);
    },
  ],
  [
    assertions.collectionSizeBetweenAssertion,
    () => {
      expect(new Set([1, 2, 3, 4]), 'to have size between', [1, 3]);
    },
  ],
  [
    assertions.collectionSizeGreaterThanAssertion,
    () => {
      expect(new Set([1]), 'to have size greater than', 2);
    },
  ],
  [
    assertions.collectionSizeLessThanAssertion,
    () => {
      expect(new Set([1, 2, 3]), 'to have size less than', 2);
    },
  ],
  [
    assertions.emptyMapAssertion,
    () => {
      expect(new Map([['key', 'value']]), 'to be empty');
    },
  ],
  [
    assertions.emptySetAssertion,
    () => {
      expect(new Set(['value']), 'to be empty');
    },
  ],
  [
    assertions.mapContainsAssertion,
    () => {
      expect(new Map([['key', 'value']]), 'to contain', 'missing');
    },
  ],
  [
    assertions.mapEntryAssertion,
    () => {
      expect(new Map([['key', 'value']]), 'to have entry', ['key', 'wrong']);
    },
  ],
  [
    assertions.mapEqualityAssertion,
    () => {
      expect(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
        'to equal',
        new Map([
          ['a', 1],
          ['b', 3],
        ]),
      );
    },
  ],
  [
    assertions.mapKeyAssertion,
    () => {
      expect(new Map([['key', 'value']]), 'to have key', 'missing');
    },
  ],
  [
    assertions.mapSizeAssertion,
    () => {
      expect(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
        'to have size',
        3,
      );
    },
  ],
  [
    assertions.mapValueAssertion,
    () => {
      expect(new Map([['key', 'value']]), 'to have value', 'missing');
    },
  ],
  [
    assertions.nonEmptyArrayAssertion,
    () => {
      expect([], 'to be non-empty');
    },
  ],
  [
    assertions.objectExactKeyAssertion,
    () => {
      expect({ foo: 'bar' }, 'to have exact key', 'missing');
    },
  ],
  [
    assertions.objectKeyAssertion,
    () => {
      expect({ foo: 'bar' }, 'to have key', 'missing.path');
    },
  ],
  [
    assertions.objectKeysAssertion,
    () => {
      expect({ a: 1 }, 'to have keys', ['a', 'b']);
    },
  ],
  [
    assertions.objectSizeAssertion,
    () => {
      expect({ a: 1 }, 'to have size', 3);
    },
  ],
  [
    assertions.setContainsAssertion,
    () => {
      expect(new Set(['a', 'b']), 'to contain', 'c');
    },
  ],
  [
    assertions.setDifferenceEqualityAssertion,
    () => {
      expect(
        new Set([1, 2, 3]),
        'to have difference',
        new Set([2, 4]),
        'equal to',
        new Set([1, 2]), // Wrong expected result
      );
    },
  ],
  [
    assertions.setDisjointAssertion,
    () => {
      expect(new Set([1, 2]), 'to be disjoint from', new Set([2, 3]));
    },
  ],
  [
    assertions.setEqualityAssertion,
    () => {
      expect(new Set([1, 2]), 'to equal', new Set([1, 3]));
    },
  ],
  [
    assertions.setIntersectionAssertion,
    () => {
      expect(new Set([1, 2]), 'to intersect with', new Set([3, 4]));
    },
  ],
  [
    assertions.setIntersectionEqualityAssertion,
    () => {
      expect(
        new Set([1, 2, 3]),
        'to have intersection',
        new Set([2, 3, 4]),
        'equal to',
        new Set([2, 3, 4]), // Wrong expected result
      );
    },
  ],
  [
    assertions.setSizeAssertion,
    () => {
      expect(new Set(['a', 'b']), 'to have size', 3);
    },
  ],
  [
    assertions.setSubsetAssertion,
    () => {
      expect(new Set([1, 4]), 'to be a subset of', new Set([1, 2, 3]));
    },
  ],
  [
    assertions.setSupersetAssertion,
    () => {
      expect(new Set([1, 2]), 'to be a superset of', new Set([1, 2, 3]));
    },
  ],
  [
    assertions.setSymmetricDifferenceEqualityAssertion,
    () => {
      expect(
        new Set([1, 2]),
        'to have symmetric difference',
        new Set([2, 3]),
        'equal to',
        new Set([1, 2]), // Wrong expected result
      );
    },
  ],
  [
    assertions.setUnionEqualityAssertion,
    () => {
      expect(
        new Set([1, 2]),
        'to have union',
        new Set([3]),
        'equal to',
        new Set([1, 2, 4]), // Wrong expected result
      );
    },
  ],
]);

describe('Sync Collection Assertion Error Snapshots', () => {
  it(`should test all available assertions in SyncCollectionAssertions`, () => {
    expect(
      failingAssertions,
      'to exhaustively test collection',
      'SyncCollectionAssertions',
      'from',
      SyncCollectionAssertions,
    );
  });

  for (const assertion of Object.values(assertions)) {
    const { id } = assertion;
    describe(`${assertion} [${id}]`, () => {
      const failingAssertion = failingAssertions.get(assertion)!;

      it(
        `should throw a consistent AssertionError [${assertion.id}] <snapshot>`,
        takeErrorSnapshot(failingAssertion),
      );
    });
  }
});
