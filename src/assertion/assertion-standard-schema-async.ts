/**
 * Asynchronous Standard Schema assertion implementation.
 *
 * This module provides the `BupkisAssertionStandardSchemaAsync` class for
 * assertions implemented using Standard Schema v1 compliant validators that may
 * perform asynchronous validation.
 *
 * @packageDocumentation
 */

import type { StandardSchemaV1 } from '../standard-schema.js';
import type {
  AssertionParts,
  AssertionSlots,
  AssertionStandardSchemaAsync,
  ParsedResult,
  ParsedResultSuccess,
  ParsedValues,
} from './assertion-types.js';

import { BupkisAssertion } from './assertion.js';

/**
 * An asynchronous assertion implemented using a Standard Schema v1 validator.
 *
 * This class handles async schema-based assertions where the implementation is
 * any Standard Schema compliant validator that may perform asynchronous
 * validation. It optimizes validation by caching the subject validation result
 * during `parseValuesAsync()` to avoid double parsing.
 *
 * @template Parts - The assertion parts tuple defining structure
 * @template Impl - The Standard Schema implementation
 * @template Slots - The derived validation slots
 */
export class BupkisAssertionStandardSchemaAsync<
  Parts extends AssertionParts,
  Impl extends StandardSchemaV1,
  Slots extends AssertionSlots<Parts>,
>
  extends BupkisAssertion<Parts, Impl, Slots>
  implements AssertionStandardSchemaAsync<Parts, Impl, Slots>
{
  /**
   * Executes the assertion asynchronously against validated values.
   *
   * If validation was already performed during `parseValuesAsync()` and cached,
   * reuses that result. Otherwise, performs validation using the Standard
   * Schema's validate() method (which may return a Promise).
   *
   * @param parsedValues - The parsed and validated values
   * @param _args - Original raw arguments (unused)
   * @param stackStartFn - Function to use as stack trace start point
   * @param parseResult - Optional cached parse result from `parseValuesAsync()`
   * @throws {AssertionError} If validation fails
   */
  async executeAsync(
    parsedValues: ParsedValues<Parts>,
    _args: unknown[],
    stackStartFn: (...args: any[]) => any,
    parseResult?: ParsedResult<Parts>,
  ): Promise<void> {
    const cachedValidation = parseResult?.success
      ? parseResult.subjectValidationResult
      : undefined;

    if (cachedValidation && !cachedValidation.success) {
      if ('issues' in cachedValidation) {
        throw this.fromStandardSchemaIssues(
          cachedValidation.issues,
          stackStartFn,
          parsedValues,
        );
      }
    }

    const [subject] = parsedValues;
    const result = this.impl['~standard'].validate(subject);
    const validationResult = result instanceof Promise ? await result : result;

    if (validationResult.issues) {
      throw this.fromStandardSchemaIssues(
        validationResult.issues,
        stackStartFn,
        parsedValues,
      );
    }
  }

  /**
   * Parses raw arguments asynchronously against slots with optimized caching.
   *
   * For simple schema assertions (subject + phrase literals only), this method
   * validates the subject during parsing and caches the result to avoid double
   * validation in `executeAsync()`.
   *
   * @param args - Raw arguments provided to `expectAsync()`
   * @returns Promise resolving to parse result with cached validation
   */
  async parseValuesAsync<Args extends readonly unknown[]>(
    args: Args,
  ): Promise<ParsedResult<Parts>> {
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
        const validationResult =
          result instanceof Promise ? await result : result;

        if (validationResult.issues) {
          subjectValidationResult = {
            issues: validationResult.issues,
            success: false,
          };
          parsedValues.push(arg);
        } else {
          subjectValidationResult = {
            data: validationResult.value,
            success: true,
          };
          parsedValues.push(validationResult.value);
        }
        exactMatch = false;
        continue;
      }

      if (slot.def.type === 'unknown' || slot.def.type === 'any') {
        parsedValues.push(arg);
        exactMatch = false;
        continue;
      }

      const result = await slot.safeParseAsync(arg);
      if (!result.success) {
        return {
          success: false,
        };
      }
      parsedValues.push(result.data);
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
