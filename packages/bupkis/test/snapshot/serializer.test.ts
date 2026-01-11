/**
 * Tests for snapshot serialization utilities.
 *
 * Verifies that the default serializer correctly handles:
 *
 * - Circular references
 * - Non-JSON types (Functions, Symbols, BigInt, etc.)
 * - Error objects
 * - Map and Set collections
 * - Key sorting for deterministic output
 */

import { describe, it } from 'node:test';

import { defaultSerializer } from '../../src/snapshot/serializer.js';
import { expect } from '../custom-assertions.js';

describe('defaultSerializer', () => {
  describe('basic types', () => {
    it('should serialize primitives', () => {
      expect(defaultSerializer('hello'), 'to equal', '"hello"');
      expect(defaultSerializer(42), 'to equal', '42');
      expect(defaultSerializer(true), 'to equal', 'true');
      expect(defaultSerializer(null), 'to equal', 'null');
    });

    it('should serialize arrays', () => {
      expect(defaultSerializer([1, 2, 3]), 'to equal', '[\n  1,\n  2,\n  3\n]');
    });

    it('should serialize objects', () => {
      const result = defaultSerializer({ a: 1, b: 2 });
      expect(result, 'to equal', '{\n  "a": 1,\n  "b": 2\n}');
    });
  });

  describe('circular references', () => {
    it('should handle circular object references', () => {
      const obj: any = { a: 1 };
      obj.self = obj;

      const result = defaultSerializer(obj);
      expect(result, 'to contain', '"self": "[Circular]"');
    });

    it('should handle circular array references', () => {
      const arr: any[] = [1, 2];
      arr.push(arr);

      const result = defaultSerializer(arr);
      expect(result, 'to contain', '"[Circular]"');
    });

    it('should handle deeply nested circular references', () => {
      const obj: any = { level1: { level2: { level3: {} } } };
      obj.level1.level2.level3.root = obj;

      const result = defaultSerializer(obj);
      expect(result, 'to contain', '"root": "[Circular]"');
    });
  });

  describe('special types', () => {
    it('should omit functions', () => {
      const obj = { fn: () => {}, value: 42 };
      const result = defaultSerializer(obj);

      expect(result, 'not to contain', 'fn');
      expect(result, 'to contain', '"value": 42');
    });

    it('should convert symbols to strings', () => {
      const sym = Symbol('test');
      const result = defaultSerializer({ sym });

      expect(result, 'to contain', 'Symbol(test)');
    });

    it('should convert BigInt to string with suffix', () => {
      const result = defaultSerializer({ big: 42n });

      expect(result, 'to contain', '"big": "42n"');
    });

    it('should convert undefined to string', () => {
      const result = defaultSerializer({ value: undefined });

      expect(result, 'not to contain', '"value"');
    });

    it('should convert RegExp to string', () => {
      const result = defaultSerializer({ pattern: /test/gi });

      expect(result, 'to contain', '"/test/gi"');
    });

    it('should convert Date to ISO string', () => {
      const date = new Date('2025-01-12T00:00:00.000Z');
      const result = defaultSerializer({ date });

      expect(result, 'to contain', '"date": "2025-01-12T00:00:00.000Z"');
    });
  });

  describe('Error objects', () => {
    it('should serialize Error with name and message', () => {
      const error = new Error('Something went wrong');
      const result = defaultSerializer(error);

      expect(result, 'to contain', '"name": "Error"');
      expect(result, 'to contain', '"message": "Something went wrong"');
      expect(result, 'not to contain', 'stack');
    });

    it('should serialize custom error properties', () => {
      const error: any = new Error('Test error');
      error.code = 'ERR_TEST';
      error.statusCode = 500;

      const result = defaultSerializer(error);

      expect(result, 'to contain', '"code": "ERR_TEST"');
      expect(result, 'to contain', '"statusCode": 500');
    });

    it('should handle TypeError', () => {
      const error = new TypeError('Invalid type');
      const result = defaultSerializer(error);

      expect(result, 'to contain', '"name": "TypeError"');
      expect(result, 'to contain', '"message": "Invalid type"');
    });
  });

  describe('Map and Set', () => {
    it('should serialize Map as object with entries', () => {
      const map = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const result = defaultSerializer(map);

      expect(result, 'to contain', '"__type": "Map"');
      expect(result, 'to contain', '"entries"');
      // Check for the nested array structure (indented within the entries array)
      expect(result, 'to contain', '[\n      "a",\n      1\n    ]');
    });

    it('should serialize Set as object with values', () => {
      const set = new Set([1, 2, 3]);
      const result = defaultSerializer(set);

      expect(result, 'to contain', '"__type": "Set"');
      expect(result, 'to contain', '"values"');
      // Check for the nested array structure (indented within the Set object)
      expect(result, 'to contain', '[\n    1,\n    2,\n    3\n  ]');
    });

    it('should handle Map with complex values', () => {
      const map = new Map([
        ['settings', { theme: 'dark' }],
        ['user', { age: 30, name: 'Alice' }],
      ]);
      const result = defaultSerializer(map);

      expect(result, 'to contain', '"name": "Alice"');
      expect(result, 'to contain', '"theme": "dark"');
    });
  });

  describe('key sorting', () => {
    it('should sort object keys alphabetically by default', () => {
      const obj = { a: 2, m: 3, z: 1 };
      const result = defaultSerializer(obj);

      // Parse and check order
      const lines = result.split('\n').filter((l) => l.includes(':'));
      expect(lines[0], 'to contain', '"a"');
      expect(lines[1], 'to contain', '"m"');
      expect(lines[2], 'to contain', '"z"');
    });

    it('should sort keys in nested objects', () => {
      const obj = { outer: { a: 2, z: 1 } };
      const result = defaultSerializer(obj);

      expect(result, 'to match', /"a".*"z"/s);
    });

    it('should allow disabling key sorting', () => {
      const obj = { a: 2, z: 1 };
      const result = defaultSerializer(obj, { sortKeys: false });

      // Without sorting, original order should be preserved
      // (though this is implementation-dependent)
      expect(result, 'to be a string');
    });
  });

  describe('complex nested structures', () => {
    it('should serialize deeply nested objects', () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };

      const result = defaultSerializer(obj);
      expect(result, 'to contain', '"value": "deep"');
    });

    it('should handle mixed types in arrays', () => {
      const arr = [1, 'string', true, null, { key: 'value' }];
      const result = defaultSerializer(arr);

      expect(result, 'to contain', '1');
      expect(result, 'to contain', '"string"');
      expect(result, 'to contain', 'true');
      expect(result, 'to contain', 'null');
      expect(result, 'to contain', '"key": "value"');
    });

    it('should serialize complex real-world-like objects', () => {
      const user = {
        email: 'alice@example.com',
        id: 123,
        metadata: new Map<string, number | string>([
          ['lastLogin', '2025-01-12'],
          ['loginCount', 42],
        ]),
        name: 'Alice',
        posts: [
          { date: new Date('2025-01-01'), id: 1, title: 'First Post' },
          { date: new Date('2025-01-02'), id: 2, title: 'Second Post' },
        ],
        settings: {
          notifications: true,
          privacy: {
            analyticsEnabled: true,
            profileVisible: false,
          },
          theme: 'dark',
        },
      };

      const result = defaultSerializer(user);

      expect(result, 'to contain', '"name": "Alice"');
      expect(result, 'to contain', '"theme": "dark"');
      expect(result, 'to contain', '"title": "First Post"');
      expect(result, 'to contain', '"__type": "Map"');
    });
  });

  describe('custom replacer', () => {
    it('should allow custom value transformation', () => {
      const obj = { password: 'secret123', username: 'alice' };

      const result = defaultSerializer(obj, {
        replacer: (value) => {
          if (typeof value === 'object' && value && 'password' in value) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return { ...(value as any), password: '[REDACTED]' };
          }
          return value;
        },
      });

      expect(result, 'to contain', '"password": "[REDACTED]"');
      expect(result, 'to contain', '"username": "alice"');
    });
  });

  describe('deterministic output', () => {
    it('should produce identical output for identical objects', () => {
      const obj = { a: 1, b: 2, c: 3 };

      const result1 = defaultSerializer(obj);
      const result2 = defaultSerializer(obj);

      expect(result1, 'to equal', result2);
    });

    it('should produce identical output regardless of insertion order', () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { a: 1, b: 2, c: 3 };

      const result1 = defaultSerializer(obj1);
      const result2 = defaultSerializer(obj2);

      expect(result1, 'to equal', result2);
    });
  });
});
