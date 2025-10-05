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

interface TestCase {
  assertion: AnyAssertion;
  description?: string;
  testFn: () => Promise<void>;
}

const failingAssertions: TestCase[] = [
  {
    assertion: assertions.functionFulfillWithValueSatisfyingAssertion,
    testFn: async () => {
      await expectAsync(
        async () => 'wrong',
        'to fulfill with value satisfying',
        42,
      );
    },
  },
  {
    assertion: assertions.functionRejectAssertion,
    testFn: async () => {
      await expectAsync(async () => 'success', 'to reject');
    },
  },
  {
    assertion: assertions.functionRejectWithErrorSatisfyingAssertion,
    description: 'with object parameter',
    testFn: async () => {
      await expectAsync(
        async () => {
          throw new Error('wrong message');
        },
        'to reject with error satisfying',
        { message: 'expected message' },
      );
    },
  },
  {
    assertion: assertions.functionRejectWithErrorSatisfyingAssertion,
    description: 'with object regex parameter',
    testFn: async () => {
      await expectAsync(
        async () => {
          throw new Error('wrong message');
        },
        'to reject with error satisfying',
        { message: /expected message/ },
      );
    },
  },
  {
    assertion: assertions.functionRejectWithErrorSatisfyingAssertion,
    description: 'with regex parameter',
    testFn: async () => {
      await expectAsync(
        async () => {
          throw new Error('wrong message');
        },
        'to reject with error satisfying',
        /expected message/,
      );
    },
  },
  {
    assertion: assertions.functionRejectWithTypeAssertion,
    testFn: async () => {
      await expectAsync(
        async () => {
          throw new Error('error');
        },
        'to reject with a',
        TypeError,
      );
    },
  },
  {
    assertion: assertions.functionResolveAssertion,
    testFn: async () => {
      await expectAsync(async () => {
        throw new Error('failure');
      }, 'to resolve');
    },
  },
  {
    assertion: assertions.promiseRejectAssertion,
    testFn: async () => {
      await expectAsync(Promise.resolve('success'), 'to reject');
    },
  },
  {
    assertion: assertions.promiseRejectWithErrorSatisfyingAssertion,
    testFn: async () => {
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
  },
  {
    assertion: assertions.promiseRejectWithTypeAssertion,
    testFn: async () => {
      // Use thenable object to avoid unhandled rejection
      const rejectingThenable = {
        then(_resolve: (value: any) => void, reject: (reason: any) => void) {
          reject(new Error('error'));
        },
      };
      await expectAsync(rejectingThenable, 'to reject with a', TypeError);
    },
  },
  {
    assertion: assertions.promiseResolveAssertion,
    testFn: async () => {
      // Use thenable object to avoid unhandled rejection
      const rejectingThenable = {
        then(_resolve: (value: any) => void, reject: (reason: any) => void) {
          reject(new Error('failure'));
        },
      };
      await expectAsync(rejectingThenable, 'to resolve');
    },
  },
  {
    assertion: assertions.promiseResolveWithValueSatisfyingAssertion,
    testFn: async () => {
      await expectAsync(
        Promise.resolve('wrong'),
        'to fulfill with value satisfying',
        42,
      );
    },
  },
];

describe('Async Parametric Assertion Error Snapshots', () => {
  it(`should test all available assertions in AsyncParametricAssertions`, () => {
    // Create a Map from unique assertions in our test cases
    const assertionMap = new Map();
    for (const testCase of failingAssertions) {
      assertionMap.set(testCase.assertion, testCase.testFn);
    }

    expect(
      assertionMap,
      'to exhaustively test collection',
      'AsyncParametricAssertions',
      'from',
      AsyncParametricAssertions,
    );
  });

  for (const testCase of failingAssertions) {
    const { assertion, description, testFn } = testCase;
    const testName = description
      ? `${assertion} [${assertion.id}] (${description})`
      : `${assertion} [${assertion.id}]`;

    describe(testName, () => {
      it(
        `should throw a consistent AssertionError [${assertion.id}] <snapshot>`,
        takeErrorSnapshot(testFn),
      );
    });
  }
});
