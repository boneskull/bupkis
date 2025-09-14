import { inspect } from 'node:util';
import { z } from 'zod/v4';

import { isA, isError, isNonNullObject, isString } from '../../guards.js';
import {
  ArrayLikeSchema,
  ClassSchema,
  FunctionSchema,
  RegExpSchema,
  StrongMapSchema,
  StrongSetSchema,
  WrappedPromiseLikeSchema,
} from '../../schema.js';
import {
  valueToSchema,
  valueToSchemaOptionsForDeepEqual,
  valueToSchemaOptionsForSatisfies,
} from '../../value-to-schema.js';
import { createAssertion } from '../create.js';

const trapError = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (err) {
    if (err === undefined) {
      return new Error('Function threw undefined');
    }
    return err;
  }
};

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

  // Number range and approximation assertions
  createAssertion(
    [z.number(), ['to be within', 'to be between'], z.number(), z.number()],
    (subject, min, max) => {
      if (subject < min || subject > max) {
        return {
          actual: subject,
          expected: `number between ${min} and ${max}`,
          message: `Expected ${subject} to be within range [${min}, ${max}]`,
        };
      }
    },
  ),
  createAssertion(
    [z.number(), 'to be close to', z.number(), z.number().optional()],
    (subject, expected, tolerance = 1e-9) => {
      const diff = Math.abs(subject - expected);
      if (diff > tolerance) {
        return {
          actual: subject,
          expected: expected,
          message: `Expected ${subject} to be close to ${expected} (within ${tolerance}), but difference was ${diff}`,
        };
      }
    },
  ),

  // String comparison assertions (lexicographic)
  createAssertion(
    [z.string(), 'to be greater than', z.string()],
    (subject, other) => {
      if (!(subject > other)) {
        return {
          actual: subject,
          expected: `string greater than "${other}"`,
          message: `Expected "${subject}" to be greater than "${other}"`,
        };
      }
    },
  ),
  createAssertion(
    [z.string(), 'to be less than', z.string()],
    (subject, other) => {
      if (!(subject < other)) {
        return {
          actual: subject,
          expected: `string less than "${other}"`,
          message: `Expected "${subject}" to be less than "${other}"`,
        };
      }
    },
  ),
  createAssertion(
    [z.string(), 'to be greater than or equal to', z.string()],
    (subject, other) => {
      if (!(subject >= other)) {
        return {
          actual: subject,
          expected: `string greater than or equal to "${other}"`,
          message: `Expected "${subject}" to be greater than or equal to "${other}"`,
        };
      }
    },
  ),
  createAssertion(
    [z.string(), 'to be less than or equal to', z.string()],
    (subject, other) => {
      if (!(subject <= other)) {
        return {
          actual: subject,
          expected: `string less than or equal to "${other}"`,
          message: `Expected "${subject}" to be less than or equal to "${other}"`,
        };
      }
    },
  ),

  // String endpoint assertions
  createAssertion(
    [z.string(), ['to begin with', 'to start with'], z.string()],
    (subject, prefix) => {
      if (!subject.startsWith(prefix)) {
        return {
          actual: subject,
          expected: `string beginning with "${prefix}"`,
          message: `Expected "${subject}" to begin with "${prefix}"`,
        };
      }
    },
  ),
  createAssertion(
    [z.string(), 'to end with', z.string()],
    (subject, suffix) => {
      if (!subject.endsWith(suffix)) {
        return {
          actual: subject,
          expected: `string ending with "${suffix}"`,
          message: `Expected "${subject}" to end with "${suffix}"`,
        };
      }
    },
  ),

  // One-of assertion
  createAssertion(
    [z.any(), 'to be one of', z.array(z.any())],
    (subject, values) => {
      if (!values.includes(subject)) {
        return {
          actual: subject as unknown,
          expected: `one of [${values.map((v) => inspect(v)).join(', ')}]`,
          message: `Expected ${inspect(subject)} to be one of [${values.map((v) => inspect(v)).join(', ')}]`,
        };
      }
    },
  ),

  // Function arity assertion
  createAssertion(
    [FunctionSchema, 'to have arity', z.number().int().nonnegative()],
    (subject, expectedArity) => {
      if (subject.length !== expectedArity) {
        return {
          actual: subject.length,
          expected: expectedArity,
          message: `Expected function to have arity ${expectedArity}, but it has arity ${subject.length}`,
        };
      }
    },
  ),

  // Error message assertions
  createAssertion(
    [z.instanceof(Error), 'to have message', z.string()],
    (subject, expectedMessage) => {
      if (subject.message !== expectedMessage) {
        return {
          actual: subject.message,
          expected: expectedMessage,
          message: `Expected error message "${subject.message}" to equal "${expectedMessage}"`,
        };
      }
    },
  ),
  createAssertion(
    [z.instanceof(Error), 'to have message matching', RegExpSchema],
    (subject, pattern) => {
      if (!pattern.test(subject.message)) {
        return {
          actual: subject.message,
          expected: `message matching ${pattern}`,
          message: `Expected error message "${subject.message}" to match ${pattern}`,
        };
      }
    },
  ),
  createAssertion(
    [
      ['to be', 'to equal', 'equals', 'is', 'is equal to', 'to strictly equal'],
      z.unknown(),
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
  // @ts-expect-error fix later
  createAssertion(
    [
      z.looseObject({}),
      ['to deep equal', 'to deeply equal'],
      z.looseObject({}),
    ],
    (_, expected) => valueToSchema(expected, { strict: true }),
  ),
  createAssertion(
    [ArrayLikeSchema, ['to deep equal', 'to deeply equal'], ArrayLikeSchema],
    (_, expected) => {
      return valueToSchema(expected, valueToSchemaOptionsForDeepEqual);
    },
  ),
  createAssertion([FunctionSchema, 'to throw'], (subject) => {
    const error = trapError(subject);
    if (!error) {
      return {
        actual: error,
        message: `Expected function to throw, but it did not`,
      };
    }
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
        const schema = valueToSchema(param, {
          literalPrimitives: true,
          strict: true,
        });
        return schema.safeParse(error).success;
      } else {
        throw new TypeError(`Invalid parameter schema: ${inspect(param)}`);
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
        return {
          actual: error,
          expected: `instance of ${ctor.name}`,
          message: isError(error)
            ? `Expected function to throw an instance of ${ctor.name}, but it threw ${(error as Error).constructor.name}`
            : `Expected function to throw an instance of ${ctor.name}, but it threw a non-object value: ${error as unknown}`,
        };
      }

      if (isString(param)) {
        const result = z
          .looseObject({
            message: z.coerce.string().refine((msg) => msg.includes(param)),
          })
          .or(z.coerce.string().refine((str) => str.includes(param)))
          .safeParse(error);
        if (!result.success) {
          return {
            actual: isError(error) ? error.message : String(error),
            expected: `error with message containing "${param}"`,
            message: `Expected error message to contain "${param}", but got: ${isError(error) ? error.message : String(error)}`,
          };
        }
      } else if (isA(param, RegExp)) {
        const result = z
          .looseObject({
            message: z.coerce.string().regex(param),
          })
          .or(z.coerce.string().regex(param))
          .safeParse(error);
        if (!result.success) {
          return {
            actual: isError(error) ? error.message : String(error),
            expected: `error with message matching ${param}`,
            message: `Expected error message to match ${param}, but got: ${isError(error) ? error.message : String(error)}`,
          };
        }
      } else if (isNonNullObject(param)) {
        const schema = valueToSchema(param);
        const result = schema.safeParse(error);
        if (!result.success) {
          return {
            actual: error as unknown,
            expected: param,
            message: `Expected error to match object: ${inspect(param)}, but got: ${inspect(error)}`,
          };
        }
      } else {
        throw new TypeError(`Invalid parameter schema: ${inspect(param)}`);
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

  createAssertion([z.string(), 'to match', RegExpSchema], (subject, regex) =>
    regex.test(subject),
  ),
  createAssertion(
    [
      z.looseObject({}).nonoptional(),
      ['to satisfy', 'to be like'],
      z.looseObject({}),
    ],
    (subject, shape) =>
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      valueToSchema(shape) as unknown as z.ZodType<{}, z.core.$loose>,
  ),
  createAssertion(
    [ArrayLikeSchema, ['to satisfy', 'to be like'], ArrayLikeSchema],
    (subject, shape) =>
      valueToSchema(shape) as unknown as typeof ArrayLikeSchema,
  ),
  createAssertion(
    [FunctionSchema, 'to have arity', z.number().int().nonnegative()],
    (subject, expectedArity) => {
      if (subject.length !== expectedArity) {
        return {
          actual: subject.length,
          expected: expectedArity,
          message: `Expected function to have arity ${expectedArity}, but it has arity ${subject.length}`,
        };
      }
    },
  ),
] as const; // Shared validation/match helper
