import Debug from 'debug';
import { inspect } from 'util';
import { z } from 'zod/v4';

import { kStringLiteral } from '../constant.js';
import { AssertionError } from '../error.js';
import {
  isA,
  isBoolean,
  isPromiseLike,
  isZodPromise,
  isZodType,
} from '../guards.js';
import { BupkisRegistry } from '../metadata.js';
import {
  type AssertionFunctionSync,
  type AssertionImplFnSync,
  type AssertionImplSchemaSync,
  type AssertionImplSync,
  type AssertionParts,
  type AssertionSchemaSync,
  type AssertionSlots,
  type AssertionSync,
  type ParsedResult,
  type ParsedResultSuccess,
  type ParsedValues,
} from './assertion-types.js';
import { BupkisAssertion } from './assertion.js';

const debug = Debug('bupkis:assertion:sync');

/**
 * An assertion implemented as a Zod schema.
 *
 * Async schemas are supported via {@link expectAsync}.
 */
/**
 * Optimized schema assertion that performs subject validation during
 * parseValues() to eliminate double parsing for simple schema-based
 * assertions.
 *
 * This class implements Option 2 from the z.function() analysis - it caches the
 * subject validation result during argument parsing and reuses it during
 * execution, eliminating the double parsing overhead.
 */

export abstract class BupkisAssertionSync<
    Parts extends AssertionParts,
    Impl extends AssertionImplSync<Parts>,
    Slots extends AssertionSlots<Parts>,
  >
  extends BupkisAssertion<Parts, Impl, Slots>
  implements AssertionSync<Parts, Impl, Slots>
{
  /**
   * Parses raw arguments synchronously against this `Assertion`'s Slots to
   * determine if they match this `Assertion`.
   *
   * @param args Raw arguments provided to `expect()`
   * @returns Result of parsing attempt
   */
  abstract execute(
    parsedValues: ParsedValues<Parts>,
    args: unknown[],
    stackStartFn: (...args: any[]) => any,
    parseResult?: ParsedResult<Parts>,
  ): void;

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
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]!;
      const arg = args[i];

      const parsedLiteralResult = this.parseSlotForLiteral(slot, i, arg);
      if (parsedLiteralResult === true) {
        continue;
      } else if (parsedLiteralResult !== false) {
        return parsedLiteralResult;
      }

      // unknown/any accept anything
      // IMPORTANT: do not use a type guard here
      if (slot.def.type === 'unknown' || slot.def.type === 'any') {
        debug('Skipping unknown/any slot validation for arg', arg);
        parsedValues.push(arg);
        exactMatch = false;
        continue;
      }
      // low-effort check
      if (isZodPromise(slot)) {
        throw new TypeError(
          `${this} expects a Promise for slot ${i}; use expectAsync() instead of expect()`,
        );
      }
      const result = slot.safeParse(arg);
      if (!result.success) {
        debug(
          'Validation failed for slot',
          i,
          'with value',
          arg,
          'error:',
          z.prettifyError(result.error),
        );
        return {
          assertion: `${this}`,
          reason: `Validation failed for slot ${i}: ${z.prettifyError(result.error)}`,
          success: false,
        };
      }
      parsedValues.push(result.data);
    }
    return {
      assertion: `${this}`,
      exactMatch,
      parsedValues: parsedValues as unknown as ParsedValues<Parts>,
      success: true,
    };
  }
}

export class BupkisAssertionFunctionSync<
    Parts extends AssertionParts,
    Impl extends AssertionImplFnSync<Parts>,
    Slots extends AssertionSlots<Parts>,
  >
  extends BupkisAssertionSync<Parts, Impl, Slots>
  implements AssertionFunctionSync<Parts, Impl, Slots>
{
  override execute(
    parsedValues: ParsedValues<Parts>,
    args: unknown[],
    stackStartFn: (...args: any[]) => any,
    _parseResult?: ParsedResult<Parts>,
  ): void {
    const result = (this.impl as AssertionImplFnSync<Parts>).call(
      null,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      ...(parsedValues as any),
    );
    if (isPromiseLike(result)) {
      // Avoid unhandled promise rejection
      Promise.resolve(result).catch((err) => {
        debug(`Ate unhandled rejection from assertion %s: %O`, this, err);
      });

      throw new TypeError(
        `Assertion ${this} returned a Promise; use expectAsync() instead of expect()`,
      );
    }
    if (isZodType(result)) {
      try {
        result.parse(parsedValues[0]);
      } catch (error) {
        if (isA(error, z.ZodError)) {
          throw this.translateZodError(stackStartFn, error, ...parsedValues);
        }
        throw error;
      }
    } else if (isBoolean(result)) {
      if (!result) {
        throw new AssertionError({
          message: `Assertion ${this} failed for arguments: ${inspect(args)}`,
        });
      }
    }
  }
}

