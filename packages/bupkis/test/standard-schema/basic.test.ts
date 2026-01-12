/**
 * Basic Standard Schema support tests.
 *
 * Tests Standard Schema detection guards, creating assertions with Standard
 * Schema implementations, and basic validation success/failure paths.
 */

import { describe, it } from 'node:test';
import { z } from 'zod';

import type { StandardSchemaV1 } from '../../src/standard-schema.js';

import {
  createAssertion,
  createAsyncAssertion,
} from '../../src/assertion/create.js';
import { isStandardSchema } from '../../src/guards.js';
import { AssertionError, expect } from '../../src/index.js';

describe('Standard Schema - Basic Support', () => {
  describe('isStandardSchema guard', () => {
    it('should detect a valid Standard Schema v1 object', () => {
      const schema: StandardSchemaV1<string> = {
        '~standard': {
          validate: (value) => {
            return typeof value === 'string'
              ? { value }
              : { issues: [{ message: 'Not a string' }] };
          },
          vendor: 'test',
          version: 1,
        },
      };

      expect(isStandardSchema(schema), 'to be', true);
    });

    it('should detect Zod schema as Standard Schema (Zod v4 implements spec)', () => {
      const zodSchema = z.string();
      expect(isStandardSchema(zodSchema), 'to be', true);
    });

    it('should reject objects without ~standard property', () => {
      expect(isStandardSchema({}), 'to be', false);
      expect(isStandardSchema({ version: 1 }), 'to be', false);
    });

    it('should reject objects with invalid version', () => {
      const invalid = {
        '~standard': {
          validate: () => ({ value: null }),
          vendor: 'test',
          version: 2,
        },
      };
      expect(isStandardSchema(invalid), 'to be', false);
    });

    it('should reject non-objects', () => {
      expect(isStandardSchema(null), 'to be', false);
      expect(isStandardSchema(undefined), 'to be', false);
      expect(isStandardSchema('string'), 'to be', false);
      expect(isStandardSchema(42), 'to be', false);
    });
  });

  describe('creating sync assertions with Standard Schema', () => {
    it('should create a simple Standard Schema assertion that passes', () => {
      const stringSchema: StandardSchemaV1<string> = {
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

      const assertion = createAssertion(['to be a string'], stringSchema);

      // Should not throw
      assertion.execute(
        ['hello'] as unknown as readonly [unknown],
        ['hello'],
        () => {},
      );
    });

    it('should create a Standard Schema assertion that fails', () => {
      const stringSchema: StandardSchemaV1<string> = {
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

      const assertion = createAssertion(['to be a string'], stringSchema);

      try {
        assertion.execute(
          [42] as unknown as readonly [unknown],
          [42],
          () => {},
        );
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
        expect((err as Error).message, 'to contain', 'Expected string');
      }
    });

    it('should create Standard Schema assertion with path information', () => {
      const objectSchema: StandardSchemaV1 = {
        '~standard': {
          validate: (value: any) => {
            if (typeof value !== 'object' || value === null) {
              return { issues: [{ message: 'Not an object' }] };
            }
            if (typeof value.name !== 'string') {
              return {
                issues: [
                  {
                    message: 'name must be string',
                    path: ['name'],
                  },
                ],
              };
            }
            return { value };
          },
          vendor: 'test',
          version: 1,
        },
      };

      const assertion = createAssertion(['to be valid'], objectSchema);

      try {
        assertion.execute(
          [{ name: 42 }] as unknown as readonly [unknown],
          [{ name: 42 }],
          () => {},
        );
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
        expect((err as Error).message, 'to contain', 'name');
        expect((err as Error).message, 'to contain', 'must be string');
      }
    });
  });

  describe('creating async assertions with Standard Schema', () => {
    it('should create async Standard Schema assertion that passes', async () => {
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

      const assertion = createAsyncAssertion(['to be a string'], asyncSchema);

      await assertion.executeAsync(
        ['hello'] as unknown as readonly [unknown],
        ['hello'],
        () => {},
      );
    });

    it('should create async Standard Schema assertion that fails', async () => {
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

      const assertion = createAsyncAssertion(['to be a string'], asyncSchema);

      try {
        await assertion.executeAsync(
          [42] as unknown as readonly [unknown],
          [42],
          () => {},
        );
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
        expect((err as Error).message, 'to contain', 'Expected string');
      }
    });

    it('should handle sync Standard Schema in async context', async () => {
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

      const assertion = createAsyncAssertion(['to be a string'], syncSchema);

      await assertion.executeAsync(
        ['hello'] as unknown as readonly [unknown],
        ['hello'],
        () => {},
      );
    });
  });

  describe('error message formatting', () => {
    it('should format errors without paths', () => {
      const schema: StandardSchemaV1<string> = {
        '~standard': {
          validate: (_value) => {
            return { issues: [{ message: 'Validation failed' }] };
          },
          vendor: 'test',
          version: 1,
        },
      };

      const assertion = createAssertion(['to be valid'], schema);

      try {
        assertion.execute(
          ['invalid'] as unknown as readonly [unknown],
          ['invalid'],
          () => {},
        );
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
        expect((err as Error).message, 'to contain', 'Validation failed');
      }
    });

    it('should format errors with nested paths', () => {
      const schema: StandardSchemaV1 = {
        '~standard': {
          validate: (_value) => {
            return {
              issues: [
                {
                  message: 'Invalid nested value',
                  path: ['user', 'address', 'zip'],
                },
              ],
            };
          },
          vendor: 'test',
          version: 1,
        },
      };

      const assertion = createAssertion(['to be valid'], schema);

      try {
        assertion.execute(
          [{}] as unknown as readonly [unknown],
          [{}],
          () => {},
        );
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
        expect((err as Error).message, 'to contain', 'user.address.zip');
        expect((err as Error).message, 'to contain', 'Invalid nested value');
      }
    });

    it('should format multiple errors', () => {
      const schema: StandardSchemaV1 = {
        '~standard': {
          validate: (_value) => {
            return {
              issues: [
                { message: 'Error 1', path: ['field1'] },
                { message: 'Error 2', path: ['field2'] },
              ],
            };
          },
          vendor: 'test',
          version: 1,
        },
      };

      const assertion = createAssertion(['to be valid'], schema);

      try {
        assertion.execute(
          [{}] as unknown as readonly [unknown],
          [{}],
          () => {},
        );
        expect(false, 'to be', true); // Should not reach here
      } catch (err) {
        expect(err, 'to be an', AssertionError);
        expect((err as Error).message, 'to contain', 'Error 1');
        expect((err as Error).message, 'to contain', 'Error 2');
        expect((err as Error).message, 'to contain', 'field1');
        expect((err as Error).message, 'to contain', 'field2');
      }
    });
  });
});
