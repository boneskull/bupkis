/**
 * Types used throughout _BUPKIS_
 *
 * @packageDocumentation
 */

import type { Constructor as TypeFestConstructor } from 'type-fest';
import type { z } from 'zod/v4';

import type {
  AssertionPart,
  AssertionParts,
  AssertionSlot,
  BuiltinAssertion,
  BuiltinAsyncAssertion,
  PhraseLiteralChoiceSlot,
  PhraseLiteralSlot,
} from './assertion/assertion-types.js';
import type {
  AsyncAssertions,
  SyncAssertions,
} from './assertion/impl/index.js';

import { type NoNeverTuple } from './assertion/assertion-types.js';
import {
  type createAssertion,
  type createAsyncAssertion,
} from './assertion/create.js';

/**
 * Helper type to create negated version of assertion parts. For phrase
 * literals, creates "not phrase" version. For phrase arrays, creates negated
 * versions of each phrase in the array.
 */
export type AddNegation<T extends AssertionParts> = T extends readonly [
  infer First extends AssertionPart,
  ...infer Rest extends AssertionParts,
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
  fail(reason?: string): never;
}

export interface BaseExpectAsync extends BaseExpect {
  createAssertion: typeof createAsyncAssertion;
}

export interface BaseExpectSync extends BaseExpect {
  createAssertion: typeof createAssertion;
}

/**
 * Properties and methods available on {@link expect} and {@link expectAsync}.
 */

export type Constructor<
  T = any,
  Arguments extends unknown[] = any[],
> = TypeFestConstructor<T, Arguments>;

/**
 * The main synchronous assertion function.
 *
 * Contains properties in {@link BaseExpect}.
 */
export interface Expect extends BaseExpect, ExpectFunction {}

/**
 * The main asynchronous assertion function.
 *
 * Contains properties in {@link BaseExpect}.
 */
export interface ExpectAsync extends BaseExpectAsync, ExpectAsyncFunction {}

/**
 * All overloads for {@link expectAsync}
 */
export type ExpectAsyncFunction = {
  [K in keyof typeof AsyncAssertions]: (typeof AsyncAssertions)[K] extends BuiltinAsyncAssertion
    ? (
        ...args: InferredExpectSlots<(typeof AsyncAssertions)[K]['parts']>
      ) => Promise<void>
    : never;
}[number];

/**
 * All overloads for {@link expect}
 */
export type ExpectFunction = {
  [K in keyof typeof SyncAssertions]: (typeof SyncAssertions)[K] extends BuiltinAssertion
    ? (
        ...args: InferredExpectSlots<(typeof SyncAssertions)[K]['parts']>
      ) => void
    : never;
}[number];

/**
 * Prepares {@link MapExpectSlots} by injecting `unknown` if the `AssertionParts`
 * have no `z.ZodType` in the head position.
 *
 * Also filters out `never` from the resulting tuple to guarantee tupleness.
 */
export type InferredExpectSlots<Parts extends AssertionParts> = NoNeverTuple<
  Parts extends readonly [infer First extends AssertionPart, ...infer _]
    ? First extends readonly [string, ...string[]] | string
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
export type MapExpectSlots<Parts extends AssertionParts> =
  Parts extends readonly [
    infer First extends AssertionPart,
    ...infer Rest extends AssertionParts,
  ]
    ? [
        AssertionSlot<First> extends PhraseLiteralSlot<infer StringLiteral>
          ? Negation<StringLiteral> | StringLiteral
          : AssertionSlot<First> extends PhraseLiteralChoiceSlot<
                infer StringLiterals
              >
            ? Negation<StringLiterals[number]> | StringLiterals[number]
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
