// Drop `never` elements from a tuple while keeping it a tuple

import { z } from 'zod/v4';

import type { Assertion } from './assertion/assertion.js';
import type { BuiltinAssertion } from './assertion/types.js';

import { type Assertions } from './assertion/implementations.js';
import { type InferredExpectSlots } from './expect.js';

export type NoNeverTuple<T extends readonly unknown[]> = T extends readonly [
  infer First,
  ...infer Rest,
]
  ? [First] extends [never]
    ? readonly [...NoNeverTuple<Rest>]
    : readonly [First, ...NoNeverTuple<Rest>]
  : readonly [];

// Create a padded function signature
export type PaddedSignature<T extends BuiltinAssertion> =
  T extends Assertion<infer _, infer Parts>
    ? (...args: PadTuple<InferredExpectSlots<Parts>, MaxArity>) => void
    : never;
// Find maximum length across all assertion signatures
type AllSignatureLengths<T extends readonly BuiltinAssertion[]> =
  T extends readonly [
    infer First extends BuiltinAssertion,
    ...infer Rest extends readonly BuiltinAssertion[],
  ]
    ? [First] extends [Assertion<infer _, infer Parts>]
      ? AllSignatureLengths<Rest> | Length<InferredExpectSlots<Parts>>
      : AllSignatureLengths<Rest>
    : never;
// ————————————————————————————————————————————————————————————————
// Utility types for padding function signatures to same arity
// ————————————————————————————————————————————————————————————————
// Get the length of a tuple type
type Length<T extends readonly unknown[]> = T['length'];
type MaxArity = AllSignatureLengths<typeof Assertions>;
// Pad a tuple to a specific length with optional never parameters
type PadTuple<
  T extends readonly unknown[],
  TargetLength extends number,
  Current extends readonly unknown[] = T,
> = Current['length'] extends TargetLength
  ? Current
  : PadTuple<T, TargetLength, readonly [...Current, never?]>;

export const satisfies = <Actual, Expected = Actual>(
  actual: Actual,
  expected: Expected,
  visitedActual = new WeakSet(),
  visitedExpected = new WeakSet(),
): boolean => {
  if (typeof expected !== 'object' || expected === null) {
    return actual === (expected as unknown as Actual);
  }

  if (typeof actual !== 'object' || actual === null) {
    return false;
  }

  // Check for circular references
  if (visitedActual.has(actual) || visitedExpected.has(expected)) {
    // If we've seen both objects before, assume they match to avoid infinite recursion
    // This is a conservative approach - in practice, circular structures should match
    // if they have the same structure
    return visitedActual.has(actual) && visitedExpected.has(expected);
  }

  // Mark objects as visited
  visitedActual.add(actual);
  visitedExpected.add(expected);

  for (const key of Object.keys(expected)) {
    if (key in actual) {
      if (
        !satisfies(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (actual as any)[key],
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (expected as any)[key],
          visitedActual,
          visitedExpected,
        )
      ) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
};

/**
 * @internal
 */
export const shallowSatisfiesShape = (param: object): z.ZodRawShape => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return Object.fromEntries(
    Object.entries(param).map(([key, value]) => {
      if (value instanceof RegExp) {
        return [key, z.coerce.string().regex(value)];
      }
      if (typeof value === 'string') {
        return [key, z.coerce.string().pipe(z.literal(value))];
      }
      if (typeof value === 'object' && value !== null) {
        return [key, z.object(shallowSatisfiesShape(value as object))];
      }
      return [key, z.literal(value)];
    }),
  );
};
