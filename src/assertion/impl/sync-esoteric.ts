import { z } from 'zod/v4';

import { NullProtoObjectSchema, PropertyKeySchema } from '../../schema.js';
import { createAssertion } from '../create.js';

export const EsotericAssertions = [
  createAssertion(['to have a null prototype'], NullProtoObjectSchema),
  createAssertion(
    [PropertyKeySchema, 'to be an enumerable property of', z.looseObject({})],
    (subject, obj) =>
      !!Object.getOwnPropertyDescriptor(obj, subject)?.enumerable,
  ),
  createAssertion(
    ['to be sealed'],
    z.any().refine((obj) => Object.isSealed(obj)),
  ),
  createAssertion(
    ['to be frozen'],
    z.any().refine((obj) => Object.isFrozen(obj)),
  ),
  createAssertion(
    ['to be extensible'],
    z.any().refine((obj) => Object.isExtensible(obj)),
  ),
  createAssertion(['to be a String'], z.instanceof(String)),
  createAssertion(['to be a Number'], z.instanceof(Number)),
  createAssertion(['to be a Boolean'], z.instanceof(Boolean)),
] as const;
