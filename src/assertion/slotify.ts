/**
 * Provides {@link slotify}, which converts {@link AssertionParts} into
 * {@link AssertionSlots}.
 *
 * @packageDocumentation
 */

import { z } from 'zod/v4';

import type { AssertionParts, AssertionSlots } from './assertion-types.js';

import { kStringLiteral } from '../constant.js';
import { isPhraseLiteral, isPhraseLiteralChoice } from '../guards.js';
import { BupkisRegistry } from '../metadata.js';

/**
 * Builds slots out of assertion parts.
 *
 * @remarks
 * This function converts {@link AssertionParts} into {@link AssertionSlots} by
 * processing string literals and Zod schemas, registering metadata for runtime
 * introspection, and handling validation constraints such as preventing "not "
 * prefixes in string literal parts.
 * @param parts Assertion parts
 * @returns Slots
 * @internal
 */
export const slotify = <const Parts extends AssertionParts>(
  parts: Parts,
): AssertionSlots<Parts> => {
  return parts.flatMap((part, index) => {
    const result: z.ZodType[] = [];
    if (index === 0 && (isPhraseLiteralChoice(part) || isPhraseLiteral(part))) {
      result.push(z.unknown().describe('subject'));
    }

    if (isPhraseLiteralChoice(part)) {
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
  }) as unknown as AssertionSlots;
};
