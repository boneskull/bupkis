import { describe, it } from 'node:test';

import { expect } from '../../src/index.js';
import { satisfies } from '../../src/util.js';

describe('satisfies', () => {
  describe('basic object matching', () => {
    it('should return true when actual object contains all expected properties', () => {
      const actual = { a: 1, b: 2, c: 3 };
      const expected = { a: 1, b: 2 };

      expect(
        () => expect(satisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should return false when actual object is missing expected properties', () => {
      const actual = { a: 1 };
      const expected = { a: 1, b: 2 };

      expect(
        () => expect(satisfies(actual, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should return false when actual object has different values', () => {
      const actual = { a: 1, b: 3 };
      const expected = { a: 1, b: 2 };

      expect(
        () => expect(satisfies(actual, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should return true when objects are identical', () => {
      const obj = { a: 1, b: 2 };

      expect(() => expect(satisfies(obj, obj), 'to be true'), 'not to throw');
    });
  });

  describe('nested object matching', () => {
    it('should return true when nested objects match', () => {
      const actual = {
        a: 1,
        nested: { x: 10, y: 20, z: 30 },
      };
      const expected = {
        a: 1,
        nested: { x: 10, y: 20 },
      };

      expect(
        () => expect(satisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should return false when nested objects do not match', () => {
      const actual = {
        a: 1,
        nested: { x: 10, y: 30 },
      };
      const expected = {
        a: 1,
        nested: { x: 10, y: 20 },
      };

      expect(
        () => expect(satisfies(actual, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should return false when nested object is missing', () => {
      const actual = { a: 1 };
      const expected = {
        a: 1,
        nested: { x: 10 },
      };

      expect(
        () => expect(satisfies(actual, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should handle deeply nested objects', () => {
      const actual = {
        level1: {
          level2: {
            level3: {
              extra: 'data',
              value: 42,
            },
          },
        },
      };
      const expected = {
        level1: {
          level2: {
            level3: {
              value: 42,
            },
          },
        },
      };

      expect(
        () => expect(satisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });
  });

  describe('primitive value matching', () => {
    it('should handle string values', () => {
      const actual = { extra: 'data', name: 'test' };
      const expected = { name: 'test' };

      expect(
        () => expect(satisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should handle number values', () => {
      const actual = { count: 42, other: 100 };
      const expected = { count: 42 };

      expect(
        () => expect(satisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should handle boolean values', () => {
      const actual = { debug: false, flag: true };
      const expected = { flag: true };

      expect(
        () => expect(satisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should handle null values', () => {
      const actual = { other: 'data', value: null };
      const expected = { value: null };

      expect(
        () => expect(satisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should handle undefined values', () => {
      const actual = { other: 'data', value: undefined };
      const expected = { value: undefined };

      expect(
        () => expect(satisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });
  });

  describe('circular reference handling', () => {
    it('should handle self-referencing objects', () => {
      const actual: any = { value: 42 };
      actual.self = actual;

      const expected = { value: 42 };

      expect(
        () => expect(satisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should handle mutually referencing objects', () => {
      const actual: any = { a: 1 };
      const actualNested: any = { b: 2 };
      actual.nested = actualNested;
      actualNested.parent = actual;

      const expected = { a: 1 };

      expect(
        () => expect(satisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should handle circular references in expected objects', () => {
      const actual: any = { a: 1, nested: { b: 2 } };

      const expected: any = { a: 1 };
      expected.self = expected;

      // This should not cause infinite recursion
      expect(
        () => expect(satisfies(actual, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should handle complex circular reference patterns for better coverage', () => {
      // Test the specific branch where both objects are already in visitedSets
      // This should exercise the return statement: visitedActual.has(actual) && visitedExpected.has(expected)
      const obj1: any = { type: 'first' };
      const obj2: any = { type: 'second' };
      const obj3: any = { type: 'third' };

      // Create a complex circular structure
      obj1.next = obj2;
      obj2.next = obj3;
      obj3.next = obj1; // Back to obj1, creating a cycle

      const expected1: any = { type: 'first' };
      const expected2: any = { type: 'second' };
      const expected3: any = { type: 'third' };

      expected1.next = expected2;
      expected2.next = expected3;
      expected3.next = expected1; // Same cycle structure

      expect(
        () => expect(satisfies(obj1, expected1), 'to be true'),
        'not to throw',
      );
    });
  });

  describe('edge cases', () => {
    it('should return false when actual is null', () => {
      const actual = null;
      const expected = { a: 1 };

      expect(
        () => expect(satisfies(actual as any, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should return false when actual is not an object', () => {
      const actual = 'string';
      const expected = { a: 1 };

      expect(
        () => expect(satisfies(actual as any, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should handle empty objects', () => {
      const actual = { a: 1, b: 2 };
      const expected = {};

      expect(
        () => expect(satisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should handle arrays as objects', () => {
      const actual = [1, 2, 3, 4];
      const expected = [1, 2, 3];

      expect(
        () => expect(satisfies(actual as any, expected as any), 'to be true'),
        'not to throw',
      );
    });
  });
});
