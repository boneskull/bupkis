import { describe, it } from 'node:test';
import { z } from 'zod/v4';

import { createAssertion } from '../../src/assertion/create.js';
import { AssertionError } from '../../src/error.js';
import { expect, use } from '../../src/index.js';

describe('sync assertion execution with custom diff', () => {
  describe('AssertionFailure with diff property', () => {
    it('should include custom diff in error message', () => {
      const customDiffAssertion = createAssertion(
        [z.string(), 'to have custom diff with', z.string()],
        (actual, expected) => ({
          actual,
          diff: `Custom:\n  want: ${expected}\n  got:  ${actual}`,
          expected,
          message: 'Values differ',
        }),
      );

      const { expect: customExpect } = use([customDiffAssertion]);

      try {
        customExpect('foo', 'to have custom diff with', 'bar');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
        expect((err as AssertionError).message, 'to contain', 'Custom:');
        expect((err as AssertionError).message, 'to contain', 'want: bar');
        expect((err as AssertionError).message, 'to contain', 'got:  foo');
      }
    });
  });

  describe('AssertionFailure with formatters', () => {
    it('should use formatters in diff output', () => {
      const formatterAssertion = createAssertion(
        [z.unknown(), 'to format as', z.unknown()],
        (actual, expected) => ({
          actual,
          expected,
          formatActual: (v) => `[ACTUAL:${JSON.stringify(v)}]`,
          formatExpected: (v) => `[EXPECTED:${JSON.stringify(v)}]`,
          message: 'Formatted comparison failed',
        }),
      );

      const { expect: customExpect } = use([formatterAssertion]);

      try {
        customExpect({ a: 1 }, 'to format as', { a: 2 });
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
        expect((err as AssertionError).message, 'to contain', '[ACTUAL:');
        expect((err as AssertionError).message, 'to contain', '[EXPECTED:');
      }
    });
  });

  describe('AssertionFailure with diffOptions', () => {
    it('should respect diffOptions', () => {
      const optionsAssertion = createAssertion(
        [z.unknown(), 'to diff with options', z.unknown()],
        (actual, expected) => ({
          actual,
          diffOptions: { expand: true },
          expected,
          message: 'Diff with options',
        }),
      );

      const { expect: customExpect } = use([optionsAssertion]);

      try {
        customExpect({ a: 1, b: 2 }, 'to diff with options', { a: 1, b: 3 });
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
        // Just verify it doesn't crash - diffOptions are passed through
      }
    });
  });
});
