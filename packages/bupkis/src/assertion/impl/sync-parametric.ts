/**
 * Parameterized assertions for comparisons, function behavior, and complex
 * validation.
 *
 * These assertions accept additional parameters to customize their behavior,
 * including numeric comparisons, string matching, object satisfaction, function
 * throwing behavior, and deep equality checks.
 *
 * @packageDocumentation
 * @groupDescription Parametric Assertions (Sync)
 * Complex assertions that accept parameters for customized validation behavior.
 *
 * @showGroups
 */

import { inspect } from 'node:util';
import { z } from 'zod';

import { BupkisError, InvalidObjectSchemaError } from '../../error.js';
import { isA, isError, isNonNullObject, isString } from '../../guards.js';
import {
  AnyObjectSchema,
  ArrayLikeSchema,
  BigintSchema,
  BooleanSchema,
  ConstructibleSchema,
  createErrorMessageRegexSchema,
  createErrorMessageSchema,
  DateSchema,
  ErrorSchema,
  FunctionSchema,
  MapSchema,
  NonNegativeIntegerSchema,
  NullSchema,
  NumberSchema,
  RegExpSchema,
  SetSchema,
  StringSchema,
  SymbolSchema,
  UndefinedSchema,
  UnknownArraySchema,
  UnknownRecordSchema,
  UnknownSchema,
  WeakMapSchema,
  WeakRefSchema,
  WeakSetSchema,
  WrappedPromiseLikeSchema,
} from '../../schema.js';
import { type Constructor } from '../../types.js';
import {
  valueToSchema,
  valueToSchemaOptionsForDeepEqual,
  valueToSchemaOptionsForSatisfies,
} from '../../value-to-schema.js';
import { createAssertion } from '../create.js';
import { trapError } from './assertion-util.js';

const { freeze } = Object;
const { abs } = Math;

/**
 * For {@link typeOfAssertion}
 */
const knownTypes = freeze(
  new Set([
    'string',
    'number',
    'boolean',
    'undefined',
    'null',
    'BigInt',
    'Symbol',
    'Object',
    'Function',
    'Array',
    'Date',
    'Map',
    'Set',
    'WeakMap',
    'WeakSet',
    'RegExp',
    'Promise',
    'Error',
    'WeakRef',
  ] as const),
);

