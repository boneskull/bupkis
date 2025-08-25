import type { z } from 'zod/v4';

import type {
  AssertionPart,
  AssertionParts,
  AssertionSlot,
  BuiltinAssertion,
  BuiltinAsyncAssertion,
  PhraseLiteralEnumSlot,
  PhraseLiteralSlot,
} from './assertion/types.js';

import { type Assertion } from './assertion/assertion.js';
import { type Assertions as AsyncAssertions } from './assertion/async-implementations.js';
import { type Assertions as SyncAssertions } from './assertion/implementations.js';

/**
 * Properties and methods available on {@link expect} and {@link expectAsync}.
 */

export interface BaseExpect {
  createAssertion: (typeof Assertion)['fromParts'];
  fail(reason?: string): never;
}

/**
 * The main assertion function.
 *
 * Contains {@link BaseExpect}.
 */

export interface Expect extends BaseExpect, ExpectFunction {}

export interface ExpectAsync extends BaseExpect, ExpectAsyncFunction {}

export type ExpectAsyncFunction = {
  [K in keyof typeof AsyncAssertions]: (typeof AsyncAssertions)[K] extends BuiltinAsyncAssertion
    ? (
        ...args: InferredExpectSlots<(typeof AsyncAssertions)[K]['__parts']>
      ) => Promise<void>
    : never;
}[number];

export type ExpectFunction = {
  [K in keyof typeof SyncAssertions]: (typeof SyncAssertions)[K] extends BuiltinAssertion
    ? (
        ...args: InferredExpectSlots<(typeof SyncAssertions)[K]['__parts']>
      ) => void
    : never;
}[number];

export type InferredExpectSlots<Parts extends AssertionParts> = NoNeverTuple<
  Parts extends readonly [infer First extends AssertionPart, ...infer _]
    ? First extends readonly [string, ...string[]] | string
      ? [unknown, ...MapExpectSlots<Parts>]
      : MapExpectSlots<Parts>
    : never
>;

export type MapExpectSlots<Parts extends AssertionParts> =
  Parts extends readonly [
    infer First extends AssertionPart,
    ...infer Rest extends AssertionParts,
  ]
    ? [
        AssertionSlot<First> extends PhraseLiteralSlot<infer StringLiteral>
          ? StringLiteral
          : AssertionSlot<First> extends PhraseLiteralEnumSlot<
                infer StringLiterals
              >
            ? z.infer<z.ZodEnum<z.core.util.ToEnum<StringLiterals[number]>>>
            : AssertionSlot<First> extends z.ZodType
              ? z.infer<AssertionSlot<First>>
              : never,
        ...MapExpectSlots<Rest>,
      ]
    : [];

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
