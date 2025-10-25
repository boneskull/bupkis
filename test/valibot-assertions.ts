/**
 * Valibot-based assertion definitions for Standard Schema interoperability
 * testing.
 *
 * These assertions mirror native bupkis assertions but use Valibot schemas
 * instead of Zod to validate Standard Schema v1 compatibility.
 */

import * as v from 'valibot';

import { createAssertion } from '../src/assertion/create.js';

export const valibotStringAssertion = createAssertion(
  ['to be a string'],
  v.string(),
);

export const valibotNumberAssertion = createAssertion(
  ['to be a number'],
  v.pipe(v.number(), v.finite()),
);

export const valibotBooleanAssertion = createAssertion(
  ['to be a boolean'],
  v.boolean(),
);

export const valibotArrayAssertion = createAssertion(
  ['to be an array'],
  v.array(v.unknown()),
);

export const valibotEqualityAssertion = createAssertion(
  [v.unknown(), 'to be', v.unknown()],
  (subject, expected) => {
    if (subject !== expected) {
      return {
        actual: subject,
        expected,
        message: `Expected values to be strictly equal`,
      };
    }
  },
);

export const valibotGreaterThanAssertion = createAssertion(
  [v.number(), 'to be greater than', v.number()],
  (_, expected) => v.pipe(v.number(), v.minValue(expected + 1)),
);

export const valibotLessThanAssertion = createAssertion(
  [v.number(), 'to be less than', v.number()],
  (_, expected) => v.pipe(v.number(), v.maxValue(expected - 1)),
);

export const valibotStringContainsAssertion = createAssertion(
  [v.string(), 'to contain', v.string()],
  (subject, expected) => {
    if (!subject.includes(expected)) {
      return {
        message: `Expected "${subject}" to include "${expected}"`,
      };
    }
  },
);

export const valibotArrayLengthAssertion = createAssertion(
  [
    v.array(v.unknown()),
    'to have length',
    v.pipe(v.number(), v.integer(), v.minValue(0)),
  ],
  (_, expectedLength) =>
    v.pipe(
      v.array(v.unknown()),
      v.minLength(expectedLength),
      v.maxLength(expectedLength),
    ),
);

export const valibotObjectHasPropertyAssertion = createAssertion(
  [v.object({}), 'to have property', v.string()],
  (subject, key) => {
    if (!(key in subject)) {
      return {
        actual: 'no such property',
        expected: `to have property ${key}`,
        message: `Expected object to contain property "${key}"`,
      };
    }
  },
);

export const valibotArrayContainsAssertion = createAssertion(
  [v.array(v.unknown()), 'to contain', v.unknown()],
  (subject, expected) => {
    if (!subject.includes(expected)) {
      return {
        actual: subject,
        expected: `array containing ${String(expected)}`,
        message: `Expected array to contain value`,
      };
    }
  },
);

export const ALL_VALIBOT_ASSERTIONS = [
  valibotStringAssertion,
  valibotNumberAssertion,
  valibotBooleanAssertion,
  valibotArrayAssertion,
  valibotEqualityAssertion,
  valibotGreaterThanAssertion,
  valibotLessThanAssertion,
  valibotStringContainsAssertion,
  valibotArrayLengthAssertion,
  valibotObjectHasPropertyAssertion,
  valibotArrayContainsAssertion,
] as const;
