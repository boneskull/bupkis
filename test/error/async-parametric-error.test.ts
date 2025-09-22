/**
 * Snapshot tests for async-parametric assertion errors.
 *
 * These tests capture the error output format for failing assertions to ensure
 * consistent error messages across versions.
 */

import { describe } from 'node:test';

import * as assertions from '../../src/assertion/impl/async-parametric.js';
import { AsyncParametricAssertions } from '../../src/assertion/index.js';
import { expectAsync } from '../../src/index.js';
import { type AnyAssertion } from '../../src/types.js';
import { expectExhaustiveAssertionTests } from '../exhaustive.macro.js';
import { runErrorSnapshotTests } from './error-snapshot.macro.js';

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
    assertions.promiseFulfillWithValueSatisfyingAssertion,
    async () => {
      await expectAsync(
        Promise.resolve('wrong'),
        'to fulfill with value satisfying',
        42,
      );
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
]);

describe('Async Parametric Assertion Error Snapshots', () => {
  expectExhaustiveAssertionTests(
    'Async Parametric Assertions',
    AsyncParametricAssertions,
    failingAssertions,
  );

  runErrorSnapshotTests(assertions, failingAssertions, { async: true });
});