/**
 * Assertion for testing if a value is an instance of a specific constructor.
 *
 * @example
 *
 * ```typescript
 * expect(new Date(), 'to be an instance of', Date); // passes
 * expect('hello', 'to be a', String); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const instanceOfAssertion = createAssertion(
  [['to be an instance of', 'to be a', 'to be an'], ConstructibleSchema],
  (_, ctor) => createInstanceOfSchema(ctor),
);

/**
 * Assertion for testing if a value is of a specific built-in type.
 *
 * @example
 *
 * ```typescript
 * expect('hello', 'to be a', 'string'); // passes
 * expect(42, 'to be an', 'Array'); // fails
 * expect([], 'to be a', 'array'); // passes
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const typeOfAssertion = createAssertion(
  [
    UnknownSchema,
    ['to be a', 'to be an', 'to have type'],
    z.enum(
      [...knownTypes].flatMap((t) => [t, t.toLowerCase()]) as [
        string,
        ...string[],
      ],
    ),
  ],
  (_, type) => {
    type = type.toLowerCase() as Lowercase<typeof type>;
    // these first three are names that are _not_ results of the `typeof` operator; i.e. `typeof x` will never return these strings
    switch (type) {
      case 'array':
        return UnknownArraySchema;
      case 'bigint':
        return BigintSchema;
      case 'boolean':
        return BooleanSchema;
      case 'date':
        return DateSchema;
      case 'error':
        return ErrorSchema;
      case 'function':
        return FunctionSchema;
      case 'map':
        return MapSchema;
      case 'null':
        return NullSchema;
      case 'number':
        return NumberSchema;
      case 'object':
        return AnyObjectSchema;
      case 'promise':
        return WrappedPromiseLikeSchema;
      case 'regex': // fallthrough
      case 'regexp':
        return RegExpSchema;
      case 'set':
        return SetSchema;
      case 'string':
        return StringSchema;
      case 'symbol':
        return SymbolSchema;
      case 'undefined':
        return UndefinedSchema;
      case 'weakmap':
        return WeakMapSchema;
      case 'weakref':
        return WeakRefSchema;
      case 'weakset':
        return WeakSetSchema;
      // c8 ignore next 2
      default:
        throw new BupkisError(`Unknown "type": "${type}"`);
    }
  },
);

/**
 * Assertion for testing if a number is greater than another number.
 *
 * @example
 *
 * ```typescript
 * expect(5, 'to be greater than', 3); // passes
 * expect(2, 'to be greater than', 5); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const numberGreaterThanAssertion = createAssertion(
  [NumberSchema, 'to be greater than', NumberSchema],
  (_, other) => NumberSchema.gt(other),
);

/**
 * Assertion for testing if a number is less than another number.
 *
 * @example
 *
 * ```typescript
 * expect(3, 'to be less than', 5); // passes
 * expect(5, 'to be less than', 2); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const numberLessThanAssertion = createAssertion(
  [NumberSchema, ['to be less than', 'to be lt'], NumberSchema],
  (_, other) => NumberSchema.lt(other),
);

/**
 * Assertion for testing if a number is greater than or equal to another number.
 *
 * @example
 *
 * ```typescript
 * expect(5, 'to be greater than or equal to', 5); // passes
 * expect(5, 'to be at least', 3); // passes
 * expect(2, 'to be at least', 5); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const numberGreaterThanOrEqualAssertion = createAssertion(
  [
    NumberSchema,
    ['to be greater than or equal to', 'to be at least', 'to be gte'],
    NumberSchema,
  ],
  (_, other) => NumberSchema.gte(other),
);

/**
 * Assertion for testing if a number is less than or equal to another number.
 *
 * @example
 *
 * ```typescript
 * expect(3, 'to be less than or equal to', 5); // passes
 * expect(5, 'to be at most', 5); // passes
 * expect(7, 'to be at most', 5); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const numberLessThanOrEqualAssertion = createAssertion(
  [
    NumberSchema,
    ['to be less than or equal to', 'to be at most', 'to be lte'],
    NumberSchema,
  ],
  (_, other) => NumberSchema.lte(other),
);

/**
 * Assertion for testing if a number is within a specific range (inclusive).
 *
 * @example
 *
 * ```typescript
 * expect(5, 'to be within', 1, 10); // passes
 * expect(15, 'to be between', 1, 10); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const numberWithinRangeAssertion = createAssertion(
  [NumberSchema, ['to be within', 'to be between'], NumberSchema, NumberSchema],
  (subject, min, max) => {
    if (subject < min || subject > max) {
      return {
        message: `Expected ${subject} to be within range [${min}, ${max}]`,
      };
    }
  },
);

/**
 * Assertion for testing if a number is close to another number within a
 * tolerance.
 *
 * @example
 *
 * ```typescript
 * expect(1.0001, 'to be close to', 1.0, 0.001); // passes
 * expect(1.1, 'to be close to', 1.0, 0.01); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const numberCloseToAssertion = createAssertion(
  [NumberSchema, 'to be close to', NumberSchema, NumberSchema.optional()],
  (subject, expected, tolerance = 1e-9) => {
    const diff = abs(subject - expected);
    if (diff > tolerance) {
      return {
        actual: subject,
        expected,
        message: `Expected ${subject} to be close to ${expected} (within ${tolerance}), but difference was ${diff}`,
      };
    }
  },
);

/**
 * Assertion for testing if a string is lexicographically greater than another
 * string.
 *
 * @example
 *
 * ```typescript
 * expect('b', 'to be greater than', 'a'); // passes
 * expect('apple', 'to be greater than', 'banana'); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const stringGreaterThanAssertion = createAssertion(
  [StringSchema, 'to be greater than', StringSchema],
  (subject, other) => {
    if (!(subject > other)) {
      return {
        message: `Expected "${subject}" to be greater than "${other}"`,
      };
    }
  },
);

/**
 * Assertion for testing if a string is lexicographically less than another
 * string.
 *
 * @example
 *
 * ```typescript
 * expect('a', 'to be less than', 'b'); // passes
 * expect('banana', 'to be less than', 'apple'); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const stringLessThanAssertion = createAssertion(
  [StringSchema, 'to be less than', StringSchema],
  (subject, other) => {
    if (!(subject < other)) {
      return {
        message: `Expected "${subject}" to be less than "${other}"`,
      };
    }
  },
);

/**
 * Assertion for testing if a string is lexicographically greater than or equal
 * to another string.
 *
 * @example
 *
 * ```typescript
 * expect('b', 'to be greater than or equal to', 'a'); // passes
 * expect('a', 'to be greater than or equal to', 'a'); // passes
 * expect('a', 'to be greater than or equal to', 'b'); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const stringGreaterThanOrEqualAssertion = createAssertion(
  [StringSchema, 'to be greater than or equal to', StringSchema],
  (subject, other) => {
    if (!(subject >= other)) {
      return {
        message: `Expected "${subject}" to be greater than or equal to "${other}"`,
      };
    }
  },
);

/**
 * Assertion for testing if a string is lexicographically less than or equal to
 * another string.
 *
 * @example
 *
 * ```typescript
 * expect('a', 'to be less than or equal to', 'b'); // passes
 * expect('a', 'to be less than or equal to', 'a'); // passes
 * expect('b', 'to be less than or equal to', 'a'); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const stringLessThanOrEqualAssertion = createAssertion(
  [StringSchema, 'to be less than or equal to', StringSchema],
  (subject, other) => {
    if (!(subject <= other)) {
      return {
        message: `Expected "${subject}" to be less than or equal to "${other}"`,
      };
    }
  },
);

/**
 * Assertion for testing if a string begins with a specific prefix.
 *
 * @example
 *
 * ```typescript
 * expect('hello world', 'to begin with', 'hello'); // passes
 * expect('hello world', 'to start with', 'world'); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const stringBeginsWithAssertion = createAssertion(
  [StringSchema, ['to begin with', 'to start with'], StringSchema],
  (subject, prefix) => {
    if (!subject.startsWith(prefix)) {
      return {
        message: `Expected "${subject}" to begin with "${prefix}"`,
      };
    }
  },
);

/**
 * Assertion for testing if a string ends with a specific suffix.
 *
 * @example
 *
 * ```typescript
 * expect('hello world', 'to end with', 'world'); // passes
 * expect('hello world', 'to end with', 'hello'); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const stringEndsWithAssertion = createAssertion(
  [StringSchema, 'to end with', StringSchema],
  (subject, suffix) => {
    if (!subject.endsWith(suffix)) {
      return {
        message: `Expected "${subject}" to end with "${suffix}"`,
      };
    }
  },
);

/**
 * Assertion for testing if a value is one of a specific set of values.
 *
 * @example
 *
 * ```typescript
 * expect('red', 'to be one of', ['red', 'green', 'blue']); // passes
 * expect('yellow', 'to be one of', ['red', 'green', 'blue']); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const oneOfAssertion = createAssertion(
  ['to be one of', UnknownArraySchema],
  (subject, values) => {
    if (!values.includes(subject)) {
      return {
        actual: subject,
        expected: values,
        message: `Expected ${inspect(subject)} to be one of [${values.map((v) => inspect(v)).join(', ')}]`,
      };
    }
  },
);

/**
 * Assertion for testing if a function has a specific arity (number of
 * parameters).
 *
 * @example
 *
 * ```typescript
 * expect((a, b) => a + b, 'to have arity', 2); // passes
 * expect((a, b, c) => a + b + c, 'to have arity', 2); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const functionArityAssertion = createAssertion(
  [FunctionSchema, 'to have arity', NonNegativeIntegerSchema],
  (subject, expectedArity) => {
    if (subject.length !== expectedArity) {
      return {
        actual: subject.length,
        expected: expectedArity,
        message: `Expected function to have arity ${expectedArity}, but it has arity ${subject.length}`,
      };
    }
  },
);

/**
 * Assertion for testing if an Error has a specific message.
 *
 * @example
 *
 * ```typescript
 * expect(new Error('oops'), 'to have message', 'oops'); // passes
 * expect(new Error('oops'), 'to have message', 'wrong'); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const errorMessageAssertion = createAssertion(
  [ErrorSchema, 'to have message', StringSchema],
  (subject, expectedMessage) => {
    if (subject.message !== expectedMessage) {
      return {
        actual: subject.message,
        expected: expectedMessage,
        message: `Expected error message "${subject.message}" to equal "${expectedMessage}"`,
      };
    }
  },
);

/**
 * Assertion for testing if an Error has a message matching a regular
 * expression.
 *
 * @example
 *
 * ```typescript
 * expect(
 *   new Error('Error: something went wrong'),
 *   'to have message matching',
 *   /something/,
 * ); // passes
 * expect(new Error('All good'), 'to have message matching', /error/i); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const errorMessageMatchingAssertion = createAssertion(
  [ErrorSchema, 'to have message matching', RegExpSchema],
  (subject, pattern) => {
    if (!pattern.test(subject.message)) {
      return {
        message: `Expected error message "${subject.message}" to match ${pattern}`,
      };
    }
  },
);

/**
 * Assertion for testing strict equality between two values.
 *
 * @example
 *
 * ```typescript
 * expect(42, 'to be', 42); // passes
 * expect('hello', 'to equal', 'hello'); // passes
 * expect({}, 'to be', {}); // fails (different object references)
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const strictEqualityAssertion = createAssertion(
  [
    [
      'to be',
      'to equal',
      'equals',
      'is',
      'is equal to',
      'to strictly equal',
      'is strictly equal to',
    ],
    UnknownSchema,
  ],
  (subject, value) => {
    if (subject !== value) {
      return {
        actual: subject,
        expected: value,
        message: `Expected ${inspect(subject)} to equal ${inspect(value)}`,
      };
    }
  },
);

/**
 * Assertion for testing deep equality between objects.
 *
 * @example
 *
 * ```typescript
 * expect({ a: 1, b: 2 }, 'to deep equal', { a: 1, b: 2 }); // passes
 * expect({ a: 1 }, 'to deeply equal', { a: 1, b: 2 }); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const objectDeepEqualAssertion = createAssertion(
  [UnknownRecordSchema, ['to deep equal', 'to deeply equal'], UnknownSchema],
  (_, expected) => valueToSchema(expected, valueToSchemaOptionsForDeepEqual),
);

/**
 * Assertion for testing deep equality between array-like structures.
 *
 * @example
 *
 * ```typescript
 * expect([1, 2, 3], 'to deep equal', [1, 2, 3]); // passes
 * expect([1, 2], 'to deeply equal', [1, 2, 3]); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const arrayDeepEqualAssertion = createAssertion(
  [ArrayLikeSchema, ['to deep equal', 'to deeply equal'], UnknownSchema],
  (_, expected) => {
    return valueToSchema(expected, valueToSchemaOptionsForDeepEqual);
  },
);

/**
 * Assertion for testing deep equality between Map instances.
 *
 * @example
 *
 * ```typescript
 * const map1 = new Map([
 *   ['a', 1],
 *   ['b', 2],
 * ]);
 * const map2 = new Map([
 *   ['a', 1],
 *   ['b', 2],
 * ]);
 * expect(map1, 'to deep equal', map2); // passes
 *
 * const map3 = new Map([['a', 1]]);
 * expect(map1, 'to deeply equal', map3); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 * @bupkisAnchor map-to-deep-equal
 * @bupkisAssertionCategory collections
 */
