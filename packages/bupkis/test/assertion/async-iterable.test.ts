import { Readable } from 'node:stream';
import { describe, it } from 'node:test';

import { AssertionError } from '../../src/error.js';
import { expect, expectAsync } from '../../src/index.js';

// Helper: async generator factory
const asyncGen = async function* <T>(values: T[]) {
  for (const v of values) {
    yield v;
  }
};

// Helper: async generator that throws
const failingGen = async function* (errorAfter: number, error: Error) {
  for (let i = 0; i < errorAfter; i++) {
    yield i;
  }
  throw error;
};

describe('async iterable assertions', () => {
  // ===========================================================================
  // 'to yield' - any item matches
  // ===========================================================================
  describe("'to yield' / 'to emit' / 'to yield value satisfying'", () => {
    it('should pass when async generator yields matching value', async () => {
      await expectAsync(asyncGen([1, 2, 3]), 'to yield', 2);
    });

    it('should pass with Node.js Readable stream', async () => {
      const readable = Readable.from(['chunk1', 'chunk2', 'chunk3']);
      await expectAsync(readable, 'to emit', 'chunk2');
    });

    it('should pass with sync iterable (wrapped as async)', async () => {
      await expectAsync([1, 2, 3], 'to yield', 2);
    });

    it('should pass with partial object matching (satisfy semantics)', async () => {
      await expectAsync(asyncGen([{ a: 1, b: 2 }, { c: 3 }]), 'to yield', {
        a: 1,
      });
    });

    it('should fail when no value matches', async () => {
      try {
        await expectAsync(asyncGen([1, 2, 3]), 'to yield', 5);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
      }
    });

    it('should support negation', async () => {
      await expectAsync(asyncGen([1, 2, 3]), 'not to yield', 5);
    });
  });

  describe("'to yield value exhaustively satisfying'", () => {
    it('should pass with exact match', async () => {
      await expectAsync(
        asyncGen([{ a: 1 }]),
        'to yield value exhaustively satisfying',
        { a: 1 },
      );
    });

    it('should fail with extra properties', async () => {
      try {
        await expectAsync(
          asyncGen([{ a: 1, b: 2 }]),
          'to yield value exhaustively satisfying',
          { a: 1 },
        );
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
      }
    });
  });

  // ===========================================================================
  // 'to yield items satisfying' - ALL items must match
  // ===========================================================================
  describe("'to yield items satisfying'", () => {
    it('should pass when all items satisfy', async () => {
      await expectAsync(
        asyncGen([{ a: 1 }, { a: 2, b: 3 }]),
        'to yield items satisfying',
        { a: expect.it('to be a number') },
      );
    });

    it('should pass with Node.js stream', async () => {
      const readable = Readable.from(['str1', 'str2', 'str3']);
      await expectAsync(
        readable,
        'to yield items satisfying',
        expect.it('to be a string'),
      );
    });

    it('should fail when one item does not satisfy', async () => {
      try {
        await expectAsync(
          asyncGen([{ a: 1 }, { b: 2 }]),
          'to yield items satisfying',
          { a: expect.it('to be a number') },
        );
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
      }
    });
  });

  // ===========================================================================
  // First/Last assertions
  // ===========================================================================
  describe("'to yield first' / 'to yield first satisfying'", () => {
    it('should pass when first value satisfies', async () => {
      await expectAsync(
        asyncGen([{ a: 1, b: 2 }, { c: 3 }]),
        'to yield first',
        { a: 1 },
      );
    });

    it('should fail when first does not match', async () => {
      try {
        await expectAsync(asyncGen([1, 2, 3]), 'to yield first', 2);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
      }
    });

    it('should fail on empty async iterable', async () => {
      try {
        await expectAsync(asyncGen([]), 'to yield first', 1);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
      }
    });
  });

  describe("'to yield last' / 'to yield last satisfying'", () => {
    it('should pass when last value satisfies', async () => {
      await expectAsync(asyncGen([{ a: 1 }, { b: 2, c: 3 }]), 'to yield last', {
        b: 2,
      });
    });

    it('should fail when last does not match', async () => {
      try {
        await expectAsync(asyncGen([1, 2, 3]), 'to yield last', 2);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
      }
    });
  });

  // ===========================================================================
  // Cardinality assertions
  // ===========================================================================
  describe("'to yield count'", () => {
    it('should pass with correct count', async () => {
      await expectAsync(asyncGen([1, 2, 3]), 'to yield count', 3);
    });

    it('should pass with Node.js stream', async () => {
      const readable = Readable.from(['a', 'b']);
      await expectAsync(readable, 'to yield count', 2);
    });

    it('should fail with wrong count', async () => {
      try {
        await expectAsync(asyncGen([1, 2, 3]), 'to yield count', 5);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
      }
    });
  });

  describe("'to yield at least'", () => {
    it('should pass when count >= minimum', async () => {
      await expectAsync(asyncGen([1, 2, 3]), 'to yield at least', 2);
    });

    it('should fail when count < minimum', async () => {
      try {
        await expectAsync(asyncGen([1]), 'to yield at least', 2);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
      }
    });
  });

  describe("'to yield at most'", () => {
    it('should pass when count <= maximum', async () => {
      await expectAsync(asyncGen([1, 2]), 'to yield at most', 3);
    });

    it('should fail when count > maximum', async () => {
      try {
        await expectAsync(asyncGen([1, 2, 3, 4]), 'to yield at most', 3);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
      }
    });
  });

  describe("'to be an empty iterable'", () => {
    it('should pass for empty async generator', async () => {
      await expectAsync(asyncGen([]), 'to be an empty iterable');
    });

    it('should fail for non-empty async iterable', async () => {
      try {
        await expectAsync(asyncGen([1]), 'to be an empty iterable');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
      }
    });

    it('should support negation', async () => {
      await expectAsync(asyncGen([1, 2, 3]), 'not to be an empty iterable');
    });
  });

  // ===========================================================================
  // Sequence/Collection assertions
  // ===========================================================================
  describe("'to yield exactly'", () => {
    it('should pass with exact sequence', async () => {
      await expectAsync(asyncGen([1, 2, 3]), 'to yield exactly', [1, 2, 3]);
    });

    it('should fail with different sequence', async () => {
      try {
        await expectAsync(asyncGen([1, 2, 3]), 'to yield exactly', [1, 2]);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
      }
    });
  });

  describe("'to yield sequence satisfying' / 'to yield array satisfying'", () => {
    it('should pass with partial object matching', async () => {
      await expectAsync(
        asyncGen([{ a: 1, b: 2 }]),
        'to yield sequence satisfying',
        [{ a: 1 }],
      );
    });

    it('should pass with exact primitive sequence', async () => {
      await expectAsync(
        asyncGen([1, 2, 3]),
        'to yield array satisfying',
        [1, 2, 3],
      );
    });
  });

  // ===========================================================================
  // Completion/Error assertions (async-only)
  // ===========================================================================
  describe("'to complete' / 'to finish'", () => {
    it('should pass when async iterable completes successfully', async () => {
      await expectAsync(asyncGen([1, 2, 3]), 'to complete');
    });

    it('should pass with Node.js stream that ends cleanly', async () => {
      const readable = Readable.from(['a', 'b']);
      await expectAsync(readable, 'to finish');
    });

    it('should fail when iteration throws', async () => {
      const error = new Error('Test error');
      try {
        await expectAsync(failingGen(2, error), 'to complete');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
      }
    });
  });

  describe("'to reject' / 'to be rejected'", () => {
    it('should pass when iteration throws', async () => {
      const error = new Error('Test error');
      await expectAsync(failingGen(1, error), 'to reject');
    });

    it('should fail when iteration completes successfully', async () => {
      try {
        await expectAsync(asyncGen([1, 2, 3]), 'to reject');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
      }
    });

    it('should work with "to be rejected" alias', async () => {
      const error = new Error('Test error');
      await expectAsync(failingGen(1, error), 'to be rejected');
    });
  });

  describe("'to reject with a' / 'to reject with an'", () => {
    it('should pass when rejecting with expected error type', async () => {
      await expectAsync(
        failingGen(1, new TypeError('bad')),
        'to reject with a',
        TypeError,
      );
    });

    it('should fail when rejecting with different error type', async () => {
      try {
        await expectAsync(
          failingGen(1, new Error('not a type error')),
          'to reject with a',
          TypeError,
        );
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
      }
    });

    it('should fail when completing successfully', async () => {
      try {
        await expectAsync(asyncGen([1, 2, 3]), 'to reject with an', Error);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
      }
    });
  });

  describe("'to reject with error satisfying'", () => {
    it('should pass when error matches shape', async () => {
      await expectAsync(
        failingGen(1, new Error('Connection failed')),
        'to reject with error satisfying',
        { message: 'Connection failed' },
      );
    });

    it('should pass with partial match', async () => {
      const error = Object.assign(new Error('Failed'), {
        code: 'ECONNREFUSED',
      });
      await expectAsync(
        failingGen(1, error),
        'to be rejected with error satisfying',
        { code: 'ECONNREFUSED' },
      );
    });

    it('should fail when error does not match shape', async () => {
      try {
        await expectAsync(
          failingGen(1, new Error('Wrong message')),
          'to reject with error satisfying',
          { message: 'Expected message' },
        );
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err, 'to be an instance of', AssertionError);
      }
    });
  });

  // ===========================================================================
  // Edge cases
  // ===========================================================================
  describe('edge cases', () => {
    it('should work with Web ReadableStream in Node 22+', async () => {
      // Web ReadableStream supports async iteration in Node 22+
      const webStream = new ReadableStream({
        start(controller) {
          controller.enqueue('chunk1');
          controller.enqueue('chunk2');
          controller.close();
        },
      });
      await expectAsync(webStream, 'to yield count', 2);
    });

    it('should handle async generator that yields undefined', async () => {
      const genUndefined = async function* () {
        yield undefined;
        yield 1;
      };
      await expectAsync(genUndefined(), 'to yield count', 2);
    });

    it('should work with sync iterable passed to async assertion', async () => {
      await expectAsync([1, 2, 3], 'to yield', 2);
      await expectAsync(new Set(['a', 'b']), 'to yield count', 2);
    });
  });
});
