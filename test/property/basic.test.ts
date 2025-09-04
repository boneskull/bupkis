import fc from 'fast-check';
import { describe, it } from 'node:test';
import { type z } from 'zod/v4';

import { type AnyAssertion } from '../../src/assertion/assertion-types.js';
import { BasicAssertions } from '../../src/assertion/impl/sync-basic.js';
import { isString } from '../../src/guards.js';
import { expect } from '../../src/index.js';
import { keyBy } from '../../src/util.js';

const assertions = keyBy(BasicAssertions, 'id');

const extractPhrases = <T extends AnyAssertion>(assertion: T): string[] => {
  // Cast parts to the proper type since AnyAssertion uses `any` generics
  const parts = assertion.parts as readonly (
    | readonly string[]
    | string
    | z.ZodType
  )[];

  return parts.reduce((acc: string[], part) => {
    if (Array.isArray(part)) {
      // part is PhraseLiteralChoice: readonly [string, ...string[]]
      acc.push(...(part as readonly string[]));
    } else if (isString(part)) {
      // part is PhraseLiteral: string
      acc.push(part);
    }
    // Skip z.ZodType parts as they don't contribute to phrases
    return acc;
  }, []);
};

/**
 * Configuration for property-based tests that extends fast-check's Parameters.
 *
 * Omits `examples` from fc.Parameters because this test suite uses pure
 * property-based testing with generators rather than example-based testing. The
 * `examples` property is for providing specific test cases, while `generators`
 * defines how to create random inputs that should satisfy the assertion
 * properties.
 *
 * The generators tuple contains:
 *
 * - First generator: Creates random values that should pass the assertion
 * - Second generator: Creates random phrase strings from the assertion's parts
 */
type TestConfig = Omit<fc.Parameters<any>, 'examples'> & {
  generators: readonly [fc.Arbitrary<any>, fc.Arbitrary<string>];
};

/**
 * Test config defaults
 */
const testConfigDefaults: Omit<fc.Parameters<any>, 'examples'> = {
  numRuns: 200,
} as const;

/**
 * Test configurations for each basic assertion.
 *
 * Note that the second generator in each will only work for these basic
 * assertions, since parametric assertions may have phrases separated by
 * parameters.
 */
