import fc from 'fast-check';
import { describe } from 'node:test';

import { BasicAssertions } from '../../src/assertion/impl/sync-basic.js';
import { isConstructable } from '../../src/guards.js';
import { keyBy } from '../../src/util.js';
import {
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from './config.js';
import { createPhraseExtractor } from './property-test-util.js';
import {
  assertExhaustiveTestConfig,
  runPropertyTests,
} from './property-test.macro.js';

const assertions = keyBy(BasicAssertions, 'id');
const extractPhrases = createPhraseExtractor(assertions);

/**
 * Test config defaults
 */
const testConfigDefaults: PropertyTestConfigParameters = {} as const;

/**
 * Test configurations for each basic assertion.
 *
 * Note that the form of the second generator in each will only work for these
 * basic assertions, since parametric assertions may have phrases separated by
 * parameters.
 */
const testConfigs = {
  'array-to-be-empty-2s2p': {
    invalid: {
      generators: [
        fc.array(fc.anything(), { minLength: 1 }),
        fc.constantFrom(...extractPhrases('array-to-be-empty-2s2p')),
      ],
    },
    valid: {
      generators: [
        fc.constant([]),
        fc.constantFrom(...extractPhrases('array-to-be-empty-2s2p')),
      ],
    },
  },
  'recordany-unknown-to-be-empty-2s2p': {
    invalid: {
      generators: [
        fc.dictionary(
          fc.string().filter((k) => k !== '__proto__'),
          fc.anything(),
          { minKeys: 1 },
        ),
        fc.constantFrom(
          ...extractPhrases('recordany-unknown-to-be-empty-2s2p'),
        ),
      ],
    },
    valid: {
      generators: [
        fc.constant({}),
        fc.constantFrom(
          ...extractPhrases('recordany-unknown-to-be-empty-2s2p'),
        ),
      ],
    },
  },
  'string-to-be-empty-2s2p': {
    invalid: {
      generators: [
        fc.string().filter((s) => s.length > 0),
        fc.constantFrom(...extractPhrases('string-to-be-empty-2s2p')),
      ],
    },
    valid: {
      generators: [
        fc.constant(''),
        fc.constantFrom(...extractPhrases('string-to-be-empty-2s2p')),
      ],
    },
  },
  'string-to-be-non_empty-2s2p': {
    invalid: {
      generators: [
        fc.constant(''),
        fc.constantFrom(...extractPhrases('string-to-be-non_empty-2s2p')),
      ],
    },
    valid: {
      generators: [
        fc.string().filter((s) => s.length > 0),
        fc.constantFrom(...extractPhrases('string-to-be-non_empty-2s2p')),
      ],
    },
  },
  'unknown-to-be-_infinity-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => v !== -Infinity),
        fc.constantFrom(...extractPhrases('unknown-to-be-_infinity-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.constant(-Infinity),
        fc.constantFrom(...extractPhrases('unknown-to-be-_infinity-2s1p')),
      ],
    },
  },
  'unknown-to-be-a-bigint-to-be-a-bigint-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => typeof v !== 'bigint'),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-a-bigint-to-be-a-bigint-2s1p'),
        ),
      ],
    },
    valid: {
      generators: [
        fc.bigInt(),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-a-bigint-to-be-a-bigint-2s1p'),
        ),
      ],
    },
  },
  'unknown-to-be-a-boolean-to-be-boolean-to-be-a-bool-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => typeof v !== 'boolean'),
        fc.constantFrom(
          ...extractPhrases(
            'unknown-to-be-a-boolean-to-be-boolean-to-be-a-bool-2s1p',
          ),
        ),
      ],
    },
    valid: {
      generators: [
        fc.boolean(),
        fc.constantFrom(
          ...extractPhrases(
            'unknown-to-be-a-boolean-to-be-boolean-to-be-a-bool-2s1p',
          ),
        ),
      ],
    },
  },
  'unknown-to-be-a-class-to-be-a-constructor-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => !isConstructable(v)),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-a-class-to-be-a-constructor-2s1p'),
        ),
      ],
    },
    valid: {
      generators: [
        fc.oneof(
          fc.constant(class TestClass {}),
          fc.constant(Array),
          fc.constant(Date),
          fc.constant(Map),
          fc.constant(Set),
        ),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-a-class-to-be-a-constructor-2s1p'),
        ),
      ],
    },
  },
  'unknown-to-be-a-date-to-be-a-date-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => !(v instanceof Date)),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-a-date-to-be-a-date-2s1p'),
        ),
      ],
    },
    valid: {
      generators: [
        fc.date().filter((d) => !isNaN(d.getTime())),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-a-date-to-be-a-date-2s1p'),
        ),
      ],
    },
  },
  'unknown-to-be-a-function-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => typeof v !== 'function'),
        fc.constantFrom(...extractPhrases('unknown-to-be-a-function-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.oneof(
          fc.constant(() => {}),
          fc.constant(function () {}),
          fc.constant(Math.max),
          fc.constant(Array.isArray),
        ),
        fc.constantFrom(...extractPhrases('unknown-to-be-a-function-2s1p')),
      ],
    },
  },
  'unknown-to-be-a-negative-integer-to-be-a-negative-int-2s1p': {
    invalid: {
      generators: [
        fc
          .anything()
          .filter(
            (v) =>
              typeof v !== 'number' ||
              !Number.isInteger(v) ||
              v >= 0 ||
              v === Infinity ||
              v === -Infinity,
          ),
        fc.constantFrom(
          ...extractPhrases(
            'unknown-to-be-a-negative-integer-to-be-a-negative-int-2s1p',
          ),
        ),
      ],
    },
    valid: {
      generators: [
        fc.integer({ max: -1, min: Number.MIN_SAFE_INTEGER }),
        fc.constantFrom(
          ...extractPhrases(
            'unknown-to-be-a-negative-integer-to-be-a-negative-int-2s1p',
          ),
        ),
      ],
    },
  },
  'unknown-to-be-a-number-to-be-finite-2s1p': {
    invalid: {
      generators: [
        fc
          .anything()
          .filter(
            (v) =>
              typeof v !== 'number' ||
              v === Infinity ||
              v === -Infinity ||
              Number.isNaN(v),
          ),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-a-number-to-be-finite-2s1p'),
        ),
      ],
    },
    valid: {
      generators: [
        fc
          .oneof(fc.integer(), fc.float())
          .filter((v) => v !== Infinity && v !== -Infinity && !Number.isNaN(v)),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-a-number-to-be-finite-2s1p'),
        ),
      ],
    },
  },
  'unknown-to-be-a-positive-integer-to-be-a-positive-int-2s1p': {
    invalid: {
      generators: [
        fc
          .anything()
          .filter(
            (v) =>
              typeof v !== 'number' ||
              !Number.isInteger(v) ||
              v <= 0 ||
              v === Infinity ||
              v === -Infinity,
          ),
        fc.constantFrom(
          ...extractPhrases(
            'unknown-to-be-a-positive-integer-to-be-a-positive-int-2s1p',
          ),
        ),
      ],
    },
    valid: {
      generators: [
        fc.integer({ max: Number.MAX_SAFE_INTEGER, min: 1 }),
        fc.constantFrom(
          ...extractPhrases(
            'unknown-to-be-a-positive-integer-to-be-a-positive-int-2s1p',
          ),
        ),
      ],
    },
  },
  'unknown-to-be-a-primitive-2s1p': {
    invalid: {
      generators: [
        fc.oneof(
          fc.object(),
          fc.array(fc.anything()),
          fc.date(),
          fc.constant(new Map()),
          fc.constant(new Set()),
          fc.constant(() => {}),
        ),
        fc.constantFrom(...extractPhrases('unknown-to-be-a-primitive-2s1p')),
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
        fc.constantFrom(...extractPhrases('unknown-to-be-a-primitive-2s1p')),
      ],
    },
  },
  'unknown-to-be-a-record-to-be-a-plain-object-2s1p': {
    invalid: {
      generators: [
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.constant(undefined),
          fc.bigInt(),
          fc.string().map((s) => Symbol(s)),
          fc.array(fc.anything()),
          fc.date(),
          fc.constant(new Map()),
          fc.constant(new Set()),
          fc.constant(() => {}),
        ),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-a-record-to-be-a-plain-object-2s1p'),
        ),
      ],
    },
    valid: {
      generators: [
        fc.dictionary(fc.string(), fc.anything()),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-a-record-to-be-a-plain-object-2s1p'),
        ),
      ],
    },
  },
  'unknown-to-be-a-regexp-to-be-a-regex-to-be-a-regexp-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => !(v instanceof RegExp)),
        fc.constantFrom(
          ...extractPhrases(
            'unknown-to-be-a-regexp-to-be-a-regex-to-be-a-regexp-2s1p',
          ),
        ),
      ],
    },
    valid: {
      generators: [
        fc.oneof(
          fc.constant(/test/),
          fc.constant(new RegExp('\\d+')),
          fc.constant(/[a-z]/i),
        ),
        fc.constantFrom(
          ...extractPhrases(
            'unknown-to-be-a-regexp-to-be-a-regex-to-be-a-regexp-2s1p',
          ),
        ),
      ],
    },
  },
  'unknown-to-be-a-set-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => !(v instanceof Set)),
        fc.constantFrom(...extractPhrases('unknown-to-be-a-set-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.array(fc.anything()).map((arr) => new Set(arr)),
        fc.constantFrom(...extractPhrases('unknown-to-be-a-set-2s1p')),
      ],
    },
  },
  'unknown-to-be-a-string-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => typeof v !== 'string'),
        fc.constantFrom(...extractPhrases('unknown-to-be-a-string-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.string(),
        fc.constantFrom(...extractPhrases('unknown-to-be-a-string-2s1p')),
      ],
    },
  },
  'unknown-to-be-a-symbol-to-be-a-symbol-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => typeof v !== 'symbol'),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-a-symbol-to-be-a-symbol-2s1p'),
        ),
      ],
    },
    valid: {
      generators: [
        fc.string().map((s) => Symbol(s)),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-a-symbol-to-be-a-symbol-2s1p'),
        ),
      ],
    },
  },
  'unknown-to-be-a-weakmap-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => !(v instanceof WeakMap)),
        fc.constantFrom(...extractPhrases('unknown-to-be-a-weakmap-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.constant(new WeakMap()),
        fc.constantFrom(...extractPhrases('unknown-to-be-a-weakmap-2s1p')),
      ],
    },
  },
  'unknown-to-be-a-weakset-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => !(v instanceof WeakSet)),
        fc.constantFrom(...extractPhrases('unknown-to-be-a-weakset-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.constant(new WeakSet()),
        fc.constantFrom(...extractPhrases('unknown-to-be-a-weakset-2s1p')),
      ],
    },
  },
  'unknown-to-be-an-array-to-be-array-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => !Array.isArray(v)),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-an-array-to-be-array-2s1p'),
        ),
      ],
    },
    valid: {
      generators: [
        fc.array(fc.anything()),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-an-array-to-be-array-2s1p'),
        ),
      ],
    },
  },
  'unknown-to-be-an-async-function-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => {
          return (
            typeof v !== 'function' ||
            (typeof v === 'function' && v.constructor.name !== 'AsyncFunction')
          );
        }),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-an-async-function-2s1p'),
        ),
      ],
    },
    valid: {
      generators: [
        fc.oneof(
          fc.constant(async () => {}),
          fc.constant(async function () {}),
        ),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-an-async-function-2s1p'),
        ),
      ],
    },
  },
  'unknown-to-be-an-error-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => !(v instanceof Error)),
        fc.constantFrom(...extractPhrases('unknown-to-be-an-error-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.oneof(
          fc.constant(new Error('test error')),
          fc.constant(new TypeError('test type error')),
          fc.constant(new ReferenceError('test reference error')),
          fc.constant(new SyntaxError('test syntax error')),
        ),
        fc.constantFrom(...extractPhrases('unknown-to-be-an-error-2s1p')),
      ],
    },
  },
  'unknown-to-be-an-integer-to-be-a-safe-integer-to-be-an-int-to-be-a-safe-int-2s1p':
    {
      invalid: {
        generators: [
          fc
            .anything()
            .filter(
              (v) =>
                typeof v !== 'number' ||
                !Number.isInteger(v) ||
                v === Infinity ||
                v === -Infinity ||
                v > Number.MAX_SAFE_INTEGER ||
                v < Number.MIN_SAFE_INTEGER,
            ),
          fc.constantFrom(
            ...extractPhrases(
              'unknown-to-be-an-integer-to-be-a-safe-integer-to-be-an-int-to-be-a-safe-int-2s1p',
            ),
          ),
        ],
      },
      valid: {
        generators: [
          fc.integer({
            max: Number.MAX_SAFE_INTEGER,
            min: Number.MIN_SAFE_INTEGER,
          }),
          fc.constantFrom(
            ...extractPhrases(
              'unknown-to-be-an-integer-to-be-a-safe-integer-to-be-an-int-to-be-a-safe-int-2s1p',
            ),
          ),
        ],
      },
    },
  'unknown-to-be-an-object-2s1p': {
    invalid: {
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
        fc.constantFrom(...extractPhrases('unknown-to-be-an-object-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.oneof(
          fc.object(),
          fc.array(fc.anything()),
          fc.date(),
          fc.constant(new Map()),
          fc.constant(new Set()),
        ),
        fc.constantFrom(...extractPhrases('unknown-to-be-an-object-2s1p')),
      ],
    },
  },
  'unknown-to-be-defined-2s1p': {
    invalid: {
      generators: [
        fc.constant(undefined),
        fc.constantFrom(...extractPhrases('unknown-to-be-defined-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.anything().filter((v) => v !== undefined),
        fc.constantFrom(...extractPhrases('unknown-to-be-defined-2s1p')),
      ],
    },
  },
  'unknown-to-be-false-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => v !== false),
        fc.constantFrom(...extractPhrases('unknown-to-be-false-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.constant(false),
        fc.constantFrom(...extractPhrases('unknown-to-be-false-2s1p')),
      ],
    },
  },
  'unknown-to-be-falsy-2s1p': {
    invalid: {
      generators: [
        fc.oneof(
          fc.string().filter((s) => s.length > 0),
          fc.integer().filter((n) => n !== 0),
          fc.constant(true),
          fc.array(fc.anything(), { minLength: 1 }),
          fc.object(),
        ),
        fc.constantFrom(...extractPhrases('unknown-to-be-falsy-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.oneof(
          fc.constant(false),
          fc.constant(0),
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined),
          fc.constant(Number.NaN),
        ),
        fc.constantFrom(...extractPhrases('unknown-to-be-falsy-2s1p')),
      ],
    },
  },
  'unknown-to-be-infinite-2s1p': {
    invalid: {
      generators: [
        fc
          .anything()
          .filter(
            (v) => typeof v !== 'number' || (v !== Infinity && v !== -Infinity),
          ),
        fc.constantFrom(...extractPhrases('unknown-to-be-infinite-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.oneof(fc.constant(Infinity), fc.constant(-Infinity)),
        fc.constantFrom(...extractPhrases('unknown-to-be-infinite-2s1p')),
      ],
    },
  },
  'unknown-to-be-infinity-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => v !== Infinity),
        fc.constantFrom(...extractPhrases('unknown-to-be-infinity-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.constant(Infinity),
        fc.constantFrom(...extractPhrases('unknown-to-be-infinity-2s1p')),
      ],
    },
  },
  'unknown-to-be-nan-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => !Number.isNaN(v)),
        fc.constantFrom(...extractPhrases('unknown-to-be-nan-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.constant(Number.NaN),
        fc.constantFrom(...extractPhrases('unknown-to-be-nan-2s1p')),
      ],
    },
  },
  'unknown-to-be-negative-to-be-a-negative-number-2s1p': {
    invalid: {
      generators: [
        fc
          .anything()
          .filter(
            (v) =>
              typeof v !== 'number' ||
              v >= 0 ||
              v === Infinity ||
              v === -Infinity ||
              Number.isNaN(v),
          ),
        fc.constantFrom(
          ...extractPhrases(
            'unknown-to-be-negative-to-be-a-negative-number-2s1p',
          ),
        ),
      ],
    },
    valid: {
      generators: [
        fc.float({
          max: Math.fround(-1e-6),
          min: Math.fround(-1e30),
          noDefaultInfinity: true,
          noNaN: true,
        }),
        fc.constantFrom(
          ...extractPhrases(
            'unknown-to-be-negative-to-be-a-negative-number-2s1p',
          ),
        ),
      ],
    },
  },
  'unknown-to-be-null-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => v !== null),
        fc.constantFrom(...extractPhrases('unknown-to-be-null-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.constant(null),
        fc.constantFrom(...extractPhrases('unknown-to-be-null-2s1p')),
      ],
    },
  },
  'unknown-to-be-positive-to-be-a-positive-number-2s1p': {
    invalid: {
      generators: [
        fc
          .anything()
          .filter(
            (v) =>
              typeof v !== 'number' ||
              v <= 0 ||
              v === Infinity ||
              v === -Infinity ||
              Number.isNaN(v),
          ),
        fc.constantFrom(
          ...extractPhrases(
            'unknown-to-be-positive-to-be-a-positive-number-2s1p',
          ),
        ),
      ],
    },
    valid: {
      generators: [
        fc.float({
          max: Math.fround(1e30),
          min: Math.fround(1e-6),
          noDefaultInfinity: true,
          noNaN: true,
        }),
        fc.constantFrom(
          ...extractPhrases(
            'unknown-to-be-positive-to-be-a-positive-number-2s1p',
          ),
        ),
      ],
    },
  },
  'unknown-to-be-true-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => v !== true),
        fc.constantFrom(...extractPhrases('unknown-to-be-true-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.constant(true),
        fc.constantFrom(...extractPhrases('unknown-to-be-true-2s1p')),
      ],
    },
  },
  'unknown-to-be-truthy-to-exist-to-be-ok-2s1p': {
    invalid: {
      generators: [
        fc.oneof(
          fc.constant(false),
          fc.constant(0),
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined),
          fc.constant(Number.NaN),
        ),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-truthy-to-exist-to-be-ok-2s1p'),
        ),
      ],
    },
    valid: {
      generators: [
        fc.oneof(
          fc.string().filter((s) => s.length > 0),
          fc.integer().filter((n) => n !== 0),
          fc.constant(true),
          fc.array(fc.anything(), { minLength: 1 }),
          fc.object(),
        ),
        fc.constantFrom(
          ...extractPhrases('unknown-to-be-truthy-to-exist-to-be-ok-2s1p'),
        ),
      ],
    },
  },
  'unknown-to-be-undefined-2s1p': {
    invalid: {
      generators: [
        fc.anything().filter((v) => v !== undefined),
        fc.constantFrom(...extractPhrases('unknown-to-be-undefined-2s1p')),
      ],
    },
    valid: {
      generators: [
        fc.constant(undefined),
        fc.constantFrom(...extractPhrases('unknown-to-be-undefined-2s1p')),
      ],
    },
  },
} as const satisfies Record<string, PropertyTestConfig>;

describe('Property-Based Tests for Basic (non-parametric) Assertions', () => {
  assertExhaustiveTestConfig(assertions, testConfigs);

  runPropertyTests(testConfigs, assertions, testConfigDefaults);
});
