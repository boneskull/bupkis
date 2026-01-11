import {
  extractPhrases,
  filteredObject,
  type GeneratorParams,
} from '@bupkis/property-testing';
import fc from 'fast-check';

import * as assertions from '../src/assertion/impl/sync-esoteric.js';
import { type AnyAssertion } from '../src/types.js';

export const SyncEsotericGenerators = new Map<AnyAssertion, GeneratorParams>([
  [
    assertions.enumerablePropertyAssertion,
    [
      fc.constant('a'),
      fc.constantFrom(
        ...extractPhrases(assertions.enumerablePropertyAssertion),
      ),
      fc.constant({}).map((obj) => {
        Object.defineProperty(obj, 'a', {
          enumerable: true,
          value: 42,
        });
        return obj;
      }),
    ],
  ],
  [
    assertions.enumerablePropertyAssertion2,
    [
      filteredObject.map((obj) => {
        Object.defineProperty(obj, 'a', {
          enumerable: true,
          value: 42,
        });
        return obj;
      }),
      fc.constantFrom(
        ...extractPhrases(assertions.enumerablePropertyAssertion2),
      ),
      fc.constant('a'),
    ],
  ],
  [
    assertions.extensibleAssertion,
    [
      filteredObject,
      fc.constantFrom(...extractPhrases(assertions.extensibleAssertion)),
    ],
  ],
  [
    assertions.frozenAssertion,
    [
      filteredObject.map(Object.freeze),
      fc.constantFrom(...extractPhrases(assertions.frozenAssertion)),
    ],
  ],
  [
    assertions.nullPrototypeAssertion,
    [
      fc.constant(Object.create(null)),
      fc.constantFrom(...extractPhrases(assertions.nullPrototypeAssertion)),
    ],
  ],
  [
    assertions.sealedAssertion,
    [
      filteredObject.map((obj) => {
        Object.seal(obj);
        return obj;
      }),
      fc.constantFrom(...extractPhrases(assertions.sealedAssertion)),
    ],
  ],
]);
