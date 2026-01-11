/**
 * Test data generation utilities for modestbench benchmarks.
 *
 * This module combines all fast-check generators from test-data/ and provides
 * utilities to get test data for any assertion.
 */

import fc from 'fast-check';

import type { AnyAssertion } from '../../src/assertion/index.js';

import {
  AsyncParametricGenerators,
  SyncBasicGenerators,
  SyncCollectionGenerators,
  SyncDateGenerators,
  SyncEsotericGenerators,
  SyncParametricGenerators,
} from '../../test-data/index.js';

type AssertionGenerators =
  | fc.Arbitrary<readonly [unknown, string, ...unknown[]]>
  | readonly fc.Arbitrary<unknown>[];

const assertionArbitraries = new Map<AnyAssertion, AssertionGenerators>();

for (const [assertion, generators] of SyncBasicGenerators) {
  assertionArbitraries.set(assertion, generators);
}
for (const [assertion, generators] of SyncCollectionGenerators) {
  assertionArbitraries.set(assertion, generators);
}
for (const [assertion, generators] of SyncDateGenerators) {
  assertionArbitraries.set(assertion, generators);
}
for (const [assertion, generators] of SyncEsotericGenerators) {
  assertionArbitraries.set(assertion, generators);
}
for (const [assertion, generators] of SyncParametricGenerators) {
  assertionArbitraries.set(assertion, generators);
}
for (const [assertion, generators] of AsyncParametricGenerators) {
  assertionArbitraries.set(assertion, generators);
}

const isGeneratorArray = (
  generators: AssertionGenerators,
): generators is readonly fc.Arbitrary<unknown>[] => Array.isArray(generators);

export const getTestDataForAssertion = (
  assertion: AnyAssertion,
): readonly [subject: unknown, phrase: string, ...args: unknown[]] => {
  const generators = assertionArbitraries.get(assertion);

  if (!generators) {
    throw new Error(`No generator found for assertion ${assertion}`);
  }

  if (isGeneratorArray(generators)) {
    const sample = fc.sample(fc.tuple(...generators), 1)[0];
    if (!sample) {
      throw new Error(`Failed to sample generators for ${assertion}`);
    }
    return sample as unknown as readonly [
      subject: unknown,
      phrase: string,
      ...args: unknown[],
    ];
  } else {
    const sample = fc.sample(generators, 1)[0];
    if (!sample) {
      throw new Error(`Failed to sample generators for ${assertion}`);
    }
    return sample;
  }
};

const getPrimaryPhrase = (assertion: AnyAssertion): string => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const parts = assertion.parts;

  for (const part of parts) {
    if (typeof part === 'string') {
      return part;
    }

    if (Array.isArray(part) && part.length > 0 && typeof part[0] === 'string') {
      return part[0];
    }
  }

  throw new Error(
    `Could not determine primary phrase for assertion ${assertion}`,
  );
};

export const isThrowingAssertion = (assertion: AnyAssertion): boolean => {
  const phrase = getPrimaryPhrase(assertion);
  if (!phrase) {
    return false;
  }

  const throwingPatterns = [
    'to throw',
    'throws',
    'to reject',
    'rejects',
    'to be rejected',
    'to fail',
    'fails',
  ];

  return throwingPatterns.some((pattern) =>
    phrase.toLowerCase().includes(pattern),
  );
};
