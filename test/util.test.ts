import { describe, it } from 'node:test';

import { expect } from '../src/index.js';
import { hasKey, hasValue } from '../src/util.js';

describe('util module', () => {
  describe('hasKey', () => {
    describe('should return true when key exists', () => {
      it('should find key in top-level object', () => {
        const obj = { a: 1, b: 2 };
        expect(hasKey(obj, 'a'), 'to be true');
        expect(hasKey(obj, 'b'), 'to be true');
      });

      it('should find key in nested object', () => {
        const obj = { a: 1, b: { c: 2, d: 3 } };
        expect(hasKey(obj, 'c'), 'to be true');
        expect(hasKey(obj, 'd'), 'to be true');
      });

      it('should find key in deeply nested object', () => {
        const obj = { a: { b: { c: { d: { e: 1 } } } } };
        expect(hasKey(obj, 'e'), 'to be true');
      });

      it('should find key in array elements', () => {
        const obj = { arr: [{ x: 1 }, { y: 2 }] };
        expect(hasKey(obj, 'x'), 'to be true');
        expect(hasKey(obj, 'y'), 'to be true');
      });

      it('should find key in nested array', () => {
        const obj = { a: [{ b: [{ c: 1 }] }] };
        expect(hasKey(obj, 'c'), 'to be true');
      });

      it('should find numeric keys', () => {
        const obj = { 0: 'zero', 1: 'one' };
        expect(hasKey(obj, 0), 'to be true');
        expect(hasKey(obj, 1), 'to be true');
      });

      it('should find symbol keys', () => {
        const sym = Symbol('test');
        const obj = { [sym]: 'value' };
        expect(hasKey(obj, sym), 'to be true');
      });

      it('should find key in mixed structure', () => {
        const obj = {
          a: 1,
          b: [
            { c: 2 },
            [{ d: 3 }],
            {
              e: {
                f: [{ g: 4 }],
              },
            },
          ],
        };
        expect(hasKey(obj, 'a'), 'to be true');
        expect(hasKey(obj, 'c'), 'to be true');
        expect(hasKey(obj, 'd'), 'to be true');
        expect(hasKey(obj, 'g'), 'to be true');
      });
    });

    describe('should return false when key does not exist', () => {
      it('should return false for non-existent key in object', () => {
        const obj = { a: 1, b: 2 };
        expect(hasKey(obj, 'c'), 'to be false');
        expect(hasKey(obj, 'x'), 'to be false');
      });

      it('should return false for non-existent key in nested structure', () => {
        const obj = { a: { b: { c: 1 } } };
        expect(hasKey(obj, 'x'), 'to be false');
      });

      it('should return false for empty object', () => {
        expect(hasKey({}, 'a'), 'to be false');
      });

      it('should return false for empty array', () => {
        expect(hasKey([], 'a'), 'to be false');
      });
    });

    describe('should handle primitive values', () => {
      it('should return false for null', () => {
        expect(hasKey(null, 'a'), 'to be false');
      });

      it('should return false for undefined', () => {
        expect(hasKey(undefined, 'a'), 'to be false');
      });

      it('should return false for numbers', () => {
        expect(hasKey(42, 'a'), 'to be false');
      });

      it('should return false for strings', () => {
        expect(hasKey('hello', 'a'), 'to be false');
      });

      it('should return false for booleans', () => {
        expect(hasKey(true, 'a'), 'to be false');
      });
    });

    describe('should handle circular references', () => {
      it('should not cause infinite recursion with circular object', () => {
        const obj: any = { a: 1 };
        obj.self = obj;
        expect(hasKey(obj, 'a'), 'to be true');
        expect(hasKey(obj, 'self'), 'to be true');
        expect(hasKey(obj, 'nonexistent'), 'to be false');
      });

      it('should handle circular references in nested structures', () => {
        const obj: any = { a: { b: 1 } };
        obj.a.circular = obj;
        expect(hasKey(obj, 'b'), 'to be true');
        expect(hasKey(obj, 'circular'), 'to be true');
        expect(hasKey(obj, 'nonexistent'), 'to be false');
      });

      it('should handle circular references in arrays', () => {
        const arr: any[] = [{ a: 1 }];
        arr.push(arr);
        expect(hasKey(arr, 'a'), 'to be true');
        expect(hasKey(arr, 'nonexistent'), 'to be false');
      });
    });

    describe('should handle edge cases', () => {
      it('should work with arrays containing mixed types', () => {
        const obj = { arr: [1, 'string', { key: 'value' }, null, undefined] };
        expect(hasKey(obj, 'key'), 'to be true');
        expect(hasKey(obj, 'missing'), 'to be false');
      });

      it('should work with objects having special property names', () => {
        const obj = {
          '': 'empty string key',
          ' ': 'space key',
          'special-chars!@#': 'special',
        };
        expect(hasKey(obj, ''), 'to be true');
        expect(hasKey(obj, ' '), 'to be true');
        expect(hasKey(obj, 'special-chars!@#'), 'to be true');
      });
    });
  });

  describe('hasValue', () => {
    describe('should return true when value exists', () => {
      it('should find value in top-level object', () => {
        const obj = { a: 1, b: 'hello' };
        expect(hasValue(obj, 1), 'to be true');
        expect(hasValue(obj, 'hello'), 'to be true');
      });

      it('should find value in nested object', () => {
        const obj = { a: 1, b: { c: 2, d: 'nested' } };
        expect(hasValue(obj, 2), 'to be true');
        expect(hasValue(obj, 'nested'), 'to be true');
      });

      it('should find value in deeply nested object', () => {
        const obj = { a: { b: { c: { d: { e: 'deep' } } } } };
        expect(hasValue(obj, 'deep'), 'to be true');
      });

      it('should find value in array elements', () => {
        const obj = { arr: [1, 2, 3] };
        expect(hasValue(obj, 1), 'to be true');
        expect(hasValue(obj, 2), 'to be true');
        expect(hasValue(obj, 3), 'to be true');
      });

      it('should find value in nested array', () => {
        const obj = { a: [{ b: [{ c: 'found' }] }] };
        expect(hasValue(obj, 'found'), 'to be true');
      });

      it('should find exact object references', () => {
        const innerObj = { x: 1 };
        const obj = { a: innerObj };
        expect(hasValue(obj, innerObj), 'to be true');
      });

      it('should find primitive values', () => {
        const obj = {
          bool: true,
          nil: null,
          num: 42,
          str: 'test',
          undef: undefined,
        };
        expect(hasValue(obj, 42), 'to be true');
        expect(hasValue(obj, 'test'), 'to be true');
        expect(hasValue(obj, true), 'to be true');
        expect(hasValue(obj, null), 'to be true');
        expect(hasValue(obj, undefined), 'to be true');
      });

      it('should match the object itself', () => {
        const obj = { a: 1 };
        expect(hasValue(obj, obj), 'to be true');
      });
    });

    describe('should handle empty objects specially', () => {
      it('should match empty objects', () => {
        const obj = { empty: {} };
        expect(hasValue(obj, {}), 'to be true');
      });

      it('should match nested empty objects', () => {
        const obj = { a: { b: { empty: {} } } };
        expect(hasValue(obj, {}), 'to be true');
      });

      it('should match multiple empty objects', () => {
        const obj = { empty1: {}, empty2: {} };
        expect(hasValue(obj, {}), 'to be true');
      });

      it('should not match non-empty objects with empty object', () => {
        const obj = { notEmpty: { a: 1 } };
        expect(hasValue(obj, {}), 'to be false');
      });
    });

    describe('should return false when value does not exist', () => {
      it('should return false for non-existent value in object', () => {
        const obj = { a: 1, b: 'hello' };
        expect(hasValue(obj, 2), 'to be false');
        expect(hasValue(obj, 'world'), 'to be false');
      });

      it('should return false for non-existent value in nested structure', () => {
        const obj = { a: { b: { c: 1 } } };
        expect(hasValue(obj, 2), 'to be false');
      });

      it('should return false for empty object', () => {
        expect(hasValue({}, 'anything'), 'to be false');
      });

      it('should return false for empty array', () => {
        expect(hasValue([], 'anything'), 'to be false');
      });

      it('should use strict equality', () => {
        const obj = { a: 1, b: '2', c: true };
        expect(hasValue(obj, '1'), 'to be false'); // 1 !== '1'
        expect(hasValue(obj, 2), 'to be false'); // '2' !== 2
        expect(hasValue(obj, 1), 'to be true'); // 1 === 1
        expect(hasValue(obj, false), 'to be false'); // true !== false
      });
    });

    describe('should handle primitive inputs', () => {
      it('should handle null input', () => {
        expect(hasValue(null, null), 'to be true');
        expect(hasValue(null, 'anything'), 'to be false');
      });

      it('should handle undefined input', () => {
        expect(hasValue(undefined, undefined), 'to be true');
        expect(hasValue(undefined, 'anything'), 'to be false');
      });

      it('should handle number input', () => {
        expect(hasValue(42, 42), 'to be true');
        expect(hasValue(42, 43), 'to be false');
      });

      it('should handle string input', () => {
        expect(hasValue('hello', 'hello'), 'to be true');
        expect(hasValue('hello', 'world'), 'to be false');
      });

      it('should handle boolean input', () => {
        expect(hasValue(true, true), 'to be true');
        expect(hasValue(true, false), 'to be false');
      });
    });

    describe('should handle circular references', () => {
      it('should not cause infinite recursion with circular object', () => {
        const obj: any = { a: 1 };
        obj.self = obj;
        expect(hasValue(obj, 1), 'to be true');
        expect(hasValue(obj, obj), 'to be true');
        expect(hasValue(obj, 'nonexistent'), 'to be false');
      });

      it('should handle circular references in nested structures', () => {
        const obj: any = { a: { b: 'value' } };
        obj.a.circular = obj;
        expect(hasValue(obj, 'value'), 'to be true');
        expect(hasValue(obj, obj), 'to be true');
        expect(hasValue(obj, 'nonexistent'), 'to be false');
      });

      it('should handle circular references in arrays', () => {
        const arr: any[] = [{ a: 'value' }];
        arr.push(arr);
        expect(hasValue(arr, 'value'), 'to be true');
        expect(hasValue(arr, arr), 'to be true');
        expect(hasValue(arr, 'nonexistent'), 'to be false');
      });
    });

    describe('should handle edge cases', () => {
      it('should work with arrays containing mixed types', () => {
        const obj = {
          arr: [1, 'string', { key: 'value' }, null, undefined, true],
        };
        expect(hasValue(obj, 1), 'to be true');
        expect(hasValue(obj, 'string'), 'to be true');
        expect(hasValue(obj, 'value'), 'to be true');
        expect(hasValue(obj, null), 'to be true');
        expect(hasValue(obj, undefined), 'to be true');
        expect(hasValue(obj, true), 'to be true');
        expect(hasValue(obj, 'missing'), 'to be false');
      });

      it('should handle special values', () => {
        const obj = {
          emptyString: '',
          infinity: Infinity,
          nan: NaN,
          negativeZero: -0,
          zero: 0,
        };
        expect(hasValue(obj, 0), 'to be true');
        expect(hasValue(obj, ''), 'to be true');
        expect(hasValue(obj, -0), 'to be true');
        expect(hasValue(obj, Infinity), 'to be true');
        // Note: NaN !== NaN, so this should be false
        expect(hasValue(obj, NaN), 'to be false');
      });

      it('should handle objects with special property values', () => {
        const symbol = Symbol('test');
        const obj = {
          bigint: 123n,
          date: new Date('2023-01-01'),
          symbol,
        };
        expect(hasValue(obj, symbol), 'to be true');
        expect(hasValue(obj, 123n), 'to be true');
        expect(hasValue(obj, obj.date), 'to be true');
      });
    });
  });
});
