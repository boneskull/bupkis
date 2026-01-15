import setDifference from 'set.prototype.difference';

import { BupkisAssertion } from '../src/assertion/assertion.js';
import { expect as builtinExpect, z } from '../src/index.js';
import { type AnyAssertion, type AssertionFailure } from '../src/types.js';
import { keyBy } from '../src/util.js';

const { keys } = Object;

/**
 * Matches any assertion instance.
 *
 * Uses z.custom() with explicit type annotation because z.instanceof() infers
 * overly specific generic parameters that don't align with AnyAssertion's use
 * of `any` type parameters.
 */
const AnyAssertionSchema = z.custom<AnyAssertion>(
  (val): val is AnyAssertion => val instanceof BupkisAssertion,
);

/**
 * Helper function to validate assertion coverage against a collection.
 *
 * @param configMap - Map of assertion configurations being tested
 * @param collectionName - Name of the collection for error messages
 * @param assertions - All assertions in the collection
 * @param exceptedAssertions - Assertions to exclude from the check (optional)
 * @returns Assertion result or undefined if validation passes
 */
const validateAssertionCoverage = (
  configMap: Map<AnyAssertion, unknown>,
  collectionName: string,
  assertions: AnyAssertion[],
  exceptedAssertions: AnyAssertion[] = [],
): AssertionFailure | void => {
  const assertionsById = keyBy(assertions, 'id');
  const exceptedIds = new Set(exceptedAssertions.map(({ id }) => id));
  const allCollectionIds = new Set(
    keys(assertionsById).filter((id) => !exceptedIds.has(id)),
  );
  const testedIds = new Set([...configMap.keys()].map(({ id }) => id));
  const diff = setDifference(allCollectionIds, testedIds);

  try {
    builtinExpect(diff, 'to be empty');
  } catch {
    /* c8 ignore next */
    const suffix =
      exceptedAssertions.length > 0
        ? ` (excepting ${exceptedAssertions.length} assertion${exceptedAssertions.length === 1 ? '' : 's'})`
        : '';
    return {
      actual: testedIds,
      expected: allCollectionIds,
      message: `Some assertions in collection "${collectionName}" are missing property test configurations${suffix}`,
    };
  }
};

/**
 * Asserts that a configuration map exhaustively tests all assertions in a
 * collection.
 */
const exhaustiveAssertionTestAssertion = builtinExpect.createAssertion(
  [
    z.map(AnyAssertionSchema, z.unknown()),
    'to exhaustively test collection',
    z.string(),
    'from',
    z.array(AnyAssertionSchema),
  ],
  (configMap, collectionName, assertions) => {
    return validateAssertionCoverage(configMap, collectionName, assertions);
  },
);

/**
 * Asserts that a configuration map exhaustively tests all assertions in a
 * collection, excluding specified assertions.
 */
const exhaustiveAssertionTestExceptingAssertion = builtinExpect.createAssertion(
  [
    z.map(AnyAssertionSchema, z.unknown()),
    'to exhaustively test collection',
    z.string(),
    'from',
    z.array(AnyAssertionSchema),
    'excepting',
    z.array(AnyAssertionSchema),
  ],
  (configMap, collectionName, assertions, exceptedAssertions) => {
    return validateAssertionCoverage(
      configMap,
      collectionName,
      assertions,
      exceptedAssertions,
    );
  },
);

const { expect, expectAsync, use } = builtinExpect.use([
  exhaustiveAssertionTestAssertion,
  exhaustiveAssertionTestExceptingAssertion,
]);

export { expect, expectAsync, use };
