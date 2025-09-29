/**
 * Snapshot tests for async-parametric assertion errors.
 *
 * These tests capture the error output format for failing assertions to ensure
 * consistent error messages across versions.
 */

import { describe, it } from 'node:test';

import * as assertions from '../../src/assertion/impl/async-parametric.js';
import { AsyncParametricAssertions } from '../../src/assertion/index.js';
import { type AnyAssertion } from '../../src/types.js';
import { expect, expectAsync } from '../custom-assertions.js';
import { takeErrorSnapshot } from './error-snapshot-util.js';

const failingAssertions = new Map<AnyAssertion, () => Promise<void>>([
  [
    assertions.functionFulfillWithValueSatisfyingAssertion,
    async () => {
      await expectAsync(
        async () => 'wrong',
        'to fulfill with value satisfying',
        42,
      );
    },
  ],
  [
    assertions.functionRejectAssertion,
    async () => {
      await expectAsync(async () => 'success', 'to reject');
    },
  ],
  [
    assertions.functionRejectWithErrorSatisfyingAssertion,
    async () => {
      await expectAsync(
        async () => {
          throw new Error('wrong message');
        },
        'to reject with error satisfying',
        { message: 'expected message' },
      );
    },
  ],
  [
    assertions.functionRejectWithTypeAssertion,
    async () => {
      await expectAsync(
        async () => {
          throw new Error('error');
        },
        'to reject with a',
        TypeError,
      );
    },
  ],
  [
    assertions.functionResolveAssertion,
    async () => {
      await expectAsync(async () => {
        throw new Error('failure');
      }, 'to resolve');
    },
  ],
  [
    assertions.promiseRejectAssertion,
    async () => {
      await expectAsync(Promise.resolve('success'), 'to reject');
    },
  ],
  [
    assertions.promiseRejectWithErrorSatisfyingAssertion,
    async () => {
      // Use thenable object to avoid unhandled rejection
      const rejectingThenable = {
        then(_resolve: (value: any) => void, reject: (reason: any) => void) {
          reject(new Error('wrong message'));
        },
      };
      await expectAsync(rejectingThenable, 'to reject with error satisfying', {
        message: 'expected message',
      });
    },
  ],
  [
    assertions.promiseRejectWithTypeAssertion,
    async () => {
      // Use thenable object to avoid unhandled rejection
      const rejectingThenable = {
        then(_resolve: (value: any) => void, reject: (reason: any) => void) {
          reject(new Error('error'));
        },
      };
      await expectAsync(rejectingThenable, 'to reject with a', TypeError);
    },
  ],
  [
    assertions.promiseResolveAssertion,
    async () => {
      // Use thenable object to avoid unhandled rejection
      const rejectingThenable = {
        then(_resolve: (value: any) => void, reject: (reason: any) => void) {
          reject(new Error('failure'));
        },
      };
      await expectAsync(rejectingThenable, 'to resolve');
    },
  ],
  [
    assertions.promiseResolveWithValueSatisfyingAssertion,
    async () => {
      await expectAsync(
        Promise.resolve('wrong'),
        'to fulfill with value satisfying',
        42,
      );
    },
  ],
]);

describe('Async Parametric Assertion Error Snapshots', () => {
  it(`should test all available assertions in SyncCollectionAssertions`, () => {
    expect(
      failingAssertions,
      'to exhaustively test collection',
      'AsyncParametricAssertions',
      'from',
      AsyncParametricAssertions,
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
