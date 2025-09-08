/**
 * Types used throughout _BUPKIS_, mainly related to the
 * `expect()`/`expectAsync()` API.
 *
 * @packageDocumentation
 */

import type {
  ArrayValues,
  NonEmptyTuple,
  Constructor as TypeFestConstructor,
} from 'type-fest';
import type { z } from 'zod/v4';

import type {
  AnyAssertion,
  AnyAsyncAssertion,
  AnyAsyncAssertions,
  AnySyncAssertion,
  AnySyncAssertions,
  AssertionPart,
  AssertionParts,
  AssertionSlot,
  NoNeverTuple,
  PhraseLiteral,
  PhraseLiteralChoice,
  PhraseLiteralChoiceSlot,
  PhraseLiteralSlot,
} from './assertion/assertion-types.js';

import { type Expect, type ExpectAsync } from './api.js';

/**
 * Helper type to create negated version of assertion parts. For phrase
 * literals, creates "not phrase" version. For phrase arrays, creates negated
 * versions of each phrase in the array.
 */
export type AddNegation<T extends readonly AssertionPart[]> =
  T extends readonly [
    infer First extends AssertionPart,
    ...infer Rest extends readonly AssertionPart[],
  ]
    ? First extends NonEmptyTuple<string>
      ? readonly [
          {
            [K in keyof First]: First[K] extends string
              ? Negation<First[K]>
              : never;
          },
          ...AddNegation<Rest>,
        ]
      : First extends string
        ? readonly [Negation<First>, ...AddNegation<Rest>]
        : readonly [First, ...AddNegation<Rest>]
    : readonly [];

/**
 * Helper type to concatenate two tuples
 */
export type Concat<
  A extends readonly unknown[],
  B extends readonly unknown[],
> = readonly [...A, ...B];

/**
 * A constructor based on {@link TypeFestConstructor type-fest's Constructor}
 * with a default instance type argument.
 */
export type Constructor<
  T = any,
  Arguments extends unknown[] = any[],
> = TypeFestConstructor<T, Arguments>;

export type FilterAsyncAssertions<T extends readonly AnyAssertion[]> =
  T extends readonly [
    infer S extends AnyAssertion,
    ...infer Rest extends readonly AnyAssertion[],
  ]
    ? S extends AnyAsyncAssertion
      ? readonly [S, ...FilterAsyncAssertions<Rest>]
      : FilterAsyncAssertions<Rest>
    : readonly [];

export type FilterSyncAssertions<T extends readonly AnyAssertion[]> =
  T extends readonly [
    infer S extends AnyAssertion,
    ...infer Rest extends readonly AnyAssertion[],
  ]
    ? S extends AnySyncAssertion
      ? readonly [S, ...FilterSyncAssertions<Rest>]
      : FilterSyncAssertions<Rest>
    : readonly [];

/**
 * Prepares {@link MapExpectSlots} by injecting `unknown` if the `AssertionParts`
 * have no `z.ZodType` in the head position.
 *
 * Also filters out `never` from the resulting tuple to guarantee tupleness.
 *
 * @remarks
 * This is a convenience and I hope it's not too confusing.
 */
export type InferredExpectSlots<Parts extends AssertionParts> = NoNeverTuple<
  Parts extends readonly [infer First extends AssertionPart, ...infer _]
    ? First extends PhraseLiteral | PhraseLiteralChoice
      ? [unknown, ...MapExpectSlots<Parts>]
      : MapExpectSlots<Parts>
    : never
>; /**
 * Maps `AssertionParts` to the corresponding argument types for `expect` and
 * `expectAsync`, as provided by the user.
 *
 * Overloads each phrase literal slot with a negated version using a union.
 */
export type MapExpectSlots<Parts extends readonly AssertionPart[]> =
  Parts extends readonly [
    infer First extends AssertionPart,
    ...infer Rest extends readonly AssertionPart[],
  ]
    ? readonly [
        AssertionSlot<First> extends PhraseLiteralSlot<infer StringLiteral>
          ? Negation<StringLiteral> | StringLiteral
          : AssertionSlot<First> extends PhraseLiteralChoiceSlot<
                infer StringLiterals
              >
            ?
                | ArrayValues<StringLiterals>
                | Negation<ArrayValues<StringLiterals>>
            : AssertionSlot<First> extends z.ZodType
              ? z.infer<AssertionSlot<First>>
              : never,
        ...MapExpectSlots<Rest>,
      ]
    : readonly [];

/**
 * Makes tuple types accept both mutable and readonly variants
 */
export type MutableOrReadonly<T> = T extends readonly (infer U)[]
  ? readonly U[] | U[]
  : T extends readonly [infer First, ...infer Rest]
    ? [First, ...Rest] | readonly [First, ...Rest]
    : T;

/**
 * The type of a `PhraesLiteral` which is negated, e.g. "not to be"
 */
export type Negation<T extends string> = `not ${T}`;

export interface UseFn<
  T extends AnySyncAssertions,
  U extends AnyAsyncAssertions,
> {
  <
    V extends readonly AnyAssertion[],
    W extends FilterSyncAssertions<V>,
    X extends FilterAsyncAssertions<V>,
  >(
    assertions: V,
  ): {
    expect: Expect<Concat<T, W>, Concat<U, X>>;
    expectAsync: ExpectAsync<Concat<U, X>, Concat<T, W>>;
    use: UseFn<Concat<T, W>, Concat<U, X>>;
  };
}
