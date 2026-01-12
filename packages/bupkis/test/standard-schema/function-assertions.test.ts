/**
 * Function assertion tests with Standard Schema.
 *
 * Tests function assertions that return Standard Schemas and
 * AssertionParseRequest objects containing Standard Schemas.
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { describe, it } from 'node:test';
import { z } from 'zod';

import type { StandardSchemaV1 } from '../../src/standard-schema.js';

import {
  createAssertion,
  createAsyncAssertion,
} from '../../src/assertion/create.js';
import { AssertionError, expect } from '../../src/index.js';

describe('Standard Schema - Function Assertions', () => {
  describe('sync function returning Standard Schema', () => {
    it('should handle function that returns Standard Schema on success', () => {
      const numberRangeSchema = (
        min: number,
        max: number,
      ): StandardSchemaV1<number> => ({
        '~standard': {
          validate: (value) => {
            if (typeof value !== 'number') {
              return { issues: [{ message: 'Expected number' }] };
            }
            if (value < min || value > max) {
              return {
                issues: [
                  { message: `Expected number between ${min} and ${max}` },
                ],
              };
            }
            return { value };
          },
          vendor: 'test',
          version: 1,
        },
      });

      const assertion = createAssertion(
        [z.number(), 'to be in range', z.number(), 'and', z.number()],
        (subject, min, max) => {
          return numberRangeSchema(min, max);
        },
      );

      // Should pass
      assertion.execute(
        [5, 1, 10] as unknown as readonly [number, number, number],
        [5, 1, 10],
        () => {},
      );
    });

    it('should handle function that returns Standard Schema on failure', () => {
      const numberRangeSchema = (
        min: number,
        max: number,
      ): StandardSchemaV1<number> => ({
        '~standard': {
          validate: (value) => {
            if (typeof value !== 'number') {
              return { issues: [{ message: 'Expected number' }] };
            }
            if (value < min || value > max) {
              return {
                issues: [
                  { message: `Expected number between ${min} and ${max}` },
                ],
              };
            }
            return { value };
          },
          vendor: 'test',
          version: 1,
        },
      });

      const assertion = createAssertion(
        [z.number(), 'to be in range', z.number(), 'and', z.number()],
        (subject, min, max) => {
          return numberRangeSchema(min, max);
        },
      );

      try {
        assertion.execute(
          [15, 1, 10] as unknown as readonly [number, number, number],
          [15, 1, 10],
          () => {},
        );
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
        expect((err as Error).message, 'to contain', 'between 1 and 10');
      }
    });

    it('should reject async Standard Schema in sync context', () => {
      const asyncSchema: StandardSchemaV1<string> = {
        '~standard': {
          validate: async (value) => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            return typeof value === 'string'
              ? { value }
              : { issues: [{ message: 'Invalid' }] };
          },
          vendor: 'test',
          version: 1,
        },
      };

      const assertion = createAssertion(['to be valid'], () => asyncSchema);

      try {
        assertion.execute(
          ['test'] as unknown as readonly [unknown],
          ['test'],
          () => {},
        );
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect((err as Error).message, 'to contain', 'use expectAsync');
      }
    });
  });

  describe('async function returning Standard Schema', () => {
    it('should handle async function returning Standard Schema', async () => {
      const asyncSchema: StandardSchemaV1<string> = {
        '~standard': {
          validate: async (value) => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            return typeof value === 'string'
              ? { value }
              : { issues: [{ message: 'Expected string' }] };
          },
          vendor: 'test',
          version: 1,
        },
      };

      const assertion = createAsyncAssertion(
        ['to be async valid'],
        async () => asyncSchema,
      );

      await assertion.executeAsync(
        ['test'] as unknown as readonly [unknown],
        ['test'],
        () => {},
      );
    });

    it('should handle async function returning sync Standard Schema', async () => {
      const syncSchema: StandardSchemaV1<string> = {
        '~standard': {
          validate: (value) => {
            return typeof value === 'string'
              ? { value }
              : { issues: [{ message: 'Expected string' }] };
          },
          vendor: 'test',
          version: 1,
        },
      };

      const assertion = createAsyncAssertion(
        ['to be valid'],
        async () => syncSchema,
      );

      await assertion.executeAsync(
        ['test'] as unknown as readonly [unknown],
        ['test'],
        () => {},
      );
    });
  });

  describe('AssertionParseRequest with Standard Schema', () => {
    it('should handle sync AssertionParseRequest with sync Standard Schema', () => {
      const emailSchema: StandardSchemaV1<string> = {
        '~standard': {
          validate: (value) => {
            if (typeof value !== 'string' || !value.includes('@')) {
              return { issues: [{ message: 'Invalid email format' }] };
            }
            return { value };
          },
          vendor: 'test',
          version: 1,
        },
      };

      const assertion = createAssertion(
        [z.object({ email: z.string() }), 'to have valid email'],
        (obj) => {
          return {
            schema: emailSchema,
            subject: obj.email,
          };
        },
      );

      // Should pass
      assertion.execute(
        [{ email: 'test@example.com' }] as any,
        [{ email: 'test@example.com' }],
        () => {},
      );

      // Should fail
      try {
        assertion.execute(
          [{ email: 'invalid' }] as any,
          [{ email: 'invalid' }],
          () => {},
        );
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
        expect((err as Error).message, 'to contain', 'Invalid email format');
      }
    });

    it('should handle async AssertionParseRequest with async Standard Schema', async () => {
      const asyncEmailSchema: StandardSchemaV1<string> = {
        '~standard': {
          validate: async (value) => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            if (typeof value !== 'string' || !value.includes('@')) {
              return { issues: [{ message: 'Invalid email format' }] };
            }
            return { value };
          },
          vendor: 'test',
          version: 1,
        },
      };

      const assertion = createAsyncAssertion(
        [z.object({ email: z.string() }), 'to have valid email'],
        (obj) => {
          return {
            asyncSchema: asyncEmailSchema,
            subject: obj.email,
          };
        },
      );

      // Should pass
      await assertion.executeAsync(
        [{ email: 'test@example.com' }] as any,
        [{ email: 'test@example.com' }],
        () => {},
      );

      // Should fail
      try {
        await assertion.executeAsync(
          [{ email: 'invalid' }] as any,
          [{ email: 'invalid' }],
          () => {},
        );
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
        expect((err as Error).message, 'to contain', 'Invalid email format');
      }
    });

    it('should reject async Standard Schema in sync AssertionParseRequest', () => {
      const asyncSchema: StandardSchemaV1<string> = {
        '~standard': {
          validate: async (value) => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            return { value: value as string };
          },
          vendor: 'test',
          version: 1,
        },
      };

      const assertion = createAssertion(['to have valid value'], (obj: any) => {
        return {
          schema: asyncSchema,
          subject: obj.value,
        };
      });

      try {
        assertion.execute(
          [{ value: 'test' }] as unknown as readonly [unknown],
          [{ value: 'test' }],
          () => {},
        );
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect((err as Error).message, 'to contain', 'async validation');
      }
    });

    it('should handle AssertionParseRequest with mixed Zod and Standard Schema across assertions', () => {
      // One assertion using Zod
      const zodAssertion = createAssertion(
        [z.number(), 'to be positive'],
        (n) => ({
          schema: z.number().gt(0),
          subject: n,
        }),
      );

      // Another assertion using Standard Schema
      const stdAssertion = createAssertion(
        [z.number(), 'to be positive std'],
        (n) => ({
          schema: {
            '~standard': {
              validate: (value: unknown) => {
                return typeof value === 'number' && value > 0
                  ? { value }
                  : { issues: [{ message: 'Must be positive' }] };
              },
              vendor: 'test',
              version: 1,
            },
          },
          subject: n,
        }),
      );

      // Both should work
      zodAssertion.execute([5] as any, [5], () => {});
      stdAssertion.execute([5] as any, [5], () => {});

      // Both should fail
      try {
        zodAssertion.execute([-5] as any, [-5], () => {});
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
      }

      try {
        stdAssertion.execute([-5] as any, [-5], () => {});
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
      }
    });
  });
});
