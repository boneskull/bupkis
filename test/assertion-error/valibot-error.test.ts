/**
 * Snapshot tests for Valibot-based assertion errors.
 *
 * These tests capture the error output format from Valibot-based assertions to
 * ensure consistent error messages and allow comparison with native bupkis
 * (Zod-based) assertions.
 */

import { describe, it } from 'node:test';

import { type AnyAssertion } from '../../src/types.js';
import { expect } from '../custom-assertions.js';
import {
  valibotArrayAssertion,
  valibotArrayContainsAssertion,
  valibotArrayLengthAssertion,
  valibotBooleanAssertion,
  valibotEqualityAssertion,
  valibotGreaterThanAssertion,
  valibotLessThanAssertion,
  valibotNumberAssertion,
  valibotObjectHasPropertyAssertion,
  valibotStringAssertion,
  valibotStringContainsAssertion,
} from '../valibot-assertions.js';
import { takeErrorSnapshot } from './error-snapshot-util.js';

const failingAssertions = new Map<AnyAssertion, () => void>([
  [
    valibotArrayAssertion,
    () => {
      expect(42, 'to be an array');
    },
  ],
  [
    valibotArrayContainsAssertion,
    () => {
      expect([1, 2, 3], 'to contain', 5);
    },
  ],
  [
    valibotArrayLengthAssertion,
    () => {
      expect([1, 2, 3], 'to have length', 5);
    },
  ],
  [
    valibotBooleanAssertion,
    () => {
      expect('hello', 'to be a boolean');
    },
  ],
  [
    valibotEqualityAssertion,
    () => {
      expect(5, 'to be', 10);
    },
  ],
  [
    valibotGreaterThanAssertion,
    () => {
      expect(3, 'to be greater than', 5);
    },
  ],
  [
    valibotLessThanAssertion,
    () => {
      expect(10, 'to be less than', 5);
    },
  ],
  [
    valibotNumberAssertion,
    () => {
      expect('hello', 'to be a number');
    },
  ],
  [
    valibotObjectHasPropertyAssertion,
    () => {
      expect({ foo: 'bar' }, 'to have property', 'baz');
    },
  ],
  [
    valibotStringAssertion,
    () => {
      expect(42, 'to be a string');
    },
  ],
  [
    valibotStringContainsAssertion,
    () => {
      expect('hello world', 'to contain', 'foo');
    },
  ],
]);

describe('Valibot Assertion Error Snapshots', () => {
  for (const [assertion, failingFn] of failingAssertions) {
    const { id } = assertion;
    describe(`${assertion} [${id}]`, () => {
      it(
        `should throw a consistent AssertionError [${id}] <snapshot>`,
        takeErrorSnapshot(failingFn),
      );
    });
  }
});
