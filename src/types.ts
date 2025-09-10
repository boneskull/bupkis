/**
 * Types used throughout _BUPKIS_.
 *
 * May be useful for those building on top of _BUPKIS_.
 *
 * @example
 *
 * ```ts
 * // namespace
 * import { types } from 'bupkis';
 * // subpath import
 * import type * as alsoTypes from 'bupkis/types';
 * ```
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
  AnyAsyncAssertion,
  AnyAsyncAssertions,
  AnySyncAssertion,
  AnySyncAssertions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Assertion,
  AssertionFunctionAsync,
  AssertionFunctionSync,
  AssertionImplFnAsync,
  AssertionImplFnSync,
  AssertionImplSchemaAsync,
  AssertionImplSchemaSync,
  AssertionPart,
  AssertionParts,
  AssertionSchemaAsync,
  AssertionSchemaSync,
  AssertionSlot,
  AssertionSlots,
  BuiltinAsyncAssertions,
  BuiltinSyncAssertions,
  NoNeverTuple,
  PhraseLiteral,
  PhraseLiteralChoice,
  PhraseLiteralChoiceSlot,
  PhraseLiteralSlot,
  RawAssertionImplSchemaSync,
} from './assertion/assertion-types.js';

/**
 * Creates a negated version of a tuple of
 * {@link AssertionPart | AssertionParts}.
 *
 * For {@link PhraseLiteral | PhraseLiterals}, creates a
 * {@link Negation | "not" variant}. For
 * {@link PhraseLiteralChoice | PhraseLiteralChoices}, creates negated versions
 * of each `Phrase` in the array.
 *
 * Does not affect Zod schemas.
 *
 * @template Parts Parts containing `PhraseLiterals` or `PhraseLiteralChoices`
 *   to negate.
 */
export type AddNegation<Parts extends readonly AssertionPart[]> =
  Parts extends readonly [
    infer First extends AssertionPart,
    ...infer Rest extends readonly AssertionPart[],
  ]
    ? First extends PhraseLiteralChoice
      ? readonly [
          {
            [K in keyof First]: First[K] extends PhraseLiteral
              ? Negation<First[K]>
              : never;
          },
          ...AddNegation<Rest>,
        ]
      : First extends PhraseLiteral
        ? readonly [Negation<First>, ...AddNegation<Rest>]
        : readonly [First, ...AddNegation<Rest>]
    : readonly [];

/**
 * Base set of properties included in both {@link Expect} and {@link ExpectAsync}.
 *
 * @preventExpand
 */
export interface BaseExpect {
  /**
   * Creates a new synchronous assertion.
   */
  createAssertion: CreateAssertionFn;

  /**
   * Creates a new asynchronous assertion.
   */
  createAsyncAssertion: CreateAsyncAssertionFn;
  /**
   * Fails immediately with optional `reason`.
   *
   * @param reason Reason for failure
   * @throws {AssertionError}
   */
  fail: FailFn;
}

export type * from './assertion/assertion-types.js';

/**
 * The main API as returned by a {@link UseFn}.
 *
 * @template BaseSyncAssertions Base set of synchronous
 *   {@link Assertion Assertions}; will be the builtin sync assertions, at
 *   minimum)
 * @template BaseAsyncAssertions Base set of asynchronous
 *   {@link Assertion Assertions}; will be the builtin async assertions, at
 *   minimum)
 * @template ExtendedSyncAssertions Synchronous assertions extracted from
 *   `MixedAssertions`
 * @template ExtendedAsyncAssertions Asynchronous assertions extracted from
 *   `MixedAssertions`
 */
export interface Bupkis<
  BaseSyncAssertions extends AnySyncAssertions,
  BaseAsyncAssertions extends AnyAsyncAssertions,
  ExtendedSyncAssertions extends readonly AnySyncAssertion[] = readonly [],
  ExtendedAsyncAssertions extends readonly AnyAsyncAssertion[] = readonly [],
