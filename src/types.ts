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

/**
 * The callable function type for asynchronous assertions.
 *
 * This type represents the actual function signature of an async expect
 * function, created by mapping all available assertions to their respective
 * function signatures and combining them using intersection types. Each
 * assertion contributes its own overload to the final function type.
 *
 * The function signatures are derived from the {@link AssertionParts} of each
 * assertion, with parameters that match the expected slots for natural language
 * assertion calls.
 *
 * @example
 *
 * ```typescript
 * // Example function type derived from async assertions
 * const expectAsync: ExpectAsyncFunction<MyAsyncAssertions> = ...;
 * await expectAsync(promise, 'to resolve');
 * await expectAsync(promise, 'to resolve with value satisfying', expectedValue);
 * ```
 *
 * @template T - Array of async assertion objects that define available
 *   assertion logic
 * @see {@link ExpectFunction} for the synchronous equivalent
 * @see {@link SlotsFromParts} for how assertion parts are converted to function parameters
 */
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

/**
 * Properties available on asynchronous expect functions.
 *
 * This interface defines the additional properties and methods that are
 * attached to async expect functions, extending the base expect functionality
 * with async-specific features. These properties provide access to the
 * underlying assertions and enable function composition through the
 * {@link UseFn | use} method.
 *
 * @example
 *
 * ```typescript
 * const expectAsync: ExpectAsync<MyAsyncAssertions> =
 *   createExpectAsyncFunction(assertions);
 *
 * // Access the underlying assertions
 * console.log(expectAsync.assertions.length);
 *
 * // Compose with additional assertions
 * const { expectAsync: enhanced } = expectAsync.use(moreAssertions);
 * ```
 *
 * @template AsyncAssertions - Array of async assertion objects available to
 *   this expect function
 * @template SyncAssertions - Array of sync assertion objects available for
 *   composition via {@link UseFn | use}
 */
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
/**
 * Given a mixed array of assertions, filters out only the async assertions.
 *
 * This utility type recursively examines each assertion in the input array and
 * constructs a new tuple containing only the asynchronous assertions. It uses
 * conditional types to test whether each assertion extends
 * {@link AnyAsyncAssertion} and includes it in the result if so.
 *
 * Used primarily by {@link UseFn} to separate async assertions from mixed
 * assertion arrays when composing expect functions.
 *
 * @example
 *
 * ```typescript
 * type Mixed = [
 *   SyncAssertion1,
 *   AsyncAssertion1,
 *   SyncAssertion2,
 *   AsyncAssertion2,
 * ];
 * type AsyncOnly = FilterAsyncAssertions<Mixed>; // [AsyncAssertion1, AsyncAssertion2]
 * ```
 *
 * @template MixedAssertions - Array that may contain both sync and async
 *   assertions
 * @see {@link FilterSyncAssertions} for extracting synchronous assertions
 * @see {@link UseFn} for the primary use case of this type
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
 * Maps AssertionParts to the corresponding argument types for expect and
 * expectAsync functions.
 *
 * This utility type transforms assertion parts into the actual parameter types
 * that users provide when calling expect functions. It handles both phrase
 * literals and Zod schemas, creating appropriate TypeScript types for each
 * slot.
 *
 * For phrase literals, it creates union types that include both the original
 * phrase and its negated version (with "not " prefix). For Zod schemas, it
 * extracts the inferred type. This enables natural language assertions with
 * optional negation support.
 *
 * @remarks
 * This type works recursively through the parts tuple, transforming each part
 * according to its type. The resulting tuple maintains the same structure as
 * the input but with user-facing TypeScript types instead of internal assertion
 * part types.
 * @example
 *
 * ```typescript
 * // Given parts: ['to be a', z.string()]
 * // Results in: ['to be a' | 'not to be a', string]
 * type Slots = MapExpectSlots<['to be a', z.string()]>;
 * // Usage: expect(value, 'to be a', 'hello') or expect(value, 'not to be a', 'hello')
 * ```
 *
 * @template Parts - Tuple of assertion parts to be converted to function
 *   parameter types
 * @see {@link SlotsFromParts} for the complete slot transformation including subject injection
 * @see {@link Negation} for how phrase negation is implemented
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
 * Makes tuple types accept both mutable and readonly variants.
 *
 * This utility type creates a union of both mutable and readonly versions of a
 * tuple type, providing flexibility for function parameters that should accept
 * either variant. This is particularly useful for assertion function parameters
 * where users may pass either `const` arrays (readonly) or regular arrays.
 *
 * The type handles both array types and specific tuple types, creating
 * appropriate unions for each case to maintain type safety while maximizing
 * usability.
 *
 * @example
 *
 * ```typescript
 * type FlexibleArgs = MutableOrReadonly<readonly [string, number]>;
 * // Results in: [string, number] | readonly [string, number]
 *
 * function acceptArgs(args: FlexibleArgs) { ... }
 * acceptArgs(['hello', 42]);           // ✓ mutable array
 * acceptArgs(['hello', 42] as const);  // ✓ readonly array
 * ```
 *
 * @template Tuple - The readonly tuple type to make flexible
 * @see {@link ExpectFunction} and {@link ExpectAsyncFunction} which use this for parameter flexibility
 */
