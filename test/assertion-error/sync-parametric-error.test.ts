/**
 * Snapshot tests for sync-parametric assertion errors.
 *
 * These tests capture the error output format for failing assertions to ensure
 * consistent error messages across versions.
 */

import { describe, it } from 'node:test';

import * as assertions from '../../src/assertion/impl/sync-parametric.js';
import { SyncParametricAssertions } from '../../src/assertion/index.js';
import { type AnyAssertion } from '../../src/types.js';
import { expect } from '../custom-assertions.js';
import { takeErrorSnapshot } from './error-snapshot-util.js';

const failingAssertions = new Map<AnyAssertion, () => void>([
  [
    assertions.arrayDeepEqualAssertion,
    () => {
      expect([1, 2, 3], 'to deeply equal', [1, 2, 4]);
    },
  ],
  [
    assertions.arraySatisfiesAssertion,
    () => {
      expect([1, 2, 3], 'to satisfy', [1, 2, 4]);
    },
  ],
  [
    assertions.errorMessageAssertion,
    () => {
      const error = new Error('wrong message');
      expect(error, 'to have message', 'expected message');
    },
  ],
  [
    assertions.errorMessageMatchingAssertion,
    () => {
      const error = new Error('wrong message');
      expect(error, 'to have message matching', /expected/);
    },
  ],
  [
    assertions.functionArityAssertion,
    () => {
      /**
       * @function
       */
      const fn = (a: number, b: number) => a + b;
      expect(fn, 'to have arity', 3);
    },
  ],
  [
    assertions.functionThrowsAssertion,
    () => {
      /**
       * @function
       */
      const fn = () => 'no error';
      expect(fn, 'to throw');
    },
  ],
  [
    assertions.functionThrowsSatisfyingAssertion,
    () => {
      /**
       * @function
       */
      const fn = () => {
        throw new Error('wrong message');
      };
      expect(fn, 'to throw matching', /expected/);
    },
  ],
  [
    assertions.functionThrowsTypeAssertion,
    () => {
      /**
       * @function
       */
      const fn = () => {
        throw new Error('message');
      };
      expect(fn, 'to throw a', TypeError);
    },
  ],
  [
    assertions.functionThrowsTypeSatisfyingAssertion,
    () => {
      /**
       * @function
       */
      const fn = () => {
        throw new Error('wrong message');
      };
      expect(fn, 'to throw an', Error, 'satisfying', {
        message: 'expected message',
      });
    },
  ],
  [
    assertions.instanceOfAssertion,
    () => {
      expect('hello', 'to be an instance of', Number);
    },
  ],
  [
    assertions.numberCloseToAssertion,
    () => {
      expect(10, 'to be close to', 5, 2);
    },
  ],
  [
    assertions.numberGreaterThanAssertion,
    () => {
      expect(5, 'to be greater than', 10);
    },
  ],
  [
    assertions.numberGreaterThanOrEqualAssertion,
    () => {
      expect(5, 'to be greater than or equal to', 10);
    },
  ],
  [
    assertions.numberLessThanAssertion,
    () => {
      expect(10, 'to be less than', 5);
    },
  ],
  [
    assertions.numberLessThanOrEqualAssertion,
    () => {
      expect(10, 'to be less than or equal to', 5);
    },
  ],
  [
    assertions.numberWithinRangeAssertion,
    () => {
      expect(15, 'to be within range', [1, 10]);
    },
  ],
  [
    assertions.objectDeepEqualAssertion,
    () => {
      expect({ a: 1, b: 2 }, 'to deeply equal', { a: 1, b: 3 });
    },
  ],
  [
    assertions.objectSatisfiesAssertion,
    () => {
      expect({ a: 1, b: 2 }, 'to satisfy', { a: 1, b: 3 });
    },
  ],
  [
    assertions.oneOfAssertion,
    () => {
      expect(5, 'to be one of', [1, 2, 3]);
    },
  ],
  [
    assertions.strictEqualityAssertion,
    () => {
      expect({}, 'to strictly equal', {});
    },
  ],
  [
    assertions.stringBeginsWithAssertion,
    () => {
      expect('hello world', 'to begin with', 'goodbye');
    },
  ],
  [
    assertions.stringEndsWithAssertion,
    () => {
      expect('hello world', 'to end with', 'universe');
    },
  ],
  [
    assertions.stringGreaterThanAssertion,
    () => {
      expect('apple', 'to be greater than', 'zebra');
    },
  ],
  [
    assertions.stringGreaterThanOrEqualAssertion,
    () => {
      expect('apple', 'to be greater than or equal to', 'zebra');
    },
  ],
  [
    assertions.stringIncludesAssertion,
    () => {
      expect('hello world', 'to include', 'universe');
    },
  ],
  [
    assertions.stringLessThanAssertion,
    () => {
      expect('zebra', 'to be less than', 'apple');
    },
  ],
  [
    assertions.stringLessThanOrEqualAssertion,
    () => {
      expect('zebra', 'to be less than or equal to', 'apple');
    },
  ],
  [
    assertions.stringMatchesAssertion,
    () => {
      expect('hello world', 'to match', /universe/);
    },
  ],
  [
    assertions.typeOfAssertion,
    () => {
      expect('hello', 'to be a', 'number');
    },
  ],
]);

describe('Sync Parametric Assertion Error Snapshots', () => {
  it(`should test all available assertions in SyncParametricAssertions`, () => {
    expect(
      failingAssertions,
      'to exhaustively test collection',
      'SyncParametricAssertions',
      'from',
      SyncParametricAssertions,
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
