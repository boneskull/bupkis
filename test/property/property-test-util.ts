/**
 * Utilities for property-based tests.
 *
 * @packageDocumentation
 */

import { z } from 'zod/v4';

import type {
  AnyAssertion,
  AssertionParts,
} from '../../src/assertion/assertion-types.js';

/**
 * Extracts phrase literals from {@link Assertion.parts AssertionParts}.
 *
 * Used with {@link fc.constantFrom} to generate phrases for testing with
 * `expect()`.
 *
 * @param assertion Assertion to extract phrases from
 * @param indices One or more indices of parts to extract. Indices are based on
 *   the {@link bupkis!types.PhraseLiteral | PhraseLiterals}; only (no `ZodType`
 *   parts).
 * @returns One or more phrase literals
 */
export const extractPhrases = (
  assertion: AnyAssertion,
): readonly [string, ...string[]] =>
  (assertion.parts as AssertionParts)
    .filter((part) => !(part instanceof z.ZodType))
    .flatMap((part) =>
      Array.isArray(part) ? part : [part],
    ) as unknown as readonly [string, ...string[]];
