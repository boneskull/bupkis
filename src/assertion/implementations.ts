/**
 * Synchronous assertion implementations.
 *
 * This module contains all built-in synchronous assertion implementations
 * including type checks, comparisons, equality tests, object satisfaction,
 * function behavior validation, and property checks. Each assertion is
 * implemented with proper error handling and type safety.
 *
 * @packageDocumentation
 */

import { z } from 'zod/v4';

import {
  ClassSchema,
  FunctionSchema,
  PropertyKeySchema,
  StrongMapSchema,
  StrongSetSchema,
} from '../schema.js';
import { satisfies, shallowSatisfiesShape } from '../util.js';
import { Assertion } from './assertion.js';

const { fromParts: createAssertion } = Assertion;

const trapError = (fn: () => unknown) => {
  try {
    fn();
  } catch (err) {
    return err;
  }
};

const BasicAssertions = [
  createAssertion(
    [
      ['to be a', 'to be an'],
      z.enum([
        'string',
        'number',
        'boolean',
        'undefined',
        'null',
        'bigint',
        'BigInt',
        'Symbol',
        'symbol',
        'object',
        'Object',
        'function',
        'Function',
        'array',
        'Array',
        'date',
        'Date',
      ]),
    ],
    (subject, type) => {
      type = type.toLowerCase() as typeof type;
      switch (type) {
        case 'array':
          return z.array(z.any());
        case 'date':
          return z.date();
        case 'null':
          return z.null();
        default:
          // For primitive types like 'string', 'number', 'boolean', 'object', 'function', 'symbol', 'bigint', 'undefined'
          if (typeof subject !== type) {
            return false;
          }
          // Return a schema that validates the type
          switch (type) {
            case 'bigint':
              return z.bigint();
            case 'boolean':
              return z.boolean();
            case 'function':
              return z.function();
            case 'number':
              return z.number();
            case 'object':
              return z.looseObject({});
            case 'string':
              return z.string();
            case 'symbol':
              return z.symbol();
            case 'undefined':
              return z.undefined();
            default:
              return false; // Unknown type
          }
      }
    },
  ),
  createAssertion(['to be a string'], z.string()),
  createAssertion(['to be a String'], z.instanceof(String)),
  createAssertion(['to be a Number'], z.instanceof(Number)),
  createAssertion(['to be a Boolean'], z.instanceof(Boolean)),
  createAssertion([['to be a number', 'to be finite']], z.number()),
  createAssertion([['to be infinite', 'to be Infinity']], z.literal(Infinity)),
  createAssertion(
    [['to be a safe number', 'to be safe']],
    z.number().refine((n) => Number.isSafeInteger(n)),
  ),
  createAssertion(['to be a boolean'], z.boolean()),
  createAssertion(['to be positive'], z.number().positive()),
  createAssertion(['to be negative'], z.number().negative()),
  createAssertion([['to be zero', 'to be 0']], z.literal(0)),
  createAssertion([['to be 1', 'to be one']], z.literal(1)),
  createAssertion([['to be true', 'not to be false']], z.literal(true)),
  createAssertion([['to be a bigint', 'to be a BigInt']], z.bigint()),
  createAssertion([['to be a symbol', 'to be a Symbol']], z.symbol()),
  createAssertion(['to be a function'], FunctionSchema),
  createAssertion([['to be false', 'not to be true']], z.literal(false)),
  createAssertion(['to be NaN'], z.nan()),
  createAssertion(['to be an integer'], z.number().int()),
  createAssertion(['to be null'], z.null()),
  createAssertion(['to be undefined'], z.undefined()),
  createAssertion([['to be an array', 'to be array']], z.array(z.any())),
  createAssertion([['to be a date', 'to be a Date']], z.date()),
  createAssertion([['to be a class', 'to be a constructor']], ClassSchema),

  createAssertion(
    [['to be a RegExp', 'to be a regex', 'to be a regexp']],
    z.instanceof(RegExp),
  ),
  createAssertion(
    [['to be truthy', 'to exist']],
    z.any().refine((value) => !!value),
  ),
  createAssertion(
    [['to be falsy', 'not to exist']],
    z.any().refine((value) => !value),
  ),
  createAssertion(['to be an object'], z.looseObject({}).or(z.array(z.any()))),
  createAssertion([z.array(z.any()), 'to be empty'], z.array(z.any()).max(0)),
  createAssertion(
    [z.array(z.any()), ['to not be empty', 'not to be empty']],
    z.array(z.any()).min(1),
  ),
  createAssertion(
    [z.record(z.any(), z.unknown()), ['to not be empty', 'not to be empty']],
    z.record(z.any(), z.any()).refine((value) => Object.keys(value).length > 0),
  ),
  createAssertion(
    [z.record(z.any(), z.unknown()), ['to be empty']],
    z.record(z.any(), z.never()),
  ),
] as const;

