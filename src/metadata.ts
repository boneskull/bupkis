import { z } from 'zod';

// ————————————————————————————————————————————————————————————————
// Types
// ————————————————————————————————————————————————————————————————
/**
 * Symbol flagging the value as a string literal
 */
export const kStringLiteral = Symbol('bupkis-string-literal');

/**
 * Metadata stored in Zod registry
 */
export type BupkisMeta = {
  [kStringLiteral]: true;
} & (
  | { value: string; values?: never }
  | { value?: never; values: readonly [string, ...string[]]; }
);

/**
 * Zod metadata registry for Bupkis
 */
export const bupkisRegistry = z.registry<BupkisMeta>();
