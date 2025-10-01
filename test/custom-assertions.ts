import setDifference from 'set.prototype.difference';

import { BupkisAssertion } from '../src/assertion/assertion.js';
import { AssertionError } from '../src/error.js';
import { expect as builtinExpect, z } from '../src/index.js';
import { type AnyAssertion } from '../src/types.js';
import { keyBy } from '../src/util.js';

const { keys } = Object;

const AnyAssertionSchema = z.instanceof(BupkisAssertion) as z.ZodCustom<
  AnyAssertion,
  AnyAssertion
>;

const exhaustiveAssertionTestAssertion = builtinExpect.createAssertion(
  [
    z.map(AnyAssertionSchema, z.unknown()),
    'to exhaustively test collection',
    z.string(),
    'from',
    z.array(AnyAssertionSchema),
  ],
  (configMap, collectionName, assertions) => {
    const assertionsById = keyBy(assertions, 'id');
    const allCollectionIds = new Set(keys(assertionsById));
    const testedIds = new Set([...configMap.keys()].map(({ id }) => id));
    const diff = setDifference(allCollectionIds, testedIds);
    try {
      builtinExpect(diff, 'to be empty');
    } catch {
      /* c8 ignore next */
      throw new AssertionError({
        actual: testedIds,
        expected: allCollectionIds,
        message: `Some assertions in collection "${collectionName}" are missing property test configurations`,
      });
    }
  },
);

const { expect, expectAsync, use } = builtinExpect.use([
  exhaustiveAssertionTestAssertion,
]);

export { expect, expectAsync, use };
