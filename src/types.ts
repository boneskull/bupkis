/**
 * Types used throughout _BUPKIS_
 *
 * @packageDocumentation
 */

import type {
  ArrayValues,
  TupleToUnion,
  Constructor as TypeFestConstructor,
  UnionToIntersection,
} from 'type-fest';
import type { z } from 'zod/v4';

import type {
  AnyAssertion,
  AnyAssertions,
  AnyAsyncAssertion,
  AnyAsyncAssertions,
  AnySyncAssertion,
  AnySyncAssertions,
  AssertionFunctionAsync,
  AssertionFunctionSync,
  AssertionPart,
  AssertionParts,
  AssertionSchemaAsync,
  AssertionSchemaSync,
  AssertionSlot,
  BuiltinAsyncAssertions,
  BuiltinSyncAssertions,
  PhraseLiteral,
  PhraseLiteralChoice,
  PhraseLiteralChoiceSlot,
  PhraseLiteralSlot,
} from './assertion/assertion-types.js';

import { type NoNeverTuple } from './assertion/assertion-types.js';
import {
  type createAssertion,
  type createAsyncAssertion,
} from './assertion/create.js';
import { type UseFn } from './use.js';

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
    ? First extends readonly [string, ...string[]]
      ? readonly [
          {
            [K in keyof First]: First[K] extends string
              ? `not ${First[K]}`
              : never;
          },
          ...AddNegation<Rest>,
        ]
      : First extends string
        ? readonly [`not ${First}`, ...AddNegation<Rest>]
        : readonly [First, ...AddNegation<Rest>]
    : readonly [];

export interface BaseExpect {
  createAssertion: typeof createAssertion;
  createAsyncAssertion: typeof createAsyncAssertion;
  fail(reason?: string): never;
}

export type Constructor<
  T = any,
  Arguments extends unknown[] = any[],
> = TypeFestConstructor<T, Arguments>;

/**
 * The main synchronous assertion function.
 *
 * Contains properties in {@link BaseExpect}.
 *
 * @template T All synchronous assertions available
 * @template U All asynchronous assertions available; for use in
 *   {@link ExpectSyncProps.use}
 */
export type Expect<
  T extends AnySyncAssertions = BuiltinSyncAssertions,
  U extends AnyAsyncAssertions = BuiltinAsyncAssertions,
> = ExpectFunction<T> & ExpectSyncProps<T, U>;

/**
 * Properties and methods available on {@link expect} and {@link expectAsync}.
 */

/**
 * The main asynchronous assertion function.
 *
 * Contains properties in {@link BaseExpect}.
 */
export type ExpectAsync<
  T extends AnyAsyncAssertions = BuiltinAsyncAssertions,
  U extends AnySyncAssertions = BuiltinSyncAssertions,
> = ExpectAsyncFunction<T> & ExpectAsyncProps<T, U>;

/**
 * All overloads for {@link expectAsync}
 */
export type ExpectAsyncFunction<
  T extends AnyAsyncAssertions = BuiltinAsyncAssertions,
> = UnionToIntersection<
  TupleToUnion<{
    [K in keyof T]: T[K] extends AnyAsyncAssertion
      ? (...args: InferredExpectSlots<T[K]['parts']>) => Promise<void>
      : never;
  }>
>;

export interface ExpectAsyncProps<
  T extends AnyAsyncAssertions,
  U extends AnySyncAssertions,
> extends BaseExpect {
  assertions: T;
  use: UseFn<U, T>;
}

/**
 * All overloads for {@link expect}
 */
export type ExpectFunction<
  T extends AnySyncAssertions = BuiltinSyncAssertions,
> = UnionToIntersection<
  TupleToUnion<{
    [K in keyof T]: T[K] extends AnySyncAssertion
      ? (...args: InferredExpectSlots<T[K]['parts']>) => void
      : never;
  }>
>;

export interface ExpectSyncProps<
  T extends AnySyncAssertions,
  U extends AnyAsyncAssertions,
> extends BaseExpect {
  assertions: T;
  use: UseFn<T, U>;
}

/**
 * Infers the type arguments from each assertion in a tuple of assertions.
 *
 * Given `T extends AnyAssertions`, this type returns a tuple where each element
 * is a tuple of the three type arguments for the corresponding assertion:
 *
 * - For `AssertionFunctionSync<Parts, Impl, Slots>`: `[Parts, Impl, Slots]`
 * - For `AssertionSchemaSync<Parts, Impl, Slots>`: `[Parts, Impl, Slots]`
 * - For `AssertionFunctionAsync<Parts, Impl, Slots>`: `[Parts, Impl, Slots]`
 * - For `AssertionSchemaAsync<Parts, Impl, Slots>`: `[Parts, Impl, Slots]`
 */
export type InferAssertionTypeArgs<T extends AnyAssertions> =
  T extends readonly [
    infer First extends AnyAssertion,
    ...infer Rest extends AnyAssertions,
  ]
    ? First extends AssertionFunctionSync<infer Parts, infer Impl, infer Slots>
      ? readonly [[Parts, Impl, Slots], ...InferAssertionTypeArgs<Rest>]
      : First extends AssertionSchemaSync<infer Parts, infer Impl, infer Slots>
        ? readonly [[Parts, Impl, Slots], ...InferAssertionTypeArgs<Rest>]
        : First extends AssertionFunctionAsync<
              infer Parts,
              infer Impl,
              infer Slots
            >
          ? readonly [[Parts, Impl, Slots], ...InferAssertionTypeArgs<Rest>]
          : First extends AssertionSchemaAsync<
                infer Parts,
                infer Impl,
                infer Slots
              >
            ? readonly [[Parts, Impl, Slots], ...InferAssertionTypeArgs<Rest>]
            : InferAssertionTypeArgs<Rest>
    : readonly [];

/**
 * Prepares {@link MapExpectSlots} by injecting `unknown` if the `AssertionParts`
 * have no `z.ZodType` in the head position.
 *
 * Also filters out `never` from the resulting tuple to guarantee tupleness.
 */
export type InferredExpectSlots<Parts extends AssertionParts> = NoNeverTuple<
  Parts extends readonly [infer First extends AssertionPart, ...infer _]
    ? First extends PhraseLiteral | PhraseLiteralChoice
      ? [unknown, ...MapExpectSlots<Parts>]
      : MapExpectSlots<Parts>
    : never
>;
/**
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
    ? [
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
    : [];

/**
 * The type of a phrase which is negated, e.g. "not to be"
 */
export type Negation<T extends string> = `not ${T}`;
