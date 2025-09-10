/**
 * Defines Bupkis' Zod metadata registry
 *
 * @packageDocumentation
 * @internal
 */

import { z } from 'zod/v4';

import { kStringLiteral } from './constant.js';

/**
 * Metadata stored in Zod registry
 */
type BupkisMeta = z.infer<typeof BupkisRegistrySchema>;

/**
 * Zod metadata registry for Bupkis
 */
export const BupkisRegistry = z.registry<BupkisMeta>();

/**
 * Base schema for all metadata
 */
const BaseBupkisMetadataSchema = z.object({
  description: z.string().optional().describe('Human-friendly description'),
  name: z
    .string()
    .optional()
    .describe('Internal name; used by Assertion.prototype.toString()'),
});

/**
 * Base schema for metadata referring to string literal flag
 */
const StringLiteralFlagSchema = z.object({
  ...BaseBupkisMetadataSchema.shape,
  [kStringLiteral]: z.literal(true),
});

/**
 * Final schema for Bupkis registry
 */
// TODO: Figure out how to make this rule allow type-only usage. Or just export it and tag it.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BupkisRegistrySchema = z.union([
  z.object({ ...BaseBupkisMetadataSchema.shape }),
  z.object({
    ...StringLiteralFlagSchema.shape,
    value: z.string(),
    values: z.never().optional(),
  }),
  z.object({
    ...StringLiteralFlagSchema.shape,
    value: z.never().optional(),
    // eslint-disable-next-line no-restricted-syntax
    values: z.tuple([z.string()]).rest(z.string()).readonly(),
  }),
]);
