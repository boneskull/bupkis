import escapeStringRegexp from 'escape-string-regexp';
import fc from 'fast-check';

import * as assertions from '../src/assertion/impl/sync-parametric.js';
import { type AnyAssertion } from '../src/types.js';
import { type GeneratorParams } from '../test/property/property-test-config.js';
import {
  extractPhrases,
  filteredAnything,
  filteredObject,
  objectFilter,
  safeRegexStringFilter,
} from '../test/property/property-test-util.js';

export const SyncParametricGenerators = new Map<AnyAssertion, GeneratorParams>([
  [
    assertions.arrayDeepEqualAssertion,
    fc
      .array(filteredAnything, { minLength: 1, size: 'small' })
      .filter(objectFilter)
      .chain((expected) =>
        fc.tuple(
          fc.constant(structuredClone(expected)),
          fc.constantFrom(
            ...extractPhrases(assertions.arrayDeepEqualAssertion),
          ),
          fc.constant(expected),
        ),
      ),
  ],
  [
    assertions.arraySatisfiesAssertion,
    fc
      .array(filteredAnything, { minLength: 1, size: 'small' })
      .filter(objectFilter)
      .chain((expected) =>
        fc.tuple(
          fc.constant(structuredClone(expected)),
          fc.constantFrom(
            ...extractPhrases(assertions.arraySatisfiesAssertion),
          ),
          fc.constant(expected),
        ),
      ),
  ],
  [
    assertions.errorMessageAssertion,
    fc
      .string()
      .chain((expectedMessage) =>
        fc.tuple(
          fc.constant(new Error(expectedMessage)),
          fc.constantFrom(...extractPhrases(assertions.errorMessageAssertion)),
          fc.constant(expectedMessage),
        ),
      ),
  ],
  [
    assertions.errorMessageMatchingAssertion,
    fc
      .string({ maxLength: 5, minLength: 1 })
      .map(safeRegexStringFilter)
      .filter((message) => !!message.length)
      .chain((message) =>
        fc.tuple(
          fc.constant(new Error(message)),
          fc.constantFrom(
            ...extractPhrases(assertions.errorMessageMatchingAssertion),
          ),
          fc.constant(new RegExp(escapeStringRegexp(message))),
        ),
      ),
  ],
  [
    assertions.functionArityAssertion,
    fc.integer({ max: 5, min: 0 }).chain((arity) =>
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
              ) => String(a) + String(b) + String(c) + String(d) + String(e);
          }
        }),
        fc.constantFrom(...extractPhrases(assertions.functionArityAssertion)),
        fc.constant(arity),
      ),
    ),
  ],
  [
    assertions.functionThrowsAssertion,
    [
      fc.constant(() => {
        throw new Error('test error');
      }),
      fc.constantFrom(...extractPhrases(assertions.functionThrowsAssertion)),
    ],
  ],
  [
    assertions.functionThrowsSatisfyingAssertion,
    [
      fc.constant(() => {
        throw new Error('hello world');
      }),
      fc.constantFrom(
        ...extractPhrases(assertions.functionThrowsSatisfyingAssertion),
      ),
      fc.constant(/hello/),
    ],
  ],
  [
    assertions.functionThrowsTypeAssertion,
    [
      fc.constant(() => {
        throw new Error('test');
      }),
      fc.constantFrom(
        ...extractPhrases(assertions.functionThrowsTypeAssertion),
      ),
      fc.constant(Error),
    ],
  ],
  [
    assertions.functionThrowsTypeSatisfyingAssertion,
    [
      fc.constant(() => {
        throw new Error('test message');
      }),
      fc.constantFrom('to throw a', 'to throw an'),
      fc.constant(Error), // Expect Error and will get Error
      fc.constant('satisfying'),
      fc.constantFrom(
        { message: 'test message' },
        'test message',
        /test message/,
      ),
    ],
  ],
  [
    assertions.instanceOfAssertion,
    [
      fc.constant(new Error('test')),
      fc.constantFrom(...extractPhrases(assertions.instanceOfAssertion)),
      fc.constant(Error),
    ],
  ],
  [
    assertions.numberCloseToAssertion,
    fc.integer({ max: 100, min: -100 }).chain((target) =>
      fc.integer({ max: 10, min: 1 }).chain((tolerance) =>
        fc.tuple(
          fc.integer({
            max: target + tolerance,
            min: target - tolerance,
          }),
          fc.constantFrom(...extractPhrases(assertions.numberCloseToAssertion)),
          fc.constant(target),
          fc.constant(tolerance),
        ),
      ),
    ),
  ],
  [
    assertions.numberGreaterThanAssertion,
    fc
      .integer({ max: 5, min: 1 })
      .chain((threshold) =>
        fc.tuple(
          fc.integer({ max: 10, min: 6 }),
          fc.constantFrom(
            ...extractPhrases(assertions.numberGreaterThanAssertion),
          ),
          fc.constant(threshold),
        ),
      ),
  ],
  [
    assertions.numberGreaterThanOrEqualAssertion,
    fc
      .integer({ max: 50, min: -50 })
      .chain((threshold) =>
        fc.tuple(
          fc.integer({ min: threshold }),
          fc.constantFrom(
            ...extractPhrases(assertions.numberGreaterThanOrEqualAssertion),
          ),
          fc.constant(threshold),
        ),
      ),
  ],
  [
    assertions.numberLessThanAssertion,
    fc
      .integer({ max: 50, min: -50 })
      .chain((threshold) =>
        fc.tuple(
          fc.integer({ max: threshold - 1 }),
          fc.constantFrom(
            ...extractPhrases(assertions.numberLessThanAssertion),
          ),
          fc.constant(threshold),
        ),
      ),
  ],
  [
    assertions.numberLessThanOrEqualAssertion,
    fc
      .integer({ max: 50, min: -50 })
      .chain((threshold) =>
        fc.tuple(
          fc.integer({ max: threshold }),
          fc.constantFrom(
            ...extractPhrases(assertions.numberLessThanOrEqualAssertion),
          ),
          fc.constant(threshold),
        ),
      ),
  ],
  [
    assertions.numberWithinRangeAssertion,
    fc.integer({ max: 50, min: 0 }).chain((min) =>
      fc.integer({ max: 100, min: min + 5 }).chain((max) =>
        fc.tuple(
          fc.integer({ max, min }), // Within range
          fc.constantFrom(
            ...extractPhrases(assertions.numberWithinRangeAssertion),
          ),
          fc.constant(min),
          fc.constant(max),
        ),
      ),
    ),
  ],
  [
    assertions.objectDeepEqualAssertion,
    fc
      .object()
      .filter(objectFilter)
      .chain((expected) =>
        fc.tuple(
          fc.constant(structuredClone(expected)),
          fc.constantFrom(
            ...extractPhrases(assertions.objectDeepEqualAssertion),
          ),
          fc.constant(expected),
        ),
      ),
  ],
  [
    assertions.objectSatisfiesAssertion,
    fc
      .object({ depthSize: 'small' })
      .filter(objectFilter)
      .chain((expected) =>
        fc.tuple(
          fc.constant(structuredClone(expected)),
          fc.constantFrom(
            ...extractPhrases(assertions.objectSatisfiesAssertion),
          ),
          fc.constant(expected),
        ),
      ),
  ],
  [
    assertions.oneOfAssertion,
    [
      fc.oneof(
        fc.constant('test'),
        fc.constant('other1'),
        fc.constant('other2'),
      ),
      fc.constantFrom(...extractPhrases(assertions.oneOfAssertion)),
      fc.constant(['test', 'other1', 'other2']),
    ],
  ],
  [
    assertions.strictEqualityAssertion,
    fc
      .anything()
      .filter((v) => !Number.isNaN(v))
      .chain((value) =>
        fc.tuple(
          fc.constant(value),
          fc.constantFrom(
            ...extractPhrases(assertions.strictEqualityAssertion),
          ),
          fc.constant(value),
        ),
      ),
  ],
  [
    assertions.stringBeginsWithAssertion,
    fc
      .string({ minLength: 2 })
      .chain((str) =>
        fc
          .integer({ max: str.length, min: 1 })
          .chain((prefixLength) =>
            fc.tuple(
              fc.constant(str),
              fc.constantFrom(
                ...extractPhrases(assertions.stringBeginsWithAssertion),
              ),
              fc.constant(str.substring(0, prefixLength)),
            ),
          ),
      ),
  ],
  [
    assertions.stringEndsWithAssertion,
    fc
      .string({ minLength: 2 })
      .chain((str) =>
        fc
          .integer({ max: str.length, min: 1 })
          .chain((suffixLength) =>
            fc.tuple(
              fc.constant(str),
              fc.constantFrom(
                ...extractPhrases(assertions.stringEndsWithAssertion),
              ),
              fc.constant(str.substring(str.length - suffixLength)),
            ),
          ),
      ),
  ],
  [
    assertions.stringGreaterThanAssertion,
    fc.string({ maxLength: 5, minLength: 1 }).chain((threshold) =>
      fc.tuple(
        fc.constant(threshold + 'a'), // Simple: append 'a' to make it greater
        fc.constantFrom(
          ...extractPhrases(assertions.stringGreaterThanAssertion),
        ),
        fc.constant(threshold),
      ),
    ),
  ],

  [
    assertions.stringGreaterThanOrEqualAssertion,

    fc.string({ maxLength: 5, minLength: 1 }).chain((threshold) =>
      fc.tuple(
        fc.oneof(
          fc.constant(threshold), // Equal case
          fc.constant(threshold + 'a'), // Greater case: append 'a'
        ),
        fc.constantFrom(
          ...extractPhrases(assertions.stringGreaterThanOrEqualAssertion),
        ),
        fc.constant(threshold),
      ),
    ),
  ],

  [
    assertions.stringIncludesAssertion,
    fc
      .string({ minLength: 3 })
      .chain((str) =>
        fc
          .integer({ max: str.length - 1, min: 1 })
          .chain((startIndex) =>
            fc
              .integer({ max: str.length - startIndex, min: 1 })
              .chain((length) =>
                fc.tuple(
                  fc.constant(str),
                  fc.constantFrom(
                    ...extractPhrases(assertions.stringIncludesAssertion),
                  ),
                  fc.constant(str.substring(startIndex, startIndex + length)),
                ),
              ),
          ),
      ),
  ],

  [
    assertions.stringLessThanAssertion,
    fc.string({ maxLength: 5, minLength: 1 }).chain((threshold) =>
      fc.tuple(
        // Generate string guaranteed to be less than threshold
        fc.constant(
          threshold.length > 0 && threshold.charCodeAt(0) > 32
            ? ' '.repeat(threshold.length)
            : '',
        ),
        fc.constantFrom(...extractPhrases(assertions.stringLessThanAssertion)),
        fc.constant(threshold),
      ),
    ),
  ],

  [
    assertions.stringLessThanOrEqualAssertion,
    fc.string({ maxLength: 5, minLength: 1 }).chain((threshold) =>
      fc.tuple(
        fc.oneof(
          fc.constant(threshold), // Equal case
          // Less case: if threshold starts with a character > space, replace with space
          // Otherwise use empty string (which is always < any non-empty string)
          fc.constant(
            threshold.length > 0 && threshold.charCodeAt(0) > 32
              ? ' '.repeat(threshold.length)
              : '',
          ),
        ),
        fc.constantFrom(
          ...extractPhrases(assertions.stringLessThanOrEqualAssertion),
        ),
        fc.constant(threshold),
      ),
    ),
  ],

  [
    assertions.stringMatchesAssertion,
    fc
      .string({ maxLength: 5, minLength: 1 })
      .map(safeRegexStringFilter)
      .filter((str) => !!str.length)
      .chain((str) =>
        fc.tuple(
          fc.constant(str),
          fc.constantFrom(...extractPhrases(assertions.stringMatchesAssertion)),
          fc.constant(new RegExp(escapeStringRegexp(str))),
        ),
      ),
  ],

  [
    assertions.typeOfAssertion,
    fc
      .oneof(
        // Generate value-type pairs where value matches the type
        fc.constant([fc.string(), 'string']),
        fc.constant([
          fc.float({ noDefaultInfinity: true, noNaN: true }),
          'number',
        ]),
        fc.constant([fc.boolean(), 'boolean']),
        fc.constant([fc.constant(undefined), 'undefined']),
        fc.constant([fc.constant(null), 'null']),
        fc.constant([fc.constant(BigInt(1)), 'bigint']),
        fc.constant([fc.constant(Symbol('test')), 'symbol']),
        fc.constant([filteredObject, 'object']),
        fc.constant([fc.func(filteredAnything), 'function']),
        fc.constant([fc.array(filteredAnything), 'array']),
        fc.constant([fc.constant(new Date()), 'date']),
        fc.constant([fc.constant(new Map()), 'map']),
        fc.constant([fc.constant(new Set()), 'set']),
        fc.constant([fc.constant(new WeakMap()), 'weakmap']),
        fc.constant([fc.constant(new WeakSet()), 'weakset']),
        fc.constant([fc.constant(/test/), 'regexp']),
        fc.constant([fc.constant(Promise.resolve()), 'promise']),
        fc.constant([fc.constant(new Error()), 'error']),
        fc.constant([fc.constant(new WeakRef({})), 'weakref']),
      )
      .chain(([valueGen, typeString]) =>
        valueGen.chain((value) =>
          fc.tuple(
            fc.constant(value),
            fc.constantFrom(...extractPhrases(assertions.typeOfAssertion)),
            fc.constant(typeString), // Only use lowercase
          ),
        ),
      ),
  ],
] as const);
