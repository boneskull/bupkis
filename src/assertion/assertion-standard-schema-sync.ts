/**
 * Synchronous Standard Schema assertion implementation.
 *
 * This module provides the `BupkisAssertionStandardSchemaSync` class for
 * assertions implemented using Standard Schema v1 compliant validators from any
 * library (Valibot, ArkType, etc.).
 *
 * @packageDocumentation
 */

import type { StandardSchemaV1 } from '../standard-schema.js';
import type {
  AssertionParts,
  AssertionSlots,
  AssertionStandardSchemaSync,
  ParsedResult,
  ParsedResultSuccess,
  ParsedValues,
} from './assertion-types.js';

import { BupkisAssertion } from './assertion.js';

/**
 * A synchronous assertion implemented using a Standard Schema v1 validator.
 *
 * This class handles schema-based assertions where the implementation is any
 * Standard Schema compliant validator (not just Zod). It optimizes validation
 * by caching the subject validation result during `parseValues()` to avoid
 * double parsing.
 *
 * @template Parts - The assertion parts tuple defining structure
 * @template Impl - The Standard Schema implementation
 * @template Slots - The derived validation slots
 */
export class BupkisAssertionStandardSchemaSync<
  Parts extends AssertionParts,
  Impl extends StandardSchemaV1,
  Slots extends AssertionSlots<Parts>,
>
  extends BupkisAssertion<Parts, Impl, Slots>
  implements AssertionStandardSchemaSync<Parts, Impl, Slots>
{
  /**
   * Executes the assertion against validated values.
   *
   * If validation was already performed during `parseValues()` and cached,
   * reuses that result. Otherwise, performs validation using the Standard
   * Schema's validate() method.
   *
   * @param parsedValues - The parsed and validated values
   * @param _args - Original raw arguments (unused)
   * @param stackStartFn - Function to use as stack trace start point
   * @param parseResult - Optional cached parse result from `parseValues()`
   * @throws {AssertionError} If validation fails
   */
  execute(
    parsedValues: ParsedValues<Parts>,
    _args: unknown[],
    stackStartFn: (...args: any[]) => any,
    parseResult?: ParsedResult<Parts>,
  ): void {
    const cachedValidation = parseResult?.success
      ? parseResult.subjectValidationResult
      : undefined;

    if (cachedValidation) {
      if (!cachedValidation.success) {
        if ('issues' in cachedValidation) {
          throw this.fromStandardSchemaIssues(
            cachedValidation.issues,
            stackStartFn,
            parsedValues,
          );
        }
      }
      return;
    }

    const [subject] = parsedValues;
    const result = this.impl['~standard'].validate(subject);

    if (result instanceof Promise) {
      result.catch(() => {
        /* prevent unhandled rejection */
      });
      throw new Error(
        `Standard Schema returned a Promise in sync context; use expectAsync() instead`,
      );
    }

    if (result.issues) {
      throw this.fromStandardSchemaIssues(
        result.issues,
        stackStartFn,
        parsedValues,
      );
    }
  }

  /**
   * Parses raw arguments against slots with optimized validation caching.
   *
   * For simple schema assertions (subject + phrase literals only), this method
   * validates the subject during parsing and caches the result to avoid double
   * validation in `execute()`.
   *
   * @param args - Raw arguments provided to `expect()`
   * @returns Parse result indicating success/failure and cached validation
   */
  parseValues<Args extends readonly unknown[]>(
    args: Args,
  ): ParsedResult<Parts> {
    const { slots } = this;
    const parsedValues: any[] = [];
    const mismatch = this.maybeParseValuesArgMismatch(args);
    if (mismatch) {
      return mismatch;
    }

    let exactMatch = true;
    let subjectValidationResult: ParsedResultSuccess<Parts>['subjectValidationResult'];

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]!;
      const arg = args[i];
      const parsedLiteralResult = this.parseSlotForLiteral(slot, i, arg);
      if (parsedLiteralResult === true) {
        continue;
      } else if (parsedLiteralResult !== false) {
        return parsedLiteralResult;
      }

      if (
        i === 0 &&
        (slot.def.type === 'unknown' || slot.def.type === 'any') &&
        this.isSimpleSchemaAssertion()
      ) {
        const result = this.impl['~standard'].validate(arg);

        if (result instanceof Promise) {
          result.catch(() => {
            /* prevent unhandled rejection */
          });
          return {
            success: false,
          };
        }

        if (result.issues) {
          subjectValidationResult = { issues: result.issues, success: false };
          parsedValues.push(arg);
        } else {
          subjectValidationResult = { data: result.value, success: true };
          parsedValues.push(result.value);
        }
        exactMatch = false;
        continue;
      }

      if (slot.def.type === 'unknown' || slot.def.type === 'any') {
        parsedValues.push(arg);
        exactMatch = false;
        continue;
      }

      const result = slot.safeParse(arg);
      if (!result.success) {
        return {
          success: false,
        };
      }
      parsedValues.push(arg);
    }

    const result: ParsedResultSuccess<Parts> = {
      exactMatch,
      parsedValues: parsedValues as unknown as ParsedValues<Parts>,
      success: true,
    };

    if (subjectValidationResult) {
      result.subjectValidationResult = subjectValidationResult;
    }

    return result;
  }
}
