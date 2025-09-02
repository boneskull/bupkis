/* eslint-disable @typescript-eslint/no-unsafe-argument */

import fc from 'fast-check';
import { describe, it } from 'node:test';
import { type Entries } from 'type-fest';
import { type z } from 'zod/v4';

import { BasicAssertions } from '../../src/assertion/impl/sync-basic.js';
import { AssertionError } from '../../src/error.js';
import { isZodType } from '../../src/guards.js';
import { expect } from '../../src/index.js';
import { BupkisRegistry } from '../../src/metadata.js';

type TypeAssertion = (typeof BasicAssertions)[number];

/**
 * Maps Zod type kinds to fast-check Arbitrary generators. This static mapping
 * allows us to generate appropriate test data for any ZodType.
 */
const ZodToFastCheckMapping = {
  any: () => fc.anything().filter((v) => !!v),
  array: <T extends z.ZodArray<U>, U extends z.ZodType>(schema: T) => {
    const elementArb =
      zodTypeToArbitrary(schema.unwrap() as z.ZodType) ?? fc.anything();

    let constraints: fc.ArrayConstraints = {};
    if (schema.def.checks?.length) {
      constraints = schema.def.checks.reduce(
        (constraints, { _zod: { def } }) => {
          if (def.check === 'max_length') {
            return {
              ...constraints,
              maxLength: (def as z.core.$ZodCheckMaxLengthDef).maximum,
            };
          }
          if (def.check === 'min_length') {
            return {
              ...constraints,
              minLength: (def as z.core.$ZodCheckMinLengthDef).minimum,
            };
          }
          return constraints;
        },
        {},
      );
    }
    return fc.array(elementArb, constraints);
  },
  bigint: () => fc.bigInt(),
  boolean: () => fc.boolean(),
  date: () => fc.date(),
  enum: (schema: z.ZodEnum) => fc.constantFrom(...(schema.options || [])),
  function: () => fc.func(fc.anything()),
  // instanceof: (schema: z.ZodCustom) => {
  //   // Generate instances based on common constructors
  //   const constructor = schema.checks?.[0]?.className;
  //   if (constructor === 'RegExp') {
  //     return fc
  //       .string()
  //       .map((s) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  //   }
  //   if (constructor === 'Date') {
  //     return fc.date();
  //   }
  //   if (constructor === 'Error') {
  //     return fc.string().map((s) => new Error(s));
  //   }
  //   // For unknown constructors, try to create instances
  //   return fc.anything().map(() => {
  //     try {
  //       return new constructor();
  //     } catch {
  //       return {};
  //     }
  //   });
  // },
  intersection: (schema: any) => {
    // For intersections, we'll try to generate from the left side
    // This is a simplification - true intersection would be more complex
    return zodTypeToArbitrary(schema.left);
  },
  literal: (schema: z.ZodLiteral) => fc.constantFrom(...schema.values),
  nan: () => fc.constant(NaN),
  never: () => fc.constantFrom(), // Empty constantFrom creates impossible values
  nonoptional: <T extends z.ZodNonOptional<Inner>, Inner extends z.ZodType>(
    schema: T,
  ) => {
    const innerArb = zodTypeToArbitrary(schema.unwrap());
    return innerArb ? innerArb : fc.anything();
  },
  null: () => fc.constant(null),
  nullable: (schema: any) => {
    const innerArb = zodTypeToArbitrary(schema.innerType);
    return innerArb
      ? fc.option(innerArb, { nil: null })
      : fc.option(fc.anything(), { nil: null });
  },
  number: (
    schema: z.ZodNumber,
    _assertion: TypeAssertion = BasicAssertions[0],
  ) => {
    const isInteger = !!(
      schema.def.checks as undefined | z.core.$ZodCheckNumberFormatInternals[]
    )?.some((check) => check.def?.format === 'safeint');

    const roundFn = isInteger ? Math.round : Math.fround;
    const arbFn = isInteger ? fc.integer.bind(fc) : fc.float.bind(fc);

    let constraints: fc.FloatConstraints | fc.IntegerConstraints = {
      max: roundFn(Number.MAX_SAFE_INTEGER),
      min: roundFn(Number.MIN_SAFE_INTEGER),
      noNaN: true,
    };

    const checks = (
      schema.def.checks as
        | undefined
        | z.core.$ZodCheckGreaterThan[]
        | z.core.$ZodCheckLessThan[]
    )?.filter(
      (check) =>
        check._zod.def?.check === 'greater_than' ||
        check._zod.def?.check === 'less_than',
    );

    if (checks?.length) {
      if (isInteger) {
        constraints = {
          ...constraints,
          ...Object.fromEntries(
            checks.map<[keyof fc.IntegerConstraints, z.core.util.Numeric]>(
              (check) => {
                const def = check._zod.def;
                if (def?.check === 'less_than') {
                  if (def.inclusive) {
                    return ['max', roundFn(Number(def.value))];
                  }
                  return ['max', roundFn(Number(def.value) - 1)];
                } else {
                  if (def.inclusive) {
                    return ['min', roundFn(Number(def.value))];
                  }
                  return ['min', roundFn(Number(def.value) + 1)];
                }
              },
            ),
          ),
        };
        console.dir(constraints);
      } else {
        constraints = {
          ...constraints,
          ...Object.fromEntries(
            checks.flatMap<Entries<fc.FloatConstraints>>((check) => {
              const def = check._zod.def;
              if (def?.check === 'less_than') {
                return [
                  ['max', roundFn(Number(def.value))],
                  ['maxExcluded', !def.inclusive],
                ];
              } else {
                return [
                  ['min', roundFn(Number(def.value))],
                  ['minExcluded', !def.inclusive],
                ];
              }
            }),
          ),
        };
        console.dir(constraints);
      }
    }

    return arbFn(constraints).filter(
      (value) =>
        // eslint-disable-next-line no-compare-neg-zero
        value !== -0,
    );
  },
  object: () => fc.object(),
  optional: <T extends z.ZodOptional<Inner>, Inner extends z.ZodType>(
    schema: T,
  ) => {
    const innerArb = zodTypeToArbitrary(schema.unwrap());
    return innerArb ? fc.option(innerArb) : fc.option(fc.anything());
  },
  // promise: (schema: z.ZodPromise) => {
  //   const innerArb = zodTypeToArbitrary(schema.def.type);
  //   return innerArb
  //     ? fc
  //         .constant(Promise.resolve())
  //         .chain(() => innerArb.map((v) => Promise.resolve(v)))
  //     : fc.constant(Promise.resolve());
  // },
  record: (
    schema: z.ZodRecord,
    _assertion: TypeAssertion = BasicAssertions[0],
  ) => {
    let constraints: fc.DictionaryConstraints = {};
    if ((schema as any).def?.valueType?.def?.type === 'never') {
      constraints = { ...constraints, maxKeys: 0 };
    }
    return fc.dictionary(fc.string(), fc.anything(), constraints);
  },
  string: () => fc.string(),
  symbol: () => fc.string().map(Symbol),
  tuple: <T extends z.ZodTuple<U>, U extends z.core.util.TupleItems>(
    schema: T,
  ) => {
    const items = (schema as any).def?.items || [];
    const itemArbs = (items as z.ZodType[])
      .map((value: z.ZodType) => zodTypeToArbitrary(value))
      .filter((value: fc.Arbitrary<any> | undefined) => !!value);
    return itemArbs.length > 0 ? fc.tuple(...itemArbs) : fc.tuple();
  },
  undefined: () => fc.constant(undefined),
  union: (schema: z.ZodUnion) => {
    const options = (schema.options || [])
      .map((opt) => zodTypeToArbitrary(opt as any))
      .filter((value) => !!value);
    return options.length > 0 ? fc.oneof(...options) : fc.anything();
  },
  unknown: () => fc.anything().filter((v) => !!v),
  void: () => fc.constant(undefined),
} as const;