export const mapDeepEqualAssertion = createAssertion(
  [MapSchema, ['to deep equal', 'to deeply equal'], UnknownSchema],
  (_, expected) => {
    return valueToSchema(expected, valueToSchemaOptionsForDeepEqual);
  },
);

/**
 * Assertion for testing deep equality between Set instances.
 *
 * @example
 *
 * ```typescript
 * const set1 = new Set([1, 2, 3]);
 * const set2 = new Set([1, 2, 3]);
 * expect(set1, 'to deep equal', set2); // passes
 *
 * const set3 = new Set([1, 2]);
 * expect(set1, 'to deeply equal', set3); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 * @bupkisAnchor set-to-deep-equal
 * @bupkisAssertionCategory collections
 */
export const setDeepEqualAssertion = createAssertion(
  [SetSchema, ['to deep equal', 'to deeply equal'], UnknownSchema],
  (_, expected) => {
    return valueToSchema(expected, valueToSchemaOptionsForDeepEqual);
  },
);

/**
 * Assertion for testing if a function throws an error when called.
 *
 * @example
 *
 * ```typescript
 * expect(() => {
 *   throw new Error('oops');
 * }, 'to throw'); // passes
 * expect(() => 'hello', 'to throw'); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 * @bupkisAnchor function-to-throw-any
 * @bupkisAssertionCategory function
 * @bupkisRedirect to-throw
 */
