/**
 * Utilities for property-based tests.
 *
 * @packageDocumentation
 */

import type { z } from 'zod/v4';

import type { AnyAssertion } from '../../src/assertion/assertion-types.js';

import { isString } from '../../src/guards.js';

/**
 * Extracts phrase literals from {@link Assertion.parts AssertionParts}.
 *
 * Used with {@link fc.constantFrom} to generate phrases for testing with
 * `expect()`.
 *
 * @param assertion Assertion to extract phrases from
 * @returns One or more phrase literals
 */

export const extractPhrases = <T extends AnyAssertion>(
  assertion: T,
): [string, ...string[]] => {
  if (assertion === undefined) {
    throw new TypeError('assertion is required');
  }
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
  }, []) as [string, ...string[]];
};
