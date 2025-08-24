import { describe, it } from 'node:test';

import { expect } from '../../src/index.js';
import { exhaustivelySatisfies, satisfies } from '../../src/util.js';

describe('exhaustivelySatisfies', () => {
  describe('basic object matching', () => {
    it('should return true when objects have exactly the same properties', () => {
      const actual = { a: 1, b: 2 };
      const expected = { a: 1, b: 2 };

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should return false when actual object has extra properties', () => {
      const actual = { a: 1, b: 2, c: 3 };
      const expected = { a: 1, b: 2 };

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should return false when actual object is missing expected properties', () => {
      const actual = { a: 1 };
      const expected = { a: 1, b: 2 };

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should return false when actual object has different values', () => {
      const actual = { a: 1, b: 3 };
      const expected = { a: 1, b: 2 };

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should return true when objects are identical', () => {
      const obj = { a: 1, b: 2 };

      expect(
        () => expect(exhaustivelySatisfies(obj, obj), 'to be true'),
        'not to throw',
      );
    });

    it('should return false when property order differs but content is same', () => {
      const actual = { a: 1, b: 2 };
      const expected = { a: 1, b: 2 };

      // Property order shouldn't matter, only content - this should be true
      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });
  });

  describe('nested object matching', () => {
    it('should return true when nested objects match exactly', () => {
      const actual = {
        a: 1,
        nested: { x: 10, y: 20 },
      };
      const expected = {
        a: 1,
        nested: { x: 10, y: 20 },
      };

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should return false when nested object has extra properties', () => {
      const actual = {
        a: 1,
        nested: { x: 10, y: 20, z: 30 },
      };
      const expected = {
        a: 1,
        nested: { x: 10, y: 20 },
      };

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should return false when nested object is missing properties', () => {
      const actual = {
        a: 1,
        nested: { x: 10 },
      };
      const expected = {
        a: 1,
        nested: { x: 10, y: 20 },
      };

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should return false when nested object values do not match', () => {
      const actual = {
        a: 1,
        nested: { x: 10, y: 30 },
      };
      const expected = {
        a: 1,
        nested: { x: 10, y: 20 },
      };

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should handle deeply nested objects', () => {
      const actual = {
        level1: {
          level2: {
            level3: {
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
        () => expect(exhaustivelySatisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });
  });

  describe('primitive value matching', () => {
    it('should handle string values', () => {
      const actual = { name: 'test' };
      const expected = { name: 'test' };

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should handle number values', () => {
      const actual = { count: 42 };
      const expected = { count: 42 };

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should handle boolean values', () => {
      const actual = { flag: true };
      const expected = { flag: true };

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should handle null values', () => {
      const actual = { value: null };
      const expected = { value: null };

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should handle undefined values', () => {
      const actual = { value: undefined };
      const expected = { value: undefined };

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });
  });

  describe('circular reference handling', () => {
    it('should handle self-referencing objects', () => {
      const actual: any = { value: 42 };
      actual.self = actual;

      const expected: any = { value: 42 };
      expected.self = expected;

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should handle mutually referencing objects', () => {
      const actual: any = { a: 1 };
      const actualNested: any = { b: 2 };
      actual.nested = actualNested;
      actualNested.parent = actual;

      const expected: any = { a: 1 };
      const expectedNested: any = { b: 2 };
      expected.nested = expectedNested;
      expectedNested.parent = expected;

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should handle circular references with different structures', () => {
      const actual: any = { a: 1 };
      actual.self = actual;

      const expected: any = { a: 1, b: 2 };
      expected.self = expected;

      // Different number of properties, should be false
      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should handle complex circular reference scenarios for full coverage', () => {
      // Test edge cases in circular reference detection to improve coverage
      const complexObj: any = {
        data: { value: 'test' },
        level: 1,
      };
      complexObj.parent = complexObj;
      complexObj.data.root = complexObj;

      const complexExpected: any = {
        data: { value: 'test' },
        level: 1,
      };
      complexExpected.parent = complexExpected;
      complexExpected.data.root = complexExpected;

      expect(
        () =>
          expect(
            exhaustivelySatisfies(complexObj, complexExpected),
            'to be true',
          ),
        'not to throw',
      );
    });
  });

  describe('edge cases', () => {
    it('should return false when actual is null', () => {
      const actual = null;
      const expected = { a: 1 };

      expect(
        () =>
          expect(exhaustivelySatisfies(actual as any, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should return false when actual is not an object', () => {
      const actual = 'string';
      const expected = { a: 1 };

      expect(
        () =>
          expect(exhaustivelySatisfies(actual as any, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should handle empty objects', () => {
      const actual = {};
      const expected = {};

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });

    it('should return false when one object is empty and other is not', () => {
      const actual = {};
      const expected = { a: 1 };

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should handle arrays as objects', () => {
      const actual = [1, 2, 3];
      const expected = [1, 2, 3];

      expect(
        () =>
          expect(
            exhaustivelySatisfies(actual as any, expected as any),
            'to be true',
          ),
        'not to throw',
      );
    });

    it('should return false when arrays have different lengths', () => {
      const actual = [1, 2, 3, 4];
      const expected = [1, 2, 3];

      expect(
        () =>
          expect(
            exhaustivelySatisfies(actual as any, expected as any),
            'to be false',
          ),
        'not to throw',
      );
    });
  });

  describe('comparison with satisfies', () => {
    it('should differ from satisfies when actual has extra properties', () => {
      const actual = { a: 1, b: 2, c: 3 };
      const expected = { a: 1, b: 2 };

      // satisfies should return true (actual contains all expected)
      expect(
        () => expect(satisfies(actual, expected), 'to be true'),
        'not to throw',
      );

      // exhaustivelySatisfies should return false (actual has extra property)
      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be false'),
        'not to throw',
      );
    });

    it('should behave same as satisfies when objects match exactly', () => {
      const actual = { a: 1, b: 2 };
      const expected = { a: 1, b: 2 };

      // Both should return true for exact matches
      expect(
        () => expect(satisfies(actual, expected), 'to be true'),
        'not to throw',
      );

      expect(
        () => expect(exhaustivelySatisfies(actual, expected), 'to be true'),
        'not to throw',
      );
    });
  });
});
