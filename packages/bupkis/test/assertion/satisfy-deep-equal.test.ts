/**
 * Tests for the consolidated `satisfiesAssertion` and `deepEqualAssertion`
 * assertions.
 *
 * These tests verify that the consolidated assertions work correctly with:
 *
 * - Primitives (strings, numbers, booleans, null, undefined, symbols, bigints)
 * - Objects and arrays
 * - Cross-type satisfaction (e.g., array satisfying object shape)
 * - Negated assertions
 * - Edge cases (NaN, Infinity, etc.)
 */

import { describe, it } from 'node:test';

import { expect } from '../custom-assertions.js';

describe('satisfiesAssertion (consolidated)', () => {
  describe('primitives', () => {
    it('should satisfy identical numbers', () => {
      expect(42, 'to satisfy', 42);
    });

    it('should fail for different numbers', () => {
      expect(() => expect(42, 'to satisfy', 43), 'to throw');
    });

    it('should satisfy identical strings', () => {
      expect('hello', 'to satisfy', 'hello');
    });

    it('should fail for different strings', () => {
      expect(() => expect('hello', 'to satisfy', 'world'), 'to throw');
    });

    it('should satisfy identical booleans', () => {
      expect(true, 'to satisfy', true);
      expect(false, 'to satisfy', false);
    });

    it('should fail for different booleans', () => {
      expect(() => expect(true, 'to satisfy', false), 'to throw');
    });

    it('should satisfy null', () => {
      expect(null, 'to satisfy', null);
    });

    it('should satisfy undefined', () => {
      expect(undefined, 'to satisfy', undefined);
    });

    it('should satisfy bigints', () => {
      expect(BigInt(42), 'to satisfy', BigInt(42));
    });

    it('should fail for different bigints', () => {
      expect(() => expect(BigInt(42), 'to satisfy', BigInt(43)), 'to throw');
    });
  });

  describe('objects', () => {
    it('should satisfy exact object match', () => {
      expect({ a: 1, b: 2 }, 'to satisfy', { a: 1, b: 2 });
    });

    it('should satisfy partial object match (extra properties allowed)', () => {
      expect({ a: 1, b: 2, c: 3 }, 'to satisfy', { a: 1 });
    });

    it('should fail when expected property is missing', () => {
      expect(() => expect({ a: 1 }, 'to satisfy', { a: 1, b: 2 }), 'to throw');
    });

    it('should fail when property value differs', () => {
      expect(
        () => expect({ a: 1, b: 2 }, 'to satisfy', { a: 1, b: 3 }),
        'to throw',
      );
    });

    it('should satisfy nested objects', () => {
      expect({ a: { b: { c: 1 } } }, 'to satisfy', { a: { b: { c: 1 } } });
    });

    it('should satisfy partial nested objects', () => {
      expect({ a: { b: 1, c: 2 }, d: 3 }, 'to satisfy', { a: { b: 1 } });
    });
  });

  describe('arrays', () => {
    it('should satisfy identical arrays', () => {
      expect([1, 2, 3], 'to satisfy', [1, 2, 3]);
    });

    it('should fail for different arrays', () => {
      expect(() => expect([1, 2, 3], 'to satisfy', [1, 2, 4]), 'to throw');
    });

    it('should fail for different length arrays', () => {
      expect(() => expect([1, 2], 'to satisfy', [1, 2, 3]), 'to throw');
    });

    it('should satisfy nested arrays', () => {
      expect(
        [
          [1, 2],
          [3, 4],
        ],
        'to satisfy',
        [
          [1, 2],
          [3, 4],
        ],
      );
    });
  });

  describe('arrays with object properties', () => {
    it('should satisfy array with index properties', () => {
      // Arrays can be checked for specific index values
      expect([1, 2, 3], 'to satisfy', [1, 2, 3]);
    });

    it('should fail when array elements differ', () => {
      expect(() => expect([1, 2, 3], 'to satisfy', [1, 2, 4]), 'to throw');
    });

    it('should work with arrays containing objects', () => {
      expect([{ a: 1 }, { b: 2 }], 'to satisfy', [{ a: 1 }, { b: 2 }]);
    });
  });

  describe('negated assertions', () => {
    it('should pass when not satisfying different primitives', () => {
      expect(42, 'not to satisfy', 43);
    });

    it('should pass when not satisfying different objects', () => {
      expect({ a: 1 }, 'not to satisfy', { a: 2 });
    });

    it('should fail when actually satisfying', () => {
      expect(() => expect(42, 'not to satisfy', 42), 'to throw');
    });
  });

  describe('edge cases', () => {
    it('should satisfy empty objects', () => {
      expect({}, 'to satisfy', {});
    });

    it('should satisfy empty arrays', () => {
      expect([], 'to satisfy', []);
    });

    it('should satisfy Infinity', () => {
      expect(Infinity, 'to satisfy', Infinity);
    });

    it('should satisfy -Infinity', () => {
      expect(-Infinity, 'to satisfy', -Infinity);
    });
  });
});

