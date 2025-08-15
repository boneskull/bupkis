import Debug from 'debug';
import { inspect } from 'util';
import z from 'zod/v4';

import { kStringLiteral } from '../constant.js';
import { AssertionError } from '../error.js';
import { isA, isAssertionFailure, isBoolean, isZodType } from '../guards.js';
import { BupkisRegistry } from '../metadata.js';
import {
  type AssertionAsync,
  type AssertionFunctionAsync,
  type AssertionImplAsync,
  type AssertionImplFnAsync,
  type AssertionImplSchemaAsync,
  type AssertionParts,
  type AssertionSchemaAsync,
  type AssertionSlots,
  type ParsedResult,
  type ParsedValues,
} from './assertion-types.js';
import { BupkisAssertion } from './assertion.js';
const debug = Debug('bupkis:assertion:async');

export abstract class BupkisAssertionAsync<
    Parts extends AssertionParts,
    Impl extends AssertionImplAsync<Parts>,
    Slots extends AssertionSlots<Parts>,
  >
  extends BupkisAssertion<Parts, Impl, Slots>
  implements AssertionAsync<Parts, Impl, Slots>
{
  abstract executeAsync(
    parsedValues: ParsedValues<Parts>,
    args: unknown[],
    stackStartFn: (...args: any[]) => any,
    parseResult?: ParsedResult<Parts>,
  ): Promise<void>;

  async parseValuesAsync<Args extends readonly unknown[]>(
    args: Args,
  ): Promise<ParsedResult<Parts>> {
    const { slots } = this;
    const parsedValues: any[] = [];
    if (slots.length !== args.length) {
      return {
        success: false,
      };
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
      // IMPORTANT: do not use a type guard here; it will break inference
      if (slot.def.type === 'unknown' || slot.def.type === 'any') {
        debug('Skipping unknown/any slot validation for arg', arg);
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
    return {
      exactMatch,
      parsedValues: parsedValues as unknown as ParsedValues<Parts>,
      success: true,
    };
  }
}
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

export class BupkisAssertionFunctionAsync<
    Parts extends AssertionParts,
    Impl extends AssertionImplFnAsync<Parts>,
    Slots extends AssertionSlots<Parts>,
  >
  extends BupkisAssertionAsync<Parts, Impl, Slots>
  implements AssertionFunctionAsync<Parts, Impl, Slots>
{
  override async executeAsync(
    parsedValues: ParsedValues<Parts>,
    args: unknown[],
    stackStartFn: (...args: any[]) => any,
    _parseResult?: ParsedResult<Parts>,
  ): Promise<void> {
    const { impl } = this;
    const result = await impl(...parsedValues);
    if (isZodType(result)) {
      try {
        await result.parseAsync(parsedValues[0]);
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
    } else if (isAssertionFailure(result)) {
      throw new AssertionError({
        actual: result.actual,
        expected: result.expected,
        message: result.message ?? `Assertion ${this} failed`,
      });
    } else if (result as unknown) {
      throw new TypeError(
        `Invalid return type from assertion ${this}; expected boolean, ZodType, or AssertionFailure`,
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

export class BupkisAssertionSchemaAsync<
    Parts extends AssertionParts,
    Impl extends AssertionImplSchemaAsync<Parts>,
    Slots extends AssertionSlots<Parts>,
  >
  extends BupkisAssertionAsync<Parts, Impl, Slots>
  implements AssertionSchemaAsync<Parts, Impl, Slots>
{
  override async executeAsync(
    parsedValues: ParsedValues<Parts>,
    _args: unknown[],
    stackStartFn: (...args: any[]) => any,
    _parseResult?: ParsedResult<Parts>,
  ): Promise<void> {
    // For async, fall back to standard implementation for now
    const [subject] = parsedValues;
    try {
      await this.impl.parseAsync(subject);
    } catch (error) {
      if (isA(error, z.ZodError)) {
        throw this.translateZodError(stackStartFn, error, ...parsedValues);
      }
      throw error;
    }
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
