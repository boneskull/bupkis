import Debug from 'debug';
import { type z } from 'zod/v4';

import { Assertions } from './assertion/implementations.js';
import {
  type AnyParsedValues,
  type AssertionPart,
  type AssertionParts,
  type AssertionSlot,
  type BuiltinAssertion,
  type BupkisStringLiteral,
  type BupkisStringLiterals,
} from './assertion/types.js';
import { AssertionError } from './error.js';
import { type NoNeverTuple } from './util.js';

const debug = Debug('bupkis:expect');

export type Expect = ExpectFunction & {
  fail(reason?: string): never;
};

export type InferredExpectSlots<Parts extends AssertionParts> = NoNeverTuple<
  Parts extends readonly [infer First extends AssertionPart, ...infer _]
    ? First extends readonly [string, ...string[]] | string
      ? [unknown, ...MapExpectSlots<Parts>]
      : MapExpectSlots<Parts>
    : never
>;

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

// Create function overloads for each assertion
type ExpectFunction = {
  [K in keyof typeof Assertions]: (typeof Assertions)[K] extends BuiltinAssertion
    ? (...args: InferredExpectSlots<(typeof Assertions)[K]['__parts']>) => void
    : never;
}[number];

type MapExpectSlots<Parts extends AssertionParts> = Parts extends readonly [
  infer First extends AssertionPart,
  ...infer Rest extends AssertionParts,
]
  ? [
      AssertionSlot<First> extends BupkisStringLiteral<infer StringLiteral>
        ? StringLiteral
        : AssertionSlot<First> extends BupkisStringLiterals<
              infer StringLiterals
            >
          ? z.infer<z.ZodEnum<z.core.util.ToEnum<StringLiterals[number]>>>
          : AssertionSlot<First> extends z.ZodType
            ? z.infer<AssertionSlot<First>>
            : never,
      ...MapExpectSlots<Rest>,
    ]
  : [];

const expectFunction: ExpectFunction = (...args: readonly unknown[]) => {
  // Ambiguity check: ensure only one match
  let found:
    | undefined
    | {
        assertion: BuiltinAssertion;
        exactMatch: boolean;
        parsedValues: AnyParsedValues;
      };

  /**
   * This is used for debugging purposes only.
   */
  const parseFailureReasons: [string, string][] = [];
  for (const assertion of Assertions) {
    const { exactMatch, parsedValues, reason, success } =
      assertion.parseValues(args);
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
      parseFailureReasons.push([`${assertion}`, reason]);
    }
  }
  if (found) {
    const { assertion, parsedValues } = found;
    return assertion.execute(parsedValues, [...args]);
  }
  debug('Failed to find a matching assertion for args %o', args);
  throw new TypeError(
    `No assertion matched the provided arguments: [${args.map((arg) => `${typeof arg} ${String(arg)}`).join(', ')}]\\n` +
      parseFailureReasons
        .map(([assertion, reason]) => `  • ${assertion}: ${reason}`)
        .join('\\n'),
  );
};

/**
 * The main assertion function with fail property.
 */
export const expect: Expect = Object.assign(expectFunction, {
  fail(reason?: string): never {
    throw new AssertionError({ message: reason });
  },
});
