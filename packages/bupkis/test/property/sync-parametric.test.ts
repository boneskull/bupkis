import {
  createPropertyTestHarness,
  extractPhrases,
  filteredAnything,
  getVariants,
  objectFilter,
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
  safeRegexStringFilter,
} from '@bupkis/property-testing';
import escapeStringRegexp from 'escape-string-regexp';
import fc from 'fast-check';
import { describe, it } from 'node:test';

import * as assertions from '../../src/assertion/impl/sync-parametric.js';
import { SyncParametricAssertions } from '../../src/assertion/index.js';
import { type AnyAssertion } from '../../src/types.js';
import { SyncParametricGenerators } from '../../test-data/sync-parametric-generators.js';
import { expect, expectAsync } from '../custom-assertions.js';

const { runVariant } = createPropertyTestHarness({ expect, expectAsync });

/**
 * Test config defaults
 */
const testConfigDefaults: PropertyTestConfigParameters = {} as const;

/**
 * Test configurations for each parametric assertion.
 */
const testConfigs = new Map<AnyAssertion, PropertyTestConfig>([
  [
    assertions.arrayDeepEqualAssertion,
    {
      invalid: {
        generators: fc
          .array(filteredAnything, { minLength: 1, size: 'small' })
          .filter(objectFilter)
          .chain((expected) =>
            fc.tuple(
              fc
                .array(filteredAnything, {
                  minLength: 1,
                  size: 'small',
                })
                .filter(objectFilter)
                .filter(
                  (actual) =>
                    JSON.stringify(actual) !== JSON.stringify(expected),
                ),
              fc.constantFrom(
                ...extractPhrases(assertions.arrayDeepEqualAssertion),
              ),
              fc.constant(expected),
            ),
          ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.arrayDeepEqualAssertion,
        )!,
      },
    },
  ],

  [
    assertions.arraySatisfiesAssertion,
    {
      invalid: {
        generators: fc
          .array(filteredAnything, { minLength: 1, size: 'small' })
          .filter(objectFilter)
          .chain((expected) =>
            fc.tuple(
              fc
                .array(filteredAnything, {
                  minLength: 1,
                  size: 'small',
                })
                .filter(objectFilter)
                .filter(
                  (actual) =>
                    JSON.stringify(actual) !== JSON.stringify(expected),
                ),
              fc.constantFrom(
                ...extractPhrases(assertions.arraySatisfiesAssertion),
              ),
              fc.constant(expected),
            ),
          ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.arraySatisfiesAssertion,
        )!,
      },
    },
  ],

  [
    assertions.errorMessageAssertion,
    {
      invalid: {
        generators: fc.string({ size: 'medium' }).chain((actualMessage) =>
          fc.tuple(
            fc.constant(new Error(actualMessage)),
            fc.constantFrom(
              ...extractPhrases(assertions.errorMessageAssertion),
            ),
            fc
              .string()
              .filter((expectedMessage) => expectedMessage !== actualMessage),
          ),
        ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.errorMessageAssertion,
        )!,
      },
    },
  ],

  [
    assertions.errorMessageMatchingAssertion,
    {
      invalid: {
        generators: fc
          .string({ maxLength: 5, minLength: 1 })
          .chain((actualMessage) =>
            fc.tuple(
              fc.constant(new Error(actualMessage)),
              fc.constantFrom(
                ...extractPhrases(assertions.errorMessageMatchingAssertion),
              ),
              fc
                .string({ maxLength: 15, minLength: 10 })
                .map(safeRegexStringFilter)
                .filter((pattern) => pattern.length > actualMessage.length)
                .map((pattern) => new RegExp(escapeStringRegexp(pattern))),
            ),
          ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.errorMessageMatchingAssertion,
        )!,
      },
    },
  ],

  [
    assertions.functionArityAssertion,
    {
      invalid: {
        generators: fc.integer({ max: 5, min: 0 }).chain((actualArity) =>
          fc.tuple(
            fc.func(filteredAnything).map(() => {
              switch (actualArity) {
                case 0:
                  return () => 0;
                case 1:
                  return (a: unknown) => a;
                case 2:
                  return (a: unknown, b: unknown) => String(a) + String(b);
                case 3:
                  return (a: unknown, b: unknown, c: unknown) =>
                    String(a) + String(b) + String(c);
                case 4:
                  return (a: unknown, b: unknown, c: unknown, d: unknown) =>
                    String(a) + String(b) + String(c) + String(d);
                default:
                  return (
                    a: unknown,
                    b: unknown,
                    c: unknown,
                    d: unknown,
                    e: unknown,
                  ) =>
                    String(a) + String(b) + String(c) + String(d) + String(e);
              }
            }),
            fc.constantFrom(
              ...extractPhrases(assertions.functionArityAssertion),
            ),
            fc
              .integer({ max: 5, min: 0 })
              .filter((wrongArity) => wrongArity !== actualArity),
          ),
        ),
      },
      valid: {
        generators: fc.integer({ max: 5, min: 0 }).chain((arity) =>
          fc.tuple(
            fc.func(filteredAnything).map(() => {
              switch (arity) {
                case 0:
                  return () => 0;
                case 1:
                  return (a: unknown) => a;
                case 2:
                  return (a: unknown, b: unknown) => String(a) + String(b);
                case 3:
                  return (a: unknown, b: unknown, c: unknown) =>
                    String(a) + String(b) + String(c);
                case 4:
                  return (a: unknown, b: unknown, c: unknown, d: unknown) =>
                    String(a) + String(b) + String(c) + String(d);
                default:
                  return (
                    a: unknown,
                    b: unknown,
                    c: unknown,
                    d: unknown,
                    e: unknown,
                  ) =>
                    String(a) + String(b) + String(c) + String(d) + String(e);
              }
            }),
            fc.constantFrom(
              ...extractPhrases(assertions.functionArityAssertion),
            ),
            fc.constant(arity),
          ),
        ),
      },
    },
  ],

  [
    assertions.functionThrowsAssertion,
    {
      invalid: {
        generators: [
          fc.constant(() => 'no error'),
          fc.constantFrom(
            ...extractPhrases(assertions.functionThrowsAssertion),
          ),
        ],
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.functionThrowsAssertion,
        )!,
      },
    },
  ],

  [
    assertions.functionThrowsSatisfyingAssertion,
    {
      invalid: {
        generators: [
          fc.constant(() => {
            throw new Error('hello world');
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionThrowsSatisfyingAssertion),
          ),
          fc.constant(/goodbye/),
        ],
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.functionThrowsSatisfyingAssertion,
        )!,
      },
    },
  ],

  [
    assertions.functionThrowsTypeAssertion,
    {
      invalid: {
        generators: [
          fc.constant(() => {
            throw new Error('test');
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionThrowsTypeAssertion),
          ),
          fc.constant(TypeError),
        ],
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.functionThrowsTypeAssertion,
        )!,
      },
    },
  ],

  [
    assertions.functionThrowsTypeSatisfyingAssertion,
    {
      invalid: {
        generators: [
          fc.constant(() => {
            throw new Error('test message');
          }),
          fc.constantFrom('to throw a', 'to throw an'),
          fc.constant(TypeError), // Expect TypeError but will get Error
          fc.constant('satisfying'),
          fc.constantFrom(
            { message: 'test message' },
            'test message',
            /test message/,
          ),
        ],
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.functionThrowsTypeSatisfyingAssertion,
        )!,
      },
    },
  ],

  [
    assertions.instanceOfAssertion,
    {
      invalid: {
        generators: [
          fc.string(),
          fc.constantFrom(...extractPhrases(assertions.instanceOfAssertion)),
          fc.constant(Error),
        ],
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.instanceOfAssertion,
        )!,
      },
    },
  ],

  [
    assertions.mapDeepEqualAssertion,
    {
      invalid: {
        generators: fc
          .array(fc.tuple(fc.string(), fc.integer()), {
            minLength: 1,
            size: 'small',
          })
          .chain((entries) =>
            fc.tuple(
              fc.constant(new Map(entries)),
              fc.constantFrom(
                ...extractPhrases(assertions.mapDeepEqualAssertion),
              ),
              fc.constant(new Map([...entries, ['__different_key__', 999]])),
            ),
          ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.mapDeepEqualAssertion,
        )!,
      },
    },
  ],

  [
    assertions.numberCloseToAssertion,
    {
      invalid: {
        generators: fc.integer({ max: 100, min: -100 }).chain((target) =>
          fc.integer({ max: 10, min: 1 }).chain((tolerance) =>
            fc.tuple(
              fc.oneof(
                fc.integer({ max: target - tolerance - 1 }), // Too far below
                fc.integer({ min: target + tolerance + 1 }), // Too far above
              ),
              fc.constantFrom(
                ...extractPhrases(assertions.numberCloseToAssertion),
              ),
              fc.constant(target),
              fc.constant(tolerance),
            ),
          ),
        ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.numberCloseToAssertion,
        )!,
      },
    },
  ],

  [
    assertions.numberGreaterThanAssertion,
    {
      invalid: {
        generators: fc
          .integer({ max: 10, min: 6 })
          .chain((threshold) =>
            fc.tuple(
              fc.integer({ max: 5, min: 1 }),
              fc.constantFrom(
                ...extractPhrases(assertions.numberGreaterThanAssertion),
              ),
              fc.constant(threshold),
            ),
          ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.numberGreaterThanAssertion,
        )!,
      },
    },
  ],

  [
    assertions.numberGreaterThanOrEqualAssertion,
    {
      invalid: {
        generators: fc
          .integer({ max: 50, min: -50 })
          .chain((threshold) =>
            fc.tuple(
              fc.integer({ max: threshold - 1 }),
              fc.constantFrom(
                ...extractPhrases(assertions.numberGreaterThanOrEqualAssertion),
              ),
              fc.constant(threshold),
            ),
          ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.numberGreaterThanOrEqualAssertion,
        )!,
      },
    },
  ],

  [
    assertions.numberLessThanAssertion,
    {
      invalid: {
        generators: fc
          .integer({ max: 50, min: -50 })
          .chain((threshold) =>
            fc.tuple(
              fc.integer({ min: threshold }),
              fc.constantFrom(
                ...extractPhrases(assertions.numberLessThanAssertion),
              ),
              fc.constant(threshold),
            ),
          ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.numberLessThanAssertion,
        )!,
      },
    },
  ],

  [
    assertions.numberLessThanOrEqualAssertion,
    {
      invalid: {
        generators: fc
          .integer({ max: 50, min: -50 })
          .chain((threshold) =>
            fc.tuple(
              fc.integer({ min: threshold + 1 }),
              fc.constantFrom(
                ...extractPhrases(assertions.numberLessThanOrEqualAssertion),
              ),
              fc.constant(threshold),
            ),
          ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.numberLessThanOrEqualAssertion,
        )!,
      },
    },
  ],

  [
    assertions.numberWithinRangeAssertion,
    {
      invalid: {
        generators: fc.integer({ max: 50, min: 0 }).chain((min) =>
          fc.integer({ max: 100, min: min + 5 }).chain((max) =>
            fc.tuple(
              fc.oneof(
                fc.integer({ max: min - 1 }), // Below range
                fc.integer({ min: max + 1 }), // Above range
              ),
              fc.constantFrom(
                ...extractPhrases(assertions.numberWithinRangeAssertion),
              ),
              fc.constant(min),
              fc.constant(max),
            ),
          ),
        ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.numberWithinRangeAssertion,
        )!,
      },
    },
  ],

  [
    assertions.objectDeepEqualAssertion,
    {
      invalid: {
        generators: fc
          .object()
          .filter(objectFilter)
          .chain((expected) =>
            fc.tuple(
              fc
                .object()
                .filter(objectFilter)
                .filter(
                  (actual) =>
                    JSON.stringify(actual) !== JSON.stringify(expected),
                ),
              fc.constantFrom(
                ...extractPhrases(assertions.objectDeepEqualAssertion),
              ),
              fc.constant(expected),
            ),
          ),
        verbose: true,
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.objectDeepEqualAssertion,
        )!,
      },
    },
  ],

  [
    assertions.objectSatisfiesAssertion,
    {
      invalid: {
        generators: fc
          .object()
          .filter(objectFilter)
          .chain((expected) =>
            fc.tuple(
              fc
                .object({ depthSize: 'medium' })
                .filter(objectFilter)
                .filter(
                  (actual) =>
                    JSON.stringify(actual) !== JSON.stringify(expected),
                ),
              fc.constantFrom(
                ...extractPhrases(assertions.objectSatisfiesAssertion),
              ),
              fc.constant(expected),
            ),
          ),
        verbose: true,
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.objectSatisfiesAssertion,
        )!,
      },
    },
  ],

  [
    assertions.oneOfAssertion,
    {
      invalid: {
        generators: [
          fc.string(),
          fc.constantFrom(...extractPhrases(assertions.oneOfAssertion)),
          fc.array(fc.integer()),
        ],
      },
      valid: {
        generators: SyncParametricGenerators.get(assertions.oneOfAssertion)!,
      },
    },
  ],

  [
    assertions.setDeepEqualAssertion,
    {
      invalid: {
        generators: fc
          .array(fc.integer(), { minLength: 1, size: 'small' })
          .chain((values) =>
            fc.tuple(
              fc.constant(new Set(values)),
              fc.constantFrom(
                ...extractPhrases(assertions.setDeepEqualAssertion),
              ),
              fc.constant(new Set(['__different_value__', ...values])),
            ),
          ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.setDeepEqualAssertion,
        )!,
      },
    },
  ],

  [
    assertions.strictEqualityAssertion,
    {
      invalid: {
        generators: fc
          .anything()
          .filter((v) => !Number.isNaN(v))
          .chain((expected) =>
            fc.tuple(
              filteredAnything.filter((actual) => actual !== expected),
              fc.constantFrom(
                ...extractPhrases(assertions.strictEqualityAssertion),
              ),
              fc.constant(expected),
            ),
          ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.strictEqualityAssertion,
        )!,
      },
    },
  ],

  [
    assertions.stringBeginsWithAssertion,
    {
      invalid: {
        generators: fc.string({ minLength: 3 }).chain((str) =>
          fc.tuple(
            fc.constant(str),
            fc.constantFrom(
              ...extractPhrases(assertions.stringBeginsWithAssertion),
            ),
            fc
              .string({ minLength: 1 })
              .filter((prefix) => !str.startsWith(prefix)),
          ),
        ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.stringBeginsWithAssertion,
        )!,
      },
    },
  ],

  [
    assertions.stringEndsWithAssertion,
    {
      invalid: {
        generators: fc.string({ minLength: 3 }).chain((str) =>
          fc.tuple(
            fc.constant(str),
            fc.constantFrom(
              ...extractPhrases(assertions.stringEndsWithAssertion),
            ),
            fc
              .string({ minLength: 1 })
              .filter((suffix) => !str.endsWith(suffix)),
          ),
        ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.stringEndsWithAssertion,
        )!,
      },
    },
  ],

  [
    assertions.stringGreaterThanAssertion,
    {
      invalid: {
        generators: fc
          .string({ maxLength: 5, minLength: 1 })
          .chain((threshold) =>
            fc.tuple(
              fc
                .string({ maxLength: 5, minLength: 1 })
                .filter((str) => str <= threshold),
              fc.constantFrom(
                ...extractPhrases(assertions.stringGreaterThanAssertion),
              ),
              fc.constant(threshold),
            ),
          ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.stringGreaterThanAssertion,
        )!,
      },
    },
  ],

  [
    assertions.stringGreaterThanOrEqualAssertion,
    {
      invalid: {
        generators: fc
          .string({ maxLength: 5, minLength: 1 })
          .chain((threshold) =>
            fc.tuple(
              // Generate string guaranteed to be less than threshold
              fc.constant(
                threshold.length > 0 && threshold.charCodeAt(0) > 32
                  ? ' '.repeat(threshold.length)
                  : '',
              ),
              fc.constantFrom(
                ...extractPhrases(assertions.stringGreaterThanOrEqualAssertion),
              ),
              fc.constant(threshold),
            ),
          ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.stringGreaterThanOrEqualAssertion,
        )!,
      },
    },
  ],

  [
    assertions.stringIncludesAssertion,
    {
      invalid: {
        generators: fc.string({ minLength: 3 }).chain((str) =>
          fc.tuple(
            fc.constant(str),
            fc.constantFrom(
              ...extractPhrases(assertions.stringIncludesAssertion),
            ),
            fc
              .string({ minLength: 1 })
              .filter((substring) => !str.includes(substring)),
          ),
        ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.stringIncludesAssertion,
        )!,
      },
    },
  ],

  [
    assertions.stringLengthAssertion,
    {
      invalid: {
        generators: fc.string({ maxLength: 20, minLength: 1 }).chain((str) =>
          fc.tuple(
            fc.constant(str),
            fc.constantFrom(
              ...extractPhrases(assertions.stringLengthAssertion),
            ),
            fc
              .integer({ max: 100, min: 0 })
              .filter((len) => len !== str.length),
          ),
        ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.stringLengthAssertion,
        )!,
      },
    },
  ],

  [
    assertions.stringLessThanAssertion,
    {
      invalid: {
        generators: fc
          .string({ maxLength: 5, minLength: 1 })
          .chain((threshold) =>
            fc.tuple(
              fc.oneof(
                fc.constant(threshold), // Equal case
                fc.constant(threshold + 'a'), // Greater case
              ),
              fc.constantFrom(
                ...extractPhrases(assertions.stringLessThanAssertion),
              ),
              fc.constant(threshold),
            ),
          ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.stringLessThanAssertion,
        )!,
      },
    },
  ],

  [
    assertions.stringLessThanOrEqualAssertion,
    {
      invalid: {
        generators: fc
          .string({ maxLength: 5, minLength: 1 })
          .chain((threshold) =>
            fc.tuple(
              fc.constant(threshold + 'a'), // Simple: append 'a' to make it greater
              fc.constantFrom(
                ...extractPhrases(assertions.stringLessThanOrEqualAssertion),
              ),
              fc.constant(threshold),
            ),
          ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.stringLessThanOrEqualAssertion,
        )!,
      },
    },
  ],

  [
    assertions.stringMatchesAssertion,
    {
      invalid: {
        generators: fc
          .string({ maxLength: 5, minLength: 1 })
          .chain((actualString) =>
            fc.tuple(
              fc.constant(actualString),
              fc.constantFrom(
                ...extractPhrases(assertions.stringMatchesAssertion),
              ),
              fc
                .string({ maxLength: 15, minLength: 10 })
                .map(safeRegexStringFilter)
                .filter((pattern) => pattern.length > actualString.length)
                .map((pattern) => new RegExp(escapeStringRegexp(pattern))),
            ),
          ),
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.stringMatchesAssertion,
        )!,
      },
    },
  ],

  [
    assertions.typeOfAssertion,
    {
      invalid: {
        generators: fc
          .oneof(
            // Generate value-type pairs where value doesn't match the type
            fc.constant(['string', 'number']), // string value, expect number
            fc.constant([42, 'string']), // number value, expect string
            fc.constant([true, 'string']), // boolean value, expect string
            fc.constant([undefined, 'string']), // undefined value, expect string
            fc.constant([null, 'string']), // null value, expect string
            fc.constant([BigInt(1), 'string']), // bigint value, expect string
            fc.constant([Symbol('test'), 'string']), // symbol value, expect string
            fc.constant([{}, 'string']), // object value, expect string
            fc.constant([() => {}, 'string']), // function value, expect string
            fc.constant([[], 'string']), // array value, expect string
            fc.constant([new Date(), 'string']), // date value, expect string
            fc.constant([new Map(), 'string']), // map value, expect string
            fc.constant([new Set(), 'string']), // set value, expect string
            fc.constant([new WeakMap(), 'string']), // weakmap value, expect string
            fc.constant([new WeakSet(), 'string']), // weakset value, expect string
            fc.constant([/test/, 'string']), // regexp value, expect string
            fc.constant([Promise.resolve(), 'string']), // promise value, expect string
            fc.constant([new Error(), 'string']), // error value, expect string
            fc.constant([new WeakRef({}), 'string']), // weakref value, expect string
          )
          .chain(([value, wrongType]) =>
            fc.tuple(
              fc.constant(value),
              fc.constantFrom(...extractPhrases(assertions.typeOfAssertion)),
              fc.constant(wrongType),
            ),
          ),
      },
      valid: {
        generators: SyncParametricGenerators.get(assertions.typeOfAssertion)!,
      },
    },
  ],
]);

describe('Property-Based Tests for Sync Parametric Assertions', () => {
  it(`should test all available assertions in SyncParametricAssertions`, () => {
    expect(
      testConfigs,
      'to exhaustively test collection',
      'SyncParametricAssertions',
      'from',
      SyncParametricAssertions,
    );
  });

  for (const [assertion, testConfig] of testConfigs) {
    const { id } = assertion;
    describe(`Assertion: ${assertion} [${id}]`, () => {
      const runVariants = (configs: PropertyTestConfig[]) => {
        for (const config of configs) {
          const { params, variants } = getVariants(config);
          for (const [name, variant] of variants) {
            it(`should pass ${name} checks [${id}]`, async () => {
              await runVariant(variant, testConfigDefaults, params, name);
            });
          }
        }
      };

      runVariants(Array.isArray(testConfig) ? testConfig : [testConfig]);
    });
  }
});
