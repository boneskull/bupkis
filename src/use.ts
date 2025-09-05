import { BupkisAssertionAsync } from './assertion/assertion-async.js';
import { BupkisAssertionSync } from './assertion/assertion-sync.js';
import {
  type AnyAssertion,
  type AnyAsyncAssertion,
  type AnyAsyncAssertions,
  type AnySyncAssertion,
  type AnySyncAssertions,
} from './assertion/assertion-types.js';
import {
  createBaseExpect,
  createExpectAsyncFunction,
  createExpectSyncFunction,
} from './expect.js';
import { type Concat, type Expect, type ExpectAsync } from './types.js';

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

export type UseFn<T extends AnySyncAssertions, U extends AnyAsyncAssertions> = <
  V extends readonly AnyAssertion[],
  W extends FilterSyncAssertions<V>,
  X extends FilterAsyncAssertions<V>,
>(
  assertions: V,
) => {
  expect: Expect<Concat<T, W>, Concat<U, X>>;
  expectAsync: ExpectAsync<Concat<U, X>, Concat<T, W>>;
};

export function createUse<
  const T extends AnySyncAssertions,
  const U extends AnyAsyncAssertions,
>(syncAssertions: T, asyncAssertions: U): UseFn<T, U> {
  const use: UseFn<T, U> = <
    V extends readonly AnyAssertion[],
    W extends FilterSyncAssertions<V>,
    X extends FilterAsyncAssertions<V>,
  >(
    assertions: V,
  ) => {
    const newSyncAssertions = assertions.filter(
      (a) => a instanceof BupkisAssertionSync,
    ) as unknown as W;
    const newAsyncAssertions = assertions.filter(
      (a) => a instanceof BupkisAssertionAsync,
    ) as unknown as X;
    const allSyncAssertions = [
      ...syncAssertions,
      ...newSyncAssertions,
    ] as unknown as Concat<typeof syncAssertions, typeof newSyncAssertions>;
    const allAsyncAssertions = [
      ...asyncAssertions,
      ...newAsyncAssertions,
    ] as unknown as Concat<typeof asyncAssertions, typeof newAsyncAssertions>;
    const expectFunction = createExpectSyncFunction(allSyncAssertions);
    const expectAsyncFunction = createExpectAsyncFunction(allAsyncAssertions);

    const expect = Object.assign(
      expectFunction,
      createBaseExpect(allSyncAssertions, allAsyncAssertions, 'sync'),
    );
    const expectAsync = Object.assign(
      expectAsyncFunction,
      createBaseExpect(allSyncAssertions, allAsyncAssertions, 'async'),
    );

    return {
      expect,
      expectAsync,
    };
  };
  return use;
}
