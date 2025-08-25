/**
 * Core assertion class and parsing engine.
 *
 * This module implements the main `Assertion` class which handles parsing,
 * validation, and execution of assertions. It provides the foundational
 * infrastructure for converting assertion parts into executable validation
 * logic with comprehensive error handling and type safety.
 *
 * @packageDocumentation
 */

import Debug from 'debug';
import { AssertionError } from 'node:assert';
import { inspect } from 'util';
import { z } from 'zod/v4';

import { kStringLiteral } from '../constant.js';
import {
  isA,
  isBoolean,
  isFunction,
  isPromiseLike,
  isString,
  isStringTupleAssertionPart,
  isZodPromise,
  isZodType,
} from '../guards.js';
import { BupkisRegistry } from '../metadata.js';
import {
  type AnyParsedValues,
  type Assertion,
  type AssertionImpl,
  type AssertionImplAsyncFn,
  type AssertionImplFn,
  type AssertionParts,
  type AssertionSlots,
  type ParsedResult,
  type ParsedSubject,
  type ParsedValues,
} from './assertion-types.js';

const debug = Debug('bupkis:assertion');

export abstract class BupkisAssertion<
  T extends AssertionImpl<Parts>,
  Parts extends AssertionParts,
> implements Assertion<T, Parts>
{
  readonly __parts!: Parts;

  readonly impl: T;

  readonly slots: AssertionSlots<Parts>;

  constructor(slots: AssertionSlots<Parts>, impl: T) {
    this.slots = slots;
    this.impl = impl;
  }

  /**
   * Create an `Assertion` from {@link AssertionParts parts} and a
   * {@link z.ZodType Zod schema}.
   *
   * @param parts Assertion parts defining the shape of the assertion
   * @param impl Implementation as a Zod schema
   * @returns New `SchemaAssertion` instance
   * @throws {TypeError} Invalid assertion implementation type
   */

  static create<
    Impl extends z.ZodType<ParsedSubject<Parts>>,
    const Parts extends AssertionParts,
  >(this: void, parts: Parts, impl: Impl): SchemaAssertion<Impl, Parts>;
  /**
   * Create an `Assertion` from {@link AssertionParts parts} and an
   * implementation function.
   *
   * @param parts Assertion parts defining the shape of the assertion
   * @param impl Implementation as a function
   * @returns New `FunctionAssertion` instance
   * @throws {TypeError} Invalid assertion implementation type
   */
  static create<
    Impl extends AssertionImplAsyncFn<Parts> | AssertionImplFn<Parts>,
    const Parts extends AssertionParts,
  >(this: void, parts: Parts, impl: Impl): FunctionAssertion<Impl, Parts>;
  /**
   * @param this
   * @param parts
   * @param impl
   * @returns
   */
  static create<
    Impl extends AssertionImpl<Parts>,
    const Parts extends AssertionParts,
  >(this: void, parts: Parts, impl: Impl) {
    if (!parts || parts.length === 0) {
      throw new TypeError('At least one value is required for an assertion');
    }
    const slots = BupkisAssertion.slotify<Parts>(parts);

    if (isZodType(impl)) {
      return new SchemaAssertion(slots, impl);
    }
    if (isFunction(impl)) {
      return new FunctionAssertion(slots, impl);
    }
    throw new TypeError(
      'Assertion implementation must be a function, Zod schema or Zod schema factory',
    );
  }

  /**
   * Builds slots out of assertion parts.
   *
   * @param parts Assertion parts
   * @returns Slots
   */

  private static slotify<const Parts extends AssertionParts>(
    parts: Parts,
  ): AssertionSlots<Parts> {
    return parts.flatMap((part, index) => {
      const result: z.ZodType[] = [];
      if (index === 0 && (isStringTupleAssertionPart(part) || isString(part))) {
        result.push(z.unknown().describe('subject'));
      }

      if (isStringTupleAssertionPart(part)) {
        result.push(
          z
            .literal(part)
            .brand('string-literal')
            .register(BupkisRegistry, {
              [kStringLiteral]: true,
              values: part,
            }),
        );
      } else if (isString(part)) {
        result.push(
          z
            .literal(part)
            .brand('string-literal')
            .register(BupkisRegistry, {
              [kStringLiteral]: true,
              value: part,
            }),
        );
      } else {
        result.push(part);
      }
      return result;
    }) as unknown as AssertionSlots<Parts>;
  }

  /**
   * Execute the assertion implementation synchronously.
   *
   * @param parsedValues Parameters for the assertion implementation
   * @param args Raw parameters passed to `expect()`
   * @param stackStartFn
   */

  abstract execute(
    parsedValues: AnyParsedValues,
    args: unknown[],
    stackStartFn: (...args: any[]) => any,
  ): void;

  /**
   * Execute the assertion implementation asynchronously.
   *
   * @param parsedValues Parameters for the assertion implementation
   * @param args Raw parameters passed to `expectAsync()`
   * @param stackStartFn
   */

  abstract executeAsync(
    parsedValues: AnyParsedValues,
    args: unknown[],
    stackStartFn: (...args: any[]) => any,
  ): Promise<void>;

  /**
   * Parses raw arguments synchronously against this `Assertion`'s Slots to
   * determine if they match this `Assertion`.
   *
   * @param args Raw arguments provided to `expect()`
   * @returns Result of parsing attempt
   */

  parseValues<Args extends readonly unknown[]>(
    args: Args,
  ): ParsedResult<Parts> {
    const { slots } = this;
    const parsedValues: any[] = [];
    if (slots.length !== args.length) {
      return {
        assertion: `${this}`,
        reason: 'Argument count mismatch',
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
      // IMPORTANT: do not use a type guard here
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
    return {
      assertion: `${this}`,
      exactMatch,
      parsedValues: parsedValues as unknown as ParsedValues<Parts>,
      success: true,
    };
  }

  /**
   * Parses raw arguments asynchronously against this `Assertion`'s Slots to
   * determine if they match this `Assertion`.
   *
   * @param args Raw arguments provided to `expectAsync()`
   * @returns Result of parsing attempt
   */

  async parseValuesAsync<Args extends readonly unknown[]>(
    args: Args,
  ): Promise<ParsedResult<Parts>> {
    const { slots } = this;
    const parsedValues: any[] = [];
    if (slots.length !== args.length) {
      return {
        assertion: `${this}`,
        reason: 'Argument count mismatch',
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

  /**
   * @returns String representation
   */

  toString(): string {
    const expand = (zodType: z.ZodType): string => {
      switch (zodType.def.type) {
        case 'enum':
          return `${(zodType as z.ZodEnum<any>).options.join('/')}`;
        case 'literal':
          return [...(zodType as z.ZodLiteral).def.values].join('/');
        case 'union':
          return ((zodType as z.ZodUnion<any>).options as z.ZodType[])
            .map(expand)
            .join(' | ');
        case 'custom': {
          const meta = BupkisRegistry.get(zodType);
          if (meta?.name) {
            return `<${meta.name}>`;
          }
        }
        // falls through
        default:
          return `{${zodType.def.type}}`;
      }
    };
    return `"${this.slots.map(expand).join(' ')}"`;
  }

  // TODO: support stackStartFn
  protected translateZodError(
    stackStartFn: (...args: any[]) => any,
    zodError: z.ZodError,
    ...values: AnyParsedValues
  ): AssertionError {
    const flat = z.flattenError(zodError);

    let pretty = flat.formErrors.join('; ');
    for (const [keypath, errors] of Object.entries(flat.fieldErrors)) {
      pretty += `; ${keypath}: ${(errors as unknown[]).join('; ')}`;
    }
    const [actual, expected] = values as unknown as [unknown, unknown];
    return new AssertionError({
      actual,
      expected,
      message: `Assertion ${this} failed: ${pretty}`,
      operator: `${this}`,
      stackStartFn,
    });
  }

  private parseSlotForLiteral<T extends (typeof this.slots)[number]>(
    slot: T,
    i: number,
    arg: unknown,
  ): boolean | ParsedResult<Parts> {
    const meta = BupkisRegistry.get(slot) ?? {};
    // our branded literal slots are also tagged in meta for runtime
    // const metadata = BupkisRegistrySchema.safeParse(meta);
    if (kStringLiteral in meta) {
      if ('value' in meta) {
        if (arg !== meta.value) {
          return {
            assertion: `${this}`,
            reason: `Expected ${meta.value} for slot ${i}, got ${inspect(arg)}`,
            success: false,
          };
        }
      } else if ('values' in meta) {
        const allowed = meta.values as readonly string[];
        if (!allowed.includes(`${arg}`)) {
          return {
            assertion: `${this}`,
            reason: `Expected one of ${allowed.join(', ')} for slot ${i}, got ${inspect(arg)}`,
            success: false,
          };
        }
      } else {
        debug('Invalid metadata for slot', i, 'with value', arg);
        return {
          assertion: `${this}`,
          reason: `Invalid metadata for slot ${i}`,
          success: false,
        };
      }
      return true;
      // skip from impl params
    }
    return false;
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

export class FunctionAssertion<
    Impl extends AssertionImplAsyncFn<Parts> | AssertionImplFn<Parts>,
    Parts extends AssertionParts,
  >
  extends BupkisAssertion<Impl, Parts>
  implements Assertion<Impl, Parts>
{
  execute(
    parsedValues: AnyParsedValues,
    args: unknown[],
    stackStartFn: (...args: any[]) => any,
  ): void {
    const result = (this.impl as AssertionImplFn<Parts>).call(
      null,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      ...(parsedValues as any),
    );
    if (isPromiseLike(result)) {
      // Avoid unhandled promise rejection
      Promise.resolve(result).catch((err) => {
        debug(`Ignored unhandled rejection from assertion %s: %O`, this, err);
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

  async executeAsync(
    parsedValues: AnyParsedValues,
    args: unknown[],
    stackStartFn: (...args: any[]) => any,
  ): Promise<void> {
    const result = await (this.impl as AssertionImplAsyncFn<Parts>).call(
      null,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      ...(parsedValues as any),
    );
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
    }
  }
}

/**
 * An assertion implemented as a Zod schema.
 *
 * Async schemas are supported via {@link expectAsync}.
 */

export class SchemaAssertion<
    Impl extends z.ZodType<ParsedSubject<Parts>>,
    Parts extends AssertionParts,
  >
  extends BupkisAssertion<Impl, Parts>
  implements Assertion<Impl, Parts>
{
  execute(
    parsedValues: AnyParsedValues,
    _args: unknown[],
    stackStartFn: (...args: any[]) => any,
  ): void {
    const [subject] = parsedValues as unknown as AnyParsedValues;
    try {
      this.impl.parse(subject);
    } catch (error) {
      if (isA(error, z.ZodError)) {
        throw this.translateZodError(stackStartFn, error, ...parsedValues);
      }
      throw error;
    }
  }

  async executeAsync(
    parsedValues: AnyParsedValues,
    _args: unknown[],
    stackStartFn: (...args: any[]) => any,
  ): Promise<void> {
    const [subject] = parsedValues as unknown as AnyParsedValues;
    try {
      await this.impl.parseAsync(subject);
    } catch (error) {
      if (isA(error, z.ZodError)) {
        throw this.translateZodError(stackStartFn, error, ...parsedValues);
      }
      throw error;
    }
  }
}

/**
 * {@inheritDoc BupkisAssertion.create}
 */
export const createAssertion = BupkisAssertion.create;
