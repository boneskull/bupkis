/**
 * Utilities for property-based tests.
 *
 * @packageDocumentation
 */

import type { z } from 'zod/v4';

import type { AnyAssertion } from '../../src/assertion/assertion-types.js';

import { expect, expectAsync } from '../../src/bootstrap.js';
import { FailAssertionError } from '../../src/error.js';
import { isString } from '../../src/guards.js';

export const createPhraseExtractor = <
  const T extends Record<string, AnyAssertion>,
>(
  assertions: T,
) => {
  /**
   * Extracts phrase literals from {@link Assertion.parts AssertionParts}.
   *
   * Used with {@link fc.constantFrom} to generate phrases for testing with
   * `expect()`.
   *
   * @param id Assertion to extract phrases from
   * @returns One or more phrase literals
   */

  const extractPhrases = <K extends keyof T>(id: K): [string, ...string[]] => {
    if (id === undefined) {
      throw new TypeError('Assertion id is required');
    }
    if (!(id in assertions)) {
      throw new ReferenceError(`Unknown assertion id: ${String(id)}`);
    }
    // Cast parts to the proper type since AnyAssertion uses `any` generics
    const parts = assertions[id]!.parts as readonly (
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
  return extractPhrases;
};
export type ExpectationResult =
  | { error: unknown; failed: true }
  | {
      error?: never;
      failed?: false;
    };

export const createAsyncExpectations = () => {
  const validExpectationAsync = async (
    value: unknown,
    ...args: unknown[]
  ): Promise<ExpectationResult> => {
    try {
      await expectAsync(value, ...args);
      return { failed: false };
    } catch (err) {
      return { error: err, failed: true };
    }
  };

  const validNegatedExpectationAsync = async (
    value: unknown,
    ...args: unknown[]
  ): Promise<ExpectationResult> => {
    try {
      await expectAsync(value, `not ${args[0]}`, ...args.slice(1));
      return { failed: false };
    } catch (err) {
      return { error: err, failed: true };
    }
  };

  const invalidNegatedExpectationAsync = async (
    value: unknown,
    ...args: unknown[]
  ): Promise<ExpectationResult> => {
    try {
      await expectAsync(value, `not ${args[0]}`, ...args.slice(1));
      return {
        error: new FailAssertionError({
          actual: 'success',
          expected: 'failure',
          message: 'Expected negated assertion to fail but it passed instead',
        }),
        failed: true,
      };
    } catch {
      return { failed: false };
    }
  };

  const invalidExpectationAsync = async (
    value: unknown,
    ...args: unknown[]
  ): Promise<ExpectationResult> => {
    try {
      await expectAsync(value, ...args);
      return {
        error: new FailAssertionError({
          actual: 'success',
          expected: 'failure',
          message: 'Expected assertion to fail but it passed instead',
        }),
        failed: true,
      };
    } catch {
      return { failed: false };
    }
  };

  return {
    invalidExpectationAsync,
    invalidNegatedExpectationAsync,
    validExpectationAsync,
    validNegatedExpectationAsync,
  };
};

/**
 * Creates expectation functions that return results instead of throwing.
 */

export const createExpectations = () => {
  const validExpectation = (
    value: unknown,
    ...args: unknown[]
  ): ExpectationResult => {
    try {
      expect(value, ...args);
      return { failed: false };
    } catch (err) {
      return { error: err, failed: true };
    }
  };

  const validNegatedExpectation = (
    value: unknown,
    ...args: unknown[]
  ): ExpectationResult => {
    try {
      expect(value, `not ${args[0]}`, ...args.slice(1));
      return { failed: false };
    } catch (err) {
      return { error: err, failed: true };
    }
  };

  const invalidNegatedExpectation = (
    value: unknown,
    ...args: unknown[]
  ): ExpectationResult => {
    try {
      expect(value, `not ${args[0]}`, ...args.slice(1));
      return {
        error: new FailAssertionError({
          actual: 'success',
          expected: 'failure',
          message: 'Expected negated assertion to fail but it passed instead',
        }),
        failed: true,
      };
    } catch {
      return { failed: false };
    }
  };

  const invalidExpectation = (
    value: unknown,
    ...args: unknown[]
  ): ExpectationResult => {
    try {
      expect(value, ...args);
      return {
        error: new FailAssertionError({
          actual: 'success',
          expected: 'failure',
          message: 'Expected assertion to fail but it passed instead',
        }),
        failed: true,
      };
    } catch {
      return { failed: false };
    }
  };

  return {
    invalidExpectation,
    invalidNegatedExpectation,
    validExpectation,
    validNegatedExpectation,
  };
};
