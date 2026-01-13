/**
 * Tests for utility functions in @bupkis/property-testing.
 *
 * @packageDocumentation
 */

import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import {
  calculateNumRuns,
  hasKeyDeep,
  hasValueDeep,
  objectFilter,
  safeRegexStringFilter,
} from '../src/util.js';

describe('util', () => {
  describe('hasKeyDeep()', () => {
    describe('should return true when key exists', () => {
      it('should find key in top-level object', () => {
        const obj = { a: 1, b: 2 };
        expect(hasKeyDeep(obj, 'a'), 'to be true');
        expect(hasKeyDeep(obj, 'b'), 'to be true');
      });

      it('should find key in nested object', () => {
        const obj = { a: 1, b: { c: 2, d: 3 } };
        expect(hasKeyDeep(obj, 'c'), 'to be true');
        expect(hasKeyDeep(obj, 'd'), 'to be true');
      });

      it('should find key in deeply nested object', () => {
        const obj = { a: { b: { c: { d: { e: 1 } } } } };
        expect(hasKeyDeep(obj, 'e'), 'to be true');
      });

      it('should find key in array elements', () => {
        const obj = { arr: [{ x: 1 }, { y: 2 }] };
        expect(hasKeyDeep(obj, 'x'), 'to be true');
        expect(hasKeyDeep(obj, 'y'), 'to be true');
      });

      it('should find key in nested array', () => {
        const obj = { a: [{ b: [{ c: 1 }] }] };
        expect(hasKeyDeep(obj, 'c'), 'to be true');
      });

      it('should find numeric keys', () => {
        const obj = { 0: 'zero', 1: 'one' };
        expect(hasKeyDeep(obj, 0), 'to be true');
        expect(hasKeyDeep(obj, 1), 'to be true');
      });

      it('should find symbol keys', () => {
        const sym = Symbol('test');
        const obj = { [sym]: 'value' };
        expect(hasKeyDeep(obj, sym), 'to be true');
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
        expect(hasKeyDeep(obj, 'a'), 'to be true');
        expect(hasKeyDeep(obj, 'c'), 'to be true');
        expect(hasKeyDeep(obj, 'd'), 'to be true');
        expect(hasKeyDeep(obj, 'g'), 'to be true');
      });
    });

    describe('should return false when key does not exist', () => {
      it('should return false for non-existent key in object', () => {
        const obj = { a: 1, b: 2 };
        expect(hasKeyDeep(obj, 'c'), 'to be false');
        expect(hasKeyDeep(obj, 'x'), 'to be false');
      });

      it('should return false for non-existent key in nested structure', () => {
        const obj = { a: { b: { c: 1 } } };
        expect(hasKeyDeep(obj, 'x'), 'to be false');
      });

      it('should return false for empty object', () => {
        expect(hasKeyDeep({}, 'a'), 'to be false');
      });

      it('should return false for empty array', () => {
        expect(hasKeyDeep([], 'a'), 'to be false');
      });
    });

    describe('should handle primitive values', () => {
      it('should return false for null', () => {
        expect(hasKeyDeep(null, 'a'), 'to be false');
      });

      it('should return false for undefined', () => {
        expect(hasKeyDeep(undefined, 'a'), 'to be false');
      });

      it('should return false for numbers', () => {
        expect(hasKeyDeep(42, 'a'), 'to be false');
      });

      it('should return false for strings', () => {
        expect(hasKeyDeep('hello', 'a'), 'to be false');
      });

      it('should return false for booleans', () => {
        expect(hasKeyDeep(true, 'a'), 'to be false');
      });
    });

    describe('should handle circular references', () => {
      it('should not cause infinite recursion with circular object', () => {
        const obj: any = { a: 1 };
        obj.self = obj;
        expect(hasKeyDeep(obj, 'a'), 'to be true');
        expect(hasKeyDeep(obj, 'self'), 'to be true');
        expect(hasKeyDeep(obj, 'nonexistent'), 'to be false');
      });

      it('should handle circular references in nested structures', () => {
        const obj: any = { a: { b: 1 } };
        obj.a.circular = obj;
        expect(hasKeyDeep(obj, 'b'), 'to be true');
        expect(hasKeyDeep(obj, 'circular'), 'to be true');
        expect(hasKeyDeep(obj, 'nonexistent'), 'to be false');
      });

      it('should handle circular references in arrays', () => {
        const arr: any[] = [{ a: 1 }];
        arr.push(arr);
        expect(hasKeyDeep(arr, 'a'), 'to be true');
        expect(hasKeyDeep(arr, 'nonexistent'), 'to be false');
      });
    });

    describe('should handle edge cases', () => {
      it('should work with arrays containing mixed types', () => {
        const obj = { arr: [1, 'string', { key: 'value' }, null, undefined] };
        expect(hasKeyDeep(obj, 'key'), 'to be true');
        expect(hasKeyDeep(obj, 'missing'), 'to be false');
      });

      it('should work with objects having special property names', () => {
        const obj = {
          '': 'empty string key',
          ' ': 'space key',
          'special-chars!@#': 'special',
        };
        expect(hasKeyDeep(obj, ''), 'to be true');
        expect(hasKeyDeep(obj, ' '), 'to be true');
        expect(hasKeyDeep(obj, 'special-chars!@#'), 'to be true');
      });
    });
  });

  describe('hasValueDeep()', () => {
    describe('should return true when value exists', () => {
      it('should find value in top-level object', () => {
        const obj = { a: 1, b: 'hello' };
        expect(hasValueDeep(obj, 1), 'to be true');
        expect(hasValueDeep(obj, 'hello'), 'to be true');
      });

      it('should find value in nested object', () => {
        const obj = { a: 1, b: { c: 2, d: 'nested' } };
        expect(hasValueDeep(obj, 2), 'to be true');
        expect(hasValueDeep(obj, 'nested'), 'to be true');
      });

      it('should find value in deeply nested object', () => {
        const obj = { a: { b: { c: { d: { e: 'deep' } } } } };
        expect(hasValueDeep(obj, 'deep'), 'to be true');
      });

      it('should find value in array elements', () => {
        const obj = { arr: [1, 2, 3] };
        expect(hasValueDeep(obj, 1), 'to be true');
        expect(hasValueDeep(obj, 2), 'to be true');
        expect(hasValueDeep(obj, 3), 'to be true');
      });

      it('should find value in nested array', () => {
        const obj = { a: [{ b: [{ c: 'found' }] }] };
        expect(hasValueDeep(obj, 'found'), 'to be true');
      });

      it('should find exact object references', () => {
        const innerObj = { x: 1 };
        const obj = { a: innerObj };
        expect(hasValueDeep(obj, innerObj), 'to be true');
      });

      it('should find primitive values', () => {
        const obj = {
          bool: true,
          nil: null,
          num: 42,
          str: 'test',
          undef: undefined,
        };
        expect(hasValueDeep(obj, 42), 'to be true');
        expect(hasValueDeep(obj, 'test'), 'to be true');
        expect(hasValueDeep(obj, true), 'to be true');
        expect(hasValueDeep(obj, null), 'to be true');
        expect(hasValueDeep(obj, undefined), 'to be true');
      });

      it('should match the object itself', () => {
        const obj = { a: 1 };
        expect(hasValueDeep(obj, obj), 'to be true');
      });
    });

    describe('should handle empty objects specially', () => {
      it('should match empty objects', () => {
        const obj = { empty: {} };
        expect(hasValueDeep(obj, {}), 'to be true');
      });

      it('should match nested empty objects', () => {
        const obj = { a: { b: { empty: {} } } };
        expect(hasValueDeep(obj, {}), 'to be true');
      });

      it('should match multiple empty objects', () => {
        const obj = { empty1: {}, empty2: {} };
        expect(hasValueDeep(obj, {}), 'to be true');
      });

      it('should not match non-empty objects with empty object', () => {
        const obj = { notEmpty: { a: 1 } };
        expect(hasValueDeep(obj, {}), 'to be false');
      });
    });

    describe('should return false when value does not exist', () => {
      it('should return false for non-existent value in object', () => {
        const obj = { a: 1, b: 'hello' };
        expect(hasValueDeep(obj, 2), 'to be false');
        expect(hasValueDeep(obj, 'world'), 'to be false');
      });

      it('should return false for non-existent value in nested structure', () => {
        const obj = { a: { b: { c: 1 } } };
        expect(hasValueDeep(obj, 2), 'to be false');
      });

      it('should return false for empty object', () => {
        expect(hasValueDeep({}, 'anything'), 'to be false');
      });

      it('should return false for empty array', () => {
        expect(hasValueDeep([], 'anything'), 'to be false');
      });

      it('should use strict equality', () => {
        const obj = { a: 1, b: '2', c: true };
        expect(hasValueDeep(obj, '1'), 'to be false'); // 1 !== '1'
        expect(hasValueDeep(obj, 2), 'to be false'); // '2' !== 2
        expect(hasValueDeep(obj, 1), 'to be true'); // 1 === 1
        expect(hasValueDeep(obj, false), 'to be false'); // true !== false
      });
    });

    describe('should handle primitive inputs', () => {
      it('should handle null input', () => {
        expect(hasValueDeep(null, null), 'to be true');
        expect(hasValueDeep(null, 'anything'), 'to be false');
      });

      it('should handle undefined input', () => {
        expect(hasValueDeep(undefined, undefined), 'to be true');
        expect(hasValueDeep(undefined, 'anything'), 'to be false');
      });

      it('should handle number input', () => {
        expect(hasValueDeep(42, 42), 'to be true');
        expect(hasValueDeep(42, 43), 'to be false');
      });

      it('should handle string input', () => {
        expect(hasValueDeep('hello', 'hello'), 'to be true');
        expect(hasValueDeep('hello', 'world'), 'to be false');
      });

      it('should handle boolean input', () => {
        expect(hasValueDeep(true, true), 'to be true');
        expect(hasValueDeep(true, false), 'to be false');
      });
    });

    describe('should handle circular references', () => {
      it('should not cause infinite recursion with circular object', () => {
        const obj: any = { a: 1 };
        obj.self = obj;
        expect(hasValueDeep(obj, 1), 'to be true');
        expect(hasValueDeep(obj, obj), 'to be true');
        expect(hasValueDeep(obj, 'nonexistent'), 'to be false');
      });

      it('should handle circular references in nested structures', () => {
        const obj: any = { a: { b: 'value' } };
        obj.a.circular = obj;
        expect(hasValueDeep(obj, 'value'), 'to be true');
        expect(hasValueDeep(obj, obj), 'to be true');
        expect(hasValueDeep(obj, 'nonexistent'), 'to be false');
      });

      it('should handle circular references in arrays', () => {
        const arr: any[] = [{ a: 'value' }];
        arr.push(arr);
        expect(hasValueDeep(arr, 'value'), 'to be true');
        expect(hasValueDeep(arr, arr), 'to be true');
        expect(hasValueDeep(arr, 'nonexistent'), 'to be false');
      });
    });

    describe('should handle edge cases', () => {
      it('should work with arrays containing mixed types', () => {
        const obj = {
          arr: [1, 'string', { key: 'value' }, null, undefined, true],
        };
        expect(hasValueDeep(obj, 1), 'to be true');
        expect(hasValueDeep(obj, 'string'), 'to be true');
        expect(hasValueDeep(obj, 'value'), 'to be true');
        expect(hasValueDeep(obj, null), 'to be true');
        expect(hasValueDeep(obj, undefined), 'to be true');
        expect(hasValueDeep(obj, true), 'to be true');
        expect(hasValueDeep(obj, 'missing'), 'to be false');
      });

      it('should handle special values', () => {
        const obj = {
          emptyString: '',
          infinity: Infinity,
          nan: NaN,
          negativeZero: -0,
          zero: 0,
        };
        expect(hasValueDeep(obj, 0), 'to be true');
        expect(hasValueDeep(obj, ''), 'to be true');
        expect(hasValueDeep(obj, -0), 'to be true');
        expect(hasValueDeep(obj, Infinity), 'to be true');
        // Note: NaN !== NaN, so this should be false
        expect(hasValueDeep(obj, NaN), 'to be false');
      });

      it('should handle objects with special property values', () => {
        const symbol = Symbol('test');
        const obj = {
          bigint: 123n,
          date: new Date('2023-01-01'),
          symbol,
        };
        expect(hasValueDeep(obj, symbol), 'to be true');
        expect(hasValueDeep(obj, 123n), 'to be true');
        expect(hasValueDeep(obj, obj.date), 'to be true');
      });
    });
  });

  describe('objectFilter()', () => {
    describe('should reject objects with problematic keys', () => {
      it('should reject objects with __proto__ key at root', () => {
        // Using Object.defineProperty to avoid prototype pollution
        const obj = Object.defineProperty({}, '__proto__', {
          configurable: true,
          enumerable: true,
          value: 'bad',
          writable: true,
        });
        expect(objectFilter(obj), 'to be false');
      });

      it('should reject objects with __proto__ key deep in structure', () => {
        const obj = {
          a: {
            b: Object.defineProperty({}, '__proto__', {
              configurable: true,
              enumerable: true,
              value: 'bad',
              writable: true,
            }),
          },
        };
        expect(objectFilter(obj), 'to be false');
      });

      it('should reject objects with valueOf key at root', () => {
        const obj = { valueOf: 'bad' };
        expect(objectFilter(obj), 'to be false');
      });

      it('should reject objects with valueOf key deep in structure', () => {
        const obj = { nested: { deep: { valueOf: 'bad' } } };
        expect(objectFilter(obj), 'to be false');
      });

      it('should reject objects with toString key at root', () => {
        const obj = { toString: 'bad' };
        expect(objectFilter(obj), 'to be false');
      });

      it('should reject objects with toString key deep in structure', () => {
        const obj = { nested: { deep: { toString: 'bad' } } };
        expect(objectFilter(obj), 'to be false');
      });
    });

    describe('should reject objects containing empty objects', () => {
      it('should reject objects with empty object as value at root', () => {
        const obj = { empty: {} };
        expect(objectFilter(obj), 'to be false');
      });

      it('should reject objects with empty object deep in structure', () => {
        const obj = { a: { b: { c: {} } } };
        expect(objectFilter(obj), 'to be false');
      });

      it('should reject arrays containing empty objects', () => {
        const obj = { arr: [{}, { a: 1 }] };
        expect(objectFilter(obj), 'to be false');
      });
    });

    describe('should accept clean objects', () => {
      it('should accept simple objects without problematic keys', () => {
        const obj = { a: 1, b: 'hello', c: true };
        expect(objectFilter(obj), 'to be true');
      });

      it('should accept nested objects without problematic keys', () => {
        const obj = { a: { b: { c: { d: 'value' } } } };
        expect(objectFilter(obj), 'to be true');
      });

      it('should accept arrays with valid elements', () => {
        const obj = { arr: [1, 2, { a: 3 }] };
        expect(objectFilter(obj), 'to be true');
      });

      it('should accept primitives', () => {
        expect(objectFilter(null), 'to be true');
        expect(objectFilter(undefined), 'to be true');
        expect(objectFilter(42), 'to be true');
        expect(objectFilter('hello'), 'to be true');
        expect(objectFilter(true), 'to be true');
      });
    });
  });

  describe('safeRegexStringFilter()', () => {
    describe('should remove regex metacharacters', () => {
      it('should remove square brackets', () => {
        expect(safeRegexStringFilter('[a]'), 'to equal', 'a');
        expect(safeRegexStringFilter('[]'), 'to equal', '');
      });

      it('should remove parentheses', () => {
        expect(safeRegexStringFilter('(a)'), 'to equal', 'a');
        expect(safeRegexStringFilter('()'), 'to equal', '');
      });

      it('should remove curly braces', () => {
        expect(safeRegexStringFilter('{a}'), 'to equal', 'a');
        expect(safeRegexStringFilter('{}'), 'to equal', '');
      });

      it('should remove caret', () => {
        expect(safeRegexStringFilter('^abc'), 'to equal', 'abc');
      });

      it('should remove dollar sign', () => {
        expect(safeRegexStringFilter('abc$'), 'to equal', 'abc');
      });

      it('should remove asterisk', () => {
        expect(safeRegexStringFilter('a*b'), 'to equal', 'ab');
      });

      it('should remove plus', () => {
        expect(safeRegexStringFilter('a+b'), 'to equal', 'ab');
      });

      it('should remove question mark', () => {
        expect(safeRegexStringFilter('a?b'), 'to equal', 'ab');
      });

      it('should remove dot', () => {
        expect(safeRegexStringFilter('a.b'), 'to equal', 'ab');
      });

      it('should remove backslash', () => {
        expect(safeRegexStringFilter('a\\b'), 'to equal', 'ab');
      });

      it('should remove pipe', () => {
        expect(safeRegexStringFilter('a|b'), 'to equal', 'ab');
      });

      it('should remove all metacharacters at once', () => {
        expect(safeRegexStringFilter('[](){ }^$*+?.\\|'), 'to equal', ' ');
      });
    });

    describe('should preserve safe characters', () => {
      it('should preserve alphanumeric characters', () => {
        expect(safeRegexStringFilter('abc123'), 'to equal', 'abc123');
      });

      it('should preserve spaces', () => {
        expect(safeRegexStringFilter('hello world'), 'to equal', 'hello world');
      });

      it('should preserve other safe characters', () => {
        expect(safeRegexStringFilter('a-b_c!@#'), 'to equal', 'a-b_c!@#');
      });

      it('should work with empty strings', () => {
        expect(safeRegexStringFilter(''), 'to equal', '');
      });
    });
  });

  describe('calculateNumRuns()', () => {
    // Save original env values to restore after tests
    const originalEnv = { ...process.env };

    const resetEnv = () => {
      delete process.env.WALLABY;
      delete process.env.CI;
      delete process.env.NUM_RUNS;
    };

    const restoreEnv = () => {
      process.env = { ...originalEnv };
    };

    describe('should return correct base values', () => {
      it('should return 50 for small', () => {
        resetEnv();
        expect(calculateNumRuns('small'), 'to equal', 50);
        restoreEnv();
      });

      it('should return 250 for medium', () => {
        resetEnv();
        expect(calculateNumRuns('medium'), 'to equal', 250);
        restoreEnv();
      });

      it('should return 500 for large', () => {
        resetEnv();
        expect(calculateNumRuns('large'), 'to equal', 500);
        restoreEnv();
      });

      it('should default to medium when no size provided', () => {
        resetEnv();
        expect(calculateNumRuns(), 'to equal', 250);
        restoreEnv();
      });
    });

    describe('should respect WALLABY environment variable', () => {
      it('should divide by 10 when WALLABY is set', () => {
        resetEnv();
        process.env.WALLABY = 'true';
        expect(calculateNumRuns('small'), 'to equal', 5);
        expect(calculateNumRuns('medium'), 'to equal', 25);
        expect(calculateNumRuns('large'), 'to equal', 50);
        restoreEnv();
      });
    });

    describe('should respect CI environment variable', () => {
      it('should divide by 5 when CI is set (and WALLABY is not)', () => {
        resetEnv();
        process.env.CI = 'true';
        expect(calculateNumRuns('small'), 'to equal', 10);
        expect(calculateNumRuns('medium'), 'to equal', 50);
        expect(calculateNumRuns('large'), 'to equal', 100);
        restoreEnv();
      });
    });

    describe('should respect NUM_RUNS environment variable', () => {
      it('should use NUM_RUNS when set (and WALLABY/CI are not)', () => {
        resetEnv();
        process.env.NUM_RUNS = '42';
        expect(calculateNumRuns('small'), 'to equal', 42);
        expect(calculateNumRuns('medium'), 'to equal', 42);
        expect(calculateNumRuns('large'), 'to equal', 42);
        restoreEnv();
      });
    });

    describe('should prioritize env variables correctly', () => {
      it('should prioritize WALLABY over CI', () => {
        resetEnv();
        process.env.WALLABY = 'true';
        process.env.CI = 'true';
        // WALLABY divides by 10, CI divides by 5
        // WALLABY should take precedence
        expect(calculateNumRuns('medium'), 'to equal', 25);
        restoreEnv();
      });

      it('should prioritize WALLABY over NUM_RUNS', () => {
        resetEnv();
        process.env.WALLABY = 'true';
        process.env.NUM_RUNS = '1000';
        expect(calculateNumRuns('medium'), 'to equal', 25);
        restoreEnv();
      });

      it('should prioritize CI over NUM_RUNS', () => {
        resetEnv();
        process.env.CI = 'true';
        process.env.NUM_RUNS = '1000';
        expect(calculateNumRuns('medium'), 'to equal', 50);
        restoreEnv();
      });
    });
  });
});
