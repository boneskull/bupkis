/**
 * Synchronous assertion subclasses.
 *
 * @packageDocumentation
 * @see {@link AssertionFunctionSync} for function-based assertions
 * @see {@link AssertionSchemaSync} for schema-based assertions
 */

import createDebug from 'debug';
import { inspect } from 'util';
import { z } from 'zod/v4';

import { kStringLiteral } from '../constant.js';
import {
  AssertionError,
  AssertionImplementationError,
  UnexpectedAsyncError,
} from '../error.js';
import {
  isAssertionFailure,
  isBoolean,
  isError,
  isPromiseLike,
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

const debug = createDebug('bupkis:assertion:sync');

/**
 * Abstract class for synchronous assertions.
 *
 * Child classes are expected to implement {@link execute}.
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

  /**
   * Parses raw arguments against the slots of this assertion to determine if
   * this assertion should be executed against those arguments.
   *
   * For example, if an assertion wants the subject to be a `z.string()`, then
   * this will validate that the first raw arg parses as a string. It will also
   * validate Phrase Literals as well, such as "to be a string". If all slots
   * match and none of the slots are "unknown" or "any", then `exactMatch` will
   * be true.
   *
   * If any slot does not match, this returns `success: false`.
   *
   * @param args Raw arguments
   * @returns Result of parsing attempt
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
        // debug('Skipping unknown/any slot validation for arg', arg);
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
    return {
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

      throw new UnexpectedAsyncError(
        `Assertion ${this} returned a Promise; use expectAsync() instead of expect()`,
      );
    }
    if (isZodType(result)) {
      const zodResult = result.safeParse(parsedValues[0]);
      if (!zodResult.success) {
        throw this.fromZodError(zodResult.error, stackStartFn, parsedValues);
      }
    } else if (isBoolean(result)) {
      if (!result) {
        throw new AssertionError({
          message: `Assertion ${this} failed for arguments: ${inspect(args)}`,
        });
      }
    } else if (isAssertionFailure(result)) {
      throw new AssertionError({
        actual: result.actual,
        expected: result.expected,
        message: result.message ?? `Assertion ${this} failed`,
      });
    } else if (isError(result) && result instanceof z.ZodError) {
      throw this.fromZodError(result, stackStartFn, parsedValues);
    } else if (result as unknown) {
      throw new AssertionImplementationError(
        `Invalid return type from assertion ${this}; expected boolean, ZodType, or AssertionFailure`,
        { result },
      );
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
    _args: unknown[],
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
        throw this.fromZodError(
          cachedValidation.error,
          stackStartFn,
          parsedValues,
        );
      }
      // Subject validation passed, nothing more to do
      return;
    }

    // Fall back to standard validation if no cached result
    const [subject] = parsedValues;
    const result = this.impl.safeParse(subject);
    if (!result.success) {
      throw this.fromZodError(result.error, stackStartFn, parsedValues);
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
