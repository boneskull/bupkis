/**
 * Snapshot tests for sync-basic assertion errors.
 *
 * These tests capture the error output format for failing assertions to ensure
 * consistent error messages across versions.
 */

import { describe, it } from 'node:test';

import * as assertions from '../../src/assertion/impl/sync-basic.js';
import { SyncBasicAssertions } from '../../src/assertion/index.js';
import { type AnyAssertion } from '../../src/types.js';
import { expect } from '../custom-assertions.js';
import { takeErrorSnapshot } from './error-snapshot-util.js';

const failingAssertions = new Map<AnyAssertion, () => void>([
  [
    assertions.arrayAssertion,
    () => {
      expect(42, 'to be an array');
    },
  ],
  [
    assertions.asyncFunctionAssertion,
    () => {
      expect(() => {}, 'to be an async function');
    },
  ],
  [
    assertions.bigintAssertion,
    () => {
      expect(42, 'to be a bigint');
    },
  ],
  [
    assertions.booleanAssertion,
    () => {
      expect('hello', 'to be a boolean');
    },
  ],
  [
    assertions.classAssertion,
    () => {
      expect('hello', 'to be a class');
    },
  ],
  [
    assertions.dateAssertion,
    () => {
      expect('hello', 'to be a date');
    },
  ],
  [
    assertions.definedAssertion,
    () => {
      expect(undefined, 'to be defined');
    },
  ],
  [
    assertions.emptyArrayAssertion,
    () => {
      expect([1, 2, 3], 'to be an empty array');
    },
  ],
  [
    assertions.emptyObjectAssertion,
    () => {
      expect({ foo: 'bar' }, 'to be an empty object');
    },
  ],
  [
    assertions.emptyStringAssertion,
    () => {
      expect('hello', 'to be an empty string');
    },
  ],
  [
    assertions.errorAssertion,
    () => {
      expect('hello', 'to be an error');
    },
  ],
  [
    assertions.falseAssertion,
    () => {
      expect(true, 'to be false');
    },
  ],
  [
    assertions.falsyAssertion,
    () => {
      expect(1, 'to be falsy');
    },
  ],
  [
    assertions.functionAssertion,
    () => {
      expect('hello', 'to be a function');
    },
  ],
  [
    assertions.infiniteAssertion,
    () => {
      expect(42, 'to be infinite');
    },
  ],
  [
    assertions.integerAssertion,
    () => {
      expect(3.14, 'to be an integer');
    },
  ],
  [
    assertions.nanAssertion,
    () => {
      expect(42, 'to be NaN');
    },
  ],
  [
    assertions.negativeAssertion,
    () => {
      expect(5, 'to be negative');
    },
  ],
  [
    assertions.negativeInfinityAssertion,
    () => {
      expect(Infinity, 'to be negative infinity');
    },
  ],
  [
    assertions.negativeIntegerAssertion,
    () => {
      expect(5, 'to be a negative integer');
    },
  ],
  [
    assertions.nonEmptyStringAssertion,
    () => {
      expect('', 'to be a non empty string');
    },
  ],
  [
    assertions.nullAssertion,
    () => {
      expect(undefined, 'to be null');
    },
  ],
  [
    assertions.numberAssertion,
    () => {
      expect('hello', 'to be a number');
    },
  ],
  [
    assertions.objectAssertion,
    () => {
      expect('hello', 'to be an object');
    },
  ],
  [
    assertions.positiveAssertion,
    () => {
      expect(-5, 'to be positive');
    },
  ],
  [
    assertions.positiveInfinityAssertion,
    () => {
      expect(-Infinity, 'to be positive infinity');
    },
  ],
  [
    assertions.positiveIntegerAssertion,
    () => {
      expect(-5, 'to be a positive integer');
    },
  ],
  [
    assertions.primitiveAssertion,
    () => {
      expect({}, 'to be a primitive');
    },
  ],
  [
    assertions.recordAssertion,
    () => {
      expect([], 'to be a record');
    },
  ],
  [
    assertions.regexpAssertion,
    () => {
      expect('hello', 'to be a regexp');
    },
  ],
  [
    assertions.setAssertion,
    () => {
      expect('hello', 'to be a Set');
    },
  ],
  [
    assertions.stringAssertion,
    () => {
      expect(42, 'to be a string');
    },
  ],
  [
    assertions.symbolAssertion,
    () => {
      expect('hello', 'to be a symbol');
    },
  ],
  [
    assertions.trueAssertion,
    () => {
      expect(false, 'to be true');
    },
  ],
  [
    assertions.truthyAssertion,
    () => {
      expect(0, 'to be truthy');
    },
  ],
  [
    assertions.undefinedAssertion,
    () => {
      expect(null, 'to be undefined');
    },
  ],
  [
    assertions.weakMapAssertion,
    () => {
      expect('hello', 'to be a WeakMap');
    },
  ],
  [
    assertions.weakSetAssertion,
    () => {
      expect('hello', 'to be a WeakSet');
    },
  ],
]);

describe('Sync Basic Assertion Error Snapshots', () => {
  it(`should test all available assertions in SyncBasicAssertions`, () => {
    expect(
      failingAssertions,
      'to exhaustively test collection',
      'SyncBasicAssertions',
      'from',
      SyncBasicAssertions,
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
