import { describe, it } from 'node:test';

import { AssertionError } from '../../src/error.js';
import { expect } from '../../src/index.js';

// Helper: custom iterable
const createIterable = <T>(values: T[]): Iterable<T> => ({
  *[Symbol.iterator]() {
    for (const v of values) {
      yield v;
    }
  },
});

describe('sync iterable assertions', () => {
  // ===========================================================================
  // 'to yield' - any item matches
  // ===========================================================================
  describe("'to yield' / 'to emit' / 'to yield value satisfying'", () => {
    it('should pass when array yields matching value', () => {
      expect([1, 2, 3], 'to yield', 2);
    });

    it('should pass when Set yields matching value', () => {
      expect(new Set(['a', 'b', 'c']), 'to yield', 'b');
    });

    it('should pass with generator', () => {
      const gen = function* () {
        yield 1;
        yield 2;
        yield 3;
      };
      expect(gen(), 'to yield', 3);
    });

    it('should pass with partial object matching (satisfy semantics)', () => {
      expect([{ a: 1, b: 2 }, { c: 3 }], 'to yield', { a: 1 });
    });

    it('should fail when no value matches', () => {
      expect(
        () => expect([1, 2, 3], 'to yield', 5),
        'to throw an',
        AssertionError,
      );
    });

    it('should work with "to emit" alias', () => {
      expect([1, 2, 3], 'to emit', 2);
    });

    it('should work with "to yield value satisfying" alias', () => {
      expect([{ name: 'test' }], 'to yield value satisfying', { name: 'test' });
    });

    it('should support negation', () => {
      expect([1, 2, 3], 'not to yield', 5);
    });

    it('should work with custom iterable', () => {
      expect(createIterable([1, 2, 3]), 'to yield', 2);
    });
  });

  describe("'to yield value exhaustively satisfying'", () => {
    it('should pass with exact match', () => {
      expect([{ a: 1 }], 'to yield value exhaustively satisfying', { a: 1 });
    });

    it('should fail with extra properties', () => {
      expect(
        () =>
          expect([{ a: 1, b: 2 }], 'to yield value exhaustively satisfying', {
            a: 1,
          }),
        'to throw an',
        AssertionError,
      );
    });

    it('should support negation', () => {
      expect([{ a: 1, b: 2 }], 'not to yield value exhaustively satisfying', {
        a: 1,
      });
    });
  });

  // ===========================================================================
  // 'to yield items satisfying' - ALL items must match
  // ===========================================================================
  describe("'to yield items satisfying'", () => {
    it('should pass when all items satisfy', () => {
      expect([{ a: 1 }, { a: 2, b: 3 }], 'to yield items satisfying', {
        a: expect.it('to be a number'),
      });
    });

    it('should pass with primitive values', () => {
      expect(
        [1, 2, 3],
        'to yield items satisfying',
        expect.it('to be a number'),
      );
    });

    it('should pass with empty iterable (vacuous truth)', () => {
      expect([], 'to yield items satisfying', { any: 'shape' });
    });

    it('should fail when one item does not satisfy', () => {
      expect(
        () =>
          expect([{ a: 1 }, { b: 2 }], 'to yield items satisfying', {
            a: expect.it('to be a number'),
          }),
        'to throw an',
        AssertionError,
      );
    });
  });

  describe("'to yield items exhaustively satisfying'", () => {
    it('should pass when all items exactly match', () => {
      expect([{ a: 1 }, { a: 1 }], 'to yield items exhaustively satisfying', {
        a: 1,
      });
    });

    it('should fail when any item has extra props', () => {
      expect(
        () =>
          expect([{ a: 1, b: 2 }], 'to yield items exhaustively satisfying', {
            a: 1,
          }),
        'to throw an',
        AssertionError,
      );
    });
  });

  // ===========================================================================
  // First/Last assertions
  // ===========================================================================
  describe("'to yield first' / 'to yield first satisfying'", () => {
    it('should pass when first value satisfies', () => {
      expect([{ a: 1, b: 2 }, { c: 3 }], 'to yield first', { a: 1 });
    });

    it('should pass with primitive', () => {
      expect([1, 2, 3], 'to yield first satisfying', 1);
    });

    it('should fail when first does not match', () => {
      expect(
        () => expect([1, 2, 3], 'to yield first', 2),
        'to throw an',
        AssertionError,
      );
    });

    it('should fail on empty iterable', () => {
      expect(
        () => expect([], 'to yield first', 1),
        'to throw an',
        AssertionError,
      );
    });
  });

  describe("'to yield first exhaustively satisfying'", () => {
    it('should pass with exact first match', () => {
      expect([{ a: 1 }], 'to yield first exhaustively satisfying', { a: 1 });
    });

    it('should fail with extra props on first', () => {
      expect(
        () =>
          expect([{ a: 1, b: 2 }], 'to yield first exhaustively satisfying', {
            a: 1,
          }),
        'to throw an',
        AssertionError,
      );
    });
  });

  describe("'to yield last' / 'to yield last satisfying'", () => {
    it('should pass when last value satisfies', () => {
      expect([{ a: 1 }, { b: 2, c: 3 }], 'to yield last', { b: 2 });
    });

    it('should pass with primitive', () => {
      expect([1, 2, 3], 'to yield last satisfying', 3);
    });

    it('should fail when last does not match', () => {
      expect(
        () => expect([1, 2, 3], 'to yield last', 2),
        'to throw an',
        AssertionError,
      );
    });

    it('should fail on empty iterable', () => {
      expect(
        () => expect([], 'to yield last', 1),
        'to throw an',
        AssertionError,
      );
    });
  });

  describe("'to yield last exhaustively satisfying'", () => {
    it('should pass with exact last match', () => {
      expect([{ a: 1 }, { b: 2 }], 'to yield last exhaustively satisfying', {
        b: 2,
      });
    });

    it('should fail with extra props on last', () => {
      expect(
        () =>
          expect(
            [{ a: 1, extra: true }],
            'to yield last exhaustively satisfying',
            { a: 1 },
          ),
        'to throw an',
        AssertionError,
      );
    });
  });

  // ===========================================================================
  // Cardinality assertions
  // ===========================================================================
  describe("'to yield count'", () => {
    it('should pass with correct count', () => {
      expect([1, 2, 3], 'to yield count', 3);
    });

    it('should pass with Set', () => {
      expect(new Set([1, 2]), 'to yield count', 2);
    });

    it('should pass with generator', () => {
      const gen = function* () {
        yield 1;
        yield 2;
        yield 3;
        yield 4;
      };
      expect(gen(), 'to yield count', 4);
    });

    it('should fail with wrong count', () => {
      expect(
        () => expect([1, 2, 3], 'to yield count', 5),
        'to throw an',
        AssertionError,
      );
    });

    it('should support negation', () => {
      expect([1, 2, 3], 'not to yield count', 5);
    });
  });

  describe("'to yield at least'", () => {
    it('should pass when count >= minimum', () => {
      expect([1, 2, 3], 'to yield at least', 2);
      expect([1, 2, 3], 'to yield at least', 3);
    });

    it('should fail when count < minimum', () => {
      expect(
        () => expect([1], 'to yield at least', 2),
        'to throw an',
        AssertionError,
      );
    });
  });

  describe("'to yield at most'", () => {
    it('should pass when count <= maximum', () => {
      expect([1, 2], 'to yield at most', 3);
      expect([1, 2, 3], 'to yield at most', 3);
    });

    it('should fail when count > maximum', () => {
      expect(
        () => expect([1, 2, 3, 4], 'to yield at most', 3),
        'to throw an',
        AssertionError,
      );
    });
  });

  describe("'to be an empty iterable'", () => {
    it('should pass for empty array', () => {
      expect([], 'to be an empty iterable');
    });

    it('should pass for empty Set', () => {
      expect(new Set(), 'to be an empty iterable');
    });

    it('should pass for empty generator', () => {
      const emptyGen = function* () {};
      expect(emptyGen(), 'to be an empty iterable');
    });

    it('should fail for non-empty iterable', () => {
      expect(
        () => expect([1], 'to be an empty iterable'),
        'to throw an',
        AssertionError,
      );
    });

    it('should support negation for non-empty check', () => {
      expect([1, 2, 3], 'not to be an empty iterable');
    });
  });

  // ===========================================================================
  // Sequence/Collection assertions
  // ===========================================================================
  describe("'to yield exactly'", () => {
    it('should pass with exact sequence', () => {
      expect([1, 2, 3], 'to yield exactly', [1, 2, 3]);
    });

    it('should pass with generator', () => {
      const gen = function* () {
        yield 'a';
        yield 'b';
      };
      expect(gen(), 'to yield exactly', ['a', 'b']);
    });

    it('should fail with different sequence', () => {
      expect(
        () => expect([1, 2, 3], 'to yield exactly', [1, 2]),
        'to throw an',
        AssertionError,
      );
    });

    it('should fail with extra properties (deep equality)', () => {
      expect(
        () => expect([{ a: 1, b: 2 }], 'to yield exactly', [{ a: 1 }]),
        'to throw an',
        AssertionError,
      );
    });
  });

  describe("'to yield sequence satisfying' / 'to yield array satisfying'", () => {
    it('should pass with partial object matching', () => {
      expect([{ a: 1, b: 2 }], 'to yield sequence satisfying', [{ a: 1 }]);
    });

    it('should pass with exact primitive sequence', () => {
      expect([1, 2, 3], 'to yield array satisfying', [1, 2, 3]);
    });

    it('should fail with different count', () => {
      expect(
        () => expect([1, 2, 3], 'to yield sequence satisfying', [1, 2]),
        'to throw an',
        AssertionError,
      );
    });
  });

  // ===========================================================================
  // Edge cases
  // ===========================================================================
  describe('edge cases', () => {
    it('should work with Map (iterates entries)', () => {
      const map = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      expect(map, 'to yield count', 2);
    });

    it('should work with string (iterates chars)', () => {
      expect('abc', 'to yield', 'b');
      expect('abc', 'to yield count', 3);
    });

    it('should work with raw iterator (no Symbol.iterator)', () => {
      const rawIter = {
        _index: 0,
        _values: [1, 2, 3],
        next() {
          return this._index < this._values.length
            ? { done: false, value: this._values[this._index++] }
            : { done: true, value: undefined };
        },
      };
      expect(rawIter, 'to yield', 2);
    });

    it('should handle undefined values in iterable', () => {
      expect([1, undefined, 3], 'to yield count', 3);
      expect([undefined], 'to yield', undefined);
    });
  });
});
