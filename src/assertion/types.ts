/**
 * Strips `never` from a tuple type, retaining tupleness.
 */

export type NoNeverTuple<T extends readonly unknown[]> = T extends readonly [
  infer First,
  ...infer Rest,
]
  ? [First] extends [never]
    ? readonly [...NoNeverTuple<Rest>]
    : readonly [First, ...NoNeverTuple<Rest>]
  : readonly [];
