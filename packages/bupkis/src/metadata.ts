/**
 * Defines Bupkis' Zod metadata registry
 *
 * @packageDocumentation
 */

import { z } from 'zod';

import { kStringLiteral } from './constant.js';

/**
 * Metadata stored in Zod registry
 */
type BupkisMeta = z.infer<typeof _BupkisRegistrySchema>;

/**
 * Zod metadata registry for Bupkis
 */
export const BupkisRegistry = z.registry<BupkisMeta>();

/**
 * Base schema for all metadata
 */
const BaseBupkisMetadataSchema = z.object({
  description: z
    .string()
    .optional()
    .meta({ description: 'Human-friendly description' }),
  name: z
    .string()
    .optional()
    .meta({ description: 'Name used when rendering Assertion as a string' }),
  parameter: z
    .string()
    .optional()
    .meta({ description: 'Parameter "type" to use in documentation' }),
});

/**
 * Base schema for metadata referring to string literal flag
 */
const PhraseLiteralMetadataSchema = z.object({
  ...BaseBupkisMetadataSchema.shape,
  [kStringLiteral]: z.literal(true),
});

/**
 * Final schema for Bupkis registry
 */
// TODO: Figure out how to make this rule allow type-only usage. Or just export it and tag it.

const _BupkisRegistrySchema = z.union([
  z.object({ ...BaseBupkisMetadataSchema.shape }),
  z.object({
    ...PhraseLiteralMetadataSchema.shape,
    value: z.string(),
    values: z.never().optional(),
  }),
  z.object({
    ...PhraseLiteralMetadataSchema.shape,
    value: z.never().optional(),
    // eslint-disable-next-line no-restricted-syntax
    values: z.tuple([z.string()]).rest(z.string()).readonly(),
  }),
]);
