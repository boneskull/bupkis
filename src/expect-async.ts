import Debug from 'debug';

import { Assertions } from './assertion/async-implementations.js';
import {
  type AnyParsedValues,
  type BuiltinAsyncAssertion,
} from './assertion/types.js';
import { AssertionError } from './error.js';
import { type InferredExpectSlots } from './expect.js';

const debug = Debug('bupkis:expect-async');

/**
 * SOLUTION: Fixed type computation that avoids the "deep instantiation" error
 *
 * The original problematic code was: export type Expect =
 * UnionToIntersection<PaddedSignature<BuiltinAssertion>>;
 *
 * This created a union of 40+ function signatures with complex tuple padding,
 * which hit TypeScript's recursion limits causing "type instantiation is
 * excessively deep and possibly infinite".
 *
 * The solution uses function overloads instead of intersection types.
 */

export type ExpectAsync = ExpectAsyncFunction & {
  fail(reason?: string): never;
};

// Create function overloads for each assertion
type ExpectAsyncFunction = {
  [K in keyof typeof Assertions]: (typeof Assertions)[K] extends BuiltinAsyncAssertion
    ? (
        ...args: InferredExpectSlots<(typeof Assertions)[K]['__parts']>
      ) => Promise<void>
    : never;
}[number];

const expectAsyncFunction: ExpectAsyncFunction = async (
  ...args: readonly unknown[]
): Promise<void> => {
  // Ambiguity check: ensure only one match
  let found:
    | undefined
    | {
        assertion: BuiltinAsyncAssertion;
        exactMatch: boolean;
        parsedValues: AnyParsedValues;
      };
  const failureReasons: [string, string][] = [];
  for (const assertion of Assertions) {
    const { exactMatch, parsedValues, reason, success } =
      await assertion.parseValuesAsync(args);
    if (success) {
      if (found) {
        // if we have an exact match already and this match is not exact, keep the current one.
        // if we have an exact match already and this match is also exact, throw an error.
        if (found.exactMatch) {
          if (!exactMatch) {
            continue;
          }
          throw new TypeError(
            `Multiple exact matching assertions found: ${found.assertion} and ${assertion}`,
          );
        }
      }
      found = { assertion, exactMatch, parsedValues };
    } else {
      failureReasons.push([`${assertion}`, reason]);
    }
  }
  if (found) {
    const { assertion, parsedValues } = found;
    await assertion.executeAsync(parsedValues, [...args]);
    return;
  }
  debug('Failed to find a matching assertion for args %o', args);
  throw new TypeError(
    `No assertion matched the provided arguments: [${args.map((arg) => `${typeof arg} ${String(arg)}`).join(', ')}]\\n` +
      failureReasons
        .map(([assertion, reason]) => `  • ${assertion}: ${reason}`)
        .join('\\n'),
  );
};

/**
 * The main async assertion function with fail property.
 */
export const expectAsync: ExpectAsync = Object.assign(expectAsyncFunction, {
  fail(reason?: string): never {
    throw new AssertionError({ message: reason });
  },
});
