/**
 * ArkType-based assertion definitions for Standard Schema interoperability
 * testing.
 *
 * These assertions mirror native bupkis assertions but use ArkType schemas
 * instead of Zod to validate Standard Schema v1 compatibility.
 */

import { type } from 'arktype';

import { createAssertion } from '../src/assertion/create.js';

export const arktypeStringAssertion = createAssertion(
  ['to be a string'],
  type('string'),
);

export const arktypeNumberAssertion = createAssertion(
  ['to be a number'],
  type('number').narrow((n) => Number.isFinite(n)),
);

export const arktypeBooleanAssertion = createAssertion(
  ['to be a boolean'],
  type('boolean'),
);

export const arktypeArrayAssertion = createAssertion(
  ['to be an array'],
  type('unknown[]'),
);

export const arktypeEqualityAssertion = createAssertion(
  [type('unknown'), 'to be', type('unknown')],
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

export const arktypeGreaterThanAssertion = createAssertion(
  [type('number'), 'to be greater than', type('number')],
  (_, expected) => type(`number > ${expected}`),
);

export const arktypeLessThanAssertion = createAssertion(
  [type('number'), 'to be less than', type('number')],
  (_, expected) => type(`number < ${expected}`),
);

export const arktypeStringContainsAssertion = createAssertion(
  [type('string'), 'to contain', type('string')],
  (subject, expected) => {
    if (!subject.includes(expected)) {
      return {
        message: `Expected "${subject}" to include "${expected}"`,
      };
    }
  },
);

export const arktypeArrayLengthAssertion = createAssertion(
  [type('unknown[]'), 'to have length', type('number.integer >= 0')],
  (_, expectedLength) => type(`unknown[] == ${expectedLength}`),
);

export const arktypeObjectHasPropertyAssertion = createAssertion(
  [type('object'), 'to have property', type('string')],
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

export const arktypeArrayContainsAssertion = createAssertion(
  [type('unknown[]'), 'to contain', type('unknown')],
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

export const ALL_ARKTYPE_ASSERTIONS = [
  arktypeStringAssertion,
  arktypeNumberAssertion,
  arktypeBooleanAssertion,
  arktypeArrayAssertion,
  arktypeEqualityAssertion,
  arktypeGreaterThanAssertion,
  arktypeLessThanAssertion,
  arktypeStringContainsAssertion,
  arktypeArrayLengthAssertion,
  arktypeObjectHasPropertyAssertion,
  arktypeArrayContainsAssertion,
] as const;
