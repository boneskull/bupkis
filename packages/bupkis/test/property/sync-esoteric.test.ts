import {
  createPropertyTestHarness,
  extractPhrases,
  filteredObject,
  getVariants,
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from '@bupkis/property-testing';
import fc from 'fast-check';
import { describe, it } from 'node:test';

import * as assertions from '../../src/assertion/impl/sync-esoteric.js';
import { SyncEsotericAssertions } from '../../src/assertion/index.js';
import { type AnyAssertion } from '../../src/types.js';
import { SyncEsotericGenerators } from '../../test-data/sync-esoteric-generators.js';
import { expect, expectAsync } from '../custom-assertions.js';

const { runVariant } = createPropertyTestHarness({ expect, expectAsync });

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
        generators: SyncEsotericGenerators.get(
          assertions.enumerablePropertyAssertion,
        )!,
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
        generators: SyncEsotericGenerators.get(
          assertions.enumerablePropertyAssertion2,
        )!,
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
        generators: SyncEsotericGenerators.get(assertions.extensibleAssertion)!,
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
        generators: SyncEsotericGenerators.get(assertions.frozenAssertion)!,
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
        generators: SyncEsotericGenerators.get(
          assertions.nullPrototypeAssertion,
        )!,
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
        generators: SyncEsotericGenerators.get(assertions.sealedAssertion)!,
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
