import { describe, it } from 'node:test';

import { expect } from '../../src/index.js';
import { valueToSchema } from '../../src/util.js';

describe('valueToSchema', () => {
  describe('primitive types', () => {
    it('should handle null values', () => {
      const schema = valueToSchema(null);
      expect(() => void schema.parse(null), 'not to throw');
      expect(() => void schema.parse(undefined), 'to throw');
    });

    it('should handle undefined values', () => {
      const schema = valueToSchema(undefined);
      expect(() => void schema.parse(undefined), 'not to throw');
      expect(() => void schema.parse(null), 'to throw');
    });

    it('should handle boolean values', () => {
      const trueSchema = valueToSchema(true);
      const falseSchema = valueToSchema(false);

      expect(() => void trueSchema.parse(true), 'not to throw');
      expect(() => void trueSchema.parse(false), 'not to throw');
      expect(() => void trueSchema.parse('true'), 'to throw');

      expect(() => void falseSchema.parse(false), 'not to throw');
      expect(() => void falseSchema.parse(true), 'not to throw');
    });

    it('should handle string values', () => {
      const schema = valueToSchema('hello');
      expect(() => void schema.parse('world'), 'not to throw');
      expect(() => void schema.parse(123), 'to throw');
      expect(() => void schema.parse(''), 'not to throw');
    });

    it('should handle number values', () => {
      const schema = valueToSchema(42);
      expect(() => void schema.parse(123), 'not to throw');
      expect(() => void schema.parse(0), 'not to throw');
      expect(() => void schema.parse(-1), 'not to throw');
      expect(() => void schema.parse(3.14), 'not to throw');
      expect(() => void schema.parse('42'), 'to throw');
    });

    it('should handle NaN values', () => {
      const schema = valueToSchema(NaN);
      expect(() => void schema.parse(NaN), 'not to throw');
      expect(() => void schema.parse(123), 'to throw');
      expect(() => void schema.parse(undefined), 'to throw');
    });

    it('should handle bigint values', () => {
      const schema = valueToSchema(BigInt(123));
      expect(() => void schema.parse(BigInt(456)), 'not to throw');
      expect(() => void schema.parse(123), 'to throw');
      expect(() => void schema.parse('123'), 'to throw');
    });

    it('should handle symbol values', () => {
      const schema = valueToSchema(Symbol('test'));
      expect(() => void schema.parse(Symbol('other')), 'not to throw');
      expect(() => void schema.parse('symbol'), 'to throw');
      expect(() => void schema.parse(Symbol.for('test')), 'not to throw');
    });

    it('should handle function values', () => {
      const schema = valueToSchema(() => {});
      expect(() => void schema.parse(function named() {}), 'not to throw');
      expect(() => void schema.parse(() => 'arrow'), 'not to throw');
      expect(() => void schema.parse(Array), 'not to throw');
      expect(() => void schema.parse('function'), 'to throw');
    });
  });

  describe('built-in object types', () => {
    it('should handle Date objects', () => {
      const schema = valueToSchema(new Date());
      expect(() => void schema.parse(new Date('2023-01-01')), 'not to throw');
      expect(() => void schema.parse('2023-01-01'), 'to throw');
      expect(() => void schema.parse(Date.now()), 'to throw');
    });

    it('should handle literal RegExp objects', () => {
      const schema = valueToSchema(/test/gi, { literalRegExp: true });
      expect(() => void schema.parse(/other/), 'not to throw');
      expect(
        () => void schema.parse(new RegExp('pattern', 'i')),
        'not to throw',
      );
      expect(() => void schema.parse('/test/'), 'to throw');
      expect(() => void schema.parse('test'), 'to throw');
    });

    it('should handle RegExp as matcher', () => {
      const schema = valueToSchema({ foo: /bar/ });
      expect(() => void schema.parse({ foo: 'barbaz' }), 'not to throw');
      expect(() => void schema.parse({ foo: 'bumbum' }), 'to throw');
    });

    it('should handle Map objects', () => {
      const schema = valueToSchema(new Map());
      expect(
        () => void schema.parse(new Map([['key', 'value']])),
        'not to throw',
      );
      expect(() => void schema.parse({}), 'to throw');
      expect(() => void schema.parse(new Set()), 'to throw');
    });

    it('should handle Set objects', () => {
      const schema = valueToSchema(new Set());
      expect(() => void schema.parse(new Set([1, 2, 3])), 'not to throw');
      expect(() => void schema.parse([]), 'to throw');
      expect(() => void schema.parse(new Map()), 'to throw');
    });

    it('should handle WeakMap objects', () => {
      const schema = valueToSchema(new WeakMap());
      expect(() => void schema.parse(new WeakMap()), 'not to throw');
      expect(() => void schema.parse(new Map()), 'to throw');
      expect(() => void schema.parse({}), 'to throw');
    });

    it('should handle WeakSet objects', () => {
      const schema = valueToSchema(new WeakSet());
      expect(() => void schema.parse(new WeakSet()), 'not to throw');
      expect(() => void schema.parse(new Set()), 'to throw');
      expect(() => void schema.parse([]), 'to throw');
    });

    it('should handle Error objects', () => {
      const schema = valueToSchema(new Error('test'));
      expect(
        () => void schema.parse(new TypeError('different')),
        'not to throw',
      );
      expect(() => void schema.parse(new RangeError()), 'not to throw');
      expect(() => void schema.parse({ message: 'test' }), 'to throw');
      expect(() => void schema.parse('Error: test'), 'to throw');
    });

    it('should handle Promise objects', () => {
      const schema = valueToSchema(Promise.resolve());
      expect(() => void schema.parse(Promise.resolve('test')), 'not to throw');
      expect(() => void schema.parse(new Promise(() => {})), 'not to throw');
      expect(() => void schema.parse({ then: () => {} }), 'not to throw');
    });
  });

  describe('array handling', () => {
    it('should handle empty arrays', () => {
      const schema = valueToSchema([]);
      expect(() => void schema.parse([]), 'not to throw');
      expect(() => void schema.parse([1, 2, 3]), 'not to throw');
      expect(() => void schema.parse(['a', 'b']), 'not to throw');
      expect(() => void schema.parse({}), 'to throw');
    });

    it('should handle homogeneous arrays', () => {
      const schema = valueToSchema([1, 2, 3]);
      expect(() => void schema.parse([4, 5, 6]), 'not to throw');
      expect(() => void schema.parse([]), 'not to throw');
      expect(() => void schema.parse([1, 'mixed']), 'to throw');
    });

    it('should handle mixed arrays when allowMixedArrays is true', () => {
      const schema = valueToSchema([1, 'hello', true], {
        allowMixedArrays: true,
      });
      expect(() => void schema.parse([2, 'world', false]), 'not to throw');
      expect(() => void schema.parse([]), 'not to throw');
      expect(() => void schema.parse([1]), 'not to throw');
      expect(() => void schema.parse(['string']), 'not to throw');
      expect(() => void schema.parse([true]), 'not to throw');
    });

    it('should handle mixed arrays when allowMixedArrays is false', () => {
      const schema = valueToSchema([1, 'hello', true], {
        allowMixedArrays: false,
      });
      expect(() => void schema.parse([2, 3, 4]), 'not to throw');
      expect(() => void schema.parse([1, 'hello']), 'to throw');
    });

    it('should handle nested arrays', () => {
      const schema = valueToSchema([
        [1, 2],
        [3, 4],
      ]);
      expect(
        () =>
          void schema.parse([
            [5, 6],
            [7, 8],
          ]),
        'not to throw',
      );
      expect(() => void schema.parse([[]]), 'not to throw');
      expect(() => void schema.parse([1, 2]), 'to throw');
    });
  });

  describe('object handling', () => {
    it('should pass through unknown properties', () => {
      const schema = valueToSchema({ known: 123 });
      expect(schema.parse({ extra: 'prop', known: 456 }), 'to deep equal', {
        extra: 'prop',
        known: 456,
      });
    });

    it('should handle simple objects', () => {
      const schema = valueToSchema({ age: 30, name: 'John' });
      expect(
        () => void schema.parse({ age: 25, name: 'Jane' }),
        'not to throw',
      );
      expect(() => void schema.parse({ name: 'Bob' }), 'to throw'); // Missing age
      expect(
        () => void schema.parse({ age: 35, extra: true, name: 'Alice' }),
        'not to throw',
      ); // Extra props ok
    });

    it('should handle nested objects', () => {
      const schema = valueToSchema({
        active: true,
        user: { details: { age: 30 }, name: 'John' },
      });

      expect(
        () =>
          void schema.parse({
            active: false,
            user: { details: { age: 25 }, name: 'Jane' },
          }),
        'not to throw',
      );

      expect(
        () => void schema.parse({ active: true, user: { name: 'Bob' } }),
        'to throw',
      ); // Missing nested details
    });

    it('should handle objects with mixed value types', () => {
      const schema = valueToSchema({
        arr: [1, 2, 3],
        bool: true,
        num: 42,
        obj: { nested: true },
        str: 'hello',
      });

      expect(
        () =>
          void schema.parse({
            arr: [4, 5],
            bool: false,
            num: 100,
            obj: { extra: 'ok', nested: false },
            str: 'world',
          }),
        'not to throw',
      );
    });

    it('should handle empty objects', () => {
      const schema = valueToSchema({});
      expect(() => void schema.parse({}), 'not to throw');
      expect(() => void schema.parse({ extra: 'props' }), 'not to throw');
      expect(() => void schema.parse([]), 'to throw');
    });
  });

  describe('circular reference protection', () => {
    it('should handle simple circular references', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;

      const schema = valueToSchema(obj);

      // Should not throw during schema creation
      expect(() => schema, 'not to throw');

      // Should be able to parse objects without the circular reference
      expect(() => void schema.parse({ name: 'other' }), 'not to throw');
    });

    it('should handle deeply nested circular references', () => {
      const obj: any = {
        level1: {
          level2: {
            level3: {},
          },
        },
      };
      obj.level1.level2.level3.backToRoot = obj;

      const schema = valueToSchema(obj);
      expect(() => schema, 'not to throw');
    });

    it('should handle circular arrays', () => {
      const arr: any[] = [1, 2, 3];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      (arr as any).push(arr);

      const schema = valueToSchema(arr);
      expect(() => schema, 'not to throw');

      // Should validate similar arrays with numeric elements
      expect(() => void schema.parse([1, 2, 3, 42]), 'not to throw');
    });

    it('should handle complex circular structures', () => {
      const objA: any = { name: 'A' };
      const objB: any = { name: 'B' };
      objA.ref = objB;
      objB.ref = objA;

      const schema = valueToSchema({ primary: objA, secondary: objB });
      expect(() => schema, 'not to throw');
    });
  });

  describe('depth limiting', () => {
    it('should respect maxDepth option', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep',
              },
            },
          },
        },
      };

      const schema = valueToSchema(deepObject, { maxDepth: 3 });
      expect(() => schema, 'not to throw');

      // The deep parts should be unknown(), so this should work
      const result: unknown = schema.parse({
        level1: {
          level2: {
            level3: 'anything', // Beyond maxDepth, so accepts unknown
          },
        },
      });
      expect(result, 'to be a', 'object');
    });

    it('should handle arrays at max depth', () => {
      const deepArray = [[[[[['very deep']]]]]];

      const schema = valueToSchema(deepArray, { maxDepth: 3 });
      expect(() => schema, 'not to throw');
    });
  });

  describe('edge cases', () => {
    it('should handle objects with inherited properties', () => {
      const obj = { toString: () => 'test', valueOf: () => 42 };
      const schema = valueToSchema(obj);
      expect(() => schema, 'not to throw');
    });

    it('should handle objects with null and undefined values', () => {
      const schema = valueToSchema({
        normalValue: 'test',
        nullValue: null,
        undefinedValue: undefined,
      });

      expect(
        () =>
          void schema.parse({
            normalValue: 'other',
            nullValue: null,
            undefinedValue: undefined,
          }),
        'not to throw',
      );
    });

    it('should handle arrays with null and undefined', () => {
      const schema = valueToSchema([null, undefined, 'value']);
      expect(
        () => void schema.parse([null, undefined, 'other']),
        'not to throw',
      );
    });

    it('should handle exotic objects like ArrayBuffer', () => {
      const buffer = new ArrayBuffer(8);
      const schema = valueToSchema(buffer);
      expect(() => schema, 'not to throw');
      expect(() => void schema.parse(new ArrayBuffer(16)), 'not to throw');
      // Since we use a generic object schema, this will also pass
      expect(() => void schema.parse({}), 'not to throw');
    });

    it('should handle class instances', () => {
      class TestClass {
        constructor(public value: string) {}
      }

      const instance = new TestClass('test');
      const schema = valueToSchema(instance);
      expect(() => schema, 'not to throw');

      // Should work with objects that have the same shape
      expect(() => void schema.parse({ value: 'other' }), 'not to throw');
    });
  });

  describe('configuration options', () => {
    it('should respect allowMixedArrays option', () => {
      const mixedArray = [1, 'string', true];

      const allowedSchema = valueToSchema(mixedArray, {
        allowMixedArrays: true,
      });
      const restrictedSchema = valueToSchema(mixedArray, {
        allowMixedArrays: false,
      });

      expect(
        () => void allowedSchema.parse([2, 'other', false]),
        'not to throw',
      );
      expect(
        () => void allowedSchema.parse([1, true, 'string']),
        'not to throw',
      );

      expect(() => void restrictedSchema.parse([2, 3, 4]), 'not to throw');
      expect(() => void restrictedSchema.parse([1, 'mixed']), 'to throw');
    });

    it('should handle internal _currentDepth option', () => {
      const schema1 = valueToSchema(
        { nested: { value: 1 } },
        { _currentDepth: 0 },
      );
      const schema2 = valueToSchema(
        { nested: { value: 1 } },
        { _currentDepth: 5 },
      );

      expect(() => schema1, 'not to throw');
      expect(() => schema2, 'not to throw');
    });
  });

  describe('schema validation behavior', () => {
    it('should create schemas that properly validate equivalent structures', () => {
      const originalData = {
        metadata: {
          count: 2,
          lastUpdated: new Date('2023-01-01'),
        },
        users: [
          { active: true, id: 1, name: 'Alice' },
          { active: false, id: 2, name: 'Bob' },
        ],
      };

      const schema = valueToSchema(originalData);

      const newData = {
        metadata: {
          count: 3,
          lastUpdated: new Date('2024-01-01'),
        },
        users: [
          { active: true, id: 3, name: 'Charlie' },
          { active: true, id: 4, name: 'Diana' },
          { active: false, id: 5, name: 'Eve' },
        ],
      };

      expect(() => void schema.parse(newData), 'not to throw');
    });

    it('should reject data that does not match the structure', () => {
      const schema = valueToSchema({ optional: 42, required: 'field' });

      expect(() => void schema.parse({ required: 'value' }), 'to throw'); // Missing optional
      expect(() => void schema.parse({ optional: 42 }), 'to throw'); // Missing required
      expect(
        () => void schema.parse({ optional: 42, required: 123 }),
        'to throw',
      ); // Wrong type
    });
  });
});
