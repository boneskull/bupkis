/**
 * Types used throughout _BUPKIS_
 *
 * @packageDocumentation
 */

import type {
  ArrayValues,
  Constructor as TypeFestConstructor,
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
  BuiltinAsyncAssertion,
  BuiltinAsyncAssertions,
  BuiltinSyncAssertion,
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
> = T extends BuiltinSyncAssertions
  ? ArrayValues<{
      [K in keyof BuiltinAsyncAssertions]: BuiltinAsyncAssertions[K] extends BuiltinAsyncAssertion
        ? (
            ...args: InferredExpectSlots<BuiltinAsyncAssertions[K]['parts']>
          ) => Promise<void>
        : never;
    }>
  : ArrayValues<{
      [K in keyof T]: T[K] extends AnyAsyncAssertion
        ? (...args: InferredExpectSlots<T[K]['parts']>) => Promise<void>
        : never;
    }>;

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
> = T extends BuiltinSyncAssertions
  ? ArrayValues<{
      [K in keyof BuiltinSyncAssertions]: BuiltinSyncAssertions[K] extends BuiltinSyncAssertion
        ? (
            ...args: InferredExpectSlots<BuiltinSyncAssertions[K]['parts']>
          ) => void
        : never;
    }>
  : ArrayValues<{
      [K in keyof T]: T[K] extends AnySyncAssertion
        ? (...args: InferredExpectSlots<T[K]['parts']>) => void
        : never;
    }>;

export interface ExpectSyncProps<
  T extends AnySyncAssertions,
  U extends AnyAsyncAssertions,
> extends BaseExpect {
  assertions: T;
  use: UseFn<T, U>;
}

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
