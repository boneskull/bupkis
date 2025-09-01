/**
 * Provides {@link slotify}, which converts {@link AssertionParts} into
 * {@link AssertionSlots}.
 *
 * @packageDocumentation
 */

import { z } from 'zod/v4';

import type {
  AssertionPart,
  AssertionParts,
  AssertionSlots,
  PhraseLiteral,
  PhraseLiteralChoice,
} from './assertion-types.js';

import { kStringLiteral } from '../constant.js';
import { isPhraseLiteral, isPhraseLiteralChoice } from '../guards.js';
import { BupkisRegistry } from '../metadata.js';

const PhraseLiteralSchema: z.ZodType<PhraseLiteral> = z
  .string()
  .regex(/^(?!not\s+)/)
  .describe('Phrase Literal');

const PhraseLiteralChoiceSchema: z.ZodType<PhraseLiteralChoice> = z
  .tuple([PhraseLiteralSchema], PhraseLiteralSchema)
  .readonly()
  .describe('Phrase Literal Choice');

const AssertionPartSchema: z.ZodType<AssertionPart> = z.union([
  PhraseLiteralSchema,
  PhraseLiteralChoiceSchema,
  z.instanceof(z.ZodType).describe('Assertion Part'),
]);

const AssertionPartsSchema: z.ZodType<AssertionParts> = z
  .tuple([AssertionPartSchema], AssertionPartSchema)
  .readonly()
  .describe('Assertion Parts');

/**
 * This cannot be assigned to `z.ZodType<AssertionSlots>` because of how
 * complicated `AssertionSlots` is.
 */
const AssertionSlotsSchema = z
  .tuple([z.instanceof(z.ZodType)], z.instanceof(z.ZodType))
  .readonly()
  .describe('Assertion Slots');

const SlotifyFnSchema = z.function({
  input: [AssertionPartsSchema],
  output: AssertionSlotsSchema,
});

const slotifyImpl = SlotifyFnSchema.implement((parts) => {
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
});

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
  return slotifyImpl(parts) as AssertionSlots<Parts>;
};
