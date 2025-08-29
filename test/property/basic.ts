import fc from 'fast-check';
import { describe, it } from 'node:test';

import { type BasicAssertions } from '../../src/assertion/sync-basic.js';
import { AssertionError } from '../../src/error.js';
import { expect, expectAsync } from '../../src/index.js';
import { type InferredExpectSlots } from '../../src/types.js';

describe('Property-Based Tests for Bupkis Assertions', () => {
  describe('Core Assertion Properties', () => {
    it('should satisfy negation property for type assertions', () => {
      interface AssertionConfig {
        args: InferredExpectSlots<(typeof BasicAssertions)[number]['parts']>;
      }

      fc.assert(
        fc.property(
          fc.oneof(
            fc.string().map<AssertionConfig>((value) => ({
              args: [value, 'to be a string'],
            })),
            fc.integer().map<AssertionConfig>((value) => ({
              args: [value, 'to be a number'],
            })),
            fc.boolean().map<AssertionConfig>((value) => ({
              args: [value, 'to be a boolean'],
            })),
            fc.constant(null).map<AssertionConfig>((value) => ({
              args: [value, 'to be null'],
            })),
            fc.constant(undefined).map<AssertionConfig>((value) => ({
              args: [value, 'to be undefined'],
            })),
            fc.array(fc.anything()).map<AssertionConfig>((value) => ({
              args: [value, 'to be an array'],
            })),
          ),
          ({ args }) => {
            // Test correct type assertion
            let correctPassed = false;
            try {
              expect(...args);
              correctPassed = true;
            } catch {}

            // Test negated type assertion
            let negatedPassed = false;
            const negatedArgs = args.map((arg, idx) =>
              idx === 0
                ? arg
                : `${arg}`.startsWith('not ')
                  ? arg
                  : `not ${arg}`,
            ) as unknown as AssertionConfig['args'];
            try {
              expect(...negatedArgs);
            } catch {
              negatedPassed = true;
            }

            return correctPassed && negatedPassed;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should throw AssertionError on failure', () => {
      fc.assert(
        fc.property(fc.string(), (value) => {
          try {
            expect(value, 'to be a number'); // This should fail
            return false; // Should not reach here
          } catch (error) {
            return error instanceof AssertionError;
          }
        }),
        { numRuns: 50 },
      );
    });
  });

  describe('Type Assertion Consistency', () => {
    it('should correctly identify string types', () => {
      fc.assert(
        fc.property(fc.string(), (value) => {
          try {
            expect(value, 'to be a string');
            return true;
          } catch {
            return false;
          }
        }),
        { numRuns: 100 },
      );
    });

    it('should correctly identify number types', () => {
      fc.assert(
        fc.property(fc.integer(), (value) => {
          try {
            expect(value, 'to be a number');
            return true;
          } catch {
            return false;
          }
        }),
        { numRuns: 100 },
      );
    });

    it('should correctly identify boolean types', () => {
      fc.assert(
        fc.property(fc.boolean(), (value) => {
          try {
            expect(value, 'to be a boolean');
            return true;
          } catch {
            return false;
          }
        }),
        { numRuns: 100 },
      );
    });

    it('should correctly identify array types', () => {
      fc.assert(
        fc.property(fc.array(fc.anything()), (value) => {
          try {
            expect(value, 'to be an array');
            return true;
          } catch {
            return false;
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Comparison Assertion Properties', () => {
    it('should satisfy transitivity: if a > b and b > c, then a > c', () => {
      fc.assert(
        fc.property(
          fc.integer({ max: 100, min: -100 }),
          fc.integer({ max: 100, min: -100 }),
          fc.integer({ max: 100, min: -100 }),
          (a, b, c) => {
            // Sort to ensure x >= y >= z
            const sorted = [a, b, c].sort((p, q) => q - p) as [
              number,
              number,
              number,
            ];
            const x = sorted[0];
            const y = sorted[1];
            const z = sorted[2];

            if (x === y || y === z) {
              return true; // Skip equal values for this test
            }

            try {
              // If x > y and y > z, then x > z should also hold
              expect(x, 'to be greater than', y);
              expect(y, 'to be greater than', z);
              expect(x, 'to be greater than', z);
              return true;
            } catch {
              return false;
            }
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should satisfy reflexivity for equality: a equals a', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constantFrom(null, undefined),
          ),
          (value) => {
            try {
              expect(value, 'to equal', value);
              return true;
            } catch {
              return false;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('String Assertion Properties', () => {
    it('should satisfy substring containment properties', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (container, substring) => {
            const combinedString = container + substring;

            try {
              // Combined string should contain both parts
              expect(combinedString, 'to include', container);
              expect(combinedString, 'to include', substring);
              return true;
            } catch {
              return false;
            }
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should satisfy regex matching properties', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter((s) => /^[a-z]+$/.test(s)), // Only lowercase letters
          (str) => {
            try {
              // String of lowercase letters should match lowercase regex
              expect(str, 'to match', /^[a-z]+$/);

              // Should not match uppercase-only regex
              expect(() => expect(str, 'to match', /^[A-Z]+$/), 'to throw');

              return true;
            } catch {
              return false;
            }
          },
        ),
        { numRuns: 30 },
      );
    });
  });

  describe('Collection Assertion Properties', () => {
    it('should satisfy array emptiness properties', () => {
      fc.assert(
        fc.property(fc.array(fc.anything()), (arr) => {
          if (arr.length === 0) {
            try {
              expect(arr, 'to be empty');
              expect(() => expect(arr, 'not to be empty'), 'to throw');
              return true;
            } catch {
              return false;
            }
          } else {
            try {
              expect(arr, 'not to be empty');
              expect(() => expect(arr, 'to be empty'), 'to throw');
              return true;
            } catch {
              return false;
            }
          }
        }),
        { numRuns: 50 },
      );
    });
  });

  describe('Error Throwing Properties', () => {
    it('should correctly identify throwing vs non-throwing functions', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // Whether the function should throw
          fc.string(), // Error message if it throws
          (shouldThrow, errorMessage) => {
            const testFn = shouldThrow
              ? () => {
                  throw new Error(errorMessage);
                }
              : () => {
                  return 'success';
                };

            if (shouldThrow) {
              try {
                expect(testFn, 'to throw');
                expect(() => expect(testFn, 'not to throw'), 'to throw');
                return true;
              } catch {
                return false;
              }
            } else {
              try {
                expect(testFn, 'not to throw');
                expect(() => expect(testFn, 'to throw'), 'to throw');
                return true;
              } catch {
                return false;
              }
            }
          },
        ),
        { numRuns: 30 },
      );
    });
  });

  describe('Async Promise Properties', () => {
    it('should correctly handle resolving promises', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(fc.string(), fc.integer(), fc.boolean()),
          async (value) => {
            const resolvingPromise = Promise.resolve(value);

            try {
              await expectAsync(resolvingPromise, 'to resolve');
              return true;
            } catch {
              return false;
            }
          },
        ),
        { numRuns: 30 },
      );
    });

    it('should correctly handle rejecting promises', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (errorMessage) => {
          const rejectingPromise = Promise.reject(new Error(errorMessage));

          try {
            await expectAsync(rejectingPromise, 'to reject');
            return true;
          } catch {
            return false;
          }
        }),
        { numRuns: 30 },
      );
    });
  });

  describe('Boolean Value Properties', () => {
    it('should correctly identify true/false values', () => {
      fc.assert(
        fc.property(fc.boolean(), (value) => {
          if (value) {
            try {
              expect(value, 'to be true');
              expect(() => expect(value, 'to be false'), 'to throw');
              return true;
            } catch {
              return false;
            }
          } else {
            try {
              expect(value, 'to be false');
              expect(() => expect(value, 'to be true'), 'to throw');
              return true;
            } catch {
              return false;
            }
          }
        }),
        { numRuns: 50 },
      );
    });
  });

  describe('Null and Undefined Properties', () => {
    it('should correctly identify null values', () => {
      fc.assert(
        fc.property(fc.constantFrom(null), (value) => {
          try {
            expect(value, 'to be null');
            expect(() => expect(value, 'not to be null'), 'to throw');
            return true;
          } catch {
            return false;
          }
        }),
        { numRuns: 20 },
      );
    });

    it('should correctly identify undefined values', () => {
      fc.assert(
        fc.property(fc.constantFrom(undefined), (value) => {
          try {
            expect(value, 'to be undefined');
            expect(() => expect(value, 'not to be undefined'), 'to throw');
            return true;
          } catch {
            return false;
          }
        }),
        { numRuns: 20 },
      );
    });
  });
});
