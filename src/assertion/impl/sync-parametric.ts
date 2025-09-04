import { diff } from 'deep-object-diff';
import deepEqual from 'fast-deep-equal';
import { inspect } from 'node:util';
import { z } from 'zod/v4';

import { isA, isError, isNonNullObject, isString } from '../../guards.js';
import {
  ArrayLikeSchema,
  ClassSchema,
  FunctionSchema,
  StrongMapSchema,
  StrongSetSchema,
  WrappedPromiseLikeSchema,
} from '../../schema.js';
import { satisfies, shallowSatisfiesShape } from '../../util.js';
import { createAssertion } from '../create.js';
import { trapError } from './sync.js';

const knownTypes = Object.freeze(
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

export const ParametricAssertions = [
  createAssertion(
    [['to be an instance of', 'to be a'], ClassSchema],
    (_, ctor) => z.instanceof(ctor),
  ),
  createAssertion(
    [
      z.any(),
      ['to be a', 'to be an'],
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
          return z.array(z.any());
        case 'bigint':
          return z.bigint();
        case 'boolean':
          return z.boolean();
        case 'date':
          return z.date();
        case 'error':
          return z.instanceof(Error);
        case 'function':
          return z.function();
        case 'map':
          return StrongMapSchema;
        case 'null':
          return z.null();
        case 'number':
          return z.number();
        case 'object':
          return z.looseObject({});
        case 'promise':
          return WrappedPromiseLikeSchema;
        case 'regex': // fallthrough
        case 'regexp':
          return z.instanceof(RegExp);
        case 'set':
          return StrongSetSchema;
        case 'string':
          return z.string();
        case 'symbol':
          return z.symbol();
        case 'undefined':
          return z.undefined();
        case 'weakmap':
          return z.instanceof(WeakMap);
        case 'weakref':
          return z.instanceof(WeakRef);
        case 'weakset':
          return z.instanceof(WeakSet);
        // c8 ignore next 2
        default:
          throw new TypeError(`Unknown type: "${type}"`);
      }
    },
  ),
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
    (subject, value) => {
      if (subject !== value) {
        return {
          actual: subject,
          expected: value,
          message: `Expected ${inspect(subject)} to equal ${inspect(value)}`,
        };
      }
    },
  ),
  createAssertion(
    [
      z.looseObject({}),
      ['to deep equal', 'to deeply equal'],
      z.looseObject({}),
    ],
    (subject, expected) => {
      const result = deepEqual(subject, expected);
      if (!result) {
        return {
          actual: subject,
          expected: expected,
          message: `Expected ${inspect(subject)} to deep equal ${inspect(expected)}: ${inspect(diff(expected, subject))}`,
        };
      }
    },
  ),
  createAssertion(
    [ArrayLikeSchema, ['to deep equal', 'to deeply equal'], ArrayLikeSchema],
    (subject, expected) => {
      const result = deepEqual(subject, expected);
      if (!result) {
        return {
          actual: subject,
          expected: expected,
          message: `Expected ${inspect(subject)} to deep equal ${inspect(expected)}: ${inspect(diff(expected, subject))}`,
        };
      }
    },
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
    [FunctionSchema, ['to throw a', 'to thrown an'], ClassSchema],
    (subject, ctor) => {
      const error = trapError(subject);
      if (!error) {
        return false;
      }
      if (!(error instanceof ctor)) {
        let message: string;
        if (isError(error)) {
          message = `Expected function to throw an instance of ${ctor.name}, but it threw ${error.constructor.name}`;
        } else {
          message = `Expected function to throw an instance of ${ctor.name}, but it threw a non-object value: ${error as unknown}`;
        }
        return {
          actual: error,
          expected: ctor,
          message,
        };
      }
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

      if (isString(param)) {
        return z
          .looseObject({
            message: z.coerce.string().pipe(z.literal(param)),
          })
          .or(z.coerce.string().pipe(z.literal(param)))
          .safeParse(error).success;
      } else if (isA(param, RegExp)) {
        return z
          .looseObject({
            message: z.coerce.string().regex(param),
          })
          .or(z.coerce.string().regex(param))
          .safeParse(error).success;
      } else if (isNonNullObject(param)) {
        return z.object(shallowSatisfiesShape(param)).safeParse(error).success;
      } else {
        return false;
      }
    },
  ),
  createAssertion(
    [
      FunctionSchema,
      ['to throw a', 'to thrown an'],
      ClassSchema,
      'satisfying',
      z.union([z.string(), z.instanceof(RegExp), z.looseObject({})]),
    ],
    (subject, ctor, param) => {
      const error = trapError(subject);
      if (!isA(error, ctor)) {
        return false;
      }

      if (isString(param)) {
        return z
          .looseObject({
            message: z.coerce.string().pipe(z.literal(param)),
          })
          .or(z.coerce.string().pipe(z.literal(param)))
          .safeParse(error).success;
      } else if (isA(param, RegExp)) {
        return z
          .looseObject({
            message: z.coerce.string().regex(param),
          })
          .or(z.coerce.string().regex(param))
          .safeParse(error).success;
      } else if (isNonNullObject(param)) {
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
    [
      z.looseObject({}).nonoptional(),
      ['to satisfy', 'to be like'],
      z.looseObject({}),
    ],
    (subject, shape) => {
      return z.looseObject(shape);
    },
  ),
  createAssertion(
    [ArrayLikeSchema, ['to satisfy', 'to be like'], ArrayLikeSchema],
    (subject, expected) => {
      if (!satisfies(subject, expected)) {
        return {
          actual: subject,
          expected,
          message: `Expected array-like ${inspect(subject)} to satisfy ${inspect(expected)}`,
        };
      }
    },
  ),
] as const; // Shared validation/match helper