export type MutableOrReadonly<Tuple extends readonly unknown[]> =
  Tuple extends readonly (infer Item)[]
    ? Item[] | readonly Item[]
    : Tuple extends readonly [infer First, ...infer Rest]
      ? [First, ...Rest] | readonly [First, ...Rest]
      : Tuple;

/**
 * Creates a negated version of a phrase literal by prefixing "not ".
 *
 * This utility type transforms assertion phrases into their negated
 * equivalents, enabling the natural language negation feature in Bupkis
 * assertions. When users provide phrases like "not to be a string", this type
 * helps the system understand and process the negation.
 *
 * The negation is applied at the type level during assertion matching and
 * affects how the assertion logic is executed - negated assertions expect the
 * opposite result.
 *
 * @example
 *
 * ```typescript
 * type Negated = Negation<'to be a string'>; // "not to be a string"
 * type AlsoNegated = Negation<'to equal'>; // "not to equal"
 *
 * // Usage in assertions:
 * expect(42, 'not to be a string'); // Uses negated assertion logic
 * ```
 *
 * @template S - The string literal phrase to be negated
 * @see {@link AddNegation} for applying negation to entire AssertionParts tuples
 * @see {@link MapExpectSlots} for how negation is incorporated into function signatures
 */
export type Negation<S extends string> = `not ${S}`;

/**
 * Converts AssertionParts to complete function parameter types for expect
 * functions.
 *
 * This utility type prepares assertion parts for use as function parameters by
 * applying several transformations:
 *
 * 1. Injects an `unknown` type for the subject parameter if the first part is a
 *    phrase literal
 * 2. Maps the remaining parts to their corresponding TypeScript types via
 *    {@link MapExpectSlots}
 * 3. Filters out `never` types to ensure a clean tuple structure
 *
 * The subject injection is a key feature - when assertions start with phrases
 * like "to be a string", users still need to provide the subject being tested
 * as the first argument to expect functions.
 *
 * @remarks
 * This type is essential for bridging the gap between assertion definitions and
 * user-facing function signatures. The subject injection ensures that all
 * assertions have a consistent calling pattern regardless of whether they
 * explicitly define a subject parameter.
 * @example
 *
 * ```typescript
 * // Assertion parts: ['to equal', z.string()]
 * // Results in: [unknown, 'to equal' | 'not to equal', string]
 * type Slots = SlotsFromParts<['to equal', z.string()]>;
 *
 * // Usage: expect(subject, 'to equal', 'expected')
 * //        expect(subject, 'not to equal', 'unexpected')
 * ```
 *
 * @template Parts - Tuple of assertion parts that define the assertion
 *   structure
 * @see {@link MapExpectSlots} for the core slot mapping logic
 * @see {@link NoNeverTuple} for never-type filtering
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
