/**
 * Defines Bupkis' Zod metadata registry
 *
 * @packageDocumentation
 */

import { z } from 'zod';

import { kStringLiteral } from './constant.js';

/**
 * Metadata stored in Zod registry
 *
 * @knipignore
 */
export type BupkisMeta = z.infer<typeof BupkisRegistrySchema>;

/**
 * Zod metadata registry for Bupkis
 */
export const BupkisRegistry = z.registry<BupkisMeta>();
/**
 * Set of all fast-check function names that return fc.Arbitrary types.
 * Extracted from fast-check type definitions.
 */
export const FC_ARBITRARY_FUNCTIONS = [
  // Basic primitives
  'boolean',
  'falsy',
  'float',
  'double',
  'integer',
  'nat',
  'maxSafeInteger',
  'maxSafeNat',
  'bigInt',

  // String generators
  'mixedCase',
  'string',
  'base64String',
  'stringMatching',
  'lorem',

  // Constants and combinators
  'constant',
  'constantFrom',
  'mapToConstant',
  'option',

  // Complex objects
  'anything',
  'object',
  'json',
  'jsonValue',

  // Functions
  'compareBooleanFunc',
  'compareFunc',
  'func',

  // Date and time
  'date',

  // Network and web
  'ipV4',
  'ipV4Extended',
  'ipV6',
  'domain',
  'webAuthority',
  'webSegment',
  'webFragments',
  'webPath',
  'webQueryParameters',
  'webUrl',
  'emailAddress',

  // Identifiers
  'ulid',
  'uuid',

  // Typed arrays
  'int8Array',
  'uint8Array',
  'uint8ClampedArray',
  'int16Array',
  'uint16Array',
  'int32Array',
  'uint32Array',
  'float32Array',
  'float64Array',
  'bigInt64Array',
  'bigUint64Array',

  // custom
  'primitive',
  'positiveNumber',
  'negativeNumber',
  'truthy',
] as const;

/**
 * Base schema for all metadata
 */
const BaseBupkisMetadataSchema = z.object({
  description: z.string().optional().describe('Human-friendly description'),
  name: z
    .string()
    .optional()
    .describe('Internal name; used by Assertion.prototype.toString()'),
  validInput: z
    .enum([...FC_ARBITRARY_FUNCTIONS])
    .optional()
    .describe('String representing valid input'),
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
    values: z.tuple([z.string()]).rest(z.string()).readonly(),
  }),
]);