> {
  /**
   * A new {@link Expect} function which handles {@link ExtendedSyncAssertions}
   * and {@link BaseSyncAssertions}
   */
  expect: Expect<
    Concat<BaseSyncAssertions, ExtendedSyncAssertions>,
    Concat<BaseAsyncAssertions, ExtendedAsyncAssertions>
  >;
  /**
   * A new {@link ExpectAsync} function which handles
   * {@link ExtendedAsyncAssertions} and {@link BaseAsyncAssertions}
   */
  expectAsync: ExpectAsync<
    Concat<BaseAsyncAssertions, ExtendedAsyncAssertions>,
    Concat<BaseSyncAssertions, ExtendedSyncAssertions>
  >;
  /**
   * For composing arrays of assertions, one after another.
   *
   * The _only_ chainable API in <span class="bupkis">Bupkis</span>.
   *
   * @since 0.1.0
   * @example
   *
   * ```ts
   * const { expect } = use([...someAssertions]).use([...otherAssertions]);
   * ```
   */
  use: UseFn<
    Concat<BaseSyncAssertions, ExtendedSyncAssertions>,
    Concat<BaseAsyncAssertions, ExtendedAsyncAssertions>
  >;
}

/**
 * Helper type to concatenate two tuples
 */
export type Concat<
  TupleA extends readonly unknown[],
  TupleB extends readonly unknown[],
> = readonly [...TupleA, ...TupleB];

/**
 * A constructor based on {@link TypeFestConstructor type-fest's Constructor}
 * with a default instance type argument.
 */
export type Constructor<
  Instance = any,
  Args extends unknown[] = any[],
> = TypeFestConstructor<Instance, Args>;

/**
 * The main factory function for creating synchronous assertions.
 */
export interface CreateAssertionFn {
  /**
   * Create a synchronous `Assertion` from {@link AssertionParts parts} and a
   * {@link z.ZodType Zod schema}.
   *
   * @template Parts Parts defining the shape of the assertion, including
   *   Phrases and Zod schemas
   * @template Impl Assertion implementation as a Zod schema
   * @template Slots Inferred slots based on the provided `Parts`
   * @returns New `AssertionSchemaSync` object
   */
  <
    const Parts extends AssertionParts,
    Impl extends RawAssertionImplSchemaSync<Parts>,
    Slots extends AssertionSlots<Parts>,
  >(
    parts: Parts,
    impl: Impl,
  ): AssertionSchemaSync<Parts, AssertionImplSchemaSync<Parts>, Slots>;

  /**
   * Create a synchronous `Assertion` from {@link AssertionParts parts} and an
   * implementation function.
   *
   * @template Parts Parts defining the shape of the assertion, including
   *   Phrases and Zod schemas
   * @template Impl Assertion implementation as a function
   * @template Slots Inferred slots based on the provided `Parts`
   * @returns New `AssertionFunctionSync` object
   */
  <
    const Parts extends AssertionParts,
    Impl extends AssertionImplFnSync<Parts>,
    Slots extends AssertionSlots<Parts>,
  >(
    parts: Parts,
    impl: Impl,
  ): AssertionFunctionSync<Parts, Impl, Slots>;
}

/**
 * The main factory function for creating asynchronous assertions.
 */
export interface CreateAsyncAssertionFn {
  /**
   * Create an async `Assertion` from {@link AssertionParts parts} and an
   * {@link z.ZodType Zod schema}.
   *
   * The Zod schema need not be async itself.
   *
   * @template Parts Parts defining the shape of the assertion, including
   *   Phrases and Zod schemas
   * @template Impl Assertion implementation as a Zod schema
   * @template Slots Inferred slots based on the provided `Parts`
   * @returns New `AssertionSchemaAsync` object
   */
  <
    const Parts extends AssertionParts,
    Impl extends AssertionImplSchemaAsync<Parts>,
    Slots extends AssertionSlots<Parts>,
  >(
    parts: Parts,
    impl: Impl,
  ): AssertionSchemaAsync<Parts, Impl, Slots>;

