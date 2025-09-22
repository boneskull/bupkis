/**
 * Snapshot tests for sync-esoteric assertion errors.
 *
 * These tests capture the error output format for failing assertions to ensure
 * consistent error messages across versions.
 */

import { describe } from 'node:test';

import * as assertions from '../../src/assertion/impl/sync-esoteric.js';
import { SyncEsotericAssertions } from '../../src/assertion/index.js';
import { expect } from '../../src/index.js';
import { type AnyAssertion } from '../../src/types.js';
import { expectExhaustiveAssertionTests } from '../exhaustive.macro.js';
import { runErrorSnapshotTests } from './error-snapshot.macro.js';

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

describe('sync-esoteric error snapshots', () => {
  expectExhaustiveAssertionTests(
    'sync-esoteric',
    SyncEsotericAssertions,
    failingAssertions,
  );

  runErrorSnapshotTests(assertions, failingAssertions);
});
