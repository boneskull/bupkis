import fc from 'fast-check';

import * as assertions from '../src/assertion/impl/sync-basic.js';
import { type AnyAssertion } from '../src/types.js';
import { type GeneratorParams } from '../test/property/property-test-config.js';
import {
  extractPhrases,
  filteredAnything,
  filteredObject,
} from '../test/property/property-test-util.js';

export const SyncBasicGenerators = new Map<AnyAssertion, GeneratorParams>([
  [
    assertions.arrayAssertion,
    [
      fc.array(filteredAnything),
      fc.constantFrom(...extractPhrases(assertions.arrayAssertion)),
    ],
  ],
  [
    assertions.asyncFunctionAssertion,
    [
      fc.oneof(
        fc.constant(async () => {}),
        fc.constant(async () => {}),
      ),
      fc.constantFrom(...extractPhrases(assertions.asyncFunctionAssertion)),
    ],
  ],
  [
    assertions.bigintAssertion,
    [
      fc.bigInt(),
      fc.constantFrom(...extractPhrases(assertions.bigintAssertion)),
    ],
  ],
  [
    assertions.booleanAssertion,
    [
      fc.boolean(),
      fc.constantFrom(...extractPhrases(assertions.booleanAssertion)),
    ],
  ],
  [
    assertions.classAssertion,
    [
      fc.constantFrom(Date, Array, Object, String, Number, Boolean, RegExp),
      fc.constantFrom(...extractPhrases(assertions.classAssertion)),
    ],
  ],
  [
    assertions.dateAssertion,
    [
      fc.date({ noInvalidDate: true }),
      fc.constantFrom(...extractPhrases(assertions.dateAssertion)),
    ],
  ],
  [
    assertions.definedAssertion,
    [
      filteredAnything.filter((v) => v !== undefined),
      fc.constantFrom(...extractPhrases(assertions.definedAssertion)),
    ],
  ],
  [
    assertions.emptyArrayAssertion,
    [
      fc.constant([]),
      fc.constantFrom(...extractPhrases(assertions.emptyArrayAssertion)),
    ],
  ],
  [
    assertions.emptyObjectAssertion,
    [
      fc.constant({}),
      fc.constantFrom(...extractPhrases(assertions.emptyObjectAssertion)),
    ],
  ],
  [
    assertions.emptyStringAssertion,
    [
      fc.constant(''),
      fc.constantFrom(...extractPhrases(assertions.emptyStringAssertion)),
    ],
  ],
  [
    assertions.errorAssertion,
    [
      fc.oneof(
        fc.constant(new Error('test')),
        fc.constant(new TypeError('test')),
        fc.constant(new ReferenceError('test')),
        fc.constant(new SyntaxError('test')),
      ),
      fc.constantFrom(...extractPhrases(assertions.errorAssertion)),
    ],
  ],
  [
    assertions.falseAssertion,
    [
      fc.constant(false),
      fc.constantFrom(...extractPhrases(assertions.falseAssertion)),
    ],
  ],
  [
    assertions.falsyAssertion,
    [
      fc.constantFrom(false, 0, '', null, undefined, NaN, 0n),
      fc.constantFrom(...extractPhrases(assertions.falsyAssertion)),
    ],
  ],
  [
    assertions.functionAssertion,
    [
      fc.oneof(
        fc.func(filteredAnything),
        fc.constant(() => {}),
        fc.constant(() => {}),
        fc.constant(async () => {}),
        fc.constant(async () => {}),
      ),
      fc.constantFrom(...extractPhrases(assertions.functionAssertion)),
    ],
  ],
  [
    assertions.infiniteAssertion,
    [
      fc.constantFrom(Infinity, -Infinity),
      fc.constantFrom(...extractPhrases(assertions.infiniteAssertion)),
    ],
  ],
  [
    assertions.integerAssertion,
    [
      fc.integer(),
      fc.constantFrom(...extractPhrases(assertions.integerAssertion)),
    ],
  ],
  [
    assertions.nanAssertion,
    [
      fc.constant(NaN),
      fc.constantFrom(...extractPhrases(assertions.nanAssertion)),
    ],
  ],
  [
    assertions.negativeAssertion,
    [
      fc
        .double({ max: -0.000001, noNaN: true })
        .filter((v) => Number.isFinite(v) && v < 0),
      fc.constantFrom(...extractPhrases(assertions.negativeAssertion)),
    ],
  ],
  [
    assertions.negativeInfinityAssertion,
    [
      fc.constant(-Infinity),
      fc.constantFrom(...extractPhrases(assertions.negativeInfinityAssertion)),
    ],
  ],
  [
    assertions.negativeIntegerAssertion,
    [
      fc.integer({ max: -1 }),
      fc.constantFrom(...extractPhrases(assertions.negativeIntegerAssertion)),
    ],
  ],
  [
    assertions.nonEmptyStringAssertion,
    [
      fc.string({ minLength: 1 }),
      fc.constantFrom(...extractPhrases(assertions.nonEmptyStringAssertion)),
    ],
  ],
  [
    assertions.nullAssertion,
    [
      fc.constant(null),
      fc.constantFrom(...extractPhrases(assertions.nullAssertion)),
    ],
  ],
  [
    assertions.numberAssertion,
    [
      fc.double().filter((v) => Number.isFinite(v)),
      fc.constantFrom(...extractPhrases(assertions.numberAssertion)),
    ],
  ],
  [
    assertions.objectAssertion,
    [
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
  ],
  [
    assertions.positiveAssertion,
    [
      fc
        .double({ min: 0.000001, noNaN: true })
        .filter((v) => Number.isFinite(v) && v > 0),
      fc.constantFrom(...extractPhrases(assertions.positiveAssertion)),
    ],
  ],
  [
    assertions.positiveInfinityAssertion,
    [
      fc.constant(Infinity),
      fc.constantFrom(...extractPhrases(assertions.positiveInfinityAssertion)),
    ],
  ],
  [
    assertions.positiveIntegerAssertion,
    [
      fc.integer({ min: 1 }),
      fc.constantFrom(...extractPhrases(assertions.positiveIntegerAssertion)),
    ],
  ],
  [
    assertions.primitiveAssertion,
    [
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
  ],
  [
    assertions.recordAssertion,
    [
      filteredObject,
      fc.constantFrom(...extractPhrases(assertions.recordAssertion)),
    ],
  ],
  [
    assertions.regexpAssertion,
    [
      fc.oneof(
        fc.constant(/test/),
        fc.constant(new RegExp('test')),
        fc
          .string()
          .map((s) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))),
      ),
      fc.constantFrom(...extractPhrases(assertions.regexpAssertion)),
    ],
  ],
  [
    assertions.setAssertion,
    [
      fc.oneof(
        fc.constant(new Set()),
        fc.array(filteredAnything).map((arr) => new Set(arr)),
      ),
      fc.constantFrom(...extractPhrases(assertions.setAssertion)),
    ],
  ],
  [
    assertions.stringAssertion,
    [
      fc.string(),
      fc.constantFrom(...extractPhrases(assertions.stringAssertion)),
    ],
  ],
  [
    assertions.symbolAssertion,
    [
      fc.constantFrom(Symbol(), Symbol.for('test'), Symbol.iterator),
      fc.constantFrom(...extractPhrases(assertions.symbolAssertion)),
    ],
  ],
  [
    assertions.trueAssertion,
    [
      fc.constant(true),
      fc.constantFrom(...extractPhrases(assertions.trueAssertion)),
    ],
  ],
  [
    assertions.truthyAssertion,
    [
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
  ],
  [
    assertions.undefinedAssertion,
    [
      fc.constant(undefined),
      fc.constantFrom(...extractPhrases(assertions.undefinedAssertion)),
    ],
  ],
  [
    assertions.weakMapAssertion,
    [
      fc.constant(new WeakMap()),
      fc.constantFrom(...extractPhrases(assertions.weakMapAssertion)),
    ],
  ],
  [
    assertions.weakSetAssertion,
    [
      fc.constant(new WeakSet()),
      fc.constantFrom(...extractPhrases(assertions.weakSetAssertion)),
    ],
  ],
]);