const EsotericAssertions = [
  createAssertion(
    ['to have a null prototype'],
    z.custom<object>(
      (value) =>
        !!value &&
        typeof value === 'object' &&
        Object.getPrototypeOf(value) === null,
    ),
  ),
  createAssertion(
    [PropertyKeySchema, 'to be an enumerable property of', z.looseObject({})],
    (subject, obj) =>
      !!Object.getOwnPropertyDescriptor(obj, subject)?.enumerable,
  ),
  createAssertion(
    ['to be sealed'],
    z.any().refine((obj) => Object.isSealed(obj)),
  ),
  createAssertion(
    ['to be frozen'],
    z.any().refine((obj) => Object.isFrozen(obj)),
  ),
  createAssertion(
    ['to be extensible'],
    z.any().refine((obj) => Object.isExtensible(obj)),
  ),
] as const;

const CollectionAssertions = [
  // Map assertions (including WeakMap)
  createAssertion(['to be a Map'], z.instanceof(Map)),
  createAssertion(
    [z.instanceof(Map), ['to contain', 'to include'], z.any()],
    (subject, key) => subject.has(key),
  ),
  createAssertion(
    [z.instanceof(Map), ['not to contain', 'not to include'], z.any()],
    (subject, key) => !subject.has(key),
  ),

  // Size-based assertions only for strong Maps (not WeakMaps)
  createAssertion(
    [StrongMapSchema, 'to have size', z.number()],
    (subject, expectedSize) => subject.size === expectedSize,
  ),
  createAssertion(
    [StrongMapSchema, 'to be empty'],
    (subject) => subject.size === 0,
  ),
  createAssertion(
    [StrongMapSchema, ['to not be empty', 'not to be empty']],
    (subject) => subject.size > 0,
  ),

  // Set assertions (including WeakSet)
  createAssertion(['to be a Set'], z.instanceof(Set)),
  createAssertion(
    [z.instanceof(Set), ['to contain', 'to include'], z.any()],
    (subject, value) => subject.has(value),
  ),
  createAssertion(
    [z.instanceof(Set), ['not to contain', 'not to include'], z.any()],
    (subject, value) => !subject.has(value),
  ),

  // Size-based assertions only for strong Sets (not WeakSets)
  createAssertion(
    [StrongSetSchema, 'to have size', z.number()],
    (subject, expectedSize) => subject.size === expectedSize,
  ),
  createAssertion(
    [StrongSetSchema, 'to be empty'],
    (subject) => subject.size === 0,
  ),
  createAssertion(
    [StrongSetSchema, ['to not be empty', 'not to be empty']],
    (subject) => subject.size > 0,
  ),

  // WeakMap specific assertions
  createAssertion(['to be a WeakMap'], z.instanceof(WeakMap)),
  createAssertion(
    [z.instanceof(WeakMap), ['to contain', 'to include'], z.any()],
    (subject, key) => {
      // WeakMap.has only works with object keys
      if (typeof key !== 'object' || key === null) {
        return false;
      }
      return subject.has(key as WeakKey);
    },
  ),
  createAssertion(
    [z.instanceof(WeakMap), ['not to contain', 'not to include'], z.any()],
    (subject, key) => {
      // WeakMap.has only works with object keys
      if (typeof key !== 'object' || key === null) {
        return true; // Non-object keys are never in WeakMap
      }
      return !subject.has(key as WeakKey);
    },
  ),

  // WeakSet specific assertions
  createAssertion(['to be a WeakSet'], z.instanceof(WeakSet)),
  createAssertion(
    [z.instanceof(WeakSet), ['to contain', 'to include'], z.any()],
    (subject, value) => {
      // WeakSet.has only works with object values
      if (typeof value !== 'object' || value === null) {
        return false;
      }
      return subject.has(value as WeakKey);
    },
  ),
  createAssertion(
    [z.instanceof(WeakSet), ['not to contain', 'not to include'], z.any()],
    (subject, value) => {
      // WeakSet.has only works with object values
      if (typeof value !== 'object' || value === null) {
        return true; // Non-object values are never in WeakSet
      }
      return !subject.has(value as WeakKey);
    },
  ),
] as const;

