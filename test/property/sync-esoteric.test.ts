import fc from 'fast-check';
import { describe, it } from 'node:test';

import * as assertions from '../../src/assertion/impl/sync-esoteric.js';
import { SyncEsotericAssertions } from '../../src/assertion/index.js';
import { type AnyAssertion } from '../../src/types.js';
import { expect } from '../custom-assertions.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './property-test-config.js';
import {
  extractPhrases,
  filteredObject,
  getVariants,
  runVariant,
} from './property-test-util.js';

/**
 * Test config defaults
 */
const testConfigDefaults = {} satisfies PropertyTestConfigParameters;

/**
 * Test configurations for each esoteric assertion.
 */
const testConfigs = new Map<AnyAssertion, PropertyTestConfig>([
  [
    assertions.enumerablePropertyAssertion,
    {
      invalid: {
        generators: [
          fc.constant('a'),
          fc.constantFrom(
            ...extractPhrases(assertions.enumerablePropertyAssertion),
          ),
          fc.constant({}).map((obj) => {
            Object.defineProperty(obj, 'a', {
              enumerable: false,
              value: 42,
            });
            return obj;
          }),
        ],
      },
      valid: {
        generators: [
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
      },
    },
  ],
  [
    assertions.enumerablePropertyAssertion2,
    {
      invalid: {
        generators: [
          fc
            .object({})
            .filter(
              (obj) => !Object.getOwnPropertyDescriptor(obj, 'a')?.enumerable,
            ),
          fc.constantFrom(
            ...extractPhrases(assertions.enumerablePropertyAssertion2),
          ),
          fc.constant('a'),
        ],
      },
      valid: {
        generators: [
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
      },
    },
  ],
  [
    assertions.extensibleAssertion,
    {
      invalid: {
        generators: [
          fc.oneof(
            filteredObject.map((obj) => {
              Object.preventExtensions(obj);
              return obj;
            }),
          ),
          fc.constantFrom(...extractPhrases(assertions.extensibleAssertion)),
        ],
      },
      valid: {
        generators: [
          filteredObject,
          fc.constantFrom(...extractPhrases(assertions.extensibleAssertion)),
        ],
      },
    },
  ],

  [
    assertions.frozenAssertion,
    {
      invalid: {
        generators: [
          filteredObject.filter((v) => !Object.isFrozen(v)),
          fc.constantFrom(...extractPhrases(assertions.frozenAssertion)),
        ],
      },
      valid: {
        generators: [
          filteredObject.map(Object.freeze),
          fc.constantFrom(...extractPhrases(assertions.frozenAssertion)),
        ],
      },
    },
  ],

  [
    assertions.nullPrototypeAssertion,

    {
      invalid: {
        generators: [
          filteredObject,
          fc.constantFrom(...extractPhrases(assertions.nullPrototypeAssertion)),
        ],
      },
      valid: {
        generators: [
          fc.constant(Object.create(null)),
          fc.constantFrom(...extractPhrases(assertions.nullPrototypeAssertion)),
        ],
      },
    },
  ],

  [
    assertions.sealedAssertion,
    {
      invalid: {
        generators: [
          fc.oneof(filteredObject.filter((v) => !Object.isSealed(v))),
          fc.constantFrom(...extractPhrases(assertions.sealedAssertion)),
        ],
      },
      valid: {
        generators: [
          filteredObject.map((obj) => {
            Object.seal(obj);
            return obj;
          }),
          fc.constantFrom(...extractPhrases(assertions.sealedAssertion)),
        ],
      },
    },
  ],
]);

describe('Property-Based Tests for Esoteric Assertions', () => {
  it(`should test all available assertions in SyncEsotericAssertions`, () => {
    expect(
      testConfigs,
      'to exhaustively test collection',
      'SyncEsotericAssertions',
      'from',
      SyncEsotericAssertions,
    );
  });

  for (const [assertion, testConfig] of testConfigs) {
    const { id } = assertion;
    const { params, variants } = getVariants(testConfig);
    describe(`Assertion: ${assertion} [${id}]`, () => {
      for (const [name, variant] of variants) {
        it(`should pass ${name} checks [${id}]`, async () => {
          await runVariant(variant, testConfigDefaults, params, name);
        });
      }
    });
  }
});
