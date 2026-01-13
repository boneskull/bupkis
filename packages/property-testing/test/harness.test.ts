/**
 * Tests for harness functions in @bupkis/property-testing.
 *
 * @packageDocumentation
 */

import {
  AssertionError,
  createAssertion,
  createAsyncAssertion,
  expect,
  expectAsync,
  NegatedAssertionError,
} from 'bupkis';
import fc from 'fast-check';
import { describe, it } from 'node:test';
import { z } from 'zod';

import {
  expectUsing,
  expectUsingAsync,
  extractPhrases,
  getVariants,
  isGeneratorsTuple,
  isPropertyTestConfigVariantAsyncGenerators,
  isPropertyTestConfigVariantAsyncProperty,
  isPropertyTestConfigVariantGenerators,
  isPropertyTestConfigVariantProperty,
  PropertyTestGeneratorError,
  WrongAssertionError,
} from '../src/harness.js';

describe('harness', () => {
  describe('extractPhrases()', () => {
    it('should extract a single phrase from a basic assertion', () => {
      const assertion = createAssertion(['to be a string'], z.string());
      const phrases = extractPhrases(assertion);
      expect(phrases, 'to deep equal', ['to be a string']);
    });

    it('should extract multiple phrases from an assertion with alternatives', () => {
      const assertion = createAssertion(
        [['to be a string', 'to be string']],
        z.string(),
      );
      const phrases = extractPhrases(assertion);
      expect(phrases.length, 'to equal', 2);
      expect(phrases[0], 'to equal', 'to be a string');
      expect(phrases[1], 'to equal', 'to be string');
    });

    it('should filter out Zod schema parts', () => {
      const assertion = createAssertion(
        [z.number(), 'to be greater than', z.number()],
        (subject, expected) => subject > expected,
      );
      const phrases = extractPhrases(assertion);
      expect(phrases.length, 'to equal', 1);
      expect(phrases[0], 'to equal', 'to be greater than');
    });

    it('should handle parametric assertions with multiple phrase parts', () => {
      const assertion = createAssertion(
        [z.any(), 'to have property', z.string(), 'with value', z.any()],
        (subject, prop, value) =>
          Object.hasOwn(subject as object, prop) &&
          (subject as Record<string, unknown>)[prop] === value,
      );
      const phrases = extractPhrases(assertion);
      expect(phrases.length, 'to equal', 2);
      expect(phrases[0], 'to equal', 'to have property');
      expect(phrases[1], 'to equal', 'with value');
    });

    it('should return a non-empty tuple', () => {
      const assertion = createAssertion(['to be null'], z.null());
      const phrases = extractPhrases(assertion);
      expect(phrases.length, 'to be greater than', 0);
      expect(phrases[0], 'to be a string');
    });
  });

  describe('getVariants()', () => {
    it('should return a Map with all four variant keys', () => {
      const config = {
        invalid: { generators: fc.constant(['a', 'b']) },
        valid: { generators: fc.constant(['x', 'y']) },
      };
      const { variants } = getVariants(config);

      expect(variants, 'to be a', Map);
      expect(variants.has('valid'), 'to be true');
      expect(variants.has('invalid'), 'to be true');
      expect(variants.has('validNegated'), 'to be true');
      expect(variants.has('invalidNegated'), 'to be true');
    });

    it('should default invalidNegated to valid when omitted', () => {
      const validVariant = { generators: fc.constant(['x', 'y']) };
      const config = {
        invalid: { generators: fc.constant(['a', 'b']) },
        valid: validVariant,
      };
      const { variants } = getVariants(config);

      expect(variants.get('invalidNegated'), 'to be', validVariant);
    });

    it('should default validNegated to invalid when omitted', () => {
      const invalidVariant = { generators: fc.constant(['a', 'b']) };
      const config = {
        invalid: invalidVariant,
        valid: { generators: fc.constant(['x', 'y']) },
      };
      const { variants } = getVariants(config);

      expect(variants.get('validNegated'), 'to be', invalidVariant);
    });

    it('should use explicit invalidNegated when provided', () => {
      const explicitInvalidNegated = {
        generators: fc.constant(['explicit', 'negated']),
      };
      const config = {
        invalid: { generators: fc.constant(['a', 'b']) },
        invalidNegated: explicitInvalidNegated,
        valid: { generators: fc.constant(['x', 'y']) },
      };
      const { variants } = getVariants(config);

      expect(variants.get('invalidNegated'), 'to be', explicitInvalidNegated);
    });

    it('should use explicit validNegated when provided', () => {
      const explicitValidNegated = {
        generators: fc.constant(['explicit', 'negated']),
      };
      const config = {
        invalid: { generators: fc.constant(['a', 'b']) },
        valid: { generators: fc.constant(['x', 'y']) },
        validNegated: explicitValidNegated,
      };
      const { variants } = getVariants(config);

      expect(variants.get('validNegated'), 'to be', explicitValidNegated);
    });

    it('should separate parameters from variants', () => {
      const config = {
        invalid: { generators: fc.constant(['a', 'b']) },
        runSize: 'small' as const,
        valid: { generators: fc.constant(['x', 'y']) },
        verbose: true,
      };
      const { params, variants } = getVariants(config);

      expect(params, 'to satisfy', { runSize: 'small', verbose: true });
      expect(params, 'not to have property', 'valid');
      expect(params, 'not to have property', 'invalid');
      expect(variants.size, 'to equal', 4);
    });
  });

  describe('type guards', () => {
    describe('isPropertyTestConfigVariantGenerators()', () => {
      it('should return true for sync generators variant', () => {
        const variant = { generators: fc.constant(['a', 'b']) };
        expect(isPropertyTestConfigVariantGenerators(variant), 'to be true');
      });

      it('should return false for async generators variant', () => {
        const variant = {
          async: true as const,
          generators: fc.constant(['a', 'b']),
        };
        expect(isPropertyTestConfigVariantGenerators(variant), 'to be false');
      });

      it('should return false for property variant', () => {
        const variant = {
          property: () => fc.property(fc.anything(), () => true),
        };
        expect(isPropertyTestConfigVariantGenerators(variant), 'to be false');
      });

      it('should return false for asyncProperty variant', () => {
        const variant = {
          asyncProperty: () =>
            fc.asyncProperty(fc.anything(), async () => true),
        };
        expect(isPropertyTestConfigVariantGenerators(variant), 'to be false');
      });
    });

    describe('isPropertyTestConfigVariantAsyncGenerators()', () => {
      it('should return true for async generators variant', () => {
        const variant = {
          async: true as const,
          generators: fc.constant(['a', 'b']),
        };
        expect(
          isPropertyTestConfigVariantAsyncGenerators(variant),
          'to be true',
        );
      });

      it('should return false for sync generators variant', () => {
        const variant = { generators: fc.constant(['a', 'b']) };
        expect(
          isPropertyTestConfigVariantAsyncGenerators(variant),
          'to be false',
        );
      });

      it('should return false for property variant', () => {
        const variant = {
          property: () => fc.property(fc.anything(), () => true),
        };
        expect(
          isPropertyTestConfigVariantAsyncGenerators(variant),
          'to be false',
        );
      });
    });

    describe('isPropertyTestConfigVariantProperty()', () => {
      it('should return true for sync property variant', () => {
        const variant = {
          property: () => fc.property(fc.anything(), () => true),
        };
        expect(isPropertyTestConfigVariantProperty(variant), 'to be true');
      });

      it('should return false for generators variant', () => {
        const variant = { generators: fc.constant(['a', 'b']) };
        expect(isPropertyTestConfigVariantProperty(variant), 'to be false');
      });

      it('should return false for asyncProperty variant', () => {
        const variant = {
          asyncProperty: () =>
            fc.asyncProperty(fc.anything(), async () => true),
        };
        expect(isPropertyTestConfigVariantProperty(variant), 'to be false');
      });
    });

    describe('isPropertyTestConfigVariantAsyncProperty()', () => {
      it('should return true for async property variant', () => {
        const variant = {
          asyncProperty: () =>
            fc.asyncProperty(fc.anything(), async () => true),
        };
        expect(isPropertyTestConfigVariantAsyncProperty(variant), 'to be true');
      });

      it('should return false for sync property variant', () => {
        const variant = {
          property: () => fc.property(fc.anything(), () => true),
        };
        expect(
          isPropertyTestConfigVariantAsyncProperty(variant),
          'to be false',
        );
      });

      it('should return false for generators variant', () => {
        const variant = { generators: fc.constant(['a', 'b']) };
        expect(
          isPropertyTestConfigVariantAsyncProperty(variant),
          'to be false',
        );
      });
    });

    describe('isGeneratorsTuple()', () => {
      it('should return true for a tuple of arbitraries', () => {
        const tuple = [fc.anything(), fc.string(), fc.integer()] as const;
        expect(isGeneratorsTuple(tuple), 'to be true');
      });

      it('should return true for minimal tuple (2 arbitraries)', () => {
        const tuple = [fc.anything(), fc.string()] as const;
        expect(isGeneratorsTuple(tuple), 'to be true');
      });

      it('should return false for a single arbitrary', () => {
        const single = fc.constant(['a', 'b']);
        expect(isGeneratorsTuple(single), 'to be false');
      });

      it('should return false for empty array', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- testing invalid input
        expect(isGeneratorsTuple([] as any), 'to be false');
      });

      it('should return false for array with only one element', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- testing invalid input
        expect(isGeneratorsTuple([fc.anything()] as any), 'to be false');
      });

      it('should return false for array with non-arbitrary elements', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- testing invalid input
        expect(isGeneratorsTuple([1, 2, 3] as any), 'to be false');
      });

      it('should return false for null/undefined', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- testing invalid input
        expect(isGeneratorsTuple(null as any), 'to be false');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- testing invalid input
        expect(isGeneratorsTuple(undefined as any), 'to be false');
      });
    });
  });

  describe('error classes', () => {
    describe('PropertyTestGeneratorError', () => {
      it('should have correct name property', () => {
        const error = new PropertyTestGeneratorError('test-assertion', [
          'arg1',
          'arg2',
        ]);
        expect(error.name, 'to equal', 'PropertyTestGeneratorError');
      });

      it('should include assertion ID in message', () => {
        const error = new PropertyTestGeneratorError('my-assertion-id', []);
        expect(error.message, 'to contain', 'my-assertion-id');
      });

      it('should include args in message', () => {
        const error = new PropertyTestGeneratorError('test', ['foo', 42]);
        expect(error.message, 'to contain', 'foo');
        expect(error.message, 'to contain', '42');
      });

      it('should store assertionId as property', () => {
        const error = new PropertyTestGeneratorError('stored-id', []);
        expect(error.assertionId, 'to equal', 'stored-id');
      });

      it('should store args as property', () => {
        const args = ['a', 1, true];
        const error = new PropertyTestGeneratorError('test', args);
        expect(error.args, 'to equal', args);
      });

      it('should use custom message when provided', () => {
        const error = new PropertyTestGeneratorError(
          'test',
          [],
          'Custom error message',
        );
        expect(error.message, 'to equal', 'Custom error message');
      });
    });

    describe('WrongAssertionError', () => {
      it('should have correct name property', () => {
        const error = new WrongAssertionError('expected', 'actual', []);
        expect(error.name, 'to equal', 'WrongAssertionError');
      });

      it('should include expected assertion ID in message', () => {
        const error = new WrongAssertionError('expected-id', 'actual-id', []);
        expect(error.message, 'to contain', 'expected-id');
      });

      it('should include actual assertion ID in message', () => {
        const error = new WrongAssertionError('expected-id', 'actual-id', []);
        expect(error.message, 'to contain', 'actual-id');
      });

      it('should store expectedAssertionId as property', () => {
        const error = new WrongAssertionError('expected', 'actual', []);
        expect(error.expectedAssertionId, 'to equal', 'expected');
      });

      it('should store actualAssertionId as property', () => {
        const error = new WrongAssertionError('expected', 'actual', []);
        expect(error.actualAssertionId, 'to equal', 'actual');
      });

      it('should store args as property', () => {
        const args = ['x', 'y', 'z'];
        const error = new WrongAssertionError('expected', 'actual', args);
        expect(error.args, 'to equal', args);
      });
    });
  });

  describe('expectUsing()', () => {
    // Create test assertions for use in these tests
    const isEvenAssertion = createAssertion(
      [z.number(), 'to be even'],
      (n) => n % 2 === 0,
    );

    const _isStringAssertion = createAssertion(['to be a string'], z.string());

    describe('when args parse successfully', () => {
      it('should not throw when assertion passes', () => {
        expect(
          () => expectUsing(isEvenAssertion, [4, 'to be even']),
          'not to throw',
        );
      });

      it('should throw AssertionError when assertion fails', () => {
        expect(
          () => expectUsing(isEvenAssertion, [3, 'to be even']),
          'to throw a',
          AssertionError,
        );
      });
    });

    describe('when args do not parse', () => {
      it('should throw PropertyTestGeneratorError', () => {
        expect(
          () => expectUsing(isEvenAssertion, ['not a number', 'to be even']),
          'to throw a',
          PropertyTestGeneratorError,
        );
      });

      it('should include assertion ID in error', () => {
        try {
          expectUsing(isEvenAssertion, ['bad', 'to be even']);
          expect.fail('Expected to throw');
        } catch (error) {
          expect(error, 'to be a', PropertyTestGeneratorError);
          expect(
            (error as PropertyTestGeneratorError).assertionId,
            'to equal',
            isEvenAssertion.id,
          );
        }
      });
    });

    describe('negated mode', () => {
      it('should return successfully when assertion fails (negated success)', () => {
        // 3 is odd, so "to be even" fails, which is success in negated mode
        expect(
          () =>
            expectUsing(isEvenAssertion, [3, 'to be even'], { negated: true }),
          'not to throw',
        );
      });

      it('should throw NegatedAssertionError when assertion passes (negated failure)', () => {
        // 4 is even, so "to be even" passes, which is failure in negated mode
        expect(
          () =>
            expectUsing(isEvenAssertion, [4, 'to be even'], { negated: true }),
          'to throw a',
          NegatedAssertionError,
        );
      });
    });
  });

  describe('expectUsingAsync()', () => {
    // Create async test assertion
    const resolvesToEvenAssertion = createAsyncAssertion(
      [z.promise(z.number()), 'to resolve to even'],
      async (promise) => {
        const n = await promise;
        return n % 2 === 0;
      },
    );

    describe('when args parse successfully', () => {
      it('should not throw when assertion passes', async () => {
        await expectAsync(
          expectUsingAsync(resolvesToEvenAssertion, [
            Promise.resolve(4),
            'to resolve to even',
          ]),
          'to fulfill',
        );
      });

      it('should throw AssertionError when assertion fails', async () => {
        await expectAsync(
          expectUsingAsync(resolvesToEvenAssertion, [
            Promise.resolve(3),
            'to resolve to even',
          ]),
          'to be rejected with a',
          AssertionError,
        );
      });
    });

    describe('when args do not parse', () => {
      it('should throw PropertyTestGeneratorError', async () => {
        await expectAsync(
          expectUsingAsync(resolvesToEvenAssertion, [
            'not a promise',
            'to resolve to even',
          ]),
          'to be rejected with a',
          PropertyTestGeneratorError,
        );
      });
    });

    describe('negated mode', () => {
      it('should return successfully when assertion fails (negated success)', async () => {
        // 3 is odd, so "to resolve to even" fails, which is success in negated mode
        await expectAsync(
          expectUsingAsync(
            resolvesToEvenAssertion,
            [Promise.resolve(3), 'to resolve to even'],
            { negated: true },
          ),
          'to fulfill',
        );
      });

      it('should throw NegatedAssertionError when assertion passes (negated failure)', async () => {
        await expectAsync(
          expectUsingAsync(
            resolvesToEvenAssertion,
            [Promise.resolve(4), 'to resolve to even'],
            { negated: true },
          ),
          'to be rejected with a',
          NegatedAssertionError,
        );
      });
    });
  });
});
