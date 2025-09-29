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
import { z } from 'zod/v4';

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
  isZodType,
} from '../guards.js';
import { BupkisRegistry } from '../metadata.js';

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
): AssertionSlots<Parts> =>
  parts.flatMap((part, index) => {
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
          `PhraseLiteral at parts[${index}] must not start with "not ": ${inspect(
            part,
          )}`,
        );
      }
      result.push(createPhraseLiteralSchema(part));
    } else if (typeof part === 'string' && part === 'and') {
      // Special case: "and" is allowed when followed by a ZodType (for conjunctify)
      if (index + 1 >= parts.length || !isZodType(parts[index + 1])) {
        throw new AssertionImplementationError(
          `"and" at parts[${index}] must be followed by a Zod schema but was followed by ${
            index + 1 >= parts.length
              ? 'nothing'
              : `${inspect(parts[index + 1])} (${typeof parts[index + 1]})`
          }`,
        );
      }
      result.push(createPhraseLiteralSchema(part));
    } else {
      if (!isZodType(part)) {
        throw new AssertionImplementationError(
          `Expected Zod schema, phrase literal, or phrase literal choice at parts[${index}] but received ${inspect(
            part,
          )} (${typeof part})`,
        );
      }
      result.push(part);
    }
    return result;
  }) as unknown as AssertionSlots<Parts>;

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
): z.core.$ZodBranded<z.ZodLiteral<string>, 'string-literal'> =>
  z
    .literal(part)
    .brand('string-literal')
    .register(BupkisRegistry, {
      [kStringLiteral]: true,
      values: part,
    });

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
): z.core.$ZodBranded<z.ZodLiteral<string>, 'string-literal'> =>
  z
    .literal(part)
    .brand('string-literal')
    .register(BupkisRegistry, {
      [kStringLiteral]: true,
      value: part,
    });
