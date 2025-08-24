import { describe, it } from 'node:test';
import { z } from 'zod';

import { expect } from '../../src/index.js';
import { shallowSatisfiesShape } from '../../src/util.js';

describe('shallowSatisfiesShape', () => {
  describe('string value handling', () => {
    it('should convert string values to literal schemas', () => {
      const shape = shallowSatisfiesShape({ message: 'test' });

      expect(() => expect(shape, 'to be an object'), 'not to throw');
      expect(() => expect('message' in shape, 'to be true'), 'not to throw');
    });

    it('should create schemas that validate string literals', () => {
      const shape = shallowSatisfiesShape({ type: 'error' });
      const schema = z.object(shape);

      // Test successful parsing
      const successResult = schema.safeParse({ type: 'error' });
      expect(() => expect(successResult.success, 'to be true'), 'not to throw');

      // Test failed parsing
      const failResult = schema.safeParse({ type: 'warning' });
      expect(() => expect(failResult.success, 'to be false'), 'not to throw');
    });
  });

  describe('RegExp value handling', () => {
    it('should convert RegExp values to regex schemas', () => {
      const shape = shallowSatisfiesShape({ pattern: /test.*pattern/ });

      expect(() => expect(shape, 'to be an object'), 'not to throw');
      expect(() => expect('pattern' in shape, 'to be true'), 'not to throw');
    });

    it('should create schemas that validate regex patterns', () => {
      const shape = shallowSatisfiesShape({ message: /error.*\d+/ });
      const schema = z.object(shape);

      // Test successful parsing
      const successResult = schema.safeParse({ message: 'error code 404' });
      expect(() => expect(successResult.success, 'to be true'), 'not to throw');

      // Test failed parsing
      const failResult = schema.safeParse({ message: 'warning message' });
      expect(() => expect(failResult.success, 'to be false'), 'not to throw');
    });
  });

  describe('nested object handling', () => {
    it('should recursively convert nested objects', () => {
      const shape = shallowSatisfiesShape({
        error: {
          code: 'ERR_001',
          details: {
            level: 'critical',
          },
        },
      });

      expect(() => expect(shape, 'to be an object'), 'not to throw');
      expect(() => expect('error' in shape, 'to be true'), 'not to throw');
    });

    it('should create schemas that validate nested structures', () => {
      const shape = shallowSatisfiesShape({
        response: {
          data: {
            id: 123,
          },
          status: 'success',
        },
      });
      const schema = z.object(shape);

      // Test successful parsing
      const successResult = schema.safeParse({
        response: {
          data: {
            extra: 'ignored',
            id: 123,
          },
          status: 'success',
        },
      });
      expect(() => expect(successResult.success, 'to be true'), 'not to throw');

      // Test failed parsing - wrong status
      const failResult = schema.safeParse({
        response: {
          data: {
            id: 123,
          },
          status: 'error',
        },
      });
      expect(() => expect(failResult.success, 'to be false'), 'not to throw');
    });
  });

  describe('primitive value handling', () => {
    it('should handle number values', () => {
      const shape = shallowSatisfiesShape({ count: 42 });
      const schema = z.object(shape);

      const successResult = schema.safeParse({ count: 42 });
      expect(() => expect(successResult.success, 'to be true'), 'not to throw');

      const failResult = schema.safeParse({ count: 43 });
      expect(() => expect(failResult.success, 'to be false'), 'not to throw');
    });

    it('should handle boolean values', () => {
      const shape = shallowSatisfiesShape({ flag: true });
      const schema = z.object(shape);

      const successResult = schema.safeParse({ flag: true });
      expect(() => expect(successResult.success, 'to be true'), 'not to throw');

      const failResult = schema.safeParse({ flag: false });
      expect(() => expect(failResult.success, 'to be false'), 'not to throw');
    });

    it('should handle null values', () => {
      const shape = shallowSatisfiesShape({ value: null });
      const schema = z.object(shape);

      const successResult = schema.safeParse({ value: null });
      expect(() => expect(successResult.success, 'to be true'), 'not to throw');

      const failResult = schema.safeParse({ value: undefined });
      expect(() => expect(failResult.success, 'to be false'), 'not to throw');
    });
  });

  describe('mixed value types', () => {
    it('should handle objects with mixed value types', () => {
      const shape = shallowSatisfiesShape({
        active: true,
        config: {
          debug: false,
          level: 'info',
        },
        id: 123,
        metadata: null,
        name: 'test',
        pattern: /test.*/,
      });

      expect(
        () => expect(Object.keys(shape).length, 'to be', 6),
        'not to throw',
      );
      expect(() => expect('active' in shape, 'to be true'), 'not to throw');
      expect(() => expect('config' in shape, 'to be true'), 'not to throw');
      expect(() => expect('id' in shape, 'to be true'), 'not to throw');
      expect(() => expect('metadata' in shape, 'to be true'), 'not to throw');
      expect(() => expect('name' in shape, 'to be true'), 'not to throw');
      expect(() => expect('pattern' in shape, 'to be true'), 'not to throw');
    });

    it('should create schemas that validate mixed value types', () => {
      const shape = shallowSatisfiesShape({
        active: true,
        id: 123,
        name: 'test',
        pattern: /test.*/,
      });
      const schema = z.object(shape);

      const successResult = schema.safeParse({
        active: true,
        id: 123,
        name: 'test',
        pattern: 'test123',
      });
      expect(() => expect(successResult.success, 'to be true'), 'not to throw');

      const failResult = schema.safeParse({
        active: true,
        id: 456,
        name: 'test',
        pattern: 'test123',
      });
      expect(() => expect(failResult.success, 'to be false'), 'not to throw');
    });
  });

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      const shape = shallowSatisfiesShape({});

      expect(() => expect(shape, 'to be an object'), 'not to throw');
      expect(
        () => expect(Object.keys(shape).length, 'to be', 0),
        'not to throw',
      );
    });

    it('should handle objects with undefined values', () => {
      const shape = shallowSatisfiesShape({ value: undefined });
      const schema = z.object(shape);

      const successResult = schema.safeParse({ value: undefined });
      expect(() => expect(successResult.success, 'to be true'), 'not to throw');

      const failResult = schema.safeParse({ value: null });
      expect(() => expect(failResult.success, 'to be false'), 'not to throw');
    });

    it('should create valid schemas for complex nested structures', () => {
      const shape = shallowSatisfiesShape({
        user: {
          active: true,
          age: 25,
          email: /.*@.*\.com/,
          name: 'John',
          profile: {
            bio: 'Developer',
            settings: {
              theme: 'dark',
            },
          },
        },
      });
      const schema = z.object(shape);

      const successResult = schema.safeParse({
        user: {
          active: true,
          age: 25,
          email: 'john@example.com',
          name: 'John',
          profile: {
            bio: 'Developer',
            settings: {
              theme: 'dark',
            },
          },
        },
      });
      expect(() => expect(successResult.success, 'to be true'), 'not to throw');
    });
  });
});