/**
 * Special generators for common test scenarios
 */
const SpecialGenerators = {
  nonBoolean: () =>
    fc.oneof(
      fc.string(),
      fc.integer(),
      fc.constant(null),
      fc.constant(undefined),
      fc.array(fc.anything()),
      fc.object(),
    ),
  nonNumber: () =>
    fc.oneof(
      fc.string(),
      fc.boolean(),
      fc.constant(null),
      fc.constant(undefined),
      fc.array(fc.anything()),
      fc.object(),
    ),
  nonPrimitives: () =>
    fc.oneof(
      fc.array(fc.anything()),
      fc.object(),
      fc.func(fc.anything()),
      fc.date(),
    ),
  // Generators for values that should NOT match certain types
  nonString: () =>
    fc.oneof(
      fc.integer(),
      fc.boolean(),
      fc.constant(null),
      fc.constant(undefined),
      fc.array(fc.anything()),
      fc.object(),
    ),
  // Generators for edge cases
  primitive: () =>
    fc.oneof(
      fc.string(),
      fc.integer(),
      fc.boolean(),
      fc.bigInt(),
      fc.constant(null),
      fc.constant(undefined),
      fc.string().map(Symbol),
    ),
} as const;

/**
 * Extracts the expected ZodType from an assertion implementation.
 */