  /**
   * Create an async `Assertion` from {@link AssertionParts parts} and an
   * implementation function.
   *
   * @template Parts Parts defining the shape of the assertion, including
   *   Phrases and Zod schemas
   * @template Impl Assertion implementation as a function
   * @template Slots Inferred slots based on the provided `Parts`
   * @returns New `AssertionFunctionAsync` object
   */
  <
    const Parts extends AssertionParts,
    Impl extends AssertionImplFnAsync<Parts>,
    Slots extends AssertionSlots<Parts>,
  >(
    parts: Parts,
    impl: Impl,
  ): AssertionFunctionAsync<Parts, Impl, Slots>;
} /**
 * @template BaseSyncAssertions Base set of synchronous
 *   {@link Assertion | Assertions}; will be the builtin sync assertions, at
 *   minimum)
 * @template BaseAsyncAssertions Base set of asynchronous
 *   {@link Assertion | Assertions}; will be the builtin async assertions, at
 *   minimum)
 */

/**
 * The main synchronous assertion function.
 *
 * Contains properties in {@link ExpectSyncProps}.
 *
 * @template SyncAssertions All synchronous assertions available
 * @template AsyncAssertions All asynchronous assertions available; for use in
 *   {@link ExpectSyncProps.use}
 * @expandType ExpectSyncProps
 * @see {@link expect}
 */
export type Expect<
  SyncAssertions extends AnySyncAssertions = BuiltinSyncAssertions,
  AsyncAssertions extends AnyAsyncAssertions = BuiltinAsyncAssertions,
> = ExpectFunction<SyncAssertions> &
  ExpectSyncProps<SyncAssertions, AsyncAssertions>;

/**
 * The main asynchronous assertion function.
 *
 * Contains properties in {@link ExpectAsyncProps}.
 *
 * @template AsyncAssertions All asynchronous assertions available
 * @template SyncAssertions All synchronous assertions available; for use in
 *   {@link ExpectAsyncProps.use}
 * @expandType ExpectAsyncProps
 * @see {@link expectAsync}
 */
export type ExpectAsync<
  AsyncAssertions extends AnyAsyncAssertions = BuiltinAsyncAssertions,
  SyncAssertions extends AnySyncAssertions = BuiltinSyncAssertions,
> = ExpectAsyncFunction<AsyncAssertions> &
  ExpectAsyncProps<AsyncAssertions, SyncAssertions>;

export type ExpectAsyncFunction<
  T extends AnyAsyncAssertions = BuiltinAsyncAssertions,
> = UnionToIntersection<
  TupleToUnion<{
    [K in keyof T]: T[K] extends AnyAsyncAssertion
      ? (
          ...args: MutableOrReadonly<SlotsFromParts<T[K]['parts']>>
        ) => Promise<void>
      : never;
  }>
>;

export interface ExpectAsyncProps<
  AsyncAssertions extends AnyAsyncAssertions,
  SyncAssertions extends AnySyncAssertions,
> extends BaseExpect {
  /**
   * Tuple of all assertions available in this `expect()`.
   *
   * @preventExpand
   */
  assertions: AsyncAssertions;
  /**
   * {@inheritDoc UseFn}
   */
  use: UseFn<SyncAssertions, AsyncAssertions>;
}

export type ExpectFunction<
  SyncAssertions extends AnySyncAssertions = BuiltinSyncAssertions,
> = UnionToIntersection<
  TupleToUnion<{
    [K in keyof SyncAssertions]: SyncAssertions[K] extends AnySyncAssertion
      ? (
          ...args: MutableOrReadonly<SlotsFromParts<SyncAssertions[K]['parts']>>
        ) => void
      : never;
  }>
>;

/**
 * Properties of {@link expect}.
 */
export interface ExpectSyncProps<
  SyncAssertions extends AnySyncAssertions,
  AsyncAssertions extends AnyAsyncAssertions,
