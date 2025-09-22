import escapeStringRegexp from 'escape-string-regexp';
import fc from 'fast-check';
import { describe } from 'node:test';

import * as assertions from '../../src/assertion/impl/sync-parametric.js';
import { SyncParametricAssertions } from '../../src/assertion/index.js';
import { type AnyAssertion } from '../../src/types.js';
import { expectExhaustiveAssertionTests } from '../exhaustive.macro.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './property-test-config.js';
import {
  extractPhrases,
  safeRegexStringFilter,
  valueToSchemaFilter,
} from './property-test-util.js';
import { runPropertyTests } from './property-test.macro.js';

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
          .array(fc.anything(), { minLength: 1, size: 'small' })
          .filter(valueToSchemaFilter)
          .chain((expected) =>
            fc.tuple(
              fc
                .array(fc.anything(), {
                  minLength: 1,
                  size: 'small',
                })
                .filter(valueToSchemaFilter)
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
        generators: fc
          .array(fc.anything(), { minLength: 1, size: 'small' })
          .filter(valueToSchemaFilter)
          .chain((expected) =>
            fc.tuple(
              fc.constant(structuredClone(expected)),
              fc.constantFrom(
                ...extractPhrases(assertions.arrayDeepEqualAssertion),
              ),
              fc.constant(expected),
            ),
          ),
      },
    },
  ],

  [
    assertions.arraySatisfiesAssertion,
    {
      invalid: {
        generators: fc
          .array(fc.anything(), { minLength: 1, size: 'small' })
          .filter(valueToSchemaFilter)
          .chain((expected) =>
            fc.tuple(
              fc
                .array(fc.anything(), {
                  minLength: 1,
                  size: 'small',
                })
                .filter(valueToSchemaFilter)
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
        generators: fc
          .array(fc.anything(), { minLength: 1, size: 'small' })
          .filter(valueToSchemaFilter)
          .chain((expected) =>
            fc.tuple(
              fc.constant(structuredClone(expected)),
              fc.constantFrom(
                ...extractPhrases(assertions.arraySatisfiesAssertion),
              ),
              fc.constant(expected),
            ),
          ),
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
        generators: fc
          .string()
          .chain((expectedMessage) =>
            fc.tuple(
              fc.constant(new Error(expectedMessage)),
              fc.constantFrom(
                ...extractPhrases(assertions.errorMessageAssertion),
              ),
              fc.constant(expectedMessage),
            ),
          ),
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
        generators: fc
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
      },
    },
  ],

  [
    assertions.functionArityAssertion,
    {
      invalid: {
        generators: fc.integer({ max: 5, min: 0 }).chain((actualArity) =>
          fc.tuple(
            fc.func(fc.anything()).map(() => {
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
            fc.func(fc.anything()).map(() => {
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
        generators: [
          fc.constant(() => {
            throw new Error('test error');
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionThrowsAssertion),
          ),
        ],
      },
    },
  ],

  [
    assertions.functionThrowsMatchingAssertion,
    {
      invalid: {
        generators: [
          fc.constant(() => {
            throw new Error('hello world');
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionThrowsMatchingAssertion),
          ),
          fc.constant(/goodbye/),
        ],
      },
      valid: {
        generators: [
          fc.constant(() => {
            throw new Error('hello world');
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionThrowsMatchingAssertion),
          ),
          fc.constant(/hello/),
        ],
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
        generators: [
          fc.constant(() => {
            throw new Error('test');
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionThrowsTypeAssertion),
          ),
          fc.constant(Error),
        ],
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
          fc.constant({ message: 'test message' }),
        ],
      },
      valid: {
        generators: [
          fc.constant(() => {
            throw new Error('test message');
          }),
          fc.constantFrom('to throw a', 'to throw an'),
          fc.constant(Error), // Expect Error and will get Error
          fc.constant('satisfying'),
          fc.constant({ message: 'test message' }),
        ],
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
        generators: [
          fc.constant(new Error('test')),
          fc.constantFrom(...extractPhrases(assertions.instanceOfAssertion)),
          fc.constant(Error),
        ],
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
        generators: fc.integer({ max: 100, min: -100 }).chain((target) =>
          fc.integer({ max: 10, min: 1 }).chain((tolerance) =>
            fc.tuple(
              fc.integer({
                max: target + tolerance,
                min: target - tolerance,
              }),
              fc.constantFrom(
                ...extractPhrases(assertions.numberCloseToAssertion),
              ),
              fc.constant(target),
              fc.constant(tolerance),
            ),
          ),
        ),
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
        generators: fc
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
        generators: fc
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
        generators: fc
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
        generators: fc
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
        generators: fc.integer({ max: 50, min: 0 }).chain((min) =>
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
      },
    },
  ],

  [
    assertions.objectDeepEqualAssertion,
    {
      invalid: {
        generators: fc
          .object()
          .filter(valueToSchemaFilter)
          .chain((expected) =>
            fc.tuple(
              fc
                .object()
                .filter(valueToSchemaFilter)
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
        generators: fc
          .object()
          .filter(valueToSchemaFilter)
          .chain((expected) =>
            fc.tuple(
              fc.constant(structuredClone(expected)),
              fc.constantFrom(
                ...extractPhrases(assertions.objectDeepEqualAssertion),
              ),
              fc.constant(expected),
            ),
          ),
      },
    },
  ],

  [
    assertions.objectSatisfiesAssertion,
    {
      invalid: {
        generators: fc
          .object()
          .filter(valueToSchemaFilter)
          .chain((expected) =>
            fc.tuple(
              fc
                .object({ depthSize: 'medium' })
                .filter(valueToSchemaFilter)
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
        generators: fc
          .object({ depthSize: 'small' })
          .filter(valueToSchemaFilter)
          .chain((expected) =>
            fc.tuple(
              fc.constant(structuredClone(expected)),
              fc.constantFrom(
                ...extractPhrases(assertions.objectSatisfiesAssertion),
              ),
              fc.constant(expected),
            ),
          ),
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
        generators: [
          fc.oneof(
            fc.constant('test'),
            fc.constant('other1'),
            fc.constant('other2'),
          ),
          fc.constantFrom(...extractPhrases(assertions.oneOfAssertion)),
          fc.constant(['test', 'other1', 'other2']),
        ],
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
              fc.anything().filter((actual) => actual !== expected),
              fc.constantFrom(
                ...extractPhrases(assertions.strictEqualityAssertion),
              ),
              fc.constant(expected),
            ),
          ),
      },
      valid: {
        generators: fc
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
        generators: fc
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
        generators: fc
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
        generators: fc
          .string({ maxLength: 5, minLength: 1 })
          .chain((threshold) =>
            fc.tuple(
              fc.constant(threshold + 'a'), // Simple: append 'a' to make it greater
              fc.constantFrom(
                ...extractPhrases(assertions.stringGreaterThanAssertion),
              ),
              fc.constant(threshold),
            ),
          ),
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
        generators: fc
          .string({ maxLength: 5, minLength: 1 })
          .chain((threshold) =>
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
        generators: fc
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
                      fc.constant(
                        str.substring(startIndex, startIndex + length),
                      ),
                    ),
                  ),
              ),
          ),
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
                ...extractPhrases(assertions.stringLessThanAssertion),
              ),
              fc.constant(threshold),
            ),
          ),
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
        generators: fc
          .string({ maxLength: 5, minLength: 1 })
          .chain((threshold) =>
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
        generators: fc
          .string({ maxLength: 5, minLength: 1 })
          .map(safeRegexStringFilter)
          .filter((str) => !!str.length)
          .chain((str) =>
            fc.tuple(
              fc.constant(str),
              fc.constantFrom(
                ...extractPhrases(assertions.stringMatchesAssertion),
              ),
              fc.constant(new RegExp(escapeStringRegexp(str))),
            ),
          ),
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
        generators: fc
          .oneof(
            // Generate value-type pairs where value matches the type
            fc.constant([fc.string(), 'string']),
            fc.constant([fc.float(), 'number']),
            fc.constant([fc.boolean(), 'boolean']),
            fc.constant([fc.constant(undefined), 'undefined']),
            fc.constant([fc.constant(null), 'null']),
            fc.constant([fc.constant(BigInt(1)), 'bigint']),
            fc.constant([fc.constant(Symbol('test')), 'symbol']),
            fc.constant([fc.object(), 'object']),
            fc.constant([fc.func(fc.anything()), 'function']),
            fc.constant([fc.array(fc.anything()), 'array']),
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
      },
    },
  ],
]);

describe('Property-Based Tests for Sync Parametric Assertions', () => {
  expectExhaustiveAssertionTests(
    'Sync Parametric Assertions',
    SyncParametricAssertions,
    testConfigs,
  );
  runPropertyTests(testConfigs, testConfigDefaults);
});
