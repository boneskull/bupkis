/**
 * Basic property tests for an async schema-based assertion.
 *
 * If and when we have builtin assertions using this style, then remove this
 * test suite and add the tests to a new suite supported by `runPropertyTests()`
 * and `PropertyTestConfig`.
 *
 * @packageDocumentation
 */

import fc from 'fast-check';
import { describe, it } from 'node:test';
import { z } from 'zod';

import { AssertionError, createAsyncAssertion, use } from '../../src/index.js';
import { calculateNumRuns } from './property-test-util.js';

const numRuns = calculateNumRuns('small');

const assertion = createAsyncAssertion(
  [`to resolve with {foo: 'bar'}`],
  z.promise(z.object({ foo: z.literal('bar') })),
);

const { expect, expectAsync } = use([assertion]);

describe('async-schema-assertion', () => {
  it('valid: resolves with {foo: "bar"}', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(Promise.resolve({ foo: 'bar' })),
        async (value) => {
          await expectAsync(value, "to resolve with {foo: 'bar'}");
        },
      ),
      { numRuns },
    );
  });

  it('invalid: does not resolve with {foo: "bar"}', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .object()
          .filter((obj) => !('foo' in obj))
          .map((obj) => Promise.resolve(obj)),
        async (value) => {
          try {
            await expectAsync(value, "to resolve with {foo: 'bar'}");
          } catch (err) {
            expect(err, 'to be an', AssertionError);
            return true;
          }
          return false;
        },
      ),
      { numRuns },
    );
  });

  it('invalidNegated: resolves with {foo: "bar"} when negated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(Promise.resolve({ foo: 'bar' })),
        async (value) => {
          try {
            await expectAsync(value, "not to resolve with {foo: 'bar'}");
          } catch (err) {
            expect(err, 'to be an', AssertionError);
            return true;
          }
          return false;
        },
      ),
      { numRuns },
    );
  });

  it('validNegated: does not resolve with {foo: "bar"} when negated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .object()
          .filter((obj) => !('foo' in obj))
          .map((obj) => Promise.resolve(obj)),
        async (value) => {
          await expectAsync(value, "not to resolve with {foo: 'bar'}");
        },
      ),
      { numRuns },
    );
  });
});
