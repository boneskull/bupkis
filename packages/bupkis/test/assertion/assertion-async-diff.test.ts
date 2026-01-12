import { describe, it } from 'node:test';
import { z } from 'zod';

import { createAsyncAssertion } from '../../src/assertion/create.js';
import { AssertionError } from '../../src/error.js';
import { expect, use } from '../../src/index.js';

describe('async assertion execution with custom diff', () => {
  describe('AssertionFailure with diff property', () => {
    it('should include custom diff in error message', async () => {
      const customDiffAssertion = createAsyncAssertion(
        [z.promise(z.string()), 'to async diff with', z.string()],
        async (actualPromise, expected) => {
          const actual = await actualPromise;
          return {
            actual,
            diff: `Async Custom:\n  want: ${expected}\n  got:  ${actual}`,
            expected,
            message: 'Async values differ',
          };
        },
      );

      const { expectAsync: customExpectAsync } = use([customDiffAssertion]);

      try {
        await customExpectAsync(
          Promise.resolve('foo'),
          'to async diff with',
          'bar',
        );
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
        expect((err as AssertionError).message, 'to contain', 'Async Custom:');
      }
    });
  });

  describe('AssertionFailure with formatters', () => {
    it('should use formatters in diff output', async () => {
      const formatterAssertion = createAsyncAssertion(
        [z.promise(z.unknown()), 'to async format as', z.unknown()],
        async (actualPromise, expected) => {
          const actual = await actualPromise;
          return {
            actual,
            expected,
            formatActual: (v) => `[ASYNC_ACTUAL:${JSON.stringify(v)}]`,
            formatExpected: (v) => `[ASYNC_EXPECTED:${JSON.stringify(v)}]`,
            message: 'Async formatted comparison failed',
          };
        },
      );

      const { expectAsync: customExpectAsync } = use([formatterAssertion]);

      try {
        await customExpectAsync(
          Promise.resolve({ a: 1 }),
          'to async format as',
          { a: 2 },
        );
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
        expect((err as AssertionError).message, 'to contain', '[ASYNC_ACTUAL:');
      }
    });
  });
});
