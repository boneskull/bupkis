import {
  extractPhrases,
  filteredAnything,
  type GeneratorParams,
  hasValueDeep,
  objectFilter,
  type PropertyTestConfig,
  rejectPassing,
  safeRegexStringFilter,
} from '@bupkis/property-testing';
import escapeStringRegexp from 'escape-string-regexp';
import fc from 'fast-check';

import { type Class } from '../../../src/assertion/assertion-types.js';
import * as assertions from '../../../src/assertion/impl/sync-parametric.js';
import { type AnyAssertion } from '../../../src/types.js';
import { SyncParametricGenerators } from '../../../test-data/sync-parametric-generators.js';
import { expect } from '../../custom-assertions.js';

/**
 * Arbitrary that generates any primitive value except `NaN` because `NaN !==
 * NaN`.
 */
const primitive = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.boolean(),
  fc.string(),
  fc.integer(),
  fc.float(),
  fc.bigInt(),
  fc.constant(Infinity),
  fc.constant(-Infinity),
  fc.constant(Symbol('test')),
);

/**
 * Maps the `[[Class]]` tag (as reported by `Object.prototype.toString`) of
 * every _object_ that `fc.anything()` can emit to the constructor which
 * produced it.
 *
 * Primitives are intentionally absent: they are never instances of anything,
 * which makes them perfect fodder for the "invalid" case.
 */
const CONSTRUCTOR_BY_TAG: ReadonlyMap<string, Class> = new Map<string, Class>([
  ['Array', Array],
  ['Boolean', Boolean],
  ['Date', Date],
  ['Float32Array', Float32Array],
  ['Float64Array', Float64Array],
  ['Int8Array', Int8Array],
  ['Int16Array', Int16Array],
  ['Int32Array', Int32Array],
  ['Map', Map],
  ['Number', Number],
  ['Object', Object],
  ['Set', Set],
  ['String', String],
  ['Uint8Array', Uint8Array],
  ['Uint8ClampedArray', Uint8ClampedArray],
  ['Uint16Array', Uint16Array],
  ['Uint32Array', Uint32Array],
]);

/**
 * Constructors that `fc.anything()` never produces, but which are still handy
 * as "wrong answers" for the invalid case.
 */
const EXTRA_CONSTRUCTORS: readonly Class[] = [
  Error,
  Promise,
  RegExp,
  WeakMap,
  WeakSet,
];

/**
 * Every constructor we may hand to `'to be an instance of'`.
 */
const INSTANCE_OF_CONSTRUCTORS: readonly Class[] = [
  ...new Set([...CONSTRUCTOR_BY_TAG.values(), ...EXTRA_CONSTRUCTORS]),
];

/**
 * `fc.anything()` configured to emit every value kind we have a lookup for,
 * plus primitives and null-prototype objects (which are instances of nothing).
 */
const instanceOfSubject = fc.anything({
  withBigInt: true,
  withBoxedValues: true,
  withDate: true,
  withMap: true,
  withNullPrototype: true,
  withSet: true,
  withTypedArray: true,
});

/**
 * Returns the constructors from {@link INSTANCE_OF_CONSTRUCTORS} that `value` is
 * an instance of (e.g., `Array` _and_ `Object` for an array).
 */
const matchingConstructors = (value: unknown): Class[] =>
  INSTANCE_OF_CONSTRUCTORS.filter((ctor) => value instanceof ctor);

/**
 * Restricts subjects to values the {@link CONSTRUCTOR_BY_TAG} lookup covers, so
 * any new kind of object `fc.anything()` learns to emit doesn't sneak in with
 * an unvetted constructor. Primitives and null-prototype objects always pass;
 * they are instances of nothing.
 */
const hasKnownTag = (value: unknown): boolean =>
  typeof value !== 'object' ||
  value === null ||
  Object.getPrototypeOf(value) === null ||
  CONSTRUCTOR_BY_TAG.has(Object.prototype.toString.call(value).slice(8, -1));

/**
 * Generates `[subject, phrase, ctor]` where `subject` is an instance of `ctor`.
 *
 * The constructor is chosen from those `subject` actually derives from, so
 * inheritance (e.g., an array being an instance of `Object`) gets exercised
 * too.
 */
const instanceOfValid = instanceOfSubject
  .filter(hasKnownTag)
  .filter((value) => matchingConstructors(value).length > 0)
  .chain((value) =>
    fc.tuple(
      fc.constant(value),
      fc.constantFrom(...extractPhrases(assertions.instanceOfAssertion)),
      fc.constantFrom(...matchingConstructors(value)),
    ),
  );

/**
 * Generates `[subject, phrase, ctor]` where `subject` is _not_ an instance of
 * `ctor`; includes primitives and null-prototype objects.
 */
