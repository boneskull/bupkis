import { BupkisAssertionAsync } from './assertion/assertion-async.js';
import { BupkisAssertionSync } from './assertion/assertion-sync.js';
import {
  type AnyAssertion,
  type AnyAsyncAssertions,
  type AnySyncAssertions,
} from './assertion/assertion-types.js';
import { kExpectIt } from './constant.js';
import {
  createBaseExpect,
  createExpectAsyncFunction,
  createExpectSyncFunction,
} from './expect.js';
import {
  type Concat,
  type ExpectIt,
  type FilterAsyncAssertions,
  type FilterSyncAssertions,
  type UseFn,
} from './types.js';

const createExpectIt = <SyncAssertions extends AnySyncAssertions>(
  expect: any,
): ExpectIt<SyncAssertions> => {
  const expectIt = (...args: readonly unknown[]) => {
    const func = Object.assign(
      (subject: unknown) => {
        const allArgs = [subject, ...args];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        expect(...allArgs);
      },
      {
        [kExpectIt]: true,
      },
    );
    return func;
  };
  return expectIt as unknown as ExpectIt<SyncAssertions>;
};

export function createUse<
  const T extends AnySyncAssertions,
  const U extends AnyAsyncAssertions,
>(syncAssertions: T, asyncAssertions: U): UseFn<T, U> {
  const syncAssertionsIn = syncAssertions ?? [];
  const asyncAssertionsIn = asyncAssertions ?? [];
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
      ...syncAssertionsIn,
      ...newSyncAssertions,
    ] as unknown as Concat<typeof syncAssertionsIn, typeof newSyncAssertions>;
    const allAsyncAssertions = [
      ...asyncAssertionsIn,
      ...newAsyncAssertions,
    ] as unknown as Concat<typeof asyncAssertionsIn, typeof newAsyncAssertions>;
    const expectFunction = createExpectSyncFunction(allSyncAssertions);
    const expectAsyncFunction = createExpectAsyncFunction(allAsyncAssertions);

    const expect = Object.assign(
      expectFunction,
      createBaseExpect(allSyncAssertions, allAsyncAssertions, 'sync'),
      { it: createExpectIt(expectFunction) },
    );
    const expectAsync = Object.assign(
      expectAsyncFunction,
      createBaseExpect(allSyncAssertions, allAsyncAssertions, 'async'),
    );

    return {
      expect,
      expectAsync,
      get use() {
        return createUse(allSyncAssertions, allAsyncAssertions);
      },
    };
  };
  return use;
}
