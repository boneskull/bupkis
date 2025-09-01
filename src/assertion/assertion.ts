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
    const expand = (zodType: z.ZodType): string => {
      switch (zodType.def.type) {
        case 'custom': {
          const meta = BupkisRegistry.get(zodType);
          if (meta?.name) {
            // our name
            return `${meta.name}`;
          } else if ('Class' in zodType._zod.bag) {
            // internal Zod class name. will probably break.
            return (zodType._zod.bag.Class as new (...args: any[]) => any).name;
          }
          return 'custom';
        }
        case 'enum':
          return `${(zodType as z.ZodEnum<any>).options.join(' / ')}`;
        case 'literal':
          return [...(zodType as z.ZodLiteral).def.values].join(' / ');
        case 'union':
          return ((zodType as z.ZodUnion<any>).options as z.ZodType[])
            .map(expand)
            .join(' | ');
        // falls through
        default:
          return `{${zodType.def.type}}`;
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

  protected parseSlotForLiteral<T extends (typeof this.slots)[number]>(
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

  // TODO: support stackStartFn
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
    const [actual, expected] = values as unknown as [unknown, unknown];
    return new AssertionError({
      actual,
      expected,
      message: `Assertion ${this} failed: ${pretty}`,
      operator: `${this}`,
      stackStartFn,
    });
  }
}
