// Drop `never` elements from a tuple while keeping it a tuple

import type { Assertion } from './assertion/assertion.js';
import { Assertions } from './assertion/implementations.js';
import type { AnyAssertion } from './assertion/types.js';
import { InferredExpectSlots } from './expect.js';

export type NoNeverTuple<T extends readonly unknown[]> = T extends readonly [
  infer First,
  ...infer Rest,
]
  ? [First] extends [never]
    ? readonly [...NoNeverTuple<Rest>]
    : readonly [First, ...NoNeverTuple<Rest>]
  : readonly []; // ————————————————————————————————————————————————————————————————
// Utility types for padding function signatures to same arity
// ————————————————————————————————————————————————————————————————
// Get the length of a tuple type
type Length<T extends readonly unknown[]> = T['length'];
// Find maximum length across all assertion signatures
type AllSignatureLengths<T extends readonly AnyAssertion[]> =
  T extends readonly [
    infer First extends AnyAssertion,
    ...infer Rest extends readonly AnyAssertion[],
  ]
    ? First extends Assertion<infer Parts>
      ? Length<InferredExpectSlots<Parts>> | AllSignatureLengths<Rest>
      : AllSignatureLengths<Rest>
    : never;
type MaxArity = AllSignatureLengths<typeof Assertions>;
// Pad a tuple to a specific length with optional never parameters
type PadTuple<
  T extends readonly unknown[],
  TargetLength extends number,
  Current extends readonly unknown[] = T,
> = Current['length'] extends TargetLength
  ? Current
  : PadTuple<T, TargetLength, readonly [...Current, never?]>;
// Create a padded function signature
export type PaddedSignature<T extends AnyAssertion> =
  T extends Assertion<infer Parts>
    ? (...args: PadTuple<InferredExpectSlots<Parts>, MaxArity>) => void
    : never;
