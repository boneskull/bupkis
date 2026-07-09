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
    assertions.arrayItemSatisfiesAssertion,
    () => {
      expect([{ a: 1 }, { b: 2 }], 'to have item satisfying', { c: 3 });
    },
  ],
  [
    assertions.arraySizeAssertion,
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
    assertions.collectionHasValueExhaustivelySatisfyingAssertion,
    () => {
      expect([1, 2, 3], 'to have a value exhaustively satisfying', 5);
    },
  ],
  [
    assertions.collectionHasValueSatisfyingAssertion,
    () => {
      expect([{ a: 1 }], 'to have a value satisfying', { b: 2 });
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
    assertions.collectionValuesExhaustivelySatisfyAssertion,
    () => {
      expect([1, 2], 'to have values exhaustively satisfying', 1);
    },
  ],
  // New collection-value assertions
  [
    assertions.collectionValuesSatisfyAssertion,
    () => {
      expect([{ a: 1 }, { b: 2 }], 'to have values satisfying', { a: 1 });
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
    assertions.mapHasKeyExhaustivelySatisfyingAssertion,
    () => {
      expect(new Map([['a', 1]]), 'to have a key exhaustively satisfying', 'b');
    },
  ],
  [
    assertions.mapHasKeySatisfyingAssertion,
    () => {
      expect(new Map([['a', 1]]), 'to have a key satisfying', 99);
    },
  ],
  [
    assertions.mapKeyAssertion,
    () => {
      expect(new Map([['key', 'value']]), 'to have key', 'missing');
    },
  ],
  [
    assertions.mapKeysExhaustivelySatisfyAssertion,
    () => {
      expect(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
        'to have keys exhaustively satisfying',
        'a',
      );
    },
  ],
  // New Map-key assertions
  [
    assertions.mapKeysSatisfyAssertion,
    () => {
      expect(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
        'to have keys satisfying',
        99,
      );
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
    assertions.objectHasKeyMatchingAssertion,
    () => {
      expect({ foo: 1 }, 'to have a key matching', /^key\d+$/);
    },
  ],
  [
    assertions.objectHasKeySatisfyingAssertion,
    () => {
      expect({ a: 1, b: 2 }, 'to have a key satisfying', 99);
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
    assertions.objectKeysMatchAssertion,
    () => {
      expect({ bar: 2, foo: 1 }, 'to have keys matching', /^key\d+$/);
    },
  ],
  // New object-key assertions
  [
    assertions.objectKeysSatisfyAssertion,
    () => {
      expect({ a: 1, b: 2 }, 'to have keys satisfying', 99);
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