const instanceOfInvalid = instanceOfSubject.chain((value) => {
  const matching = new Set(matchingConstructors(value));
  return fc.tuple(
    fc.constant(value),
    fc.constantFrom(...extractPhrases(assertions.instanceOfAssertion)),
    fc.constantFrom(
      ...INSTANCE_OF_CONSTRUCTORS.filter((ctor) => !matching.has(ctor)),
    ),
  );
});

/**
 * Normalizes either {@link GeneratorParams} form into a single tuple arbitrary
 * so it can be combined with others via `fc.oneof()`.
 */
const toTupleArbitrary = (
  generators: GeneratorParams,
): fc.Arbitrary<readonly [unknown, string, ...unknown[]]> => {
  if ('generate' in generators) {
    return generators;
  }
  const [subject, phrase, ...params] = generators;
  return fc.tuple(subject, phrase, ...params);
};

export const testConfigs = new Map<AnyAssertion, PropertyTestConfig>([
  [
    assertions.deepEqualAssertion,
    {
      invalid: {
        examples: [
          [[[[]], 'to deep equal', [[null]]]],
          [[42, 'to deep equal', 43]],
          [['hello', 'to deeply equal', 'world']],
        ],
        generators: fc
          .oneof(
            // Primitives that don't match
            primitive.chain((expected) =>
              fc.tuple(
                primitive.filter((actual) => actual !== expected),
                fc.constantFrom(
                  ...extractPhrases(assertions.deepEqualAssertion),
                ),
                fc.constant(expected),
              ),
            ),
            // Objects that don't match; medium objects should always generally be larger than small objects
            fc
              .object({ size: 'small' })
              .filter(objectFilter)
              .chain((expected) =>
                fc.tuple(
                  fc.object({ size: 'medium' }).filter(objectFilter),
                  fc.constantFrom(
                    ...extractPhrases(assertions.deepEqualAssertion),
                  ),
                  fc.constant(expected),
                ),
              ),
            // Arrays that don't match
            fc
              .array(filteredAnything, {
                minLength: 1,
                size: 'small',
              })
              .chain((expected) =>
                fc.tuple(
                  fc.array(filteredAnything, {
                    minLength: 1,
                    size: 'medium',
                  }),
                  fc.constantFrom(
                    ...extractPhrases(assertions.deepEqualAssertion),
                  ),
                  fc.constant(expected),
                ),
              ),
          )
          // Belt-and-suspenders: independently-generated actual/expected pairs
          // can shrink toward equality, so drop any tuple the assertion accepts.
          .filter(rejectPassing(expect)),
        verbose: true,
      },
      valid: {
        generators: SyncParametricGenerators.get(
          assertions.deepEqualAssertion,
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
        generators: instanceOfInvalid,
      },
      valid: {
        generators: fc.oneof(
          toTupleArbitrary(
            SyncParametricGenerators.get(assertions.instanceOfAssertion)!,
          ),
          instanceOfValid,
        ),
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
    assertions.satisfiesAssertion,
    {
      invalid: {
        examples: [
          [[[[]], 'to satisfy', [[], null]]],
          [[42, 'to satisfy', 43]],
          [['hello', 'satisfies', 'world']],
        ],
        generators: fc
          .oneof(
            // Primitives that don't match
            primitive.chain((expected) =>
              fc.tuple(
                primitive.filter((actual) => actual !== expected),
                fc.constantFrom(
                  ...extractPhrases(assertions.satisfiesAssertion),
                ),
                fc.constant(expected),
              ),
            ),
            // Objects that don't satisfy
            fc
              .object({ depthSize: 'small' })
              .filter(objectFilter)
              .chain((expected) =>
                fc.tuple(
                  fc.object({ depthSize: 'medium' }).filter(objectFilter),
                  fc.constantFrom(
                    ...extractPhrases(assertions.satisfiesAssertion),
                  ),
                  fc.constant(expected),
                ),
              ),
            // Arrays that don't satisfy
            fc
              .array(filteredAnything, { minLength: 1, size: 'small' })
              .chain((expected) =>
                fc.tuple(
                  fc
                    .array(filteredAnything, {
                      minLength: 1,
                      size: 'medium',
                    })
                    .filter((val) => !hasValueDeep(val, [])),
                  fc.constantFrom(
                    ...extractPhrases(assertions.satisfiesAssertion),
                  ),
                  fc.constant(expected),
                ),
              ),
          )
          // "to satisfy" is a subset check, so independently-generated pairs can
          // coincidentally satisfy (and the shrinker actively seeks those out).
          // Reject any tuple the assertion actually accepts so that "invalid"
          // inputs remain genuinely invalid.
          .filter(rejectPassing(expect)),
        verbose: true,
      },
      valid: {
        examples: [[[[true, 1, 'w', 1.23], 'to be like', []]]],
        generators: SyncParametricGenerators.get(
          assertions.satisfiesAssertion,
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