const testConfigs: Record<string, TestConfig> = {
  'array-to-be-empty-2s2p': {
    generators: [
      fc.constant([]),
      fc.constantFrom(...extractPhrases(assertions['array-to-be-empty-2s2p']!)),
    ] as const,
  },
  'recordany-unknown-to-be-empty-2s2p': {
    generators: [
      fc.constant({}),
      fc.constantFrom(
        ...extractPhrases(assertions['recordany-unknown-to-be-empty-2s2p']!),
      ),
    ] as const,
  },
  'unknown-to-be-a-bigint-to-be-a-bigint-2s1p': {
    generators: [
      fc.bigInt(),
      fc.constantFrom(
        ...extractPhrases(
          assertions['unknown-to-be-a-bigint-to-be-a-bigint-2s1p']!,
        ),
      ),
    ] as const,
  },
  'unknown-to-be-a-boolean-to-be-boolean-to-be-a-bool-2s1p': {
    generators: [
      fc.boolean(),
      fc.constantFrom(
        ...extractPhrases(
          assertions[
            'unknown-to-be-a-boolean-to-be-boolean-to-be-a-bool-2s1p'
          ]!,
        ),
      ),
    ] as const,
  },
  'unknown-to-be-a-class-to-be-a-constructor-2s1p': {
    generators: [
      fc.oneof(
        fc.constant(class TestClass {}),
        fc.constant(Array),
        fc.constant(Date),
        fc.constant(Map),
        fc.constant(Set),
      ),
      fc.constantFrom(
        ...extractPhrases(
          assertions['unknown-to-be-a-class-to-be-a-constructor-2s1p']!,
        ),
      ),
    ] as const,
  },
  'unknown-to-be-a-date-to-be-a-date-2s1p': {
    generators: [
      fc.date().filter((d) => !isNaN(d.getTime())),
      fc.constantFrom(
        ...extractPhrases(
          assertions['unknown-to-be-a-date-to-be-a-date-2s1p']!,
        ),
      ),
    ] as const,
  },
  'unknown-to-be-a-function-2s1p': {
    generators: [
      fc.oneof(
        fc.constant(() => {}),
        fc.constant(function () {}),
        fc.constant(Math.max),
        fc.constant(Array.isArray),
      ),
      fc.constantFrom(
        ...extractPhrases(assertions['unknown-to-be-a-function-2s1p']!),
      ),
    ] as const,
  },
  'unknown-to-be-a-negative-integer-to-be-a-negative-int-2s1p': {
    generators: [
      fc.integer({ max: -1, min: Number.MIN_SAFE_INTEGER }),
      fc.constantFrom(
        ...extractPhrases(
          assertions[
            'unknown-to-be-a-negative-integer-to-be-a-negative-int-2s1p'
          ]!,
        ),
      ),
    ] as const,
  },
  'unknown-to-be-a-number-to-be-finite-2s1p': {
    generators: [
      fc
        .oneof(fc.integer(), fc.float())
        .filter((v) => v !== Infinity && v !== -Infinity && !Number.isNaN(v)),
      fc.constantFrom(
        ...extractPhrases(
          assertions['unknown-to-be-a-number-to-be-finite-2s1p']!,
        ),
      ),
    ] as const,
  },
  'unknown-to-be-a-positive-integer-to-be-a-positive-int-2s1p': {
    generators: [
      fc.integer({ max: Number.MAX_SAFE_INTEGER, min: 1 }),
      fc.constantFrom(
        ...extractPhrases(
          assertions[
            'unknown-to-be-a-positive-integer-to-be-a-positive-int-2s1p'
          ]!,
        ),
      ),
    ] as const,
  },
  'unknown-to-be-a-primitive-2s1p': {
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
      fc.constantFrom(
        ...extractPhrases(assertions['unknown-to-be-a-primitive-2s1p']!),
      ),
    ] as const,
  },
  'unknown-to-be-a-record-to-be-a-plain-object-2s1p': {
    generators: [
      fc.dictionary(fc.string(), fc.anything()),
      fc.constantFrom(
        ...extractPhrases(
          assertions['unknown-to-be-a-record-to-be-a-plain-object-2s1p']!,
        ),
      ),
    ] as const,
  },
  'unknown-to-be-a-regexp-to-be-a-regex-to-be-a-regexp-2s1p': {
    generators: [
      fc.oneof(
        fc.constant(/test/),
        fc.constant(new RegExp('\\d+')),
        fc.constant(/[a-z]/i),
      ),
      fc.constantFrom(
        ...extractPhrases(
          assertions[
            'unknown-to-be-a-regexp-to-be-a-regex-to-be-a-regexp-2s1p'
          ]!,
        ),
      ),
    ] as const,
  },
  'unknown-to-be-a-set-2s1p': {
    generators: [
      fc.array(fc.anything()).map((arr) => new Set(arr)),
      fc.constantFrom(
        ...extractPhrases(assertions['unknown-to-be-a-set-2s1p']!),
      ),
    ] as const,
  },
  'unknown-to-be-a-string-2s1p': {
    generators: [
      fc.string(),
      fc.constantFrom(
        ...extractPhrases(assertions['unknown-to-be-a-string-2s1p']!),
      ),
    ] as const,
  },
  'unknown-to-be-a-symbol-to-be-a-symbol-2s1p': {
    generators: [
      fc.string().map((s) => Symbol(s)),
      fc.constantFrom(
        ...extractPhrases(
          assertions['unknown-to-be-a-symbol-to-be-a-symbol-2s1p']!,
        ),
      ),
    ] as const,
  },
  'unknown-to-be-a-weakmap-2s1p': {
    generators: [
      fc.constant(new WeakMap()),
      fc.constantFrom(
        ...extractPhrases(assertions['unknown-to-be-a-weakmap-2s1p']!),
      ),
    ] as const,
  },
  'unknown-to-be-a-weakset-2s1p': {
    generators: [
      fc.constant(new WeakSet()),
      fc.constantFrom(
        ...extractPhrases(assertions['unknown-to-be-a-weakset-2s1p']!),
      ),
    ] as const,
  },
  'unknown-to-be-an-array-to-be-array-2s1p': {
    generators: [
      fc.array(fc.anything()),
      fc.constantFrom(
        ...extractPhrases(
          assertions['unknown-to-be-an-array-to-be-array-2s1p']!,
        ),
      ),
    ] as const,
  },
  'unknown-to-be-an-async-function-2s1p': {
    generators: [
      fc.oneof(
        fc.constant(async () => {}),
        fc.constant(async function () {}),
      ),
      fc.constantFrom(
        ...extractPhrases(assertions['unknown-to-be-an-async-function-2s1p']!),
      ),
    ] as const,
  },
  'unknown-to-be-an-integer-to-be-a-safe-integer-to-be-an-int-to-be-a-safe-int-2s1p':
    {
      generators: [
        fc.integer({
          max: Number.MAX_SAFE_INTEGER,
          min: Number.MIN_SAFE_INTEGER,
        }),
        fc.constantFrom(
          ...extractPhrases(
            assertions[
              'unknown-to-be-an-integer-to-be-a-safe-integer-to-be-an-int-to-be-a-safe-int-2s1p'
            ]!,
          ),
        ),
      ] as const,
    },
  'unknown-to-be-an-object-2s1p': {
    generators: [
      fc.oneof(
        fc.object(),
        fc.array(fc.anything()),
        fc.date(),
        fc.constant(new Map()),
        fc.constant(new Set()),
      ),
      fc.constantFrom(
        ...extractPhrases(assertions['unknown-to-be-an-object-2s1p']!),
      ),
    ] as const,
  },
  'unknown-to-be-false-2s1p': {
    generators: [
      fc.constant(false),
      fc.constantFrom(
        ...extractPhrases(assertions['unknown-to-be-false-2s1p']!),
      ),
    ] as const,
  },
  'unknown-to-be-falsy-2s1p': {
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
        ...extractPhrases(assertions['unknown-to-be-falsy-2s1p']!),
      ),
    ] as const,
  },
  'unknown-to-be-infinite-2s1p': {
    generators: [
      fc.oneof(fc.constant(Infinity), fc.constant(-Infinity)),
      fc.constantFrom(
        ...extractPhrases(assertions['unknown-to-be-infinite-2s1p']!),
      ),
    ] as const,
  },
  'unknown-to-be-infinity-2s1p': {
    generators: [
      fc.constant(Infinity),
      fc.constantFrom(
        ...extractPhrases(assertions['unknown-to-be-infinity-2s1p']!),
      ),
    ] as const,
  },
  'unknown-to-be-nan-2s1p': {
    generators: [
      fc.constant(Number.NaN),
      fc.constantFrom(...extractPhrases(assertions['unknown-to-be-nan-2s1p']!)),
    ] as const,
  },
  'unknown-to-be-negative-to-be-a-negative-number-2s1p': {
    generators: [
      fc.float({
        max: Math.fround(-1e-6),
        min: Math.fround(-1e30),
        noDefaultInfinity: true,
        noNaN: true,
      }),
      fc.constantFrom(
        ...extractPhrases(
          assertions['unknown-to-be-negative-to-be-a-negative-number-2s1p']!,
        ),
      ),
    ] as const,
  },
  'unknown-to-be-null-2s1p': {
    generators: [
      fc.constant(null),
      fc.constantFrom(
        ...extractPhrases(assertions['unknown-to-be-null-2s1p']!),
      ),
    ] as const,
  },
  'unknown-to-be-positive-to-be-a-positive-number-2s1p': {
    generators: [
      fc.float({
        max: Math.fround(1e30),
        min: Math.fround(1e-6),
        noDefaultInfinity: true,
        noNaN: true,
      }),
      fc.constantFrom(
        ...extractPhrases(
          assertions['unknown-to-be-positive-to-be-a-positive-number-2s1p']!,
        ),
      ),
    ] as const,
  },
  'unknown-to-be-true-2s1p': {
    generators: [
      fc.constant(true),
      fc.constantFrom(
        ...extractPhrases(assertions['unknown-to-be-true-2s1p']!),
      ),
    ] as const,
  },
  'unknown-to-be-truthy-to-exist-2s1p': {
    generators: [
      fc.oneof(
        fc.string().filter((s) => s.length > 0),
        fc.integer().filter((n) => n !== 0),
        fc.constant(true),
        fc.array(fc.anything(), { minLength: 1 }),
        fc.object(),
      ),
      fc.constantFrom(
        ...extractPhrases(assertions['unknown-to-be-truthy-to-exist-2s1p']!),
      ),
    ] as const,
  },
  'unknown-to-be-undefined-2s1p': {
    generators: [
      fc.constant(undefined),
      fc.constantFrom(
        ...extractPhrases(assertions['unknown-to-be-undefined-2s1p']!),
      ),
    ] as const,
  },
} as const;

