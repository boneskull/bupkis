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
  isBoolean,
  isPromiseLike,
  isStringTupleAssertionPart,
  isZodPromise,
  isZodType,
} from '../guards.js';
import { BupkisRegistry, BupkisRegistrySchema } from '../metadata.js';
import {
  type AnyParsedValues,
  type AssertionImpl,
  type AssertionImplAsyncFn,
  type AssertionImplFn,
  type AssertionParts,
  type AssertionSlots,
  type ParsedResult,
  type ParsedSubject,
  type ParsedValues,
} from './types.js';

const debug = Debug('bupkis:assertion');

export abstract class Assertion<
  T extends AssertionImpl<Parts>,
  Parts extends AssertionParts,
> {
  readonly __parts!: Parts;
  readonly impl: T;

  readonly slots: AssertionSlots<Parts>;

  get subject() {
    return this.slots[0];
  }

  get subjectType() {
    return this.subject.def.type;
  }

  constructor(slots: AssertionSlots<Parts>, impl: T) {
    this.slots = slots;
    this.impl = impl;
  }

  static forImpl<
    Impl extends AssertionImplAsyncFn<Parts> | AssertionImplFn<Parts>,
    Parts extends AssertionParts,
  >(
    slots: AssertionSlots<Parts>,
    implementationFn: Impl,
  ): FunctionAssertion<Impl, Parts>;
  static forImpl<
    Impl extends z.ZodType<ParsedSubject<Parts>>,
    Parts extends AssertionParts,
  >(slots: AssertionSlots<Parts>, schema: Impl): SchemaAssertion<Impl, Parts>;
  static forImpl<Parts extends AssertionParts>(
    slots: AssertionSlots<Parts>,
    impl: AssertionImpl<Parts>,
  ) {
    if (isZodType(impl)) {
      return new SchemaAssertion(slots, impl);
    }
    if (typeof impl === 'function') {
      return new FunctionAssertion(slots, impl);
    }
    throw new TypeError(
      'Assertion implementation must be a function, Zod schema or Zod schema factory',
    );
  }

  // Static factory: build an Assertion instance from author-provided parts
  static fromParts<
    Impl extends AssertionImplAsyncFn<Parts> | AssertionImplFn<Parts>,
    const Parts extends AssertionParts,
  >(
    this: void,
    parts: Parts,
    implementationFn: Impl,
  ): FunctionAssertion<Impl, Parts>;
  static fromParts<
    Impl extends z.ZodType<ParsedSubject<Parts>>,
    const Parts extends AssertionParts,
  >(this: void, parts: Parts, schema: Impl): SchemaAssertion<Impl, Parts>;
  static fromParts<const Parts extends AssertionParts>(
    this: void,
    parts: Parts,
    impl: AssertionImpl<Parts>,
  ) {
    if (!parts || parts.length === 0) {
      throw new TypeError('At least one value is required for an assertion');
    }
    const slots = Assertion.slotify<Parts>(parts);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return Assertion.forImpl(slots, impl as any);
  }

  // Build slots tuple: prepend z.unknown() if first is string or string[]; map strings -> branded literals
  private static slotify<const Parts extends AssertionParts>(parts: Parts) {
    return parts.flatMap((part, index) => {
      const result: z.ZodType[] = [];
      if (
        index === 0 &&
        (isStringTupleAssertionPart(part) || typeof part === 'string')
      ) {
        result.push(z.unknown().describe('subject'));
      }

      if (isStringTupleAssertionPart(part)) {
        result.push(
          z
            .enum(part)
            .brand('string-literal')
            .register(BupkisRegistry, {
              [kStringLiteral]: true,
              values: part,
            }),
        );
      } else if (typeof part === 'string') {
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

  abstract execute(
    parsedValues: AnyParsedValues,
    args: unknown[],
    stackStartFn: (...args: any[]) => any,
  ): void;
  abstract executeAsync(
    parsedValues: AnyParsedValues,
    args: unknown[],
    stackStartFn: (...args: any[]) => any,
  ): Promise<void>;

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

  toString(): string {
    const expand = (zodType: z.ZodType): string => {
      switch (zodType.def.type) {
        case 'enum':
          return `${(zodType as z.ZodEnum<any>).options.join('/')}`;
        case 'literal':
          return JSON.stringify((zodType as z.ZodLiteral).def.values);
        case 'union':
          return ((zodType as z.ZodUnion<any>).options as z.ZodType[])
            .map(expand)
            .join(' | ');
        default:
          return `<${zodType.def.type}>`;
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
    const meta = BupkisRegistry.get(slot);
    // our branded literal slots are also tagged in meta for runtime
    const metadata = BupkisRegistrySchema.safeParse(meta);
    if (metadata.success) {
      const { data } = metadata;
      if ('value' in data) {
        if (arg !== data.value) {
          return {
            assertion: `${this}`,
            reason: `Expected ${data.value} for slot ${i}, got ${inspect(arg)}`,
            success: false,
          };
        }
      } else if ('values' in data) {
        const allowed = data.values as readonly string[];
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
  T extends AssertionImplAsyncFn<Parts> | AssertionImplFn<Parts>,
  Parts extends AssertionParts,
> extends Assertion<T, Parts> {
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
        if (error instanceof z.ZodError) {
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
        if (error instanceof z.ZodError) {
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
  T extends z.ZodType<ParsedSubject<Parts>>,
  Parts extends AssertionParts,
> extends Assertion<T, Parts> {
  execute(
    parsedValues: AnyParsedValues,
    _args: unknown[],
    stackStartFn: (...args: any[]) => any,
  ): void {
    const [subject] = parsedValues as unknown as AnyParsedValues;
    try {
      this.impl.parse(subject);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
      if (error instanceof z.ZodError) {
        throw this.translateZodError(stackStartFn, error, ...parsedValues);
      }
      throw error;
    }
  }
}
