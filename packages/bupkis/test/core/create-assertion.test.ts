import { describe, it } from 'node:test';
import { z } from 'zod';

import {
  BupkisAssertionFunctionAsync,
  BupkisAssertionSchemaAsync,
} from '../../src/assertion/assertion-async.js';
import {
  BupkisAssertionFunctionSync,
  BupkisAssertionSchemaSync,
} from '../../src/assertion/assertion-sync.js';
import { expect } from '../../src/bootstrap.js';
import { AssertionImplementationError } from '../../src/error.js';

describe('core API', () => {
  describe('createAssertion()', () => {
    describe('with Zod schema implementation', () => {
      it('should create a BupkisAssertionSchemaSync instance', () => {
        const assertion = expect.createAssertion(
          ['to be a string'],
          z.string(),
        );

        expect(assertion, 'to be a', BupkisAssertionSchemaSync);
        expect(assertion.parts, 'to deep equal', ['to be a string']);
      });
    });

    describe('with function implementation', () => {
      it('should create a BupkisAssertionFunctionSync instance', () => {
        const assertion = expect.createAssertion(
          [z.number(), 'to be between', z.number(), 'and', z.number()],
          (_, min, max) => z.number().min(min).max(max),
        );

        expect(assertion, 'to be a', BupkisAssertionFunctionSync);
        expect(assertion.parts, 'to deeply equal', [
          z.number(),
          'to be between',
          z.number(),
          'and',
          z.number(),
        ]);
      });

      describe('when the implementation returns an AssertionFailure w/o a message', () => {
        it('should throw an AssertionError with a default message', () => {
          const assertion = expect.createAssertion(
            [z.number(), 'to be even'],
            (value) =>
              value % 2 === 0
                ? true
                : {
                    actual: value,
                    expected: 'even number',
                  },
          );

          expect(
            () => assertion.execute([3], [], () => undefined),
            'to throw',
            new RegExp(`Assertion ${assertion} failed`),
          );
        });
      });
    });

    describe('error handling', () => {
      it('should throw AssertionImplementationError for empty parts array', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => expect.createAssertion([], z.string()),
          'to throw a',
          AssertionImplementationError,
        );
      });

      it('should throw AssertionImplementationError for null parts', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => expect.createAssertion(null, z.string()),
          'to throw a',
          AssertionImplementationError,
        );
      });

      it('should throw AssertionImplementationError for undefined parts', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => expect.createAssertion(undefined, z.string()),
          'to throw a',
          AssertionImplementationError,
        );
      });

      it('should throw AssertionImplementationError for invalid implementation type', () => {
        expect(
          () =>
            expect.createAssertion(
              ['to be something'],
              // @ts-expect-error Testing invalid input
              'not a function or schema',
            ),
          'to throw a',
          AssertionImplementationError,
        );
      });

      it('should throw AssertionImplementationError for null implementation', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => expect.createAssertion(['to be something'], null),
          'to throw a',
          AssertionImplementationError,
        );
      });

      it('should throw AssertionImplementationError for undefined implementation', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => expect.createAssertion(['to be something'], undefined),
          'to throw a',
          AssertionImplementationError,
        );
      });

      it('should handle and format ZodError from slotify', () => {
        // This should trigger a ZodError during slotify processing
        expect(
          () =>
            // @ts-expect-error Testing invalid input
            expect.createAssertion([42], z.string()),
          'to throw a',
          AssertionImplementationError,
        );
      });

      describe('phrase position validation', () => {
        describe('invalid patterns', () => {
          it('should reject schema-only (no phrase)', () => {
            expect(
              () =>
                expect.createAssertion(
                  // @ts-expect-error Testing invalid input
                  [z.string()],
                  () => true,
                ),
              'to throw a',
              AssertionImplementationError,
            );
          });

          it('should reject two schemas without phrase', () => {
            expect(
              () =>
                expect.createAssertion(
                  // @ts-expect-error Testing invalid input
                  [z.string(), z.number()],
                  () => true,
                ),
              'to throw a',
              AssertionImplementationError,
            );
          });

          it('should reject schema-schema-phrase pattern', () => {
            expect(
              () =>
                expect.createAssertion(
                  // @ts-expect-error Testing invalid input
                  [z.string(), z.number(), 'to be weird'],
                  () => true,
                ),
              'to throw a',
              AssertionImplementationError,
            );
          });
        });

        describe('valid patterns', () => {
          it('should accept phrase-first shorthand', () => {
            const assertion = expect.createAssertion(
              ['to be valid'],
              () => true,
            );
            expect(assertion.parts, 'to deep equal', ['to be valid']);
          });

          it('should accept phrase-first with parameters', () => {
            const assertion = expect.createAssertion(
              ['to equal', z.unknown()],
              () => true,
            );
            expect(assertion.parts, 'to have length', 2);
          });

          it('should accept subject-first pattern', () => {
            const assertion = expect.createAssertion(
              [z.string(), 'to be valid'],
              () => true,
            );
            expect(assertion.parts, 'to have length', 2);
          });

          it('should accept subject-phrase-param pattern', () => {
            const assertion = expect.createAssertion(
              [z.string(), 'to equal', z.string()],
              () => true,
            );
            expect(assertion.parts, 'to have length', 3);
          });

          it('should accept phrase choice at position 0', () => {
            const assertion = expect.createAssertion(
              [['to be foo', 'to be bar']],
              () => true,
            );
            expect(assertion.parts, 'to deep equal', [
              ['to be foo', 'to be bar'],
            ]);
          });

          it('should accept phrase choice at position 1', () => {
            const assertion = expect.createAssertion(
              [z.number(), ['to be even', 'to be an even number']],
              (n) => n % 2 === 0,
            );
            expect(assertion.parts, 'to have length', 2);
          });

          it('should accept pattern with "and" connector', () => {
            const assertion = expect.createAssertion(
              [z.number(), 'to be between', z.number(), 'and', z.number()],
              () => true,
            );
            expect(assertion.parts, 'to have length', 5);
          });
        });
      });
    });
  });

  describe('createAsyncAssertion()', () => {
    describe('with Zod schema implementation', () => {
      it('should create a BupkisAssertionSchemaAsync instance', () => {
        const assertion = expect.createAsyncAssertion(
          ['to resolve'],
          z.promise(z.any()),
        );

        expect(assertion, 'to be a', BupkisAssertionSchemaAsync);
        expect(assertion.parts, 'to deep equal', ['to resolve']);
      });
    });

    describe('with function implementation', () => {
      const assertion = expect.createAsyncAssertion(
        ['to be truthy'],
        async (value) => Boolean(value),
      );

      describe('which returns a boolean', () => {
        it('should create a BupkisAssertionFunctionAsync instance', () => {
          expect(
            assertion,
            'to be a',
            BupkisAssertionFunctionAsync,
            'and',
            'to satisfy',
            { parts: ['to be truthy'] },
          );
        });
      });
    });

    describe('error handling', () => {
      it('should throw AssertionImplementationError for empty parts array', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => expect.createAsyncAssertion([], z.string()),
          'to throw a',
          AssertionImplementationError,
        );
      });

      it('should throw AssertionImplementationError for null parts', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => expect.createAsyncAssertion(null, z.string()),
          'to throw a',
          AssertionImplementationError,
        );
      });

      it('should throw AssertionImplementationError for undefined parts', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => expect.createAsyncAssertion(undefined, z.string()),
          'to throw a',
          AssertionImplementationError,
        );
      });

      it('should throw AssertionImplementationError for invalid implementation type', () => {
        expect(
          () =>
            expect.createAsyncAssertion(
              ['to be something'],
              // @ts-expect-error Testing invalid input
              'not a function or schema',
            ),
          'to throw a',
          AssertionImplementationError,
        );
      });

      it('should throw AssertionImplementationError for null implementation', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => expect.createAsyncAssertion(['to be something'], null),
          'to throw a',
          AssertionImplementationError,
        );
      });

      it('should throw AssertionImplementationError for undefined implementation', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => expect.createAsyncAssertion(['to be something'], undefined),
          'to throw a',
          AssertionImplementationError,
        );
      });

      it('should throw AssertionImplementationError for incorrectly typed implementation', () => {
        expect(
          // @ts-expect-error Testing invalid input
          () => expect.createAsyncAssertion('foo', 'bar'),
          'to throw a',
          AssertionImplementationError,
        );
      });

      it('should handle and format ZodError from slotify', () => {
        // This should trigger a ZodError during slotify processing
        expect(
          () =>
            // @ts-expect-error Testing invalid input
            expect.createAsyncAssertion([42], z.string()),
          'to throw a',
          AssertionImplementationError,
        );
      });

      describe('phrase position validation', () => {
        describe('invalid patterns', () => {
          it('should reject schema-only (no phrase)', () => {
            expect(
              () =>
                expect.createAsyncAssertion(
                  // @ts-expect-error Testing invalid input
                  [z.string()],
                  async () => true,
                ),
              'to throw a',
              AssertionImplementationError,
            );
          });

          it('should reject two schemas without phrase', () => {
            expect(
              () =>
                expect.createAsyncAssertion(
                  // @ts-expect-error Testing invalid input
                  [z.string(), z.number()],
                  async () => true,
                ),
              'to throw a',
              AssertionImplementationError,
            );
          });

          it('should reject schema-schema-phrase pattern', () => {
            expect(
              () =>
                expect.createAsyncAssertion(
                  // @ts-expect-error Testing invalid input
                  [z.string(), z.number(), 'to be weird'],
                  async () => true,
                ),
              'to throw a',
              AssertionImplementationError,
            );
          });
        });

        describe('valid patterns', () => {
          it('should accept phrase-first shorthand', () => {
            const assertion = expect.createAsyncAssertion(
              ['to be valid'],
              async () => true,
            );
            expect(assertion.parts, 'to deep equal', ['to be valid']);
          });

          it('should accept phrase-first with parameters', () => {
            const assertion = expect.createAsyncAssertion(
              ['to equal', z.unknown()],
              async () => true,
            );
            expect(assertion.parts, 'to have length', 2);
          });

          it('should accept subject-first pattern', () => {
            const assertion = expect.createAsyncAssertion(
              [z.string(), 'to be valid'],
              async () => true,
            );
            expect(assertion.parts, 'to have length', 2);
          });

          it('should accept subject-phrase-param pattern', () => {
            const assertion = expect.createAsyncAssertion(
              [z.string(), 'to equal', z.string()],
              async () => true,
            );
            expect(assertion.parts, 'to have length', 3);
          });

          it('should accept phrase choice at position 0', () => {
            const assertion = expect.createAsyncAssertion(
              [['to be foo', 'to be bar']],
              async () => true,
            );
            expect(assertion.parts, 'to deep equal', [
              ['to be foo', 'to be bar'],
            ]);
          });

          it('should accept phrase choice at position 1', () => {
            const assertion = expect.createAsyncAssertion(
              [z.number(), ['to be even', 'to be an even number']],
              async (n) => n % 2 === 0,
            );
            expect(assertion.parts, 'to have length', 2);
          });

          it('should accept pattern with "and" connector', () => {
            const assertion = expect.createAsyncAssertion(
              [z.number(), 'to be between', z.number(), 'and', z.number()],
              async () => true,
            );
            expect(assertion.parts, 'to have length', 5);
          });
        });
      });
    });
  });
});