describe('Property-Based Tests for Bupkis Assertions', () => {
  describe('Basic (non-parametric) Assertions', () => {
    // Dynamically generate tests for each configured assertion
    Object.entries(testConfigs).forEach(([assertionId, config]) => {
      describe(assertionId, () => {
        it('should pass for all valid inputs', () => {
          const { generators, ...fcParams } = config;
          const finalParams = { ...testConfigDefaults, ...fcParams };
          fc.assert(
            fc.property(...generators, (value, part) => {
              // @ts-expect-error - Testing runtime behavior with dynamic parts
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              return expect(value, part);
            }),
            finalParams,
          );
        });
      });
    });
  });
});

// describe('Collection Assertion Properties', () => {
//   it('should satisfy array emptiness properties', () => {
//     fc.assert(
//       fc.property(fc.array(fc.anything()), (arr) => {
//         if (arr.length === 0) {
//           try {
//             expect(arr, 'to be empty');
//             expect(() => expect(arr, 'not to be empty'), 'to throw');
//             return true;
//           } catch {
//             return false;
//           }
//         } else {
//           try {
//             expect(arr, 'not to be empty');
//             expect(() => expect(arr, 'to be empty'), 'to throw');
//             return true;
//           } catch {
//             return false;
//           }
//         }
//       }),
//       { numRuns: 50 },
//     );
//   });
// });

