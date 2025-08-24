import { z } from 'zod';

import { kStringLiteral } from './constant.js';

/**
 * Metadata stored in Zod registry
 */
export type BupkisMeta = z.infer<typeof BupkisRegistrySchema>;

/**
 * Zod metadata registry for Bupkis
 */
export const bupkisRegistry = z.registry<BupkisMeta>();

const BaseBupkisRegistrySchema = z.object({
  [kStringLiteral]: z.literal(true),
});

export const BupkisRegistrySchema = z.union([
  z.object({
    ...BaseBupkisRegistrySchema.shape,
    value: z.string(),
    values: z.never().optional(),
  }),
  z.object({
    ...BaseBupkisRegistrySchema.shape,
    value: z.never().optional(),
    values: z.tuple([z.string()]).rest(z.string()).readonly(),
  }),
]);
