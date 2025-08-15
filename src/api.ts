/**
 * Contains the main API types
 *
 * @packageDocumentation
 */

import type { TupleToUnion, UnionToIntersection } from 'type-fest';

import type {
  AnyAsyncAssertion,
  AnyAsyncAssertions,
  AnySyncAssertion,
  AnySyncAssertions,
  BuiltinAsyncAssertions,
  BuiltinSyncAssertions,
} from './assertion/assertion-types.js';
import type {
  createAssertion,
  createAsyncAssertion,
} from './assertion/create.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { expect, expectAsync } from './bootstrap.js';

import {
  type InferredExpectSlots,
  type MutableOrReadonly,
  type UseFn,
} from './types.js';

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
  fail(this: void, reason?: string): never;
}

/**
 * The main synchronous assertion function.
 *
 * Contains properties in {@link ExpectSyncProps}.
 *
 * @template T All synchronous assertions available
 * @template U All asynchronous assertions available; for use in
 *   {@link ExpectSyncProps.use}
 * @useDeclaredType
 * @see {@link expect}
 */

export type Expect<
  T extends AnySyncAssertions = BuiltinSyncAssertions,
  U extends AnyAsyncAssertions = BuiltinAsyncAssertions,
> = ExpectFunction<T> & ExpectSyncProps<T, U>;

/**
 * The main asynchronous assertion function.
 *
 * Contains properties in {@link ExpectSyncProps}.
 *
 * @useDeclaredType
 * @see {@link expectAsync}
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
 *
 * @useDeclaredType
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