> extends BaseExpect {
  /**
   * Tuple of all assertions available in this `expect()`.
   *
   * @preventExpand
   */
  assertions: SyncAssertions;

  /**
   * Function to add more assertions to this `expect()`, returning a new
   * `expect()` and `expectAsync()` pair with the combined assertions.
   */
  use: UseFn<SyncAssertions, AsyncAssertions>;
}

/**
 * A function which immediately throws an {@link AssertionError}.
 *
 * Member of {@link BaseExpect}.
 *
 * @param reason Optional reason for failure
 * @see {@link fail}
 */
export type FailFn = (reason?: string) => never;

/**
 * Given a mixed array of assertions, filters out only the async assertions.
 */
export type FilterAsyncAssertions<
  MixedAssertions extends readonly AnyAssertion[],
> = MixedAssertions extends readonly [
  infer MixedAssertion extends AnyAssertion,
  ...infer Rest extends readonly AnyAssertion[],
]
  ? MixedAssertion extends AnyAsyncAssertion
    ? readonly [MixedAssertion, ...FilterAsyncAssertions<Rest>]
    : FilterAsyncAssertions<Rest>
  : readonly [];

/**
 * Given a mixed array of assertions, extracts only the synchronous assertions.
 */
export type FilterSyncAssertions<
  MixedAssertions extends readonly AnyAssertion[],
> = MixedAssertions extends readonly [
  infer MixedAssertion extends AnyAssertion,
  ...infer Rest extends readonly AnyAssertion[],
]
  ? MixedAssertion extends AnySyncAssertion
    ? readonly [MixedAssertion, ...FilterSyncAssertions<Rest>]
    : FilterSyncAssertions<Rest>
  : readonly [];

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
 * Makes tuple types accept both mutable and readonly variants
 */
export type MutableOrReadonly<Tuple extends readonly unknown[]> =
  Tuple extends readonly (infer Item)[]
    ? Item[] | readonly Item[]
    : Tuple extends readonly [infer First, ...infer Rest]
      ? [First, ...Rest] | readonly [First, ...Rest]
      : Tuple;

/**
 * The type of a `PhraesLiteral` which is negated, e.g. "not to be"
 */
export type Negation<S extends string> = `not ${S}`; /**
 * Properties available on `expectAsync()`; part of {@link ExpectAsync}.
 */

/**
 * Prepares {@link MapExpectSlots} by injecting `unknown` if the `AssertionParts`
 * have no `z.ZodType` in the head position.
 *
 * Also filters out `never` from the resulting tuple to guarantee tupleness.
 *
 * @remarks
 * This is a convenience and I hope it's not too confusing.
 */
export type SlotsFromParts<Parts extends AssertionParts> = NoNeverTuple<
  Parts extends readonly [infer First extends AssertionPart, ...infer _]
    ? First extends PhraseLiteral | PhraseLiteralChoice
      ? [unknown, ...MapExpectSlots<Parts>]
      : MapExpectSlots<Parts>
    : never
>;

/**
 * The type of a `use()` function.
 */
export interface UseFn<
  BaseSyncAssertions extends AnySyncAssertions,
  BaseAsyncAssertions extends AnyAsyncAssertions,
> {
  /**
   * @template MixedAssertions Mixed set of assertions to add; may include both
   *   sync and async assertions
   * @template ExtendedSyncAssertions Synchronous assertions extracted from
   *   `MixedAssertions`
   * @template ExtendedAsyncAssertions Asynchronous assertions extracted from
   *   `MixedAssertions`
   * @param assertions Array of assertion classes to add
   * @returns New {@link expect} and {@link expectAsync} functions with the
   *   combined assertions
   */
  <
    MixedAssertions extends readonly AnyAssertion[],
    ExtendedSyncAssertions extends FilterSyncAssertions<MixedAssertions>,
    ExtendedAsyncAssertions extends FilterAsyncAssertions<MixedAssertions>,
  >(
    assertions: MixedAssertions,
  ): Bupkis<
    BaseSyncAssertions,
    BaseAsyncAssertions,
    ExtendedSyncAssertions,
    ExtendedAsyncAssertions
  >;
}
