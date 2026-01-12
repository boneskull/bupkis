/**
 * Unit tests for diff utilities
 */

import { describe, it } from 'node:test';
import { z } from 'zod';

import { expect } from '../src/bootstrap.js';
import {
  type DiffValues,
  extractDiffValues,
  generateDiff,
  shouldGenerateDiff,
} from '../src/diff.js';

describe('diff utilities', () => {
  describe('extractDiffValues', () => {
    it('should handle invalid_type errors for primitives', () => {
      const schema = z.string();
      const subject = 42;
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', 42);
        expect(expected, 'to be', '42');
      }
    });

    it('should handle invalid_type errors for arrays', () => {
      const schema = z.array(z.string());
      const subject = 'not-array';
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', 'not-array');
        expect(expected, 'to deep equal', []);
      }
    });

    it('should handle invalid_type errors for objects', () => {
      const schema = z.object({ name: z.string() });
      const subject = 'not-object';
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', 'not-object');
        expect(expected, 'to deep equal', {});
      }
    });

    it('should handle invalid_type errors for booleans', () => {
      const schema = z.boolean();
      const subject = 'truthy';
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', 'truthy');
        expect(expected, 'to be', true);
      }
    });

    it('should handle invalid_type errors for null', () => {
      const schema = z.null();
      const subject = 'not-null';
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', 'not-null');
        expect(expected, 'to be', null);
      }
    });

    it('should handle invalid_type errors for undefined', () => {
      const schema = z.undefined();
      const subject = 'not-undefined';
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', 'not-undefined');
        expect(expected, 'to be', undefined);
      }
    });

    it('should handle invalid_value errors with available values', () => {
      const schema = z.literal('hello');
      const subject = 'world';
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', 'world');
        expect(expected, 'to be', 'hello');
      }
    });

    it('should handle enum errors with multiple valid values', () => {
      const schema = z.enum(['red', 'green', 'blue']);
      const subject = 'yellow';
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', 'yellow');
        expect(expected, 'to be', 'red'); // First valid value
      }
    });

    it('should handle too_big errors for strings', () => {
      const schema = z.string().max(5);
      const subject = 'toolongstring';
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', 'toolongstring');
        expect(expected, 'to be', 'toolo'); // Truncated to max length
      }
    });

    it('should handle too_big errors for arrays', () => {
      const schema = z.array(z.string()).max(2);
      const subject = ['a', 'b', 'c', 'd'];
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to deep equal', ['a', 'b', 'c', 'd']);
        expect(expected, 'to deep equal', ['a', 'b']); // Truncated to max length
      }
    });

    it('should handle too_big errors for numbers', () => {
      const schema = z.number().max(10);
      const subject = 15;
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', 15);
        expect(expected, 'to be', 10); // Maximum value
      }
    });

    it('should handle too_small errors for strings', () => {
      const schema = z.string().min(10);
      const subject = 'short';
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', 'short');
        expect(expected, 'to be', 'shortxxxxx'); // Padded with 'x' to reach minimum
      }
    });

    it('should handle too_small errors for arrays', () => {
      const schema = z.array(z.string()).min(3);
      const subject = ['a'];
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to deep equal', ['a']);
        expect(expected, 'to deep equal', ['a', null, null]); // Padded with null to reach minimum
      }
    });

    it('should handle too_small errors for numbers', () => {
      const schema = z.number().min(10);
      const subject = 5;
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', 5);
        expect(expected, 'to be', 10); // Minimum value
      }
    });

    it('should handle unrecognized_keys errors', () => {
      const schema = z.object({ name: z.string() }).strict();
      const subject = { age: 30, city: 'NYC', name: 'John' };
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to deep equal', { age: 30, city: 'NYC', name: 'John' });
        expect(expected, 'to deep equal', { name: 'John' }); // Unrecognized keys removed
      }
    });

    it('should handle nested object errors', () => {
      const schema = z.object({
        user: z.object({
          age: z.number(),
          name: z.string(),
        }),
      });
      const subject = {
        user: {
          age: 'thirty', // Should be number
          name: 123, // Should be string
        },
      };
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to deep equal', subject);
        expect(expected, 'to deep equal', {
          user: {
            age: 0, // Converted to number (NaN becomes 0)
            name: '123', // Converted to string
          },
        });
      }
    });

    it('should handle array element errors', () => {
      const schema = z.array(z.number());
      const subject = [1, '2', 3, 'four'];
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to deep equal', [1, '2', 3, 'four']);
        expect(expected, 'to deep equal', [1, 2, 3, 0]); // Strings converted to numbers
      }
    });

    it('should handle null subject gracefully', () => {
      const schema = z.string();
      const subject = null;
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', null);
        expect(expected, 'to be', ''); // null converted to empty string
      }
    });

    it('should handle undefined subject gracefully', () => {
      const schema = z.string();
      const subject = undefined;
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', undefined);
        expect(expected, 'to be', ''); // undefined converted to empty string
      }
    });

    it('should handle complex object to string conversion', () => {
      const schema = z.string();
      const subject = { complex: 'object' };
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', subject);
        expect(expected, 'to be', JSON.stringify(subject)); // Object stringified
      }
    });

    it('should handle unknown error codes gracefully', () => {
      // Create a valid string first, then add a custom error code
      const schema = z.string().superRefine((val, ctx) => {
        ctx.addIssue({
          code: 'custom' as any, // Use custom code which behaves like unknown
          message: 'Unknown error code for testing',
          path: [],
        });
      });
      const subject = 'valid-string'; // Use valid string to avoid type conversion
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', 'valid-string');
        // Should not modify the expected value for unknown codes
        expect(expected, 'to be', 'valid-string');
      }
    });

    it('should handle errors during path traversal gracefully', () => {
      const schema = z.object({ nested: z.string() });
      const subject = { nested: 123 };
      const result = schema.safeParse(subject);

      if (!result.success) {
        // This should not throw even with complex path issues
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to deep equal', subject);
        expect(expected, 'to deep equal', { nested: '123' });
      }
    });

    it('should handle symbol keys in path by filtering them out', () => {
      const symbolKey = Symbol('test');
      const schema = z
        .object({
          nested: z.string(),
        })
        .superRefine((val, ctx) => {
          ctx.addIssue({
            code: 'invalid_type',
            expected: 'string',
            message: 'Expected string with symbol in path',
            path: [symbolKey, 'nested'], // Symbol should be filtered out
            received: 'number',
          });
        });
      const subject = { nested: 123 };
      const result = schema.safeParse(subject);

      if (!result.success) {
        // Should not throw and should handle symbol filtering
        const { actual } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', subject);
      }
    });
  });

  describe('generateDiff', () => {
    it('should generate diff for different primitive values', () => {
      const result = generateDiff('expected', 'actual');

      if (result !== null) {
        expect(result, 'to match', /expected/);
        expect(result, 'to match', /actual/);
        expect(result, 'to match', /-\s*expected/); // More flexible regex for jest-diff format
        expect(result, 'to match', /\+\s*actual/); // More flexible regex for jest-diff format
      }
    });

    it('should generate diff for different objects', () => {
      const expected = { age: 25, name: 'John' };
      const actual = { age: 30, name: 'Jane' };
      const result = generateDiff(expected, actual);

      if (result !== null) {
        expect(result, 'to match', /John/);
        expect(result, 'to match', /Jane/);
        expect(result, 'to match', /25/);
        expect(result, 'to match', /30/);
      }
    });

    it('should generate diff for different arrays', () => {
      const expected = [1, 2, 3];
      const actual = [1, 2, 4];
      const result = generateDiff(expected, actual);

      if (result !== null) {
        expect(result, 'to match', /-\s*3/); // More flexible regex for jest-diff format
        expect(result, 'to match', /\+\s*4/); // More flexible regex for jest-diff format
      }
    });

    it('should return null for identical values', () => {
      const value = { age: 25, name: 'John' };
      const result = generateDiff(value, value);
      expect(result, 'to be', null);
    });

    it('should accept custom diff options', () => {
      const result = generateDiff('expected', 'actual', {
        expand: true,
        includeChangeCounts: false,
      });

      if (result !== null) {
        // With expand: true, should show more context
        expect(result, 'to match', /expected/);
        expect(result, 'to match', /actual/);
      }
    });

    it('should handle undefined values', () => {
      const result = generateDiff(undefined, 'actual');

      if (result !== null) {
        expect(result, 'to match', /undefined/);
        expect(result, 'to match', /string/); // jest-diff shows "received string" instead of "actual"
      }
    });

    it('should handle null values', () => {
      const result = generateDiff(null, 'actual');

      if (result !== null) {
        expect(result, 'to match', /null/);
        expect(result, 'to match', /string/); // jest-diff shows "received string" instead of "actual"
      }
    });

    it('should use custom annotations from options', () => {
      const result = generateDiff('expected', 'actual', {
        aAnnotation: 'wanted',
        bAnnotation: 'received',
      });

      if (result !== null) {
        expect(result, 'to match', /wanted/);
        expect(result, 'to match', /received/);
      }
    });
  });

  describe('shouldGenerateDiff', () => {
    it('should return true for different defined values', () => {
      expect(shouldGenerateDiff('actual', 'expected'), 'to be', true);
      expect(shouldGenerateDiff(123, 456), 'to be', true);
      expect(shouldGenerateDiff({ a: 1 }, { b: 2 }), 'to be', true);
      expect(shouldGenerateDiff([1, 2], [3, 4]), 'to be', true);
      expect(shouldGenerateDiff(null, 'something'), 'to be', true);
    });

    it('should return false for identical values', () => {
      expect(shouldGenerateDiff('same', 'same'), 'to be', false);
      expect(shouldGenerateDiff(123, 123), 'to be', false);
      expect(shouldGenerateDiff(null, null), 'to be', false);

      const obj = { a: 1 };
      expect(shouldGenerateDiff(obj, obj), 'to be', false);
    });

    it('should return false when actual is undefined', () => {
      expect(shouldGenerateDiff(undefined, 'expected'), 'to be', false);
      expect(shouldGenerateDiff(undefined, 123), 'to be', false);
      expect(shouldGenerateDiff(undefined, null), 'to be', false);
      expect(shouldGenerateDiff(undefined, undefined), 'to be', false);
    });

    it('should return false when expected is undefined', () => {
      expect(shouldGenerateDiff('actual', undefined), 'to be', false);
      expect(shouldGenerateDiff(123, undefined), 'to be', false);
      expect(shouldGenerateDiff(null, undefined), 'to be', false);
    });

    it('should return false when both are undefined', () => {
      expect(shouldGenerateDiff(undefined, undefined), 'to be', false);
    });

    it('should handle edge cases with falsy values', () => {
      expect(shouldGenerateDiff(0, 1), 'to be', true);
      expect(shouldGenerateDiff('', 'text'), 'to be', true);
      expect(shouldGenerateDiff(false, true), 'to be', true);
      expect(shouldGenerateDiff(0, 0), 'to be', false);
      expect(shouldGenerateDiff('', ''), 'to be', false);
      expect(shouldGenerateDiff(false, false), 'to be', false);
    });
  });

  describe('DiffValues type', () => {
    it('should properly type the return value of extractDiffValues', () => {
      const schema = z.string();
      const subject = 123;
      const result = schema.safeParse(subject);

      if (!result.success) {
        const diffValues: DiffValues = extractDiffValues(result.error, subject);

        // These should be typed as unknown
        expect(typeof diffValues.actual, 'to be', 'number');
        expect(typeof diffValues.expected, 'to be', 'string');
      }
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle structuredClone failures gracefully', () => {
      const schema = z.object({ name: z.string() });
      const subject = { func: () => {}, name: 123 }; // Function will cause DataCloneError
      const result = schema.safeParse(subject);

      if (!result.success) {
        // Should not throw even with non-cloneable values
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to be', subject);
        // Expected should be cloned using custom implementation
        expect(expected, 'to deep equal', { func: subject.func, name: '123' });
      }
    });

    it('should handle circular references in custom clone', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      const schema = z.object({ name: z.string() });
      const result = schema.safeParse(circular);

      if (!result.success) {
        // Should handle circular references without infinite recursion
        const { actual, expected } = extractDiffValues(result.error, circular);
        expect(actual, 'to be', circular as unknown);
        // Custom clone will create a new circular structure
        expect(typeof expected, 'to be', 'object');
      }
    });

    it('should handle deep nested paths', () => {
      const schema = z.object({
        level1: z.object({
          level2: z.object({
            level3: z.string(),
          }),
        }),
      });
      const subject = {
        level1: {
          level2: {
            level3: 123, // Should be string
          },
        },
      };
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to deep equal', subject);
        expect(expected, 'to deep equal', {
          level1: {
            level2: {
              level3: '123',
            },
          },
        });
      }
    });

    it('should handle arrays with mixed error types', () => {
      const schema = z.array(z.string()).min(5).max(3); // Impossible constraint for testing
      const subject = [1, '2', 3]; // Mix of invalid types
      const result = schema.safeParse(subject);

      if (!result.success) {
        // Should handle multiple error types without crashing
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to deep equal', subject);
        // Expected should handle type conversions
        expect(Array.isArray(expected), 'to be', true);
      }
    });

    it('should handle empty arrays and objects', () => {
      const schema = z.object({ items: z.array(z.string()).min(1) });
      const subject = { items: [] };
      const result = schema.safeParse(subject);

      if (!result.success) {
        const { actual, expected } = extractDiffValues(result.error, subject);
        expect(actual, 'to deep equal', subject);
        // Should pad array to minimum length
        expect(expected, 'to deep equal', { items: [null] });
      }
    });
  });
});
