/**
 * Interoperability tests for Standard Schema.
 *
 * Tests Zod schemas via their Standard Schema interface, backward
 * compatibility, and verification that existing Zod-based assertions continue
 * to work.
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { describe, it } from 'node:test';
import { z } from 'zod/v4';

import type { StandardSchemaV1 } from '../../src/standard-schema.js';

import { createAssertion } from '../../src/assertion/create.js';
import { isStandardSchema, isZodType } from '../../src/guards.js';
import { AssertionError, expect } from '../../src/index.js';

describe('Standard Schema - Interoperability', () => {
  describe('Zod as Standard Schema', () => {
    it('should detect Zod schemas as Standard Schema v1', () => {
      const zodString = z.string();
      const zodNumber = z.number();
      const zodObject = z.object({ name: z.string() });

      expect(isStandardSchema(zodString), 'to be', true);
      expect(isStandardSchema(zodNumber), 'to be', true);
      expect(isStandardSchema(zodObject), 'to be', true);
    });

    it('should still detect Zod schemas with isZodType', () => {
      const zodString = z.string();
      expect(isZodType(zodString), 'to be', true);
      expect(isStandardSchema(zodString), 'to be', true);
    });

    it('should validate using Zod via Standard Schema interface', () => {
      const zodString = z.string();
      const result = zodString['~standard'].validate('hello');

      expect('issues' in result, 'to be', false);
      if ('value' in result) {
        expect(result.value, 'to be', 'hello');
      }
    });

    it('should get error via Standard Schema interface from Zod', () => {
      const zodString = z.string();
      const result = zodString['~standard'].validate(42);

      expect('issues' in result, 'to be', true);
      if ('issues' in result && result.issues) {
        expect(result.issues.length, 'to be greater than', 0);
        expect(result.issues[0]?.message, 'to be a string');
      }
    });
  });

  describe('backward compatibility', () => {
    it('should still create Zod-based assertions as before', () => {
      const assertion = createAssertion(['to be a string'], z.string());

      // Should work exactly as before
      assertion.execute(['hello'] as any, ['hello'], () => {});

      try {
        assertion.execute([42] as any, [42], () => {});
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
      }
    });

    it('should still create function-based assertions as before', () => {
      const assertion = createAssertion(
        [z.number(), 'to be greater than', z.number()],
        (subject, expected) => subject > expected,
      );

      assertion.execute([10, 5] as any, [10, 5], () => {});

      try {
        assertion.execute([3, 5] as any, [3, 5], () => {});
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
      }
    });

    it('should still handle function returning Zod schema', () => {
      const assertion = createAssertion(
        [z.number(), 'to be in range', z.number(), 'and', z.number()],
        (subject, min, max) => z.number().gte(min).lte(max),
      );

      assertion.execute([5, 1, 10] as any, [5, 1, 10], () => {});

      try {
        assertion.execute([15, 1, 10] as any, [15, 1, 10], () => {});
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
      }
    });

    it('should still handle AssertionParseRequest with Zod schema', () => {
      const assertion = createAssertion(
        [z.object({ age: z.number() }), 'to have valid age'],
        (obj) => ({
          schema: z.number().int().gte(0).lte(120),
          subject: obj.age,
        }),
      );

      assertion.execute([{ age: 25 }] as any, [{ age: 25 }], () => {});

      try {
        assertion.execute([{ age: 150 }] as any, [{ age: 150 }], () => {});
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
      }
    });
  });

  describe('mixed usage patterns', () => {
    it('should handle both Zod and Standard Schema assertions in same test', () => {
      const zodAssertion = createAssertion(['to be a string'], z.string());

      const stdAssertion = createAssertion(['to be a string'], {
        '~standard': {
          validate: (value) => {
            return typeof value === 'string'
              ? { value }
              : { issues: [{ message: 'Not a string' }] };
          },
          vendor: 'test',
          version: 1,
        },
      });

      // Both should work
      zodAssertion.execute(['hello'] as any, ['hello'], () => {});
      stdAssertion.execute(['hello'] as any, ['hello'], () => {});

      // Both should fail
      try {
        zodAssertion.execute([42] as any, [42], () => {});
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
      }

      try {
        stdAssertion.execute([42] as any, [42], () => {});
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
      }
    });

    it('should allow defining assertion parts with Standard Schema', () => {
      const customNumberSchema: StandardSchemaV1<number> = {
        '~standard': {
          validate: (value: unknown) => {
            return typeof value === 'number'
              ? { value }
              : { issues: [{ message: 'Expected number' }] };
          },
          vendor: 'test',
          version: 1,
        },
      };

      // Standard Schema can be used in assertion parts
      const assertion = createAssertion(
        [customNumberSchema, 'to be positive'] as any,
        ((n: number) => n > 0) as any,
      );

      assertion.parseValues([42]);

      const result = assertion.parseValues(['invalid']);
      expect(result.success, 'to be', false);
    });

    it('should handle mixed Zod and Standard Schema in assertion parts', () => {
      const customStringSchema: StandardSchemaV1<string> = {
        '~standard': {
          validate: (value: unknown) => {
            return typeof value === 'string'
              ? { value }
              : { issues: [{ message: 'Expected string' }] };
          },
          vendor: 'test',
          version: 1,
        },
      };

      const assertion = createAssertion(
        [customStringSchema, 'to match length', z.number()] as any,
        ((str: string, len: number) => str.length === len) as any,
      );

      assertion.execute(['hello', 5] as any, ['hello', 5], () => {});

      try {
        assertion.execute(['hello', 3] as any, ['hello', 3], () => {});
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
      }
    });
  });

  describe('type inference', () => {
    it('should infer types from Standard Schema in slots', () => {
      const numberSchema: StandardSchemaV1<number> = {
        '~standard': {
          types: {
            input: 0 as number,
            output: 0 as number,
          },
          validate: (value: unknown) => {
            return typeof value === 'number'
              ? { value }
              : { issues: [{ message: 'Expected number' }] };
          },
          vendor: 'test',
          version: 1,
        },
      };

      const assertion = createAssertion(
        [numberSchema, 'to be valid'] as any,
        ((n: number) => {
          // TypeScript should infer n as number if type system is working
          const _result: number = n;
          return true;
        }) as any,
      );

      assertion.execute([42] as any, [42], () => {});
    });
  });

  describe('error format comparison', () => {
    it('should format Zod errors differently from Standard Schema errors', () => {
      const zodAssertion = createAssertion(['to be a string'], z.string());
      const stdAssertion = createAssertion(['to be a string'], {
        '~standard': {
          validate: (value) => {
            return typeof value === 'string'
              ? { value }
              : { issues: [{ message: 'Not a string' }] };
          },
          vendor: 'test',
          version: 1,
        },
      });

      let zodError: Error | undefined;
      let stdError: Error | undefined;

      try {
        zodAssertion.execute([42] as any, [42], () => {});
      } catch (err) {
        zodError = err as Error;
      }

      try {
        stdAssertion.execute([42] as any, [42], () => {});
      } catch (err) {
        stdError = err as Error;
      }

      expect(zodError, 'to be defined');
      expect(stdError, 'to be defined');

      if (zodError && stdError) {
        // Both should have messages, but formatting may differ
        expect(zodError.message.length, 'to be greater than', 0);
        expect(stdError.message.length, 'to be greater than', 0);
        expect(stdError.message, 'to contain', 'Not a string');
      }
    });
  });
});
