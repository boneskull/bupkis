/**
 * Provides {@link slotify}, which converts {@link AssertionParts} (phrases, Zod
 * schemas) into {@link AssertionSlots} (Zod schemas only).
 *
 * `AssertionSlots` are used to match assertions against arguments to
 * `expect()`.
 *
 * @packageDocumentation
 */

import { inspect } from 'util';
import { z } from 'zod';

import type {
  AssertionParts,
  AssertionSlots,
  PhraseLiteral,
  PhraseLiteralChoice,
} from './assertion-types.js';

import { kStringLiteral } from '../constant.js';
import { AssertionImplementationError } from '../error.js';
import {
  isPhrase,
  isPhraseLiteral,
  isPhraseLiteralChoice,
  isStandardSchema,
  isZodType,
} from '../guards.js';
import { BupkisRegistry } from '../metadata.js';

/**
 * This cache saves previously-computed _slotifications_ to speed up
 * `createAssertion`/`createAsyncAssertion`. While these are unlikely to be
 * called repeatedly with the same values, it's still extra work that doesn't
 * need to be done more than once.
 */
const slotifyCache = new WeakMap<AssertionParts, AssertionSlots>();

/**
 * Cache for phrase literal schemas to avoid recreating identical Zod schemas.
 * This significantly reduces the "Definition (core.js)" overhead seen in flame
 * graphs since phrase literals like 'to be a string' are reused across many
 * assertions.
 */
const phraseLiteralSchemaCache = new Map<
  PhraseLiteral,
  z.core.$ZodBranded<z.ZodLiteral<string>, 'string-literal'>
>();

/**
 * Cache for phrase literal choice schemas to avoid recreating identical Zod
 * schemas. This optimizes cases where multiple phrase options like ['to be a',
 * 'to be an'] are reused across different assertions.
 */
const phraseLiteralChoiceSchemaCache = new Map<
  PhraseLiteralChoice,
  z.core.$ZodBranded<z.ZodLiteral<string>, 'string-literal'>
>();

/**
 * Builds slots out of assertion parts.
 *
 * @remarks
 * This function converts {@link AssertionParts} into {@link AssertionSlots} by
 * processing string literals and Zod schemas, registering metadata for runtime
 * introspection, and handling validation constraints such as preventing "not "
 * prefixes in string literal parts.
 * @function
 * @param parts Assertion parts
 * @returns Slots
 * @internal
 */
export const slotify = <const Parts extends AssertionParts>(
  parts: Parts,
): AssertionSlots<Parts> => {
  if (slotifyCache.has(parts)) {
    return slotifyCache.get(parts)!;
  }
  const slots = parts.flatMap((part, index) => {
    const result: z.ZodType[] = [];
    if (index === 0 && isPhrase(part)) {
      result.push(z.unknown().describe('subject'));
    }

    if (isPhraseLiteralChoice(part)) {
      if (part.some((p) => p.startsWith('not '))) {
        throw new AssertionImplementationError(
          `PhraseLiteralChoice at parts[${index}] must not include phrases starting with "not "; refactor to be a positive assertion: ${inspect(
            part,
          )}`,
        );
      }
      result.push(createPhraseLiteralChoiceSchema(part));
    } else if (isPhraseLiteral(part)) {
      if (part.startsWith('not ')) {
        throw new AssertionImplementationError(
          `PhraseLiteral at parts[${index}] must not start with "not "; refactor to be a positive assertion: ${inspect(
            part,
          )}`,
        );
      }
      result.push(createPhraseLiteralSchema(part));
    } else if (typeof part === 'string' && part === 'and') {
      // Special case: "and" is allowed when followed by a schema (Zod or Standard Schema)
      const nextPart = parts[index + 1];
      if (
        index + 1 >= parts.length ||
        !(isZodType(nextPart) || isStandardSchema(nextPart))
      ) {
        throw new AssertionImplementationError(
          `"and" at parts[${index}] must be followed by a schema but was followed by ${
            index + 1 >= parts.length
              ? 'nothing'
              : `${inspect(nextPart)} (${typeof nextPart})`
          }`,
        );
      }
      result.push(createPhraseLiteralSchema(part));
    } else {
      // Schema parts: either Zod or Standard Schema
      if (isZodType(part)) {
        result.push(part);
      } else if (isStandardSchema(part)) {
        // Convert Standard Schema to Zod schema for slotification
        // Slots use Zod's safeParse, so we need a Zod wrapper
        const zodWrapper = z.custom(
          (value: unknown) => {
            const validationResult = part['~standard'].validate(value);
            // Must be synchronous for slots
            if (validationResult instanceof Promise) {
              return false;
            }
            return !validationResult.issues;
          },
          { error: `Failed Standard Schema validation` },
        );
        result.push(zodWrapper);
      } else {
        throw new AssertionImplementationError(
          `Expected schema, phrase literal, or phrase literal choice at parts[${index}] but received ${inspect(
            part,
          )} (${typeof part})`,
        );
      }
    }
    return result;
  }) as unknown as AssertionSlots<Parts>;
  slotifyCache.set(parts, slots as AssertionSlots);
  return slots;
};

/**
 * Creates a schema for a choice of phrase literals
 *
 * This schema is a branded literal schema to differentiate regular strings from
 * phrases.
 *
 * @function
 * @param part Phrase literal choice (tuple of strings)
 * @returns Schema
 */
const createPhraseLiteralChoiceSchema = (
  part: PhraseLiteralChoice,
): z.core.$ZodBranded<z.ZodLiteral<string>, 'string-literal'> => {
  // Check cache first to avoid recreating identical schemas
  if (phraseLiteralChoiceSchemaCache.has(part)) {
    return phraseLiteralChoiceSchemaCache.get(part)!;
  }

  const schema = z
    .literal(part)
    .brand('string-literal')
    .register(BupkisRegistry, {
      [kStringLiteral]: true,
      values: part,
    });

  // Cache the schema for future use
  phraseLiteralChoiceSchemaCache.set(part, schema);
  return schema;
};

/**
 * Creates a schema for a single phrase literal
 *
 * This schema is a branded literal schema to differentiate regular strings from
 * phrases.
 *
 * @function
 * @param part Phrase literal (string)
 * @returns Schema
 */
const createPhraseLiteralSchema = (
  part: PhraseLiteral,
): z.core.$ZodBranded<z.ZodLiteral<string>, 'string-literal'> => {
  // Check cache first to avoid recreating identical schemas
  if (phraseLiteralSchemaCache.has(part)) {
    return phraseLiteralSchemaCache.get(part)!;
  }

  const schema = z
    .literal(part)
    .brand('string-literal')
    .register(BupkisRegistry, {
      [kStringLiteral]: true,
      value: part,
    });

  // Cache the schema for future use
  phraseLiteralSchemaCache.set(part, schema);
  return schema;
};
