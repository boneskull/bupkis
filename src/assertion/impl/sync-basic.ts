/**
 * Basic type and primitive value assertions.
 *
 * These are the fundamental building blocks for type checking including
 * strings, numbers, booleans, arrays, objects, functions, and other primitive
 * JavaScript types.
 *
 * @packageDocumentation
 * @groupDescription Basic Assertions
 * Fundamental type checking and primitive value validation.
 *
 * @showGroups
 */

import { z } from 'zod/v4';

import { BupkisRegistry } from '../../metadata.js';
import {
  ArrayLikeSchema,
  AsyncFunctionSchema,
  ConstructibleSchema,
  FalsySchema,
  FunctionSchema,
  PrimitiveSchema,
  PropertyKeySchema,
  TruthySchema,
} from '../../schema.js';
import { createAssertion } from '../create.js';

const { ownKeys } = Reflect;

/**
 * Asserts that the subject is a string value.
 *
 * @example
 *
 * ```ts
 * expect('hello', 'to be a string'); // passes
 * expect(42, 'to be a string'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const stringAssertion = createAssertion(['to be a string'], z.string(), {
  anchor: 'unknown-to-be-a-string',
  category: 'primitives',
});

/**
 * Asserts that the subject is a finite number value.
 *
 * @example
 *
 * ```ts
 * expect(42, 'to be a number'); // passes
 * expect(Infinity, 'to be a number'); // fails
 * expect('42', 'to be a number'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const numberAssertion = createAssertion(
  [['to be a number', 'to be finite']],
  z.number(),
);

/**
 * Asserts that the subject is either positive or negative infinity.
 *
 * @example
 *
 * ```ts
 * expect(Infinity, 'to be infinite'); // passes
 * expect(-Infinity, 'to be infinite'); // passes
 * expect(42, 'to be infinite'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const infiniteAssertion = createAssertion(
  ['to be infinite'],
  z.literal(Infinity).or(z.literal(-Infinity)),
);

/**
 * Asserts that the subject is positive infinity.
 *
 * @example
 *
 * ```ts
 * expect(Infinity, 'to be Infinity'); // passes
 * expect(-Infinity, 'to be Infinity'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const positiveInfinityAssertion = createAssertion(
  ['to be Infinity'],
  z.literal(Infinity),
);

/**
 * Asserts that the subject is negative infinity.
 *
 * @example
 *
 * ```ts
 * expect(-Infinity, 'to be -Infinity'); // passes
 * expect(Infinity, 'to be -Infinity'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const negativeInfinityAssertion = createAssertion(
  ['to be -Infinity'],
  z.literal(-Infinity),
);

/**
 * Asserts that the subject is a boolean value.
 *
 * @example
 *
 * ```ts
 * expect(true, 'to be a boolean'); // passes
 * expect('true', 'to be a boolean'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const booleanAssertion = createAssertion(
  [['to be a boolean', 'to be boolean', 'to be a bool']],
  z.boolean(),
);

/**
 * Asserts that the subject is a positive number.
 *
 * @example
 *
 * ```ts
 * expect(42, 'to be positive'); // passes
 * expect(-1, 'to be positive'); // fails
 * expect(0, 'to be positive'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const positiveAssertion = createAssertion(
  [['to be positive', 'to be a positive number']],
  z.number().positive(),
);

/**
 * Asserts that the subject is a positive integer.
 *
 * @example
 *
 * ```ts
 * expect(42, 'to be a positive integer'); // passes
 * expect(-1, 'to be a positive integer'); // fails
 * expect(42.5, 'to be a positive integer'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const positiveIntegerAssertion = createAssertion(
  [['to be a positive integer', 'to be a positive int']],
  z.number().int().positive(),
);

/**
 * Asserts that the subject is a negative number.
 *
 * @example
 *
 * ```ts
 * expect(-42, 'to be negative'); // passes
 * expect(1, 'to be negative'); // fails
 * expect(0, 'to be negative'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const negativeAssertion = createAssertion(
  [['to be negative', 'to be a negative number']],
  z.number().negative(),
);

/**
 * Asserts that the subject is a negative integer.
 *
 * @example
 *
 * ```ts
 * expect(-42, 'to be a negative integer'); // passes
 * expect(1, 'to be a negative integer'); // fails
 * expect(-42.5, 'to be a negative integer'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const negativeIntegerAssertion = createAssertion(
  [['to be a negative integer', 'to be a negative int']],
  z.number().int().negative(),
);

/**
 * Asserts that the subject is exactly the boolean value true.
 *
 * @example
 *
 * ```ts
 * expect(true, 'to be true'); // passes
 * expect(false, 'to be true'); // fails
 * expect(1, 'to be true'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const trueAssertion = createAssertion(['to be true'], z.literal(true));

/**
 * Asserts that the subject is exactly the boolean value false.
 *
 * @example
 *
 * ```ts
 * expect(false, 'to be false'); // passes
 * expect(true, 'to be false'); // fails
 * expect(0, 'to be false'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const falseAssertion = createAssertion(
  ['to be false'],
  z.literal(false),
);

/**
 * Asserts that the subject is a BigInt value.
 *
 * @example
 *
 * ```ts
 * expect(123n, 'to be a bigint'); // passes
 * expect(123, 'to be a bigint'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const bigintAssertion = createAssertion(
  [['to be a bigint', 'to be a BigInt']],
  z.bigint(),
);

/**
 * Asserts that the subject is a Symbol.
 *
 * @example
 *
 * ```ts
 * expect(Symbol('test'), 'to be a symbol'); // passes
 * expect('symbol', 'to be a symbol'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const symbolAssertion = createAssertion(
  [['to be a symbol', 'to be a Symbol']],
  z.symbol(),
);

/**
 * Asserts that the subject is a function.
 *
 * @example
 *
 * ```ts
 * expect(() => {}, 'to be a function'); // passes
 * expect('function', 'to be a function'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const functionAssertion = createAssertion(
  ['to be a function'],
  FunctionSchema,
);

/**
 * Asserts that the subject is an async function.
 *
 * @example
 *
 * ```ts
 * expect(async () => {}, 'to be an async function'); // passes
 * expect(() => {}, 'to be an async function'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const asyncFunctionAssertion = createAssertion(
  ['to be an async function'],
  AsyncFunctionSchema,
);

/**
 * Asserts that the subject is NaN (Not a Number).
 *
 * @example
 *
 * ```ts
 * expect(NaN, 'to be NaN'); // passes
 * expect(42, 'to be NaN'); // fails
 * expect('not a number', 'to be NaN'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const nanAssertion = createAssertion(['to be NaN'], z.nan());

/**
 * Asserts that the subject is an integer (safe integer).
 *
 * @example
 *
 * ```ts
 * expect(42, 'to be an integer'); // passes
 * expect(42.5, 'to be an integer'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const integerAssertion = createAssertion(
  [
    [
      'to be an integer',
      'to be a safe integer',
      'to be an int',
      'to be a safe int',
    ],
  ],
  z.number().int(),
);

/**
 * Asserts that the subject is null.
 *
 * @example
 *
 * ```ts
 * expect(null, 'to be null'); // passes
 * expect(undefined, 'to be null'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const nullAssertion = createAssertion(['to be null'], z.null());

/**
 * Asserts that the subject is undefined.
 *
 * @example
 *
 * ```ts
 * expect(undefined, 'to be undefined'); // passes
 * expect(null, 'to be undefined'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const undefinedAssertion = createAssertion(
  ['to be undefined'],
  z.undefined(),
);

/**
 * Asserts that the subject is an array.
 *
 * @example
 *
 * ```ts
 * expect([1, 2, 3], 'to be an array'); // passes
 * expect('array', 'to be an array'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const arrayAssertion = createAssertion(
  [['to be an array', 'to be array']],
  z.array(z.any()),
);

/**
 * Asserts that the subject is a Date object.
 *
 * @example
 *
 * ```ts
 * expect(new Date(), 'to be a date'); // passes
 * expect('2023-01-01', 'to be a date'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const dateAssertion = createAssertion(
  [['to be a date', 'to be a Date']],
  z.date(),
);

/**
 * Asserts that the subject is a class constructor (constructible function).
 *
 * @example
 *
 * ```ts
 * expect(Date, 'to be a class'); // passes
 * expect(() => {}, 'to be a class'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const classAssertion = createAssertion(
  [['to be a class', 'to be a constructor', 'to be constructible']],
  ConstructibleSchema,
);

/**
 * Asserts that the subject is a primitive value (string, number, boolean, null,
 * undefined, symbol, or bigint).
 *
 * @example
 *
 * ```ts
 * expect('hello', 'to be a primitive'); // passes
 * expect({}, 'to be a primitive'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const primitiveAssertion = createAssertion(
  ['to be a primitive'],
  PrimitiveSchema,
);

/**
 * Asserts that the subject is a regular expression.
 *
 * @example
 *
 * ```ts
 * expect(/test/, 'to be a RegExp'); // passes
 * expect('test', 'to be a RegExp'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const regexpAssertion = createAssertion(
  [['to be a RegExp', 'to be a regex', 'to be a regexp']],
  z.instanceof(RegExp),
);

/**
 * Asserts that the subject is truthy (not false, 0, '', null, undefined, or
 * NaN).
 *
 * @example
 *
 * ```ts
 * expect('hello', 'to be truthy'); // passes
 * expect('', 'to be truthy'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const truthyAssertion = createAssertion(
  [['to be truthy', 'to exist', 'to be ok']],
  TruthySchema,
);

/**
 * Asserts that the subject is falsy (false, 0, '', null, undefined, or NaN).
 *
 * @example
 *
 * ```ts
 * expect('', 'to be falsy'); // passes
 * expect('hello', 'to be falsy'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const falsyAssertion = createAssertion(['to be falsy'], FalsySchema);

/**
 * Asserts that the subject is an object (non-null object type).
 *
 * @example
 *
 * ```ts
 * expect({}, 'to be an object'); // passes
 * expect(null, 'to be an object'); // fails
 * expect('string', 'to be an object'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const objectAssertion = createAssertion(
  ['to be an object'],
  z
    .any()
    .nonoptional()
    .refine((value) => typeof value == 'object' && value !== null)
    .describe(
      'Returns true for any non-null value where `typeof value` is `object`',
    )
    .register(BupkisRegistry, { name: 'Object' }),
);

/**
 * Asserts that the subject is a record (plain object with string/symbol/number
 * keys).
 *
 * @example
 *
 * ```ts
 * expect({ key: 'value' }, 'to be a record'); // passes
 * expect([], 'to be a record'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const recordAssertion = createAssertion(
  [['to be a record', 'to be a plain object']],
  z.record(PropertyKeySchema, z.unknown()),
);

/**
 * Asserts that an array is empty.
 *
 * @example
 *
 * ```ts
 * expect([], 'to be empty'); // passes
 * expect([1, 2], 'to be empty'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const emptyArrayAssertion = createAssertion(
  [ArrayLikeSchema, 'to be empty'],
  (subject) => {
    if (subject.length !== 0) {
      return {
        actual: subject.length,
        expected: 0,
        message: `Expected array-like to have length 0, but had length ${subject.length}`,
      };
    }
  },
);

/**
 * Asserts that an object is empty (has no own properties).
 *
 * @example
 *
 * ```ts
 * expect({}, 'to be empty'); // passes
 * expect({ key: 'value' }, 'to be empty'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const emptyObjectAssertion = createAssertion(
  [z.record(z.any(), z.unknown()), 'to be empty'],
  z.record(z.any(), z.unknown()).refine((obj) => ownKeys(obj).length === 0),
);

/**
 * Asserts that the subject is an Error instance.
 *
 * @example
 *
 * ```ts
 * expect(new Error('test'), 'to be an Error'); // passes
 * expect('error', 'to be an Error'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const errorAssertion = createAssertion(
  [['to be an Error', 'to be a Error']],
  z.instanceof(Error),
);

/**
 * Asserts that a string is empty.
 *
 * @example
 *
 * ```ts
 * expect('', 'to be empty'); // passes
 * expect('hello', 'to be empty'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const emptyStringAssertion = createAssertion(
  [z.string(), 'to be empty'],
  z.string().max(0),
);

/**
 * Asserts that a string is non-empty.
 *
 * @example
 *
 * ```ts
 * expect('hello', 'to be non-empty'); // passes
 * expect('', 'to be non-empty'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const nonEmptyStringAssertion = createAssertion(
  [z.string(), 'to be non-empty'],
  z.string().min(1),
);

/**
 * Asserts that the subject is defined (not undefined).
 *
 * @example
 *
 * ```ts
 * expect(null, 'to be defined'); // passes
 * expect(undefined, 'to be defined'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const definedAssertion = createAssertion(
  ['to be defined'],
  z.unknown().nonoptional(),
);

/**
 * Asserts that the subject is a Set instance.
 *
 * @example
 *
 * ```ts
 * expect(new Set(), 'to be a Set'); // passes
 * expect([], 'to be a Set'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const setAssertion = createAssertion(
  ['to be a Set'],
  z.set(z.unknown()),
);

/**
 * Asserts that the subject is a WeakMap instance.
 *
 * @example
 *
 * ```ts
 * expect(new WeakMap(), 'to be a WeakMap'); // passes
 * expect(new Map(), 'to be a WeakMap'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const weakMapAssertion = createAssertion(
  ['to be a WeakMap'],
  z.instanceof(WeakMap),
);

/**
 * Asserts that the subject is a WeakSet instance.
 *
 * @example
 *
 * ```ts
 * expect(new WeakSet(), 'to be a WeakSet'); // passes
 * expect(new Set(), 'to be a WeakSet'); // fails
 * ```
 *
 * @group Basic Assertions
 */
export const weakSetAssertion = createAssertion(
  ['to be a WeakSet'],
  z.instanceof(WeakSet),
);
