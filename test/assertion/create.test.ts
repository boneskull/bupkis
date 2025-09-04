import { describe, it } from 'node:test';
import { z } from 'zod/v4';

import {
  BupkisAssertionFunctionAsync,
  BupkisAssertionSchemaAsync,
} from '../../src/assertion/assertion-async.js';
import {
  BupkisAssertionFunctionSync,
  BupkisAssertionSchemaSync,
} from '../../src/assertion/assertion-sync.js';
import {
  createAssertion,
  createAsyncAssertion,
  createSyncAssertion,
} from '../../src/assertion/create.js';
import { expect } from '../../src/bootstrap.js';

describe('Assertion creation functions', () => {
  describe('createAssertion()', () => {
    describe('with Zod schema implementation', () => {
      it('should create a BupkisAssertionSchemaSync instance', () => {
        const assertion = createAssertion(['to be a string'], z.string());

        expect(assertion, 'to be a', BupkisAssertionSchemaSync);
        expect(assertion.parts, 'to satisfy', ['to be a string']);
      });

      it('should handle parameterized assertions', () => {
        const assertion = createAssertion(
          ['to be akin to', z.object({})],
          z.looseObject({}),
        );

        expect(assertion, 'to be a', BupkisAssertionSchemaSync);
        expect(assertion.parts, 'to satisfy', ['to be akin to', z.object({})]);
      });
    });

    describe('with function implementation', () => {
      it('should handle a boolean-returning function', () => {
        const assertion = createAssertion(
          ['to be true'],
          (value) => value === true,
        );

        expect(assertion, 'to be a', BupkisAssertionFunctionSync);
        expect(assertion.parts, 'to satisfy', ['to be true']);
      });

      it('should create a parameterized function assertion', () => {
        const assertion = createAssertion(
          [z.number(), 'to be greater than', z.number()],
          (subject, expected) => subject > expected,
        );

        expect(assertion, 'to be a', BupkisAssertionFunctionSync);
        expect(assertion.parts, 'to satisfy', [
          z.number(),
          'to be greater than',
          z.number(),
        ]);
      });
    });

    it('should handle schema-returning functions', () => {
      const assertion = createAssertion(
        [z.number(), 'to be between', z.number(), 'and', z.number()],
        (subject, min, max) => z.number().min(min).max(max),
      );

      expect(assertion, 'to be a', BupkisAssertionFunctionSync);
      expect(assertion.parts, 'to satisfy', [
        z.number(),
        'to be between',
        z.number(),
        'and',
        z.number(),
      ]);
    });

    it('should handle AssertionFailure-returning functions', () => {
      const assertion = createAssertion(
        [['to be akin to'], z.object({ foo: 'bar' })],
        (subject, expected) => {
          if (
            typeof subject === 'object' &&
            !!subject &&
            'foo' in subject &&
            subject.foo === 'bar'
          ) {
            return true;
          }
          return {
            actual: subject,
            expected,
            // message: `Expected object to have foo property with value 'bar'`,
          };
        },
      );

      expect(assertion, 'to be a', BupkisAssertionFunctionSync);
      expect(assertion.parts, 'to satisfy', [
        ['to be akin to'],
        z.object({ foo: 'bar' }),
      ]);
    });

    describe('error handling', () => {
      it('should throw TypeError for empty parts array', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => createAssertion([], z.string()),
          'to throw',
          'At least one value is required for an assertion',
        );
      });

      it('should throw TypeError for null parts', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => createAssertion(null, z.string()),
          'to throw',
          'At least one value is required for an assertion',
        );
      });

      it('should throw TypeError for undefined parts', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => createAssertion(undefined, z.string()),
          'to throw',
          'At least one value is required for an assertion',
        );
      });

      it('should throw TypeError for invalid implementation type', () => {
        expect(
          () =>
            // @ts-expect-error Testing invalid input
            createAssertion(['to be something'], 'not a function or schema'),
          'to throw',
          'Assertion implementation must be a function, Zod schema or Zod schema factory',
        );
      });

      it('should throw TypeError for null implementation', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => createAssertion(['to be something'], null),
          'to throw',
          'Assertion implementation must be a function, Zod schema or Zod schema factory',
        );
      });

      it('should throw TypeError for undefined implementation', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => createAssertion(['to be something'], undefined),
          'to throw',
          'Assertion implementation must be a function, Zod schema or Zod schema factory',
        );
      });

      it('should handle and format ZodError from slotify', () => {
        // This should trigger a ZodError during slotify processing
        expect(
          () =>
            // @ts-expect-error Testing invalid input
            createAssertion([42], z.string()),
          'to throw a',
          z.core.$ZodError,
        );
      });
    });
  });

  describe('createAsyncAssertion()', () => {
    describe('with Zod schema implementation', () => {
      it('should create a BupkisAssertionSchemaAsync instance', () => {
        const assertion = createAsyncAssertion(
          ['to resolve'],
          z.promise(z.any()),
        );

        expect(assertion, 'to be a', BupkisAssertionSchemaAsync);
        expect(assertion.parts, 'to satisfy', ['to resolve']);
      });

      it('should create a parameterized async schema assertion', () => {
        const assertion = createAsyncAssertion(
          [z.promise(z.any()), 'to resolve with', z.any()],
          z.promise(z.any()),
        );

        expect(assertion, 'to be a', BupkisAssertionSchemaAsync);
        expect(assertion.parts, 'to satisfy', [
          z.promise(z.any()),
          'to resolve with',
          z.any(),
        ]);
      });
    });

    describe('with function implementation', () => {
      it('should create a BupkisAssertionFunctionAsync instance', () => {
        const assertion = createAsyncAssertion(
          ['to resolve'],
          async (promise) => {
            try {
              await promise;
              return true;
            } catch {
              return false;
            }
          },
        );

        expect(assertion, 'to be a', BupkisAssertionFunctionAsync);
        expect(assertion.parts, 'to deep equal', ['to resolve']);
      });

      it('should create a parameterized async function assertion', () => {
        const assertion = createAsyncAssertion(
          [z.function(), 'to reject with message', z.string()],
          async (fn, expectedMessage) => {
            try {
              await fn();
              return false;
            } catch (error) {
              return (
                error instanceof Error && error.message === expectedMessage
              );
            }
          },
        );

        expect(assertion, 'to be a', BupkisAssertionFunctionAsync);
        expect(assertion.parts, 'to satisfy', [
          z.function(),
          'to reject with message',
          z.string(),
        ]);
      });

      it('should handle async function implementations returning Promises', () => {
        const assertion = createAsyncAssertion(
          ['to be truthy'],
          async (value) => Boolean(value),
        );

        expect(assertion, 'to be a', BupkisAssertionFunctionAsync);
        expect(assertion.parts, 'to deep equal', ['to be truthy']);
      });

      it('should handle async function implementations returning Promises', () => {
        const assertion = createAsyncAssertion(
          ['to be truthy'],
          async (value) => Boolean(value),
        );

        expect(assertion, 'to be a', BupkisAssertionFunctionAsync);
        expect(assertion.parts, 'to deep equal', ['to be truthy']);
      });
      it('should handle schema-returning async functions', () => {
        const assertion = createAsyncAssertion(
          [
            z.promise(z.number()),
            'to resolve to number greater than',
            z.number(),
          ],
          async (promise, min) => {
            const value = await promise;
            return value > min;
          },
        );

        expect(assertion, 'to be a', BupkisAssertionFunctionAsync);
        expect(assertion.parts, 'to satisfy', [
          z.promise(z.number()),
          'to resolve to number greater than',
          z.number(),
        ]);
      });
    });

    describe('error handling', () => {
      it('should throw TypeError for empty parts array', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => createAsyncAssertion([], z.promise(z.any())),
          'to throw',
          'At least one value is required for an assertion',
        );
      });

      it('should throw TypeError for null parts', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => createAsyncAssertion(null, z.promise(z.any())),
          'to throw',
          'At least one value is required for an assertion',
        );
      });

      it('should throw TypeError for undefined parts', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => createAsyncAssertion(undefined, z.promise(z.any())),
          'to throw',
          'At least one value is required for an assertion',
        );
      });

      it('should throw TypeError for invalid implementation type', () => {
        expect(
          () =>
            // @ts-expect-error Testing invalid input
            createAsyncAssertion(['to resolve'], 'not a function or schema'),
          'to throw',
          'Assertion implementation must be a function, Zod schema or Zod schema factory',
        );
      });

      it('should throw TypeError for null implementation', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => createAsyncAssertion(['to resolve'], null),
          'to throw',
          'Assertion implementation must be a function, Zod schema or Zod schema factory',
        );
      });

      it('should throw TypeError for undefined implementation', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => createAsyncAssertion(['to resolve'], undefined),
          'to throw',
          'Assertion implementation must be a function, Zod schema or Zod schema factory',
        );
      });
    });
  });

  describe('createSyncAssertion()', () => {
    it('should be an alias for createAssertion', () => {
      expect(createSyncAssertion, 'to be', createAssertion);
    });
  });
});
