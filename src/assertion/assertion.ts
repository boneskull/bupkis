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

import createDebug from 'debug';
import slug from 'slug';
import { type ArrayValues } from 'type-fest';
import { inspect } from 'util';
import { z } from 'zod/v4';

import { kStringLiteral } from '../constant.js';
import { AssertionError, InvalidMetadataError } from '../error.js';
import { BupkisRegistry } from '../metadata.js';
import {
  type Assertion,
  type AssertionImpl,
  type AssertionMetadata,
  type AssertionParts,
  type AssertionSlots,
  type ParsedResult,
  type ParsedValues,
} from './assertion-types.js';

const debug = createDebug('bupkis:assertion');

/**
 * Modified charmap for {@link slug} to use underscores to replace hyphens (`-`;
 * and for hyphens to replace everything else that needs replacing) and `<` with
 * `_` (to distinguish type args)
 *
 * @see {@link BupkisAssertion.generateUniqueId} for usage
 */
const SLUG_CHARMAP = { ...slug.charmap, '-': '_', '<': '_', '>': '' };

/**
 * Registry of assertion metadata.
 */
export const AssertionMetadataRegistry = new WeakMap<
  BupkisAssertion<any, any, any>,
  AssertionMetadata
>();

/**
 * Base abstract class for ALL assertions.
 */
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
    this.id = this.generateAssertionId();
    debug('ℹ Created assertion %s', this);
  }

  public metadata(): AssertionMetadata | undefined {
    return AssertionMetadataRegistry.get(this);
  }

  /**
   * @returns String representation
   */
  public toString(): string {
    const expand = (
      zodType: z.core.$ZodType | z.ZodType,
      wrapCurlies = false,
    ): string => {
      const def = 'def' in zodType ? zodType.def : zodType._zod.def;
      let repr = '';
      const meta = BupkisRegistry.get(zodType);
      if (meta?.name) {
        // our name
        repr = meta.name;
      } else {
        switch (def.type) {
          case 'custom': {
            // internal Zod class name. will probably break.
            try {
              repr =
                'Class' in zodType._zod.bag
                  ? `${(zodType._zod.bag.Class as new (...args: any[]) => any).name}`
                  : 'custom';
            } catch (err) {
              debug(
                `⚠️ WARNING: Unable to extract custom class name from Zod type(did Zod's API change?): ${err}`,
              );
              repr = 'custom';
            }

            break;
          }
          case 'default':
            repr = `{${expand((def as z.core.$ZodDefaultDef).innerType)}}`;
            break;
          case 'enum':
            repr = `${Object.keys((def as z.core.$ZodEnumDef<any>).entries as Record<PropertyKey, unknown>).join(' / ')}`;
            break;
          case 'intersection':
            repr = `${expand((def as z.core.$ZodIntersectionDef<z.core.$ZodType>).left)} & ${expand((def as z.core.$ZodIntersectionDef<z.core.$ZodType>).right)}`;
            break;
          case 'literal':
            repr = (def as z.core.$ZodLiteralDef<any>).values
              .map((value) => `'${value}'`)
              .join(' / ');
            break;
          case 'map':
            repr = `Map<${expand((def as z.core.$ZodMapDef).keyType)}, ${expand((def as z.core.$ZodMapDef).valueType)}>`;
            break;
          case 'nonoptional':
            repr = `${expand((def as z.core.$ZodNonOptionalDef).innerType)}!`;
            break;
          case 'nullable':
            repr = `${expand((def as z.core.$ZodNullableDef).innerType)}? | null`;
            break;
          case 'optional':
            repr = `${expand((def as z.core.$ZodOptionalDef).innerType)}?`;
            break;
          case 'record':
            repr = `Record<${expand((def as z.core.$ZodRecordDef).keyType)}, ${expand((def as z.core.$ZodRecordDef).valueType)}>`;
            break;
          case 'set':
            repr = `Set<${expand((def as z.core.$ZodSetDef).valueType)}>`;
            break;
          case 'tuple':
            repr = `[${(def as z.core.$ZodTupleDef).items.map((value) => expand(value)).join(', ')}]`;
            break;
          case 'union':
            repr = (
              (def as z.core.$ZodUnionDef<any>).options as z.core.$ZodType[]
            )
              .map((value) => expand(value))
              .join(' | ');
            break;
          default:
            repr = def.type;
            break;
        }
      }
      return wrapCurlies ? `{${repr}}` : repr;
    };
    return `"${this.slots
      .map((slot) =>
        Object.hasOwn(BupkisRegistry.get(slot) ?? {}, kStringLiteral)
          ? expand(slot)
          : expand(slot, true),
      )
      .join(' ')}"`;
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
  protected fromZodError<Parts extends AssertionParts>(
    zodError: z.ZodError,
    stackStartFn: (...args: any[]) => any,
    values: ParsedValues<Parts>,
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

  protected maybeParseValuesArgMismatch<Args extends readonly unknown[]>(
    args: Args,
  ): ParsedResult<Parts> | undefined {
    if (this.slots.length !== args.length) {
      return {
        success: false,
      };
    }
  }

  /**
   * TODO: Fix the return types here. This is all sorts of confusing.
   *
   * @param slot Slot to check
   * @param slotIndex Index of slot
   * @param rawArg Raw argument
   * @returns
   */
  protected parseSlotForLiteral<Slot extends ArrayValues<Slots>>(
    slot: Slot,
    slotIndex: number,
    rawArg: unknown,
  ): boolean | ParsedResult<Parts> {
    const meta = BupkisRegistry.get(slot) ?? {};
    // our branded literal slots are also tagged in meta for runtime
    if (kStringLiteral in meta) {
      if ('value' in meta) {
        if (rawArg !== meta.value) {
          return {
            success: false,
          };
        }
      } else if ('values' in meta) {
        const allowed = meta.values as readonly string[];
        if (!allowed.includes(`${rawArg}`)) {
          return {
            success: false,
          };
        }
      } else {
        /* c8 ignore next */
        throw new InvalidMetadataError(
          `Invalid metadata for slot ${slotIndex} with value ${inspect(rawArg)}`,
          { metadata: meta },
        );
      }
      return true;
    }
    return false;
  }

  /**
   * Generates a unique¹ ID for this assertion by combining content, structure,
   * and type information.
   *
   * - `s` is slot count
   * - `p` is part count
   *
   * Slugifies the string representation of the assertion. Does not collapse
   * adjacent hyphens, as hyphens are significant in phrase literals.
   *
   * @remarks
   * ¹: "Unique" here means "unique enough" for practical purposes. This is not
   * cryptographically unique, nor does it need to be. The goal is to avoid
   * collisions in common scenarios while keeping the ID human-readable.
   * @returns A human-readable unique identifier
   */
  private generateAssertionId(): string {
    const baseSlug = slug(`${this}`, {
      charmap: SLUG_CHARMAP,
    });

    // Add structural signature for additional uniqueness
    // Use simple slot count and parts count as differentiators
    const signature = `${this.slots.length}s${this.parts.length}p`;

    return `${baseSlug}-${signature}`;
  }
}