export const functionThrowsAssertion = createAssertion(
  [FunctionSchema, 'to throw'],
  (subject) => {
    const { error, result } = trapError(subject);
    if (error === undefined) {
      return {
        message: `Expected function to throw, but it fulfilled with ${inspect(result)}`,
      };
    }
  },
);

/**
 * Assertion for testing if a function throws an error of a specific type.
 *
 * @example
 *
 * ```typescript
 * expect(
 *   () => {
 *     throw new TypeError('wrong type');
 *   },
 *   'to throw a',
 *   TypeError,
 * ); // passes
 * expect(
 *   () => {
 *     throw new Error('oops');
 *   },
 *   'to throw an',
 *   TypeError,
 * ); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const functionThrowsTypeAssertion = createAssertion(
  [FunctionSchema, ['to throw a', 'to throw an'], ConstructibleSchema],
  (subject, ctor) => {
    const { error, result } = trapError(subject);
    if (error === undefined) {
      return {
        message: `Expected function to throw, but fulfilled with ${inspect(result)}`,
      };
    }
    if (!isA(error, ctor)) {
      if (isNonNullObject(error)) {
        const err = error as object;
        return {
          actual: err.constructor.name,
          expected: ctor.name,
          message: `Expected function to throw with an instance of ${ctor.name}, but it threw with a ${err.constructor.name}`,
        };
      }
      return {
        actual: typeof error,
        expected: ctor.name,
        message: `Expected function to throw with an instance of ${ctor.name}, but it threw a value of type ${typeof error}: ${inspect(error)}`,
      };
    }
  },
);

/**
 * Assertion for testing if a function throws an error matching specific
 * criteria.
 *
 * @example
 *
 * ```typescript
 * expect(
 *   () => {
 *     throw new Error('oops');
 *   },
 *   'to throw',
 *   'oops',
 * ); // passes
 * expect(
 *   () => {
 *     throw new Error('fail');
 *   },
 *   'to throw',
 *   /error/i,
 * ); // passes
 * expect(
 *   () => {
 *     throw new Error('oops');
 *   },
 *   'to throw',
 *   { message: 'oops' },
 * ); // passes
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const functionThrowsSatisfyingAssertion = createAssertion(
  [FunctionSchema, ['to throw', 'to throw error satisfying'], UnknownSchema],
  (subject, param) => {
    const { error } = trapError(subject);
    if (error === undefined) {
      return {
        message: 'Expected function to throw, but it did not',
      };
    }

    if (isString(param)) {
      return {
        schema: createErrorMessageSchema(param),
        subject: error,
      };
    } else if (isA(param, RegExp)) {
      return {
        schema: createErrorMessageRegexSchema(param),
        subject: error,
      };
    } else if (isNonNullObject(param)) {
      const schema = valueToSchema(param, valueToSchemaOptionsForSatisfies);
      return { schema, subject: error };
    } else {
      throw new InvalidObjectSchemaError(
        `Invalid parameter schema: ${inspect(param, { depth: 2 })}`,
        { schema: param },
      );
    }
  },
);

/**
 * Assertion for testing if a function throws an error of a specific type that
 * also matches criteria.
 *
 * @example
 *
 * ```typescript
 * expect(
 *   () => {
 *     throw new TypeError('wrong type');
 *   },
 *   'to throw a',
 *   TypeError,
 *   'satisfying',
 *   { message: 'wrong type' },
 * ); // passes
 * expect(
 *   () => {
 *     throw new Error('oops');
 *   },
 *   'to throw an',
 *   TypeError,
 *   'satisfying',
 *   /type/,
 * ); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const functionThrowsTypeSatisfyingAssertion = createAssertion(
  [
    FunctionSchema,
    ['to throw a', 'to throw an'],
    ConstructibleSchema,
    'satisfying',
    UnknownSchema,
  ],
  (subject, ctor, param) => {
    const { error, result } = trapError(subject);
    if (error === undefined) {
      return {
        message: `Expected function to throw, but it fulfilled with ${inspect(result)}`,
      };
    }
    if (!isA(error, ctor)) {
      return {
        message: isError(error)
          ? `Expected function to throw an instance of ${ctor.name}, but it threw ${(error as Error).constructor.name}`
          : `Expected function to throw an instance of ${ctor.name}, but it threw a non-object value: ${inspect(error)}`,
      };
    }
    let schema: undefined | z.ZodType;
    // TODO: can valueToSchema handle the first two conditional branches?
    if (isString(param)) {
      schema = createErrorMessageSchema(param);
    } else if (isA(param, RegExp)) {
      schema = createErrorMessageRegexSchema(param);
    } else if (isNonNullObject(param)) {
      schema = valueToSchema(param, valueToSchemaOptionsForSatisfies);
    }
    if (!schema) {
      throw new InvalidObjectSchemaError(
        `Invalid parameter schema: ${inspect(param)}`,
        { schema: param },
      );
    }

    return {
      schema,
      subject: error,
    };
  },
);

/**
 * Assertion for testing if a string includes/contains another string.
 *
 * @example
 *
 * ```typescript
 * expect('hello world', 'includes', 'world'); // passes
 * expect('hello world', 'contains', 'foo'); // fails
 * expect('hello world', 'to include', 'hello'); // passes
 * expect('hello world', 'to contain', 'bar'); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const stringIncludesAssertion = createAssertion(
  [
    StringSchema,
    ['includes', 'contains', 'to include', 'to contain'],
    StringSchema,
  ],
  (subject, expected) => {
    if (!subject.includes(expected)) {
      return {
        message: `Expected "${subject}" to include "${expected}"`,
      };
    }
  },
);

/**
 * Assertion for testing if a string matches a regular expression.
 *
 * @example
 *
 * ```typescript
 * expect('hello123', 'to match', /\d+/); // passes
 * expect('hello', 'to match', /\d+/); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const stringMatchesAssertion = createAssertion(
  [StringSchema, 'to match', RegExpSchema],
  (subject, regex) => regex.test(subject),
);

/**
 * Assertion for testing if a string has a specific length.
 *
 * @example
 *
 * ```typescript
 * expect('hello', 'to have length', 5); // passes
 * expect('hi', 'to have length', 5); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 * @bupkisAnchor string-to-have-length
 * @bupkisAssertionCategory strings
 */
