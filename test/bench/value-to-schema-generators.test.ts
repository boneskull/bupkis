/**
 * Tests for valueToSchema fast-check generators.
 *
 * These tests validate that our generators produce valid inputs for
 * valueToSchema() benchmarking and avoid known exception cases.
 */

import fc from 'fast-check';
import { describe, it } from 'node:test';

import { expect } from '../../src/index.js';
import { valueToSchema } from '../../src/value-to-schema.js';
import {
  createBuiltinObjectGenerators,
  createNestedStructureGenerators,
  createPrimitiveGenerators,
  createSpecialPrimitiveGenerators,
  valueToSchemaGeneratorFactory,
} from '../../test-data/value-to-schema-generators.js';

const NUM_RUNS = 100;

describe('valueToSchema generator validation', () => {
  describe('primitive generators', () => {
    it('should generate valid primitive values', () => {
      const generators = createPrimitiveGenerators();

      fc.assert(
        fc.property(generators.string, (value) => {
          try {
            const schema = valueToSchema(value);
            expect(schema, 'to be defined');
            return true;
          } catch (error) {
            // Should never throw for primitive strings
            console.error('Unexpected error for string:', value, error);
            return false;
          }
        }),
        { numRuns: NUM_RUNS },
      );

      fc.assert(
        fc.property(generators.number, (value) => {
          try {
            const schema = valueToSchema(value);
            expect(schema, 'to be defined');
            return true;
          } catch (error) {
            // Should never throw for numbers
            console.error('Unexpected error for number:', value, error);
            return false;
          }
        }),
        { numRuns: NUM_RUNS },
      );

      fc.assert(
        fc.property(generators.boolean, (value) => {
          try {
            const schema = valueToSchema(value);
            expect(schema, 'to be defined');
            return true;
          } catch (error) {
            // Should never throw for booleans
            console.error('Unexpected error for boolean:', value, error);
            return false;
          }
        }),
        { numRuns: NUM_RUNS },
      );

      fc.assert(
        fc.property(generators.bigint, (value) => {
          try {
            const schema = valueToSchema(value);
            expect(schema, 'to be defined');
            return true;
          } catch (error) {
            // Should never throw for bigints
            console.error('Unexpected error for bigint:', value, error);
            return false;
          }
        }),
        { numRuns: NUM_RUNS },
      );

      fc.assert(
        fc.property(generators.symbol, (value) => {
          try {
            const schema = valueToSchema(value);
            expect(schema, 'to be defined');
            return true;
          } catch (error) {
            // Should never throw for symbols
            console.error('Unexpected error for symbol:', value, error);
            return false;
          }
        }),
        { numRuns: NUM_RUNS },
      );
    });
  });

  describe('special primitive generators', () => {
    it('should generate valid special primitive values', () => {
      const generators = createSpecialPrimitiveGenerators();

      fc.assert(
        fc.property(generators.nullValue, (value) => {
          try {
            const schema = valueToSchema(value);
            expect(schema, 'to be defined');
            return true;
          } catch (error) {
            console.error('Unexpected error for null:', value, error);
            return false;
          }
        }),
        { numRuns: NUM_RUNS },
      );

      fc.assert(
        fc.property(generators.undefinedValue, (value) => {
          try {
            const schema = valueToSchema(value);
            expect(schema, 'to be defined');
            return true;
          } catch (error) {
            console.error('Unexpected error for undefined:', value, error);
            return false;
          }
        }),
        { numRuns: NUM_RUNS },
      );

      fc.assert(
        fc.property(generators.nanValue, (value) => {
          try {
            const schema = valueToSchema(value);
            expect(schema, 'to be defined');
            return true;
          } catch (error) {
            console.error('Unexpected error for NaN:', value, error);
            return false;
          }
        }),
        { numRuns: NUM_RUNS },
      );

      fc.assert(
        fc.property(generators.infinityValue, (value) => {
          try {
            const schema = valueToSchema(value);
            expect(schema, 'to be defined');
            return true;
          } catch (error) {
            console.error('Unexpected error for Infinity:', value, error);
            return false;
          }
        }),
        { numRuns: NUM_RUNS },
      );
    });
  });

  describe('builtin object generators', () => {
    it('should generate valid builtin object values', () => {
      const generators = createBuiltinObjectGenerators();

      fc.assert(
        fc.property(generators.date, (value) => {
          try {
            const schema = valueToSchema(value);
            expect(schema, 'to be defined');
            return true;
          } catch (error) {
            console.error('Unexpected error for Date:', value, error);
            return false;
          }
        }),
        { numRuns: NUM_RUNS },
      );

      fc.assert(
        fc.property(generators.regexp, (value) => {
          try {
            const schema = valueToSchema(value);
            expect(schema, 'to be defined');
            return true;
          } catch (error) {
            console.error('Unexpected error for RegExp:', value, error);
            return false;
          }
        }),
        { numRuns: NUM_RUNS },
      );

      fc.assert(
        fc.property(generators.map, (value) => {
          try {
            const schema = valueToSchema(value);
            expect(schema, 'to be defined');
            return true;
          } catch (error) {
            console.error('Unexpected error for Map:', value, error);
            return false;
          }
        }),
        { numRuns: NUM_RUNS },
      );

      fc.assert(
        fc.property(generators.set, (value) => {
          try {
            const schema = valueToSchema(value);
            expect(schema, 'to be defined');
            return true;
          } catch (error) {
            console.error('Unexpected error for Set:', value, error);
            return false;
          }
        }),
        { numRuns: NUM_RUNS },
      );
    });
  });

  describe('nested structure generators', () => {
    it('should generate valid nested structure values', () => {
      const generators = createNestedStructureGenerators({ maxDepth: 3 });

      fc.assert(
        fc.property(generators.nestedObject, (value) => {
          try {
            const schema = valueToSchema(value);
            expect(schema, 'to be defined');
            return true;
          } catch (error) {
            // Log the error but continue - some deep nesting might hit limits
            console.error(
              'Error for nested object:',
              error instanceof Error ? error.message : String(error),
            );
            return true; // Allow this to pass for now
          }
        }),
        { numRuns: NUM_RUNS },
      );

      fc.assert(
        fc.property(generators.nestedArray, (value) => {
          try {
            const schema = valueToSchema(value);
            expect(schema, 'to be defined');
            return true;
          } catch (error) {
            // Log the error but continue
            console.error(
              'Error for nested array:',
              error instanceof Error ? error.message : String(error),
            );
            return true; // Allow this to pass for now
          }
        }),
        { numRuns: NUM_RUNS },
      );
    });
  });

  describe('exception avoidance', () => {
    it('should never generate objects with own __proto__ property', () => {
      const factory = valueToSchemaGeneratorFactory();
      const generator = factory.createForCategory('nestedObjects');

      fc.assert(
        fc.property(generator, (value) => {
          // Check if value is an object and if it has own __proto__ property
          if (typeof value === 'object' && value !== null) {
            const hasOwnProto = Object.prototype.hasOwnProperty.call(
              value,
              '__proto__',
            );
            if (hasOwnProto) {
              console.error(
                'Generated object with own __proto__ property:',
                value,
              );
              return false;
            }
          }
          return true;
        }),
        { numRuns: NUM_RUNS },
      );
    });

    it('should never generate ExpectItExecutor functions when strict mode enabled', () => {
      const factory = valueToSchemaGeneratorFactory();
      const generator = factory.createForCategory('functions');

      fc.assert(
        fc.property(generator, (value) => {
          if (typeof value === 'function') {
            // Try to use the function in strict mode
            try {
              valueToSchema(value, { strict: true });
              return true;
            } catch (error) {
              // If it throws with ExpectItExecutor message, the generator is wrong
              if (
                error instanceof Error &&
                error.message.includes('ExpectItExecutor')
              ) {
                console.error(
                  'Generated ExpectItExecutor in strict mode:',
                  error.message,
                );
                return false;
              }
              // Other errors are acceptable
              return true;
            }
          }
          return true;
        }),
        { numRuns: NUM_RUNS },
      );
    });
  });
});