/**
 * A class representing an assertion implemented as a function.
 *
 * This function may:
 *
 * 1. Return a `boolean` indicating pass/fail.
 * 2. Return a `ZodType` which will be used to validate the subject.
 * 3. Return a `Promise` resolving to either of the above (when called via
 *    {@link expectAsync})
 * 4. Throw a {@link AssertionError}; when called via {@link expectAsync}, reject
 *    with an {@link AssertionError}
 */

export class BupkisAssertionSchemaSync<
    Parts extends AssertionParts,
    Impl extends AssertionImplSchemaSync<Parts>,
    Slots extends AssertionSlots<Parts>,
  >
  extends BupkisAssertionSync<Parts, Impl, Slots>
  implements AssertionSchemaSync<Parts, Impl, Slots>
{
  override execute(
    parsedValues: ParsedValues<Parts>,
    args: unknown[],
    stackStartFn: (...args: any[]) => any,
    parseResult?: ParsedResult<Parts>,
  ): void {
    // Check if we have cached validation result from parseValues
    const cachedValidation = parseResult?.success
      ? parseResult.subjectValidationResult
      : undefined;

    if (cachedValidation) {
      debug(
        'Using cached subject validation result from parseValues for %s',
        this,
      );
      if (!cachedValidation.success) {
        // Subject validation failed during parseValues, throw the cached error
        throw this.translateZodError(
          stackStartFn,
          cachedValidation.error,
          ...parsedValues,
        );
      }
      // Subject validation passed, nothing more to do
      return;
    }

    // Fall back to standard validation if no cached result
    const [subject] = parsedValues;
    try {
      this.impl.parse(subject);
    } catch (error) {
      if (isA(error, z.ZodError)) {
        throw this.translateZodError(stackStartFn, error, ...parsedValues);
      }
      throw error;
    }
  }

  override parseValues<Args extends readonly unknown[]>(
    args: Args,
  ): ParsedResult<Parts> {
    const { slots } = this;
    const parsedValues: any[] = [];

    const mismatch = this.maybeParseValuesArgMismatch(args);
    if (mismatch) {
      return mismatch;
    }

    let exactMatch = true;
    let subjectValidationResult:
      | undefined
      | { data: any; success: true }
      | { error: z.ZodError; success: false };

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]!;
      const arg = args[i];

      const parsedLiteralResult = this.parseSlotForLiteral(slot, i, arg);
      if (parsedLiteralResult === true) {
        continue;
      } else if (parsedLiteralResult !== false) {
        return parsedLiteralResult;
      }

      // For the subject slot (first slot if it's unknown/any), try optimized validation
      if (
        i === 0 &&
        (slot.def.type === 'unknown' || slot.def.type === 'any') &&
        this.isSimpleSchemaAssertion()
      ) {
        debug(
          'Performing optimized subject validation during parseValues for %s',
          this,
        );
        const result = this.impl.safeParse(arg);

        if (result.success) {
          subjectValidationResult = { data: result.data, success: true };
          parsedValues.push(result.data); // Use validated data
        } else {
          subjectValidationResult = { error: result.error, success: false };
          parsedValues.push(arg); // Keep original for error reporting
        }
        exactMatch = false; // Subject was validated, so we know the exact type
        continue;
      }

      // Standard slot processing for non-optimized cases
      if (slot.def.type === 'unknown' || slot.def.type === 'any') {
        debug('Skipping unknown/any slot validation for arg', arg);
        parsedValues.push(arg);
        exactMatch = false;
        continue;
      }

      if (isZodPromise(slot)) {
        throw new TypeError(
          `${this} expects a Promise for slot ${i}; use expectAsync() instead of expect()`,
        );
      }

      const result = slot.safeParse(arg);
      if (!result.success) {
        debug(
          'Validation failed for slot',
          i,
          'with value',
          arg,
          'error:',
          z.prettifyError(result.error),
        );
        return {
          assertion: `${this}`,
          reason: `Validation failed for slot ${i}: ${z.prettifyError(result.error)}`,
          success: false,
        };
      }
      parsedValues.push(result.data);
    }

    const result: ParsedResultSuccess<Parts> = {
      assertion: `${this}`,
      exactMatch,
      parsedValues: parsedValues as unknown as ParsedValues<Parts>,
      success: true,
    };

    // Add cached validation result if we performed optimization
    if (subjectValidationResult) {
      result.subjectValidationResult = subjectValidationResult;
    }

    return result;
  }

  /**
   * Determines if this assertion can be optimized (simple single-subject
   * schema). Only simple assertions like ['to be a string'] with z.string()
   * qualify.
   */
  private isSimpleSchemaAssertion(): boolean {
    // Only optimize if we have exactly one subject slot + string literal slots
    // and no complex argument processing
    const hasSubjectSlot =
      this.slots.length > 0 &&
      (this.slots[0]?.def.type === 'unknown' ||
        this.slots[0]?.def.type === 'any');

    const allOtherSlotsAreLiterals = this.slots.slice(1).every((slot) => {
      const meta = BupkisRegistry.get(slot) ?? {};
      return kStringLiteral in meta;
    });

    return hasSubjectSlot && allOtherSlotsAreLiterals;
  }
}