export const stringLengthAssertion = createAssertion(
  [StringSchema, 'to have length', NonNegativeIntegerSchema],
  // StringSchema.length() produces a ZodError with a string diff (e.g., "hel"
  // vs "hello") rather than comparing numeric lengths, which is confusing
  (subject, expectedLength) => {
    if (subject.length !== expectedLength) {
      return {
        actual: subject.length,
        expected: expectedLength,
        message: `Expected string to have length ${expectedLength}, but it has length ${subject.length}`,
      };
    }
  },
);

/**
 * Assertion for testing if an object satisfies a pattern or shape.
 *
 * @example
 *
 * ```typescript
 * expect({ name: 'John', age: 30 }, 'to satisfy', { name: 'John' }); // passes
 * expect({ name: 'John' }, 'to be like', { name: 'John', age: 30 }); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 * @bupkisAnchor object-to-satisfy-any
 * @bupkisAssertionCategory object
 * @bupkisRedirect satisfies
 */
export const objectSatisfiesAssertion = createAssertion(
  [
    AnyObjectSchema.nonoptional(),
    ['to satisfy', 'to be like', 'satisfies'],
    UnknownSchema,
  ],
  (_subject, shape) => valueToSchema(shape, valueToSchemaOptionsForSatisfies),
);

/**
 * Assertion for testing if an array-like structure satisfies a pattern or
 * shape.
 *
 * @example
 *
 * ```typescript
 * expect([1, 2, 3], 'to satisfy', [1, NumberSchema, 3]); // passes
 * expect([1, 'two'], 'to be like', [1, NumberSchema]); // fails
 * ```
 *
 * @group Parametric Assertions (Sync)
 */
export const arraySatisfiesAssertion = createAssertion(
  [ArrayLikeSchema, ['to satisfy', 'to be like'], UnknownSchema],
  (_subject, shape) => valueToSchema(shape, valueToSchemaOptionsForSatisfies),
);

/**
 * Memoizes {@link createInstanceOfSchema}
 */
const createInstanceOfSchemaCache = new WeakMap<Constructor, z.ZodCustom>();

/**
 * @function
 */
const createInstanceOfSchema = <T extends Constructor>(
  ctor: T,
): z.ZodCustom<T, T> => {
  const cached = createInstanceOfSchemaCache.get(ctor);
  if (cached) {
    return cached as z.ZodCustom<T, T>;
  }
  const schema = z.instanceof(ctor);
  createInstanceOfSchemaCache.set(ctor, schema);
  return schema;
};
