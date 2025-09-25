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

import type { AssertionParts, AssertionSlots } from './assertion-types.js';

import { kStringLiteral } from '../constant.js';
import { AssertionImplementationError } from '../error.js';
import {
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
 */
export const slotify = <const Parts extends AssertionParts>(
  parts: Parts,
): AssertionSlots<Parts> =>
  parts.flatMap((part, index) => {
    const result: z.ZodType[] = [];
    if (index === 0 && (isPhraseLiteralChoice(part) || isPhraseLiteral(part))) {
      result.push(z.unknown().describe('subject'));
    }

    if (isPhraseLiteralChoice(part)) {
      if (part.some((p) => p.startsWith('not '))) {
        throw new AssertionImplementationError(
          `PhraseLiteralChoice at parts[${index}] must not include phrases starting with "not ": ${inspect(
            part,
          )}`,
        );
      }
      result.push(
        z
          .literal(part)
          .brand('string-literal')
          .register(BupkisRegistry, {
            [kStringLiteral]: true,
            values: part,
          }),
      );
    } else if (isPhraseLiteral(part)) {
      if (part.startsWith('not ')) {
        throw new AssertionImplementationError(
          `PhraseLiteral at parts[${index}] must not start with "not ": ${inspect(
            part,
          )}`,
        );
      }
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
