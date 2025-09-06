import { BupkisAssertionAsync } from './assertion/assertion-async.js';
import { BupkisAssertionSync } from './assertion/assertion-sync.js';
import {
  type AnyAssertion,
  type AnyAsyncAssertions,
  type AnySyncAssertions,
} from './assertion/assertion-types.js';
import {
  createBaseExpect,
  createExpectAsyncFunction,
  createExpectSyncFunction,
} from './expect.js';
import {
  type Concat,
  type FilterAsyncAssertions,
  type FilterSyncAssertions,
  type UseFn,
} from './types.js';

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
      expectAsync: expectAsync,
    };
  };
  return use;
}
