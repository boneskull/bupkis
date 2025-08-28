import { z } from 'zod/v4';

import {
  AsyncFunctionSchema,
  ClassSchema,
  FunctionSchema,
  PropertyKeySchema,
} from '../schema.js';
import { createAssertion } from './assertion.js';

export const TypeAssertions = [
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
    (_, type) => {
      type = type.toLowerCase() as Lowercase<typeof type>;
      // these first three are names that are _not_ results of the `typeof` operator; i.e. `typeof x` will never return these strings
      switch (type) {
        case 'array':
          return z.array(z.any());
        case 'date':
          return z.date();
        case 'null':
          return z.null();
        default:
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
            // c8 ignore next 2
            default:
              throw new TypeError(`Unknown type: "${type}"`);
          }
      }
    },
  ),
  /**
   * @assertion
   * @subject {unknown}
   * @phrase to be a string
   * @value {string}
   */
  createAssertion(['to be a string'], z.string()),
  createAssertion([['to be a number', 'to be finite']], z.number()),
  createAssertion(['to be infinite'], z.literal([Infinity, -Infinity])),
  createAssertion(
    [['to be a safe number', 'to be safe']],
    z.number().refine((n) => Number.isSafeInteger(n)),
  ),
  createAssertion(
    [['to be a boolean', 'to be boolean', 'to be a bool']],
    z.boolean(),
  ),
  createAssertion(
    [['to be positive', 'to be a positive number']],
    z.number().positive(),
  ),
  createAssertion(
    [['to be negative', 'to be a negative number']],
    z.number().negative(),
  ),
  createAssertion(['to be true'], z.literal(true)),
  createAssertion(['to be false'], z.literal(false)),
  createAssertion([['to be a bigint', 'to be a BigInt']], z.bigint()),
  createAssertion([['to be a symbol', 'to be a Symbol']], z.symbol()),
  createAssertion(['to be a function'], FunctionSchema),
  createAssertion(['to be an async function'], AsyncFunctionSchema),
  createAssertion(['to be NaN'], z.nan()),
  createAssertion(['to be an integer'], z.number().int()),
  createAssertion(['to be null'], z.null()),
  createAssertion(['to be undefined'], z.undefined()),
  createAssertion([['to be an array', 'to be array']], z.array(z.any())),
  createAssertion([['to be a date', 'to be a Date']], z.date()),
  createAssertion([['to be a class', 'to be a constructor']], ClassSchema),
  createAssertion(
    ['to be a primitive'],
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.bigint(),
      z.symbol(),
      z.null(),
      z.undefined(),
    ]),
  ),

  createAssertion(
    [['to be a RegExp', 'to be a regex', 'to be a regexp']],
    z.instanceof(RegExp),
  ),
  createAssertion(
    [['to be truthy', 'to exist']],
    z.any().refine((value) => !!value),
  ),
  createAssertion(
    ['to be falsy'],
    z.any().refine((value) => !value),
  ),
  createAssertion(
    ['to be an object'],
    z.any().refine((value) => typeof value == 'object' && value !== null),
  ),
  createAssertion(
    [['to be a record', 'to be a plain object']],
    z.record(PropertyKeySchema, z.unknown()),
  ),
  createAssertion([z.array(z.any()), 'to be empty'], z.array(z.any()).max(0)),
  createAssertion(
    [z.record(z.any(), z.unknown()), ['to be empty']],
    z.record(z.any(), z.never()),
  ),
] as const;