const ParametricAssertions = [
  createAssertion([z.number(), 'to be greater than', z.number()], (_, other) =>
    z.number().gt(other),
  ),
  createAssertion([z.number(), 'to be less than', z.number()], (_, other) =>
    z.number().lt(other),
  ),
  createAssertion(
    [
      z.number(),
      ['to be greater than or equal to', 'to be at least'],
      z.number(),
    ],
    (_, other) => z.number().gte(other),
  ),
  createAssertion(
    [z.number(), ['to be less than or equal to', 'to be at most'], z.number()],
    (_, other) => z.number().lte(other),
  ),
  createAssertion(
    [
      ['to be', 'to equal', 'equals', 'is', 'is equal to', 'to strictly equal'],
      z.any(),
    ],
    (subject, value) => subject === value,
  ),
  createAssertion(
    [
      [
        'not to be',
        'to not equal',
        'not to equal',
        'is not',
        "isn't",
        'not to strictly equal',
        'to not strictly equal',
      ],
      z.any(),
    ],
    (subject, value) => subject !== value,
  ),
  createAssertion([FunctionSchema, 'to throw'], (subject) => {
    let threw = false;
    try {
      subject();
    } catch {
      threw = true;
    }
    return threw;
  }),
  createAssertion(
    [FunctionSchema, ['not to throw', 'to not throw']],
    (subject) => {
      let threw = false;
      try {
        subject();
      } catch {
        threw = true;
      }
      return !threw;
    },
  ),
  createAssertion(
    [FunctionSchema, ['to throw a', 'to thrown an'], ClassSchema],
    (subject, ctor) => {
      const error = trapError(subject);
      if (!error) {
        return false;
      }
      return error instanceof ctor;
    },
  ),
  createAssertion(
    [
      FunctionSchema,
      ['to throw'],
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
    ],
    (subject, param) => {
      const error = trapError(subject);
      if (!error) {
        return false;
      }

      if (typeof param === 'string') {
        return z
          .object({
            message: z.coerce.string().pipe(z.literal(param)),
          })
          .or(z.coerce.string().pipe(z.literal(param)))
          .safeParse(error).success;
      } else if (param instanceof RegExp) {
        return z
          .object({
            message: z.coerce.string().regex(param),
          })
          .or(z.coerce.string().regex(param))
          .safeParse(error).success;
      } else if (typeof param === 'object' && param !== null) {
        return z.object(shallowSatisfiesShape(param)).safeParse(error).success;
      } else {
        return false;
      }
    },
  ),
  createAssertion(
    [
      z.string(),
      ['includes', 'contains', 'to include', 'to contain'],
      z.string(),
    ],
    (subject, expected) => subject.includes(expected),
  ),

  createAssertion(
    [z.string(), 'to match', z.instanceof(RegExp)],
    (subject, regex) => regex.test(subject),
  ),
  createAssertion(
    [z.any(), ['to satisfy', 'to be like', 'to match'], z.looseObject({})],
    (subject, expected) => {
      if (typeof subject !== 'object' || subject === null) {
        return false;
      }

      // Deep recursive object matching with circular reference protection

      return satisfies(subject, expected);
    },
  ),
] as const; // Shared validation/match helper

export const Assertions = [
  ...CollectionAssertions,
  ...BasicAssertions,
  ...EsotericAssertions,
  ...ParametricAssertions,
];
