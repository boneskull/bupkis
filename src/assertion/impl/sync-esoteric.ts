import { z } from 'zod/v4';

import { DictionarySchema, PropertyKeySchema } from '../../schema.js';
import { createAssertion } from '../create.js';

export const EsotericAssertions = [
  createAssertion(['to have a null prototype'], DictionarySchema),
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
] as const;
