import { z } from 'zod/v4';

import { isNullOrNonObject } from '../../guards.js';
import { StrongMapSchema, StrongSetSchema } from '../../schema.js';
import { createAssertion } from '../create.js';

export const CollectionAssertions = [
  // Map assertions (including WeakMap)
  createAssertion(
    [z.map(z.any(), z.any()), ['to contain', 'to include'], z.any()],
    (subject, key) => subject.has(key),
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
  // Set assertions (including WeakSet)
  createAssertion(
    [z.set(z.any()), ['to contain', 'to include'], z.any()],
    (subject, value) => subject.has(value),
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
  // WeakMap specific assertions
  createAssertion(
    [z.instanceof(WeakMap), ['to contain', 'to include'], z.any()],
    (subject, key) => {
      // WeakMap.has only works with object keys
      if (isNullOrNonObject(key)) {
        return false;
      }
      return subject.has(key as WeakKey);
    },
  ),
  // WeakSet specific assertions
  createAssertion(
    [z.instanceof(WeakSet), ['to contain', 'to include'], z.any()],
    (subject, value) => {
      // WeakSet.has only works with object values
      if (isNullOrNonObject(value)) {
        return false;
      }
      return subject.has(value as WeakKey);
    },
  ),
  // Array assertions
  createAssertion(
    [z.array(z.any()), ['to contain', 'to include'], z.any()],
    (subject, value) => subject.includes(value),
  ),
  createAssertion(
    [z.array(z.any()), 'to have size', z.number()],
    (subject, expectedSize) => subject.length === expectedSize,
  ),
  createAssertion(
    [z.array(z.any()), 'to have length', z.number()],
    (subject, expectedLength) => subject.length === expectedLength,
  ),

  // Array emptiness assertions
  createAssertion([z.array(z.any()), 'to be non-empty'], (subject) => {
    if (subject.length === 0) {
      return {
        actual: subject.length,
        expected: 'non-empty array',
        message: 'Expected array to be non-empty',
      };
    }
  }),

  // Object assertions
  createAssertion(
    [
      z.looseObject({}),
      ['to have keys', 'to have properties', 'to have props'],
      z.tuple([z.string()], z.string()),
    ],
    (_, keys) =>
      z.looseObject(
        Object.fromEntries(keys.map((k) => [k, z.unknown().nonoptional()])),
      ),
  ),
  createAssertion(
    [z.looseObject({}), 'to have size', z.number().int().nonnegative()],
    (subject, expectedSize) => {
      const actual = Object.keys(subject).length;
      if (actual !== expectedSize) {
        return {
          actual: actual,
          expected: expectedSize,
          message: `Expected object to have ${expectedSize} keys, but it has ${actual} keys`,
        };
      }
    },
  ),
] as const;
