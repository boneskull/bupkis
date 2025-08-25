import { z } from 'zod/v4';

import {
  isA,
  isNonNullObject,
  isNullOrNonObject,
  isString,
} from '../guards.js';
import { ClassSchema, FunctionSchema } from '../schema.js';
import { satisfies, shallowSatisfiesShape } from '../util.js';
import { createAssertion } from './assertion.js';
import { trapError } from './sync.js';

export const ParametricAssertions = [
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
      return isA(error, ctor);
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
    [['to satisfy', 'to be like'], z.looseObject({})],
    (subject, expected) => {
      if (isNullOrNonObject(subject)) {
        return false;
      }

      // Deep recursive object matching with circular reference protection
      return satisfies(subject, expected);
    },
  ),
] as const; // Shared validation/match helper
