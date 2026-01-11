/**
 * Utility for classifying sync function assertions by their return types.
 */

import type { AnyAssertion } from '../src/assertion/index.js';

import {
  BupkisAssertionFunctionSync,
  BupkisAssertionSchemaSync,
} from '../src/assertion/assertion-sync.js';
import { SyncAssertions } from '../src/assertion/index.js';
import { isBoolean, isZodType } from '../src/guards.js';
import {
  isAssertionFailure,
  isAssertionParseRequest,
} from '../src/internal-schema.js';

type AssertionClassification = 'pure' | 'schema';

interface SyncFunctionAssertionClassification {
  pure: BupkisAssertionFunctionSync<any, any, any>[];
  schema: BupkisAssertionFunctionSync<any, any, any>[];
}

export const isSyncFunctionAssertion = (
  assertion: AnyAssertion,
): assertion is BupkisAssertionFunctionSync<any, any, any> => {
  return (
    assertion instanceof BupkisAssertionFunctionSync &&
    !(assertion instanceof BupkisAssertionSchemaSync)
  );
};

export const classifyAssertion = (
  assertion: BupkisAssertionFunctionSync<any, any, any>,
): AssertionClassification => {
  try {
    // These are dummy args to provide to the assertion implementation which
    // will most certainly cause it to fail. We can then inspect the result to
    // determine if it is a pure or schema assertion.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const dummyArgs = assertion.slots.map((_slot: unknown, i: number) => {
      if (i === 0) {
        return null;
      }
      return '';
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const result = assertion.impl(...dummyArgs);

    if (isBoolean(result) || isAssertionFailure(result)) {
      return 'pure';
    } else if (
      isZodType(result) ||
      isAssertionParseRequest(result) ||
      (result && typeof result === 'object' && '_def' in result)
    ) {
      return 'schema';
    } else {
      return 'schema';
    }
  } catch {
    return 'schema';
  }
};

export const getSyncFunctionAssertions =
  (): SyncFunctionAssertionClassification => {
    const pure: BupkisAssertionFunctionSync<any, any, any>[] = [];
    const schema: BupkisAssertionFunctionSync<any, any, any>[] = [];

    for (const assertion of SyncAssertions) {
      if (isSyncFunctionAssertion(assertion)) {
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
