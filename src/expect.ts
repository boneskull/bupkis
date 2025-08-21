import { type UnionToIntersection } from 'type-fest';
import { type z } from 'zod/v4';

import { Assertions } from './assertion/implementations.js';
import {
  AnyParsedValues,
  type AssertionPart,
  type AssertionParts,
  type AssertionSlot,
  type BuiltinAssertion,
  type BupkisStringLiteral,
  type BupkisStringLiterals,
} from './assertion/types.js';
import { PaddedSignature, type NoNeverTuple } from './util.js';

import Debug from 'debug';

const debug = Debug('bupkis:expect');

// Create the expect type using padded signatures
export type Expect = UnionToIntersection<PaddedSignature<BuiltinAssertion>>;

export type InferredExpectSlots<Parts extends AssertionParts> = NoNeverTuple<
  Parts extends readonly [infer First extends AssertionPart, ...infer _]
    ? First extends readonly [string, ...string[]] | string
      ? [unknown, ...MapExpectSlots<Parts>]
      : MapExpectSlots<Parts>
    : never
>;

// ————————————————————————————————————————————————————————————————
// expect() typing from Assertions tuple
// ————————————————————————————————————————————————————————————————
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

export const expect = ((...args: unknown[]) => {
  // Ambiguity check: ensure only one match
  let found:
    | {
        assertion: BuiltinAssertion;
        exactMatch: boolean;
        parsedValues: AnyParsedValues;
      }
    | undefined;
  const failureReasons: [string, string][] = [];
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
      failureReasons.push([`${assertion}`, reason]);
    }
  }
  if (found) {
    const { assertion, parsedValues } = found;
    return assertion.execute(args, parsedValues);
  }
  debug('Failure reasons: %O', failureReasons);
  throw new TypeError('No matching assertion found');
}) as unknown as Expect;
