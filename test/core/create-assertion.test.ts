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

          // const newExpect = expect.use([assertion]);
          expect(
            () => assertion.execute([3], [], () => undefined),
            'to throw',
            `Assertion ${assertion} failed`,
          );
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
      it('should create a BupkisAssertionFunctionAsync instance', () => {
        const assertion = expect.createAsyncAssertion(
          ['to be truthy'],
          async (value) => Boolean(value),
        );

        expect(assertion, 'to be a', BupkisAssertionFunctionAsync);
        expect(assertion.parts, 'to satisfy', ['to be truthy']);
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
    });
  });
});