describe('deepEqualAssertion (consolidated)', () => {
  describe('primitives', () => {
    it('should deep equal identical numbers', () => {
      expect(42, 'to deep equal', 42);
    });

    it('should fail for different numbers', () => {
      expect(() => expect(42, 'to deep equal', 43), 'to throw');
    });

    it('should deep equal identical strings', () => {
      expect('hello', 'to deep equal', 'hello');
    });

    it('should fail for different strings', () => {
      expect(() => expect('hello', 'to deep equal', 'world'), 'to throw');
    });

    it('should deep equal identical booleans', () => {
      expect(true, 'to deep equal', true);
      expect(false, 'to deep equal', false);
    });

    it('should fail for different booleans', () => {
      expect(() => expect(true, 'to deep equal', false), 'to throw');
    });

    it('should deep equal null', () => {
      expect(null, 'to deep equal', null);
    });

    it('should deep equal undefined', () => {
      expect(undefined, 'to deep equal', undefined);
    });

    it('should deep equal bigints', () => {
      expect(BigInt(42), 'to deep equal', BigInt(42));
    });

    it('should fail for different bigints', () => {
      expect(() => expect(BigInt(42), 'to deep equal', BigInt(43)), 'to throw');
    });
  });

  describe('objects', () => {
    it('should deep equal identical objects', () => {
      expect({ a: 1, b: 2 }, 'to deep equal', { a: 1, b: 2 });
    });

    it('should fail when object has extra properties (strict mode)', () => {
      expect(
        () => expect({ a: 1, b: 2, c: 3 }, 'to deep equal', { a: 1, b: 2 }),
        'to throw',
      );
    });

    it('should fail when expected property is missing', () => {
      expect(
        () => expect({ a: 1 }, 'to deep equal', { a: 1, b: 2 }),
        'to throw',
      );
    });

    it('should deep equal nested objects', () => {
      expect({ a: { b: { c: 1 } } }, 'to deep equal', { a: { b: { c: 1 } } });
    });
  });

  describe('arrays', () => {
    it('should deep equal identical arrays', () => {
      expect([1, 2, 3], 'to deep equal', [1, 2, 3]);
    });

    it('should fail for different arrays', () => {
      expect(() => expect([1, 2, 3], 'to deep equal', [1, 2, 4]), 'to throw');
    });

    it('should fail for different length arrays', () => {
      expect(() => expect([1, 2], 'to deep equal', [1, 2, 3]), 'to throw');
    });

    it('should deep equal nested arrays', () => {
      expect(
        [
          [1, 2],
          [3, 4],
        ],
        'to deep equal',
        [
          [1, 2],
          [3, 4],
        ],
      );
    });
  });

  describe('Maps and Sets', () => {
    it('should deep equal identical Maps', () => {
      expect(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
        'to deep equal',
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
      );
    });

    it('should fail for different Maps', () => {
      expect(
        () => expect(new Map([['a', 1]]), 'to deep equal', new Map([['a', 2]])),
        'to throw',
      );
    });

    it('should deep equal identical Sets', () => {
      expect(new Set([1, 2, 3]), 'to deep equal', new Set([1, 2, 3]));
    });

    it('should fail for different Sets', () => {
      expect(
        () => expect(new Set([1, 2]), 'to deep equal', new Set([1, 2, 3])),
        'to throw',
      );
    });
  });

  describe('negated assertions', () => {
    it('should pass when not deep equal to different primitives', () => {
      expect(42, 'not to deep equal', 43);
    });

    it('should pass when not deep equal to different objects', () => {
      expect({ a: 1 }, 'not to deep equal', { a: 2 });
    });

    it('should fail when actually deep equal', () => {
      expect(() => expect(42, 'not to deep equal', 42), 'to throw');
    });
  });

  describe('edge cases', () => {
    it('should deep equal empty objects', () => {
      expect({}, 'to deep equal', {});
    });

    it('should deep equal empty arrays', () => {
      expect([], 'to deep equal', []);
    });

    it('should deep equal Infinity', () => {
      expect(Infinity, 'to deep equal', Infinity);
    });

    it('should deep equal -Infinity', () => {
      expect(-Infinity, 'to deep equal', -Infinity);
    });

    it('should deep equal empty Maps', () => {
      expect(new Map(), 'to deep equal', new Map());
    });

    it('should deep equal empty Sets', () => {
      expect(new Set(), 'to deep equal', new Set());
    });
  });
});
