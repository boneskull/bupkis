import { z } from 'zod/v4';

import { BupkisRegistry } from '../../metadata.js';
import {
  AsyncFunctionSchema,
  ConstructibleSchema,
  FalsySchema,
  PrimitiveSchema,
  PropertyKeySchema,
  StrongSetSchema,
  TruthySchema,
} from '../../schema.js';
import { createAssertion } from '../create.js';

/**
 * Basic synchronous assertions.
 */
export const BasicAssertions = [
  createAssertion(['to be a string'], z.string()),
  createAssertion([['to be a number', 'to be finite']], z.number()),
  createAssertion(['to be infinite'], z.literal([Infinity, -Infinity])),
  createAssertion(['to be Infinity'], z.literal(Infinity)),
  createAssertion(['to be -Infinity'], z.literal(-Infinity)),
  createAssertion(
    [['to be a boolean', 'to be boolean', 'to be a bool']],
    z.boolean(),
  ),
  createAssertion(
    [['to be positive', 'to be a positive number']],
    z.number().positive(),
  ),
  createAssertion(
    [['to be a positive integer', 'to be a positive int']],
    z.number().int().positive(),
  ),
  createAssertion(
    [['to be negative', 'to be a negative number']],
    z.number().negative(),
  ),
  createAssertion(
    [['to be a negative integer', 'to be a negative int']],
    z.number().int().negative(),
  ),
  createAssertion(['to be true'], z.literal(true)),
  createAssertion(['to be false'], z.literal(false)),
  createAssertion([['to be a bigint', 'to be a BigInt']], z.bigint()),
  createAssertion([['to be a symbol', 'to be a Symbol']], z.symbol()),
  createAssertion(['to be a function'], z.function()),
  createAssertion(['to be an async function'], AsyncFunctionSchema),
  createAssertion(['to be NaN'], z.nan()),
  createAssertion(
    [
      [
        'to be an integer',
        'to be a safe integer',
        'to be an int',
        'to be a safe int',
      ],
    ],
    z.number().int(),
  ),
  createAssertion(['to be null'], z.null()),
  createAssertion(['to be undefined'], z.undefined()),
  createAssertion([['to be an array', 'to be array']], z.array(z.any())),
  createAssertion([['to be a date', 'to be a Date']], z.date()),
  createAssertion(
    [['to be a class', 'to be a constructor']],
    ConstructibleSchema,
  ),
  createAssertion(['to be a primitive'], PrimitiveSchema),

  createAssertion(
    [['to be a RegExp', 'to be a regex', 'to be a regexp']],
    z.instanceof(RegExp),
  ),
  createAssertion([['to be truthy', 'to exist', 'to be ok']], TruthySchema),
  createAssertion(['to be falsy'], FalsySchema),
  createAssertion(
    ['to be an object'],
    z
      .any()
      .nonoptional()
      .refine((value) => typeof value == 'object' && value !== null)
      .describe(
        'Returns true for any non-null value where `typeof value` is `object`',
      )
      .register(BupkisRegistry, { name: 'Object' }),
  ),
  createAssertion(
    [['to be a record', 'to be a plain object']],
    z.record(PropertyKeySchema, z.unknown()),
  ),
  createAssertion([z.array(z.any()), 'to be empty'], z.array(z.any()).max(0)),
  createAssertion(
    [z.record(z.any(), z.unknown()), 'to be empty'],
    z
      .record(z.any(), z.unknown())
      .refine((obj) => Reflect.ownKeys(obj).length === 0),
  ),
  createAssertion(['to be an Error'], z.instanceof(Error)),

  // String emptiness assertions
  createAssertion([z.string(), 'to be empty'], z.string().max(0)),
  createAssertion([z.string(), 'to be non-empty'], z.string().min(1)),

  // General existence/value checks
  createAssertion(['to be defined'], z.unknown().nonoptional()),

  // Basic collection type assertions
  createAssertion(['to be a Set'], StrongSetSchema),
  createAssertion(['to be a WeakMap'], z.instanceof(WeakMap)),
  createAssertion(['to be a WeakSet'], z.instanceof(WeakSet)),
] as const;
