/**
 * Utility for classifying sync function assertions by their return types.
 *
 * @packageDocumentation
 */

import type {
  AnyAssertion,
  AssertionFunctionSync,
  AssertionImplFnSync,
  AssertionParts,
  AssertionSlots,
} from '../src/assertion/index.js';

import { BupkisAssertionFunctionSync } from '../src/assertion/assertion-sync.js';
import { SyncAssertions } from '../src/assertion/index.js';
import { isBoolean } from '../src/guards.js';
import { isAssertionFailure } from '../src/internal-schema.js';
import { isExcludedFromBenchmarks } from './shared/excluded-assertions.js';

type AssertionClassification = 'pure' | 'schema';

interface SyncFunctionAssertionClassification {
  pure: BupkisAssertionFunctionSync<any, any, any>[];
  schema: BupkisAssertionFunctionSync<any, any, any>[];
}

export const isSyncFunctionAssertion = (
  assertion: AnyAssertion,
): assertion is BupkisAssertionFunctionSync<
  AssertionParts,
  AssertionImplFnSync<AssertionParts>,
  AssertionSlots<AssertionParts>
> => assertion instanceof BupkisAssertionFunctionSync;

/**
 * Classifies a sync function assertion into a {@link AssertionClassification}.
 *
 * @param assertion Assertion to classify
 * @returns Classification of the assertion
 */
export const classifyAssertion = <
  T extends AssertionFunctionSync<any, any, any>,
>(
  assertion: T,
): AssertionClassification => {
  try {
    // These are dummy args to provide to the assertion implementation which
    // will most certainly cause it to fail. We can then inspect the result to
    // determine if it is a pure or schema assertion.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const dummyArgs = assertion.slots.map((_slot: unknown, i: number) =>
      i === 0 ? null : '',
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const result = assertion.impl(...dummyArgs);

    if (isBoolean(result) || isAssertionFailure(result)) {
      return 'pure';
    }
    return 'schema';
  } catch {
    return 'schema';
  }
};

/**
 * Gets all sync function assertions from the {@link SyncAssertions} tuple.
 *
 * Excludes assertions that are excluded from benchmarks.
 *
 * @returns Classification of the assertions
 */
export const getSyncFunctionAssertions =
  (): SyncFunctionAssertionClassification => {
    const pure: BupkisAssertionFunctionSync<any, any, any>[] = [];
    const schema: BupkisAssertionFunctionSync<any, any, any>[] = [];

    for (const assertion of SyncAssertions) {
      if (
        isSyncFunctionAssertion(assertion) &&
        !isExcludedFromBenchmarks(assertion)
      ) {
        const classification = classifyAssertion(assertion);
        if (classification === 'pure') {
          pure.push(assertion);
        } else {
          schema.push(assertion);
        }
      }
    }

    return { pure, schema };
  };