function extractExpectedSchema(
  assertion: TypeAssertion,
): undefined | z.ZodType {
  const impl = assertion.impl;

  // Direct schema implementation
  if (isZodType(impl)) {
    return impl;
  }
}

/**
 * Analyzes assertion coverage and generates comprehensive property-based tests
 */
function generateComprehensiveTests() {
  describe('Comprehensive Dynamic Property-Based Tests', () => {
    // Test that all type assertions work with their corresponding types
    // it('should validate type consistency across all assertions', () => {
    //   const typeMap = new Map<string, fc.Arbitrary<any>>();

    //   // Build a map of types to generators
    //   typeMap.set('string', fc.string());
    //   typeMap.set('number', fc.float());
    //   typeMap.set('boolean', fc.boolean());
    //   typeMap.set('bigint', fc.bigInt());
    //   typeMap.set('symbol', fc.string().map(Symbol));
    //   typeMap.set('null', fc.constant(null));
    //   typeMap.set('undefined', fc.constant(undefined));
    //   typeMap.set('array', fc.array(fc.anything()));
    //   typeMap.set('date', fc.date());
    //   typeMap.set('function', fc.func(fc.anything()));
    //   typeMap.set('object', fc.object());

    //   fc.assert(
    //     fc.property(
    //       fc.constantFrom(...Object.keys(ZodToFastCheckMapping)),
    //       (typeName) => {
    //         const generator = typeMap.get(typeName)!;
    //         return fc.sample(generator, 10).every((value) => {
    //           try {
    //             if (typeName === 'null' || typeName === 'undefined') {
    //               expect(value, `to be ${typeName}`);
    //             } else if (typeName.startsWith('a')) {
    //               expect(value, `to be an ${typeName}` as any);
    //             } else {
    //               expect(value, `to be a ${typeName}` as any);
    //             }
    //             return true;
    //           } catch (error) {
    //             if (error instanceof AssertionError) {
    //               // Some edge cases might legitimately fail
    //               return (
    //                 typeName === 'number' &&
    //                 (Number.isNaN(value) || !Number.isFinite(value))
    //               );
    //             }
    //             throw error;
    //           }
    //         });
    //       },
    //     ),
    //     { numRuns: 20 },
    //   );
    // });

    // Test assertion parsing and execution
    it.skip('should properly parse and execute all non-parameterized assertions', () => {
      fc.assert(
        fc.property(fc.anything(), (value) => {
          let totalCount = 0;

          for (const assertion of BasicAssertions) {
            try {
              const parts = assertion.parts;
              const phrase = parts.find(
                (part) => typeof part === 'string' || Array.isArray(part),
              );
              if (!phrase) {
                throw new ReferenceError(
                  `No phrase found for assertion: ${assertion}`,
                );
              }
              // console.error('Testing phrase:', phraseStr);
              const result = assertion.parseValues([value, phrase]);
              if (!result.success) {
                return true; // Parsing failed, skip
              }

              totalCount++;

              try {
                // @ts-expect-error FIXME
                expect(value, phrase);
              } catch (error) {
                if (!(error instanceof AssertionError)) {
                  throw error; // Re-throw non-assertion errors
                }
                // AssertionError is expected for wrong types
              }
            } catch (error) {
              console.error(`Error testing assertion ${assertion}:`, error);
            }
          }

          // At least some assertions should be parseable
          return totalCount > 0;
        }),
        { numRuns: 200 },
      );
    });
  });
}

/**
 * Generates property-based tests for a specific assertion. Creates tests for
 * both positive and negative cases.
 */
