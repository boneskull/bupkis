/**
 * Types used throughout _BUPKIS_, mainly related to the
 * `expect()`/`expectAsync()` API.
 *
 * @packageDocumentation
 */

import type {
  ArrayValues,
  NonEmptyTuple,
  TupleToUnion,
  Constructor as TypeFestConstructor,
  UnionToIntersection,
} from 'type-fest';
import type { z } from 'zod/v4';

import type {
  AnyAsyncAssertion,
  AnyAsyncAssertions,
  AnySyncAssertion,
  AnySyncAssertions,
  AssertionPart,
  AssertionParts,
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
 * Base set of properties included in both {@link Expect} and {@link ExpectAsync}.
 */
export interface BaseExpect {
  /**
   * Creates a new synchronous assertion.
   */
  createAssertion: typeof createAssertion;
  /**
   * Creates a new asynchronous assertion.
   */
  createAsyncAssertion: typeof createAsyncAssertion;
  /**
   * Fails immediately with optional `reason`.
   *
   * @param reason Reason for failure
   * @throws {AssertionError}
   */
  fail(reason?: string): never;
}

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

/**
 * The main synchronous assertion function.
 *
 * Contains properties in {@link ExpectSyncProps}.
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
 * The main asynchronous assertion function.
 *
 * Contains properties in {@link ExpectSyncProps}.
 */
export type ExpectAsync<
  T extends AnyAsyncAssertions = BuiltinAsyncAssertions,
  U extends AnySyncAssertions = BuiltinSyncAssertions,
> = ExpectAsyncFunction<T> & ExpectAsyncProps<T, U>;

/**
 * All function overloads for `expectAsync()`; part of {@link ExpectAsync}.
 */
export type ExpectAsyncFunction<
  T extends AnyAsyncAssertions = BuiltinAsyncAssertions,
> = UnionToIntersection<
  TupleToUnion<{
    [K in keyof T]: T[K] extends AnyAsyncAssertion
      ? (
          ...args: MutableOrReadonly<InferredExpectSlots<T[K]['parts']>>
        ) => Promise<void>
      : never;
  }>
>;

/**
 * Properties available on `expectAsync()`; part of {@link ExpectAsync}.
 */
export interface ExpectAsyncProps<
  T extends AnyAsyncAssertions,
  U extends AnySyncAssertions,
> extends BaseExpect {
  /**
   * Tuple of all assertions available in this `expect()`.
   */
  assertions: T;
  /**
   * Function to add more assertions to this `expect()`, returning a new
   * `expect()` and `expectAsync()` pair with the combined assertions.
   */
  use: UseFn<U, T>;
}

/**
 * All function overloads for `expect()`; part of {@link Expect}.
 */
export type ExpectFunction<
  T extends AnySyncAssertions = BuiltinSyncAssertions,
> = UnionToIntersection<
  TupleToUnion<{
    [K in keyof T]: T[K] extends AnySyncAssertion
      ? (...args: MutableOrReadonly<InferredExpectSlots<T[K]['parts']>>) => void
      : never;
  }>
>;

/**
 * Properties for `expect()`; part of {@link Expect}.
 */
export interface ExpectSyncProps<
  T extends AnySyncAssertions,
  U extends AnyAsyncAssertions,
> extends BaseExpect {
  /**
   * Tuple of all assertions available in this `expect()`.
   */
  assertions: T;

  /**
   * Function to add more assertions to this `expect()`, returning a new
   * `expect()` and `expectAsync()` pair with the combined assertions.
   */
  use: UseFn<T, U>;
}

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
 * The type of a `PhraesLiteral` which is negated, e.g. "not to be"
 */
export type Negation<T extends string> = `not ${T}`;

/**
 * Makes tuple types accept both mutable and readonly variants
 */
type MutableOrReadonly<T> = T extends readonly (infer U)[]
  ? readonly U[] | U[]
  : T extends readonly [infer First, ...infer Rest]
    ? [First, ...Rest] | readonly [First, ...Rest]
    : T;
