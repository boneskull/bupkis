import { inspect } from 'node:util';
import { z } from 'zod/v4';

import { AssertionError } from '../error.js';
import { functionSchema } from '../schema.js';
import { Assertion, factory } from './assertion.js';

const { fromParts: createAssertion } = Assertion;

export const Assertions = [
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
        'symbol',
        'object',
        'function',
        'array',
        'date',
      ]),
    ],
    (_, subject, type) => {
      switch (type) {
        case 'array': {
          if (!Array.isArray(subject)) {
            throw new AssertionError(`Expected ${subject} to be an array`);
          }
          break;
        }
        case 'date': {
          if (!(subject instanceof Date)) {
            throw new AssertionError(`Expected ${subject} to be a Date`);
          }
          break;
        }
        case 'null': {
          if (subject !== null) {
            throw new AssertionError(`Expected ${subject} to be null`);
          }
          break;
        }
        default:
          if (typeof subject !== type) {
            throw new AssertionError(`Expected ${subject} to be a ${type}`);
          }
      }
    },
  ),
  // createAssertion(['to be a', classSchema], (_ctx, subject, type) => {}),
  createAssertion(['to be a string'], z.string()),
  createAssertion(['to be a number'], z.number()),
  createAssertion(['to be a boolean'], z.boolean()),
  createAssertion(['to be true'], z.literal(true)),
  createAssertion([['to be a bigint', 'to be a BigInt']], z.bigint()),
  createAssertion([['to be a symbol', 'to be a Symbol']], z.symbol()),
  createAssertion(['to be a function'], functionSchema),
  createAssertion(['to be false'], z.literal(false)),
  createAssertion(['to be null'], z.null()),
  createAssertion(['to be undefined'], z.undefined()),
  createAssertion(['to be an array'], z.array(z.unknown())),
  createAssertion([z.date(), ['to be a date', 'to be a Date']], z.date()),
  // createAssertion(
  //   [['to be a class', 'to be a constructor']],
  //   (_ctx, subject) => {
  //     expect(subject, 'to be a', classSchema);
  //   },
  // ),
  // ),
  createAssertion(['to be an object'], z.object({})),
  createAssertion(
    [z.number(), 'to be greater than', z.number()],
    factory((other: number) => {
      return z.number().gt(other);
    }),
  ),
  createAssertion(
    [z.number(), 'to be less than', z.number()],
    Object.assign(
      (context: any, subject: number, other: number) => {
        const schema = z.number().lt(other);
        try {
          schema.parse(subject);
        } catch (error) {
          if (error instanceof z.ZodError) {
            const pretty = z.prettifyError(error);
            throw new AssertionError(`Assertion failed: ${pretty}`);
          }
          throw error;
        }
      },
      { __isSchemaFactory: true },
    ),
  ),
  createAssertion(
    [
      ['to be', 'to equal', 'equals', 'is', 'is equal to', 'to strictly equal'],
      z.any(),
    ],
    (_, subject, value) => {
      if (subject !== value) {
        throw new AssertionError(
          `Expected ${subject} to be ${value}, but it was ${inspect(subject)}`,
        );
      }
    },
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
    (_, subject, value) => {
      if (subject === value) {
        throw new AssertionError(
          `Expected ${subject} not to be ${value}, but it was`,
        );
      }
    },
  ),
  createAssertion([functionSchema, 'to throw'], (_, subject) => {
    let threw = false;
    try {
      subject();
    } catch (err) {
      threw = true;
    }
    if (!threw) {
      throw new AssertionError('Expected function to throw');
    }
  }),
  createAssertion(
    [functionSchema, ['not to throw', 'to not throw']],
    (_, subject) => {
      let threw = false;
      let error: unknown;
      try {
        subject();
      } catch (err) {
        threw = true;
        error = err;
      }
      if (threw) {
        throw new AssertionError(
          `Expected function not to throw, but it threw: ${error}`,
        );
      }
    },
  ),
  createAssertion([z.looseObject({}), 'to be empty'], (_, subject) => {
    if (Object.keys(subject).length > 0) {
      throw new AssertionError(
        `Expected object to be empty, but it had keys: ${Object.keys(subject).join(', ')}`,
      );
    }
  }),
  createAssertion(
    [
      z.looseObject({}),
      [
        'to not be empty',
        'not to be empty',
        'to have no keys',
        'not to have keys',
        'to have no properties',
        'not to have properties',
      ],
    ],
    (_, subject) => {
      if (Object.keys(subject).length === 0) {
        throw new AssertionError(
          `Expected object to not be empty, but it was empty`,
        );
      }
    },
  ),
  // createAssertion(
  //   [functionSchema, ['to resolve', 'to fulfill']],
  //   async (_, subject) => {
  //     try {
  //       await subject();
  //     } catch (err) {
  //       throw new AssertionError(
  //         `Expected function to resolve, but it rejected: ${err}`,
  //       );
  //     }
  //   },
  // ),
  createAssertion(
    [z.promise(z.any()), ['to resolve', 'to fulfill']],
    async (_, subject) => {
      try {
        await subject;
      } catch (err) {
        throw new AssertionError(
          `Expected Promise to resolve, but it rejected: ${err}`,
        );
      }
    },
  ),
  createAssertion(
    [z.string(), 'to match', z.instanceof(RegExp)],
    (_, subject, regex) => {
      if (!regex.test(subject)) {
        throw new AssertionError(
          `Expected string "${subject}" to match regex ${regex}, but it did not`,
        );
      }
    },
  ),
  createAssertion(
    [
      z.looseObject({}),
      ['to satisfy', 'to be like', 'to match'],
      z.looseObject({}),
    ],
    (_, subject, expected) => {
      // TODO: this is not deeply recursive and should be; pull the implementation from some other lib or maybe z.partial would work here
      const expectedKeys = Object.keys(expected);
      for (const key of expectedKeys) {
        if (!(key in subject)) {
          throw new AssertionError(
            `Expected object to have key "${key}", but it was missing`,
          );
        }
        if (subject[key] !== expected[key]) {
          throw new AssertionError(
            `Expected object key "${key}" to be ${expected[key]}, but it was ${subject[key]}`,
          );
        }
      }
    },
  ),
] as const; // Shared validation/match helper