function generateTestsForAssertion(assertion: TypeAssertion) {
  const expectedSchema = extractExpectedSchema(assertion);

  describe(`Dynamic tests for: ${assertion}`, () => {
    if (!expectedSchema) {
      console.error(`Skipping ${assertion} - cannot extract schema`);
      return;
    }

    const positiveArbitrary = zodTypeToArbitrary(expectedSchema);
    if (!positiveArbitrary) {
      it.skip(`should pass for valid values`);
      console.error(`Skipping ${assertion} - cannot create generator`);
      return;
    }

    it(`should pass for valid values`, () => {
      fc.assert(
        // TODO exercise all phrases
        fc.property(positiveArbitrary, (value) => {
          // try {
          // Get the phrase from the assertion parts
          const parts = assertion.parts;
          const phrase = parts.find(
            (part) => typeof part === 'string' || Array.isArray(part),
          );
          if (!phrase) {
            throw new ReferenceError(
              `No phrase found for assertion: ${assertion}`,
            );
          }

          const phraseStr = Array.isArray(phrase) ? phrase[0] : phrase;
          // console.error('Testing phrase:', phraseStr);
          const { success: parsedOk } = assertion.parseValues([
            value,
            phraseStr,
          ]);
          if (!parsedOk) {
            console.error(
              `Parsing failed for phrase: ${phraseStr} with value:`,
              value,
            );
            return true; // Parsing failed, skip
          }

          // Test positive case
          let positiveResult = false;
          try {
            // console.error('Testing phrase for positive result:', phraseStr);
            expect(value, phraseStr);
            positiveResult = true;
          } catch (error) {
            if (error instanceof AssertionError) {
              positiveResult = false;
            } else {
              throw error;
            }
          }

          if (!positiveResult) {
            throw new Error(
              `Expected positive assertion to pass for ${value} in assertion ${assertion}`,
            );
          }
          return positiveResult;
        }),
        { numRuns: 200 },
      );
    });

    // it.skip(`should support negation property`, () => {
    //   fc.assert(
    //     fc.property(fc.oneof(positiveArbitrary, fc.anything()), (value) => {
    //       try {
    //         const parts = assertion.parts;
    //         const phrase = parts.find(
    //           (part) => typeof part === 'string' || Array.isArray(part),
    //         );
    //         if (!phrase) return true;

    //         const phraseStr = Array.isArray(phrase) ? phrase[0] : phrase;
    //         // console.error('Testing phrase:', phraseStr);
    //         const { success: parsedOk } = assertion.parseValues([
    //           value,
    //           phraseStr,
    //         ]);
    //         if (!parsedOk) {
    //           return true; // Parsing failed, skip
    //         }

    //         // Test positive case
    //         let positiveResult = false;
    //         try {
    //           console.error('Testing phrase:', phraseStr);
    //           expect(value, phraseStr);
    //           positiveResult = true;
    //         } catch (error) {
    //           if (error instanceof AssertionError) {
    //             positiveResult = false;
    //           } else {
    //             throw error;
    //           }
    //         }

    //         // Test negative case
    //         let negativeResult = false;
    //         try {
    //           console.error('Testing phrase:', `not ${phraseStr}`);
    //           expect(value, `not ${phraseStr}` as any);
    //           negativeResult = false; // Should have thrown
    //         } catch (error) {
    //           if (error instanceof AssertionError) {
    //             negativeResult = true; // Correctly failed
    //           } else {
    //             throw error;
    //           }
    //         }

    //         // Exactly one should succeed (positive XOR negative)
    //         return positiveResult !== negativeResult;
    //       } catch (error) {
    //         console.error(`Error in negation test for ${assertion}:`, error);
    //         return false;
    //       }
    //     }),
    //     { numRuns: 100 },
    //   );
    // });
  });
}

/**
 * Converts a ZodType to a fast-check Arbitrary generator. This is the core
 * function that enables dynamic test generation.
 */
function zodTypeToArbitrary<T extends z.core.$ZodTypeInternals | z.ZodType>(
  schema: T,
): fc.Arbitrary<any> | undefined {
  if (!schema || !schema.def) {
    return;
  }

  const meta = BupkisRegistry.get(schema as any);
  const validInput = meta?.validInput;
  if (validInput) {
    if (validInput in SpecialGenerators) {
      return SpecialGenerators[validInput as keyof typeof SpecialGenerators]();
    } else if (validInput in fc) {
      return (fc[validInput as keyof typeof fc] as () => fc.Arbitrary<any>)();
    } else {
      throw new TypeError(`No generator found for validInput: ${validInput}`);
    }
  }

  const type = schema.def.type;
  const generator =
    ZodToFastCheckMapping[type as keyof typeof ZodToFastCheckMapping];

  if (!generator) {
    console.warn(`No fast-check generator found for ZodType: ${type}`);
    return;
    // return fc.anything();
  }

  try {
    // @ts-expect-error FIXME
    return (generator as (schema: z.ZodType) => fc.Arbitrary<any>)(schema);
  } catch (error) {
    console.warn(`Error creating generator for ${type}:`, error);
    // return fc.anything();
  }
}

// Main test generation
describe('Dynamically Generated Property-Based Tests', () => {
  // Generate individual tests for each assertion
  BasicAssertions.forEach((assertion, index) => {
    try {
      generateTestsForAssertion(assertion);
    } catch (error) {
      console.warn(`Failed to generate tests for assertion ${index}:`, error);
    }
  });

  // Generate comprehensive cross-cutting tests
  generateComprehensiveTests();
});
