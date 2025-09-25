import fc from 'fast-check';
import { describe, it } from 'node:test';

import type { AnyAssertion } from '../../src/types.js';

import * as assertions from '../../src/assertion/impl/sync-basic.js';
import { SyncBasicAssertions } from '../../src/assertion/index.js';
import { expect } from '../custom-assertions.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './property-test-config.js';
import {
  extractPhrases,
  filteredAnything,
  filteredObject,
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
        generators: [
          fc.array(filteredAnything),
          fc.constantFrom(...extractPhrases(assertions.arrayAssertion)),
        ],
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
        generators: [
          fc.oneof(
            fc.constant(async () => {}),
            fc.constant(async () => {}),
          ),
          fc.constantFrom(...extractPhrases(assertions.asyncFunctionAssertion)),
        ],
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
        generators: [
          fc.bigInt(),
          fc.constantFrom(...extractPhrases(assertions.bigintAssertion)),
        ],
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
        generators: [
          fc.boolean(),
          fc.constantFrom(...extractPhrases(assertions.booleanAssertion)),
        ],
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
        generators: [
          fc.constantFrom(Date, Array, Object, String, Number, Boolean, RegExp),
          fc.constantFrom(...extractPhrases(assertions.classAssertion)),
        ],
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
        generators: [
          fc.date({ noInvalidDate: true }),
          fc.constantFrom(...extractPhrases(assertions.dateAssertion)),
        ],
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
        generators: [
          filteredAnything.filter((v) => v !== undefined),
          fc.constantFrom(...extractPhrases(assertions.definedAssertion)),
        ],
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
        generators: [
          fc.constant([]),
          fc.constantFrom(...extractPhrases(assertions.emptyArrayAssertion)),
        ],
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
        generators: [
          fc.constant([]),
          fc.constantFrom(...extractPhrases(assertions.emptyArrayAssertion)),
        ],
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
        generators: [
          fc.constant({}),
          fc.constantFrom(...extractPhrases(assertions.emptyObjectAssertion)),
        ],
      },
    },
  ],

  [
    assertions.emptyObjectAssertion,
    {
      invalid: {
        generators: [
          filteredObject.filter((obj) => Object.keys(obj).length > 0),
          fc.constantFrom(...extractPhrases(assertions.emptyObjectAssertion)),
        ],
      },
      valid: {
        generators: [
          fc.constant({}),
          fc.constantFrom(...extractPhrases(assertions.emptyObjectAssertion)),
        ],
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
        generators: [
          fc.constant(''),
          fc.constantFrom(...extractPhrases(assertions.emptyStringAssertion)),
        ],
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
        generators: [
          fc.oneof(
            fc.constant(new Error('test')),
            fc.constant(new TypeError('test')),
            fc.constant(new ReferenceError('test')),
            fc.constant(new SyntaxError('test')),
          ),
          fc.constantFrom(...extractPhrases(assertions.errorAssertion)),
        ],
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
        generators: [
          fc.constant(false),
          fc.constantFrom(...extractPhrases(assertions.falseAssertion)),
        ],
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
        generators: [
          fc.constantFrom(false, 0, '', null, undefined, NaN, 0n),
          fc.constantFrom(...extractPhrases(assertions.falsyAssertion)),
        ],
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
        generators: [
          fc.oneof(
            fc.func(filteredAnything),
            fc.constant(() => {}),
            fc.constant(() => {}),
            fc.constant(async () => {}),
            fc.constant(async () => {}),
          ),
          fc.constantFrom(...extractPhrases(assertions.functionAssertion)),
        ],
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
        generators: [
          fc.constantFrom(Infinity, -Infinity),
          fc.constantFrom(...extractPhrases(assertions.infiniteAssertion)),
        ],
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
        generators: [
          fc.integer(),
          fc.constantFrom(...extractPhrases(assertions.integerAssertion)),
        ],
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
        generators: [
          fc.constant(NaN),
          fc.constantFrom(...extractPhrases(assertions.nanAssertion)),
        ],
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
        generators: [
          fc
            .double({ max: -0.000001, noNaN: true })
            .filter((v) => Number.isFinite(v) && v < 0),
          fc.constantFrom(...extractPhrases(assertions.negativeAssertion)),
        ],
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
        generators: [
          fc.constant(-Infinity),
          fc.constantFrom(
            ...extractPhrases(assertions.negativeInfinityAssertion),
          ),
        ],
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
        generators: [
          fc.integer({ max: -1 }),
          fc.constantFrom(
            ...extractPhrases(assertions.negativeIntegerAssertion),
          ),
        ],
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
        generators: [
          fc.string({ minLength: 1 }),
          fc.constantFrom(
            ...extractPhrases(assertions.nonEmptyStringAssertion),
          ),
        ],
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
        generators: [
          fc.constant(null),
          fc.constantFrom(...extractPhrases(assertions.nullAssertion)),
        ],
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
        generators: [
          fc.double().filter((v) => Number.isFinite(v)),
          fc.constantFrom(...extractPhrases(assertions.numberAssertion)),
        ],
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
        generators: [
          fc.oneof(
            filteredObject,
            fc.array(filteredAnything),
            fc.date(),
            fc.constant(/test/),
            fc.constant(new Map()),
            fc.constant(new Set()),
          ),
          fc.constantFrom(...extractPhrases(assertions.objectAssertion)),
        ],
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
        generators: [
          fc
            .double({ min: 0.000001, noNaN: true })
            .filter((v) => Number.isFinite(v) && v > 0),
          fc.constantFrom(...extractPhrases(assertions.positiveAssertion)),
        ],
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
        generators: [
          fc.constant(Infinity),
          fc.constantFrom(
            ...extractPhrases(assertions.positiveInfinityAssertion),
          ),
        ],
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
        generators: [
          fc.integer({ min: 1 }),
          fc.constantFrom(
            ...extractPhrases(assertions.positiveIntegerAssertion),
          ),
        ],
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
        generators: [
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined),
            fc.bigInt(),
            fc.string().map((s) => Symbol(s)),
          ),
          fc.constantFrom(...extractPhrases(assertions.primitiveAssertion)),
        ],
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
        generators: [
          filteredObject,
          fc.constantFrom(...extractPhrases(assertions.recordAssertion)),
        ],
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
        generators: [
          fc.oneof(
            fc.constant(/test/),
            fc.constant(new RegExp('test')),
            fc
              .string()
              .map((s) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))),
          ),
          fc.constantFrom(...extractPhrases(assertions.regexpAssertion)),
        ],
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
        generators: [
          fc.oneof(
            fc.constant(new Set()),
            fc.array(filteredAnything).map((arr) => new Set(arr)),
          ),
          fc.constantFrom(...extractPhrases(assertions.setAssertion)),
        ],
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
        generators: [
          fc.string(),
          fc.constantFrom(...extractPhrases(assertions.stringAssertion)),
        ],
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
        generators: [
          fc.constantFrom(Symbol(), Symbol.for('test'), Symbol.iterator),
          fc.constantFrom(...extractPhrases(assertions.symbolAssertion)),
        ],
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
        generators: [
          fc.constant(true),
          fc.constantFrom(...extractPhrases(assertions.trueAssertion)),
        ],
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
          fc.constantFrom(...extractPhrases(assertions.truthyAssertion)),
        ],
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
        generators: [
          fc.constant(undefined),
          fc.constantFrom(...extractPhrases(assertions.undefinedAssertion)),
        ],
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
        generators: [
          fc.constant(new WeakMap()),
          fc.constantFrom(...extractPhrases(assertions.weakMapAssertion)),
        ],
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
        generators: [
          fc.constant(new WeakSet()),
          fc.constantFrom(...extractPhrases(assertions.weakSetAssertion)),
        ],
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