// describe('Error Throwing Properties', () => {
//   it('should correctly identify throwing vs non-throwing functions', () => {
//     fc.assert(
//       fc.property(
//         fc.boolean(), // Whether the function should throw
//         fc.string(), // Error message if it throws
//         (shouldThrow, errorMessage) => {
//           const testFn = shouldThrow
//             ? () => {
//                 throw new Error(errorMessage);
//               }
//             : () => {
//                 return 'success';
//               };

//           if (shouldThrow) {
//             try {
//               expect(testFn, 'to throw');
//               expect(() => expect(testFn, 'not to throw'), 'to throw');
//               return true;
//             } catch {
//               return false;
//             }
//           } else {
//             try {
//               expect(testFn, 'not to throw');
//               expect(() => expect(testFn, 'to throw'), 'to throw');
//               return true;
//             } catch {
//               return false;
//             }
//           }
//         },
//       ),
//       { numRuns: 30 },
//     );
//   });
// });

// describe('Async Promise Properties', () => {
//   it('should correctly handle resolving promises', async () => {
//     await fc.assert(
//       fc.asyncProperty(
//         fc.oneof(fc.string(), fc.integer(), fc.boolean()),
//         async (value) => {
//           const resolvingPromise = Promise.resolve(value);

//           try {
//             await expectAsync(resolvingPromise, 'to resolve');
//             return true;
//           } catch {
//             return false;
//           }
//         },
//       ),
//       { numRuns: 30 },
//     );
//   });

//   it('should correctly handle rejecting promises', async () => {
//     await fc.assert(
//       fc.asyncProperty(fc.string(), async (errorMessage) => {
//         const rejectingPromise = Promise.reject(new Error(errorMessage));

//         try {
//           await expectAsync(rejectingPromise, 'to reject');
//           return true;
//         } catch {
//           return false;
//         }
//       }),
//       { numRuns: 30 },
//     );
//   });
// });
