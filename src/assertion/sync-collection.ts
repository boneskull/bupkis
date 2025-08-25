import { z } from 'zod/v4';

import { isNullOrNonObject } from '../guards.js';
import { StrongMapSchema, StrongSetSchema } from '../schema.js';
import { createAssertion } from './assertion.js';

export const CollectionAssertions = [
  // Map assertions (including WeakMap)
  createAssertion(['to be a Map'], z.instanceof(Map)),
  createAssertion(
    [z.instanceof(Map), ['to contain', 'to include'], z.any()],
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
  createAssertion(['to be a Set'], z.instanceof(Set)),
  createAssertion(
    [z.instanceof(Set), ['to contain', 'to include'], z.any()],
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
  createAssertion(['to be a WeakMap'], z.instanceof(WeakMap)),
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
  createAssertion(['to be a WeakSet'], z.instanceof(WeakSet)),
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
] as const;
