import { BupkisAssertionAsync } from './assertion/assertion-async.js';
import { BupkisAssertionSync } from './assertion/assertion-sync.js';
import {
  type AnyAssertion,
  type AnyAssertions,
  type AnyAsyncAssertion,
  type AnyAsyncAssertions,
  type AnySyncAssertion,
  type AnySyncAssertions,
  type AssertionFunctionAsync,
  type AssertionFunctionSync,
  type AssertionSchemaAsync,
  type AssertionSchemaSync,
} from './assertion/assertion-types.js';
import {
  createBaseExpect,
  createExpectAsyncFunction,
  createExpectSyncFunction,
} from './expect.js';
import { type Expect, type ExpectAsync } from './types.js';
import { type Concat } from './util.js';

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

export type UseFn<T extends AnySyncAssertions, U extends AnyAsyncAssertions> = <
  V extends AnyAssertions,
>(
  assertions: V,
) => {
  expect: Expect<
    readonly [...T, ...FilterSyncAssertions<V>],
    readonly [...U, ...FilterAsyncAssertions<V>]
  >;
  expectAsync: ExpectAsync<
    readonly [...U, ...FilterAsyncAssertions<V>],
    readonly [...T, ...FilterSyncAssertions<V>]
  >;
};

type FilterAsyncAssertions<T extends AnyAssertions> = T extends readonly [
  infer S extends AnyAssertion,
  ...infer Rest extends AnyAssertions,
]
  ? S extends AnyAsyncAssertion
    ? [S, ...FilterAsyncAssertions<Rest>]
    : FilterAsyncAssertions<Rest>
  : readonly [];

type FilterSyncAssertions<T extends AnyAssertions> = T extends readonly [
  infer S extends AnyAssertion,
  ...infer Rest extends AnyAssertions,
]
  ? S extends AnySyncAssertion
    ? [S, ...FilterSyncAssertions<Rest>]
    : FilterSyncAssertions<Rest>
  : readonly [];

export function createUse<
  T extends AnySyncAssertions,
  U extends AnyAsyncAssertions,
>(syncAssertions: T, asyncAssertions: U): UseFn<T, U> {
  const use: UseFn<T, U> = <V extends AnyAssertions>(assertions: V) => {
    const newSyncAssertions = assertions.filter(
      (a) => a instanceof BupkisAssertionSync,
    ) as unknown as FilterSyncAssertions<V>;
    const newAsyncAssertions = assertions.filter(
      (a) => a instanceof BupkisAssertionAsync,
    ) as unknown as FilterAsyncAssertions<V>;
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
