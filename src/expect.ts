/**
 * Main synchronous assertion engine implementation.
 *
 * This module provides the core `expect` function for writing assertions in
 * tests. It handles assertion parsing, validation, execution, and error
 * reporting with rich type-safe APIs for various assertion patterns.
 *
 * @packageDocumentation
 */

import Debug from 'debug';

import { Assertion } from './assertion/assertion.js';
import { Assertions } from './assertion/implementations.js';
import {
  type AnyParsedValues,
  type BuiltinAssertion,
} from './assertion/types.js';
import { AssertionError } from './error.js';
import { type Expect, type ExpectFunction } from './expect-types.js';

const debug = Debug('bupkis:expect');

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

    return assertion.execute(parsedValues, [...args], expectFunction);
  }
  debug('Failed to find a matching assertion for args %o', args);
  throw new TypeError(
    `No assertion matched the provided arguments: [${args.map((arg) => `${typeof arg} ${String(arg)}`).join(', ')}]\\n` +
      parseFailureReasons
        .map(([assertion, reason]) => `  • ${assertion}: ${reason}`)
        .join('\\n'),
  );
};

/** {@inheritDoc Expect} */
export const expect: Expect = Object.assign(expectFunction, {
  createAssertion: Assertion.fromParts,
  fail(reason?: string): never {
    throw new AssertionError({ message: reason });
  },
});
