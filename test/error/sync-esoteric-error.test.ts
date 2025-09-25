/**
 * Snapshot tests for sync-esoteric assertion errors.
 *
 * These tests capture the error output format for failing assertions to ensure
 * consistent error messages across versions.
 */

import { describe, it } from 'node:test';

import * as assertions from '../../src/assertion/impl/sync-esoteric.js';
import { SyncEsotericAssertions } from '../../src/assertion/index.js';
import { type AnyAssertion } from '../../src/types.js';
import { expect } from '../custom-assertions.js';
import { takeErrorSnapshot } from './error-snapshot-util.js';

const failingAssertions = new Map<AnyAssertion, () => void>([
  [
    assertions.enumerablePropertyAssertion,
    () => {
      const obj = { visible: 'value' };
      Object.defineProperty(obj, 'hidden', {
        enumerable: false,
        value: 'secret',
      });
      expect('hidden', 'to be an enumerable property of', obj);
    },
  ],
  [
    assertions.enumerablePropertyAssertion2,
    () => {
      const obj = { visible: 'value' };
      Object.defineProperty(obj, 'hidden', {
        enumerable: false,
        value: 'secret',
      });
      expect(obj, 'to have enumerable property', 'hidden');
    },
  ],
  [
    assertions.extensibleAssertion,
    () => {
      const obj = {};
      Object.preventExtensions(obj);
      expect(obj, 'to be extensible');
    },
  ],
  [
    assertions.frozenAssertion,
    () => {
      const obj = { prop: 'value' };
      expect(obj, 'to be frozen');
    },
  ],
  [
    assertions.nullPrototypeAssertion,
    () => {
      const obj = {};
      expect(obj, 'to have a null prototype');
    },
  ],
  [
    assertions.sealedAssertion,
    () => {
      const obj = { prop: 'value' };
      expect(obj, 'to be sealed');
    },
  ],
]);

describe('Sync Esoteric Assertion Error Snapshots', () => {
  it(`should test all available assertions in SyncEsotericAssertions`, () => {
    expect(
      failingAssertions,
      'to exhaustively test collection',
      'SyncEsotericAssertions',
      'from',
      SyncEsotericAssertions,
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
