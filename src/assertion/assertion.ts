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
import slug from 'slug';
import { inspect } from 'util';
import { z } from 'zod/v4';

import { kStringLiteral } from '../constant.js';
import { AssertionError } from '../error.js';
import { BupkisRegistry } from '../metadata.js';
import {
  type Assertion,
  type AssertionImpl,
  type AssertionParts,
  type AssertionSlots,
  type ParsedResult,
  type ParsedValues,
} from './assertion-types.js';

export const debug = Debug('bupkis:assertion');

export abstract class BupkisAssertion<
  Parts extends AssertionParts,
  Impl extends AssertionImpl<Parts>,
  Slots extends AssertionSlots<Parts>,
> implements Assertion<Parts, Impl, Slots>
{
  readonly id: string;

  constructor(
    readonly parts: Parts,
    readonly slots: Slots,
    readonly impl: Impl,
  ) {
    this.id = slug(`${this}`);
  }

  /**
   * Parses raw arguments synchronously against this `Assertion`'s Slots to
   * determine if they match this `Assertion`.
   *
   * @param args Raw arguments provided to `expect()`
   * @returns Result of parsing attempt
   */

  /**
   * @returns String representation
   */
  public toString(): string {
    const expand = (zodType: z.core.$ZodType | z.ZodType): string => {
      const def = 'def' in zodType ? zodType.def : zodType._zod.def;
      switch (def.type) {
        case 'custom': {
          const meta = BupkisRegistry.get(zodType);
          if (meta?.name) {
            // our name
            return `{${meta.name}}`;
          } else if ('Class' in zodType._zod.bag) {
            // internal Zod class name. will probably break.
            return `{${(zodType._zod.bag.Class as new (...args: any[]) => any).name}}`;
          }
          return '{custom}';
        }
        case 'default':
          return `{${expand((def as z.core.$ZodDefaultDef).innerType)}}`;
        case 'enum':
          return `${Object.keys((def as z.core.$ZodEnumDef<any>).entries as Record<PropertyKey, unknown>).join(' / ')}`;
        case 'intersection':
          return `${expand((def as z.core.$ZodIntersectionDef<z.core.$ZodType>).left)} & ${expand((def as z.core.$ZodIntersectionDef<z.core.$ZodType>).right)}`;
        case 'literal':
          return (def as z.core.$ZodLiteralDef<any>).values
            .map((value) => `"${value}"`)
            .join(' / ');
        case 'map':
          return `{Map<${expand((def as z.core.$ZodMapDef).keyType)}, ${expand((def as z.core.$ZodMapDef).valueType)}>`;
        case 'nonoptional':
          return `${expand((def as z.core.$ZodNonOptionalDef).innerType)}!`;
        case 'nullable':
          return `${expand((def as z.core.$ZodNullableDef).innerType)}? | null`;
        case 'optional':
          return `${expand((def as z.core.$ZodOptionalDef).innerType)}?`;
        case 'record':
          return `{Record<${expand((def as z.core.$ZodRecordDef).keyType)}, ${expand((def as z.core.$ZodRecordDef).valueType)}>`;
        case 'set':
          return `{Set<${expand((def as z.core.$ZodSetDef).valueType)}>`;

        case 'tuple':
          return `[${(def as z.core.$ZodTupleDef).items.map(expand).join(', ')}]`;
        case 'union':
          return (
            (def as z.core.$ZodUnionDef<any>).options as z.core.$ZodType[]
          )
            .map(expand)
            .join(' | ');
        default:
          return `{${def.type}}`;
      }
    };
    return `"${this.slots.map(expand).join(' ')}"`;
  }

  protected maybeParseValuesArgMismatch<Args extends readonly unknown[]>(
    args: Args,
  ): ParsedResult<Parts> | undefined {
    if (this.slots.length !== args.length) {
      return {
        assertion: `${this}`,
        reason: 'Argument count mismatch',
        success: false,
      };
    }
  }

  protected parseSlotForLiteral<Slot extends Slots[number]>(
    slot: Slot,
    i: number,
    arg: unknown,
  ): boolean | ParsedResult<Parts> {
    const meta = BupkisRegistry.get(slot) ?? {};
    // our branded literal slots are also tagged in meta for runtime
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
        /* c8 ignore next */
        throw new TypeError(
          `Invalid metadata for slot ${i} with value ${inspect(arg)}`,
        );
      }
      return true;
    }
    return false;
  }

  /**
   * Translates a {@link z.ZodError} into an {@link AssertionError} with a
   * human-friendly message.
   *
   * @remarks
   * This does not handle parameterized assertions with more than one parameter
   * too cleanly; it's unclear how a test runner would display the expected
   * values. This will probably need a fix in the future.
   * @param stackStartFn The function to start the stack trace from
   * @param zodError The original `ZodError`
   * @param values Values which caused the error
   * @returns New `AssertionError`
   */
  protected translateZodError(
    stackStartFn: (...args: any[]) => any,
    zodError: z.ZodError,
    ...values: ParsedValues<Parts>
  ): AssertionError {
    const flat = z.flattenError(zodError);

    let pretty = flat.formErrors.join('; ');
    for (const [keypath, errors] of Object.entries(flat.fieldErrors)) {
      pretty += `; ${keypath}: ${(errors as unknown[]).join('; ')}`;
    }

    const [actual, ...expected] = values as unknown as [unknown, ...unknown[]];

    return new AssertionError({
      actual,
      expected: expected.length === 1 ? expected[0] : expected,
      message: `Assertion ${this} failed: ${pretty}`,
      operator: `${this}`,
      stackStartFn,
    });
  }
}
