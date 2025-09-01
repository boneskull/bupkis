/* eslint-disable @typescript-eslint/no-unsafe-return */
import fc from 'fast-check';
import { describe, it } from 'node:test';

import { BasicAssertions } from '../../src/assertion/impl/sync-basic.js';
import { AssertionError } from '../../src/error.js';
import { isZodType } from '../../src/guards.js';
import { expect } from '../../src/index.js';

/**
 * Maps Zod type kinds to fast-check Arbitrary generators.
 */
const _ZodToFastCheckMapping = {
  any: () => fc.anything(),
  boolean: () => fc.boolean(),
  null: () => fc.constant(null),
  number: () => fc.float(),
  string: () => fc.string(),
  undefined: () => fc.constant(undefined),
  unknown: () => fc.anything(),
} as const;

/**
 * Constructs a phrase string from assertion parts.
 */
function constructPhrase(parts: readonly unknown[]): string {
  return parts
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }
      if (Array.isArray(part)) {
        return part[0] || '';
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * Extracts the expected Zod schema from an assertion implementation.
 */
function extractExpectedSchema(assertion: unknown): unknown {
  if (!assertion || typeof assertion !== 'object' || !('impl' in assertion)) {
    return null;
  }

  const impl = (assertion as { impl: unknown }).impl;

  // For schema-based assertions, the impl IS the schema
  if (isZodType(impl)) {
    return impl;
  }

  // Skip function-based assertions for now
  return null;
}

describe('Simple Property-Based Tests for Type Assertions', () => {
  // Test only basic type assertions that are schema-based
  const basicTypeAssertions = BasicAssertions.filter((assertion) => {
    const phrase = constructPhrase(assertion.parts);
    const basicPhrases = [
      'to be a string',
      'to be a number',
      'to be a boolean',
      'to be null',
      'to be undefined',
    ];
    return basicPhrases.includes(phrase);
  });

  it('should successfully access parts property at runtime', () => {
    // This test validates that our modification worked
    for (const assertion of basicTypeAssertions) {
      if (!assertion.parts || !Array.isArray(assertion.parts)) {
        throw new Error(`Assertion does not have accessible parts`);
      }
    }
  });

  it('should extract schemas from schema-based assertions', () => {
    for (const assertion of basicTypeAssertions) {
      const schema = extractExpectedSchema(assertion);
      if (!schema) {
        const phrase = constructPhrase(assertion.parts);
        throw new Error(`Could not extract schema for ${phrase}`);
      }
    }
  });

  it('should generate valid test data for basic types', () => {
    const testCases = [
      ['hello world', 'to be a string'],
      [42, 'to be a number'],
      [true, 'to be a boolean'],
      [null, 'to be null'],
      [undefined, 'to be undefined'],
    ] as const;

    for (const [value, phrase] of testCases) {
      try {
        expect(value, phrase);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Expected ${phrase} to pass for ${value}, but got: ${message}`,
        );
      }
    }
  });

  it('should fail for mismatched types', () => {
    const mismatchCases = [
      [42, 'to be a string'],
      ['hello', 'to be a number'],
      ['true', 'to be a boolean'],
      [0, 'to be null'],
      [null, 'to be undefined'],
    ] as const;

    for (const [value, phrase] of mismatchCases) {
      try {
        expect(value, phrase);
        throw new Error(
          `Expected ${phrase} to fail for ${value}, but it passed`,
        );
      } catch (error) {
        if (!(error instanceof AssertionError)) {
          const message =
            error instanceof Error ? error.message : String(error);
          throw new Error(
            `Expected AssertionError for ${phrase} with ${value}, but got: ${message}`,
          );
        }
      }
    }
  });

  // Property-based test for string type
  it('should validate string assertions with property-based testing', () => {
    const stringAssertion = basicTypeAssertions.find(
      (a) => constructPhrase(a.parts) === 'to be a string',
    );

    if (!stringAssertion) {
      throw new Error('Could not find string assertion');
    }

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

  // Property-based test for number type
  it('should validate number assertions with property-based testing', () => {
    fc.assert(
      fc.property(fc.float(), (value) => {
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

  // Property-based test for boolean type
  it('should validate boolean assertions with property-based testing', () => {
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
});
