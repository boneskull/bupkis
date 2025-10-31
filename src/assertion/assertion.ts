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
import {
  extractDiffValues,
  generateDiff,
  shouldGenerateDiff,
} from '../diff.js';
import { AssertionError, InvalidMetadataError } from '../error.js';
import { isZodType } from '../guards.js';
import { BupkisRegistry } from '../metadata.js';
import { type StandardSchemaV1 } from '../standard-schema.js';
import { type DefFromZodType } from '../types.js';
import {
  type Assertion,
  type AssertionImpl,
  type AssertionParts,
  type AssertionSlots,
  type ParsedResult,
} from './assertion-types.js';

const debug = createDebug('bupkis:assertion');
const { entries, hasOwn, keys } = Object;
const { isArray } = Array;
/**
 * Modified charmap for {@link slug} to use underscores to replace hyphens (`-`;
 * and for hyphens to replace everything else that needs replacing) and `<` with
 * `_` (to distinguish type args)
 *
 * @see {@link BupkisAssertion.generateUniqueId} for usage
 */
const SLUG_CHARMAP = { ...slug.charmap, '-': '_', '<': '_', '>': '' };

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

  /**
   * @returns String representation
   */
  public toString(): string {
    /**
     * Expands a Zod type into a human-readable string representation.
     *
     * @function
     * @param zodType The Zod type (or internal ZodType) to expand
     * @param wrapCurlies Whether to wrap the result in curly braces
     * @returns String representation of the Zod type
     */
    /* c8 ignore start */
    const expand = <T extends z.core.$ZodType | z.ZodType>(
      zodType: T,
      wrapCurlies = false,
    ): string => {
      /**
       * Finds a `ZodTypeDef` within a Zod type or internal Zod type
       *
       * @function
       */
      const getDef = <T extends z.core.$ZodType | z.ZodType>(zodType: T) =>
        ('def' in zodType
          ? zodType.def
          : zodType._zod.def) as DefFromZodType<T>;

      let repr = '';
      const meta = BupkisRegistry.get(zodType);
      if (meta?.name) {
        // our name
        repr = meta.name;
      } else {
        // overrides for certain Zod types which have internal structure
        if (isZodType(zodType, 'custom')) {
          // handles z.instanceof
          repr = zodType._zod.bag.Class?.name ?? 'custom';
        } else if (isZodType(zodType, 'date')) {
          repr = 'Date';
        } else if (isZodType(zodType, 'array')) {
          repr = `${expand(getDef(zodType).element)}[]`;
        } else if (isZodType(zodType, 'default')) {
          repr = `{${expand(zodType.unwrap())}}`;
        } else if (isZodType(zodType, 'enum')) {
          repr = `${keys(getDef(zodType).entries).join(' / ')}`;
        } else if (isZodType(zodType, 'function')) {
          const def = getDef(zodType);
          const { input, output } = def;
          const params = input
            ? isZodType(input, 'tuple')
              ? `[${getDef(input)
                  .items.map((p) => expand(p))
                  .join(', ')}]`
              : expand(input)
            : '()';
          const returns = output ? expand(output) : 'void';
          repr = `(${params}) => ${returns}`;
        } else if (isZodType(zodType, 'intersection')) {
          const def = getDef(zodType);
          repr = `${expand(def.left)} & ${expand(def.right)}`;
        } else if (isZodType(zodType, 'literal')) {
          repr = getDef(zodType)
            .values.map((value) => `'${value}'`)
            .join(' / ');
        } else if (isZodType(zodType, 'map')) {
          repr = `Map<${expand(getDef(zodType).keyType)}, ${expand(getDef(zodType).valueType)}>`;
        } else if (isZodType(zodType, 'nonoptional')) {
          repr = `${expand(getDef(zodType).innerType)}!`;
        } else if (isZodType(zodType, 'nullable')) {
          repr = `${expand(getDef(zodType).innerType)}? | null`;
        } else if (isZodType(zodType, 'optional')) {
          repr = `${expand(getDef(zodType).innerType)}?`;
        } else if (isZodType(zodType, 'promise')) {
          repr = `Promise<${expand(zodType.unwrap())}>`;
        } else if (isZodType(zodType, 'never')) {
          repr = 'NEVER';
        } else if (isZodType(zodType, 'record')) {
          repr = `Record<${expand(getDef(zodType).keyType)}, ${expand(getDef(zodType).valueType)}>`;
        } else if (isZodType(zodType, 'set')) {
          repr = `Set<${expand(getDef(zodType).valueType)}>`;
        } else if (isZodType(zodType, 'symbol')) {
          repr = 'Symbol';
        } else if (isZodType(zodType, 'tuple')) {
          repr = `[${getDef(zodType)
            .items.map((value) => expand(value))
            .join(', ')}]`;
        } else if (isZodType(zodType, 'union')) {
          repr = getDef(zodType)
            .options.map((value) => expand(value))
            .join(' | ');
        } else if (isZodType(zodType, 'object')) {
          const objEntries = entries(zodType.shape);
          if (objEntries.length) {
            const pairs = objEntries.map(
              ([key, zodTypeValue]) => `${key}: ${expand(zodTypeValue)}`,
            );
            repr = `{ ${pairs.join('; ')} }`;
          } else {
            repr = 'object';
          }
        } else {
          repr = getDef(zodType).type;
        }
      }
      return wrapCurlies ? `{${repr}}` : repr;
    };
    /* c8 ignore stop */
    return `"${this.slots
      .map((slot) =>
        hasOwn(BupkisRegistry.get(slot) ?? {}, kStringLiteral)
          ? expand(slot)
          : expand(slot, true),
      )
      .join(' ')}"`;
  }

  /**
   * Translates Standard Schema issues into an {@link AssertionError} with a
   * human-friendly message.
   *
   * @param issues The Standard Schema issues from validation failure
   * @param stackStartFn The function to start the stack trace from
   * @param values Values which caused the error
   * @returns New `AssertionError`
   */
  protected fromStandardSchemaIssues<Values>(
    issues: ReadonlyArray<StandardSchemaV1.Issue>,
    stackStartFn: (...args: any[]) => any,
    values: Values,
  ): AssertionError {
    const subject: unknown = isArray(values) ? values[0] : values;

    const issueMessages = issues
      .map((issue) => {
        const pathStr = issue.path
          ? `at ${issue.path
              .map((segment) =>
                typeof segment === 'object' && 'key' in segment
                  ? segment.key
                  : segment,
              )
              .join('.')}: `
          : '';
        return `  ${pathStr}${issue.message}`;
      })
      .join('\n');

    return new AssertionError({
      actual: subject,
      id: this.id,
      message: `Assertion ${this} failed:\n${issueMessages}`,
      stackStartFn,
    });
  }

  /**
   * Translates a `ZodError` into an {@link AssertionError} with a human-friendly
   * message.
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
  protected fromZodError<Values>(
    zodError: z.ZodError,
    stackStartFn: (...args: any[]) => any,
    values: Values,
  ): AssertionError {
    const subject: unknown = isArray(values) ? values[0] : values;

    const { actual, expected } = extractDiffValues(zodError, subject);

    // Only use custom message if we could extract diff values
    if (shouldGenerateDiff(actual, expected)) {
      // Use jest-diff to generate rich, colored diff output
      const diffOutput = generateDiff(expected, actual, {
        aAnnotation: 'expected',
        bAnnotation: 'actual',
        expand: false,
        includeChangeCounts: true,
      });

      const message = diffOutput
        ? `Assertion ${this} failed:\n${diffOutput}`
        : `Assertion ${this} failed: values are not equal`;

      return new AssertionError({
        actual,
        expected,
        id: this.id,
        message,
        stackStartFn,
      });
    } else {
      // Fall back to Zod's prettified error message
      const pretty = z.prettifyError(zodError).slice(2);
      return new AssertionError({
        actual: subject,
        id: this.id,
        message: `Assertion ${this} failed:\n${pretty}`,
        stackStartFn,
      });
    }
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
