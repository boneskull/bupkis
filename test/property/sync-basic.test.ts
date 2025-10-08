import fc from 'fast-check';
import { describe, it } from 'node:test';

import type { AnyAssertion } from '../../src/types.js';

import * as assertions from '../../src/assertion/impl/sync-basic.js';
import { SyncBasicAssertions } from '../../src/assertion/index.js';
import { SyncBasicGenerators } from '../../test-data/sync-basic-generators.js';
import { expect } from '../custom-assertions.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './property-test-config.js';
import {
  extractPhrases,
  filteredAnything,
  getVariants,
  runVariant,
} from './property-test-util.js';

/**
 * Test config defaults
 */
const testConfigDefaults: PropertyTestConfigParameters = {} as const;

/**
 * Map of assertions to their property test configurations.
 *
 * Note that the form of the second generator in each will only work for these
 * basic assertions, since parametric assertions may have phrases separated by
 * parameters.
 */
const testConfigs = new Map<AnyAssertion, PropertyTestConfig>([
  [
    assertions.arrayAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => !Array.isArray(v)),
          fc.constantFrom(...extractPhrases(assertions.arrayAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.arrayAssertion)!,
      },
    },
  ],

  [
    assertions.asyncFunctionAssertion,
    {
      invalid: {
        generators: [
          fc
            .anything()
            .filter(
              (v) =>
                typeof v !== 'function' ||
                v.constructor.name !== 'AsyncFunction',
            ),
          fc.constantFrom(...extractPhrases(assertions.asyncFunctionAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.asyncFunctionAssertion)!,
      },
    },
  ],

  [
    assertions.bigintAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => typeof v !== 'bigint'),
          fc.constantFrom(...extractPhrases(assertions.bigintAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.bigintAssertion)!,
      },
    },
  ],

  [
    assertions.booleanAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => typeof v !== 'boolean'),
          fc.constantFrom(...extractPhrases(assertions.booleanAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.booleanAssertion)!,
      },
    },
  ],

  [
    assertions.classAssertion,
    {
      invalid: {
        generators: [
          fc
            .anything()
            .filter(
              (v) =>
                typeof v !== 'function' ||
                v.prototype === undefined ||
                !v.prototype.constructor,
            ),
          fc.constantFrom(...extractPhrases(assertions.classAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.classAssertion)!,
      },
    },
  ],

  [
    assertions.dateAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => !(v instanceof Date)),
          fc.constantFrom(...extractPhrases(assertions.dateAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.dateAssertion)!,
      },
    },
  ],

  [
    assertions.definedAssertion,
    {
      invalid: {
        generators: [
          fc.constant(undefined),
          fc.constantFrom(...extractPhrases(assertions.definedAssertion)),
        ],
      },
      valid: {
        examples: [[null, 'to be defined']],
        generators: SyncBasicGenerators.get(assertions.definedAssertion)!,
      },
    },
  ],

  [
    assertions.emptyArrayAssertion,
    {
      invalid: {
        generators: [
          fc.array(filteredAnything, { minLength: 1 }),
          fc.constantFrom(...extractPhrases(assertions.emptyArrayAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.emptyArrayAssertion)!,
      },
    },
  ],

  [
    assertions.emptyObjectAssertion,
    {
      invalid: {
        generators: [
          fc
            .dictionary(fc.string(), filteredAnything)
            .filter((obj) => Object.keys(obj).length > 0),
          fc.constantFrom(...extractPhrases(assertions.emptyObjectAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.emptyObjectAssertion)!,
      },
    },
  ],

  [
    assertions.emptyStringAssertion,
    {
      invalid: {
        generators: [
          fc.string({ minLength: 1 }),
          fc.constantFrom(...extractPhrases(assertions.emptyStringAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.emptyStringAssertion)!,
      },
    },
  ],

  [
    assertions.errorAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => !(v instanceof Error)),
          fc.constantFrom(...extractPhrases(assertions.errorAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.errorAssertion)!,
      },
    },
  ],

  [
    assertions.falseAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => v !== false),
          fc.constantFrom(...extractPhrases(assertions.falseAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.falseAssertion)!,
      },
    },
  ],

  [
    assertions.falsyAssertion,
    {
      invalid: {
        generators: [
          fc
            .anything()
            .filter(
              (v) =>
                v !== false &&
                v !== 0 &&
                v !== '' &&
                v !== null &&
                v !== undefined &&
                !Number.isNaN(v) &&
                v !== 0n,
            ),
          fc.constantFrom(...extractPhrases(assertions.falsyAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.falsyAssertion)!,
      },
    },
  ],

  [
    assertions.functionAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => typeof v !== 'function'),
          fc.constantFrom(...extractPhrases(assertions.functionAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.functionAssertion)!,
      },
    },
  ],

  [
    assertions.infiniteAssertion,
    {
      invalid: {
        generators: [
          fc
            .anything()
            .filter(
              (v) =>
                typeof v !== 'number' || (v !== Infinity && v !== -Infinity),
            ),
          fc.constantFrom(...extractPhrases(assertions.infiniteAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.infiniteAssertion)!,
      },
    },
  ],

  [
    assertions.integerAssertion,
    {
      invalid: {
        generators: [
          fc
            .anything()
            .filter(
              (v) =>
                typeof v !== 'number' ||
                !Number.isInteger(v) ||
                !Number.isFinite(v),
            ),
          fc.constantFrom(...extractPhrases(assertions.integerAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.integerAssertion)!,
      },
    },
  ],

  [
    assertions.nanAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => !Number.isNaN(v)),
          fc.constantFrom(...extractPhrases(assertions.nanAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.nanAssertion)!,
      },
    },
  ],

  [
    assertions.negativeAssertion,
    {
      invalid: {
        generators: [
          fc
            .anything()
            .filter(
              (v) => typeof v !== 'number' || !Number.isFinite(v) || v >= 0,
            ),
          fc.constantFrom(...extractPhrases(assertions.negativeAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.negativeAssertion)!,
      },
    },
  ],

  [
    assertions.negativeInfinityAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => v !== -Infinity),
          fc.constantFrom(
            ...extractPhrases(assertions.negativeInfinityAssertion),
          ),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(
          assertions.negativeInfinityAssertion,
        )!,
      },
    },
  ],

  [
    assertions.negativeIntegerAssertion,
    {
      invalid: {
        generators: [
          fc
            .anything()
            .filter(
              (v) =>
                typeof v !== 'number' ||
                !Number.isInteger(v) ||
                v >= 0 ||
                !Number.isFinite(v),
            ),
          fc.constantFrom(
            ...extractPhrases(assertions.negativeIntegerAssertion),
          ),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(
          assertions.negativeIntegerAssertion,
        )!,
      },
    },
  ],

  [
    assertions.nonEmptyStringAssertion,
    {
      invalid: {
        generators: [
          fc.constant(''),
          fc.constantFrom(
            ...extractPhrases(assertions.nonEmptyStringAssertion),
          ),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(
          assertions.nonEmptyStringAssertion,
        )!,
      },
    },
  ],

  [
    assertions.nullAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => v !== null),
          fc.constantFrom(...extractPhrases(assertions.nullAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.nullAssertion)!,
      },
    },
  ],

  [
    assertions.numberAssertion,
    {
      invalid: {
        generators: [
          fc
            .anything()
            .filter((v) => typeof v !== 'number' || !Number.isFinite(v)),
          fc.constantFrom(...extractPhrases(assertions.numberAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.numberAssertion)!,
      },
    },
  ],

  [
    assertions.objectAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => typeof v !== 'object' || v === null),
          fc.constantFrom(...extractPhrases(assertions.objectAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.objectAssertion)!,
      },
    },
  ],

  [
    assertions.positiveAssertion,
    {
      invalid: {
        generators: [
          fc
            .anything()
            .filter(
              (v) => typeof v !== 'number' || !Number.isFinite(v) || v <= 0,
            ),
          fc.constantFrom(...extractPhrases(assertions.positiveAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.positiveAssertion)!,
      },
    },
  ],

  [
    assertions.positiveInfinityAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => v !== Infinity),
          fc.constantFrom(
            ...extractPhrases(assertions.positiveInfinityAssertion),
          ),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(
          assertions.positiveInfinityAssertion,
        )!,
      },
    },
  ],

  [
    assertions.positiveIntegerAssertion,
    {
      invalid: {
        generators: [
          fc
            .anything()
            .filter(
              (v) =>
                typeof v !== 'number' ||
                !Number.isInteger(v) ||
                v <= 0 ||
                !Number.isFinite(v),
            ),
          fc.constantFrom(
            ...extractPhrases(assertions.positiveIntegerAssertion),
          ),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(
          assertions.positiveIntegerAssertion,
        )!,
      },
    },
  ],

  [
    assertions.primitiveAssertion,
    {
      invalid: {
        generators: [
          fc
            .anything()
            .filter(
              (v) =>
                typeof v === 'object' && v !== null && typeof v !== 'function',
            ),
          fc.constantFrom(...extractPhrases(assertions.primitiveAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.primitiveAssertion)!,
      },
    },
  ],

  [
    assertions.recordAssertion,
    {
      invalid: {
        generators: [
          fc
            .anything()
            .filter(
              (v) =>
                typeof v !== 'object' ||
                v === null ||
                Array.isArray(v) ||
                v instanceof Date ||
                v instanceof RegExp ||
                v instanceof Map ||
                v instanceof Set,
            ),
          fc.constantFrom(...extractPhrases(assertions.recordAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.recordAssertion)!,
      },
    },
  ],

  [
    assertions.regexpAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => !(v instanceof RegExp)),
          fc.constantFrom(...extractPhrases(assertions.regexpAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.regexpAssertion)!,
      },
    },
  ],

  [
    assertions.setAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => !(v instanceof Set)),
          fc.constantFrom(...extractPhrases(assertions.setAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.setAssertion)!,
      },
    },
  ],

  [
    assertions.stringAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => typeof v !== 'string'),
          fc.constantFrom(...extractPhrases(assertions.stringAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.stringAssertion)!,
      },
    },
  ],

  [
    assertions.symbolAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => typeof v !== 'symbol'),
          fc.constantFrom(...extractPhrases(assertions.symbolAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.symbolAssertion)!,
      },
    },
  ],

  [
    assertions.trueAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => v !== true),
          fc.constantFrom(...extractPhrases(assertions.trueAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.trueAssertion)!,
      },
    },
  ],

  [
    assertions.truthyAssertion,
    {
      invalid: {
        generators: [
          fc.constantFrom(false, 0, '', null, undefined, NaN, 0n),
          fc.constantFrom(...extractPhrases(assertions.truthyAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.truthyAssertion)!,
      },
    },
  ],

  [
    assertions.undefinedAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => v !== undefined),
          fc.constantFrom(...extractPhrases(assertions.undefinedAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.undefinedAssertion)!,
      },
    },
  ],

  [
    assertions.weakMapAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => !(v instanceof WeakMap)),
          fc.constantFrom(...extractPhrases(assertions.weakMapAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.weakMapAssertion)!,
      },
    },
  ],

  [
    assertions.weakSetAssertion,
    {
      invalid: {
        generators: [
          filteredAnything.filter((v) => !(v instanceof WeakSet)),
          fc.constantFrom(...extractPhrases(assertions.weakSetAssertion)),
        ],
      },
      valid: {
        generators: SyncBasicGenerators.get(assertions.weakSetAssertion)!,
      },
    },
  ],
]);

describe('Property-Based Tests for Basic (non-parametric) Assertions', () => {
  it(`should test all available assertions in SyncBasicAssertions`, () => {
    expect(
      testConfigs,
      'to exhaustively test collection',
      'SyncBasicAssertions',
      'from',
      SyncBasicAssertions,
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
