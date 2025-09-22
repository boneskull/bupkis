import { it } from 'node:test';
import setDifference from 'set.prototype.difference';

import { expect } from '../src/bootstrap.js';
import { AssertionError } from '../src/error.js';
import { type AnyAssertion } from '../src/types.js';
import { keyBy } from '../src/util.js';

/**
 * Checks that all `assertions` have an corresponding entry in `testConfigs`.
 *
 * @param collectionName Name of the collection being tested; used in error
 *   message
 * @param assertions Assertions to check
 * @param configMap Config to check
 */
export function expectExhaustiveAssertionTests(
  collectionName: string,
  assertions: readonly AnyAssertion[],
  configMap: Map<AnyAssertion, any>,
): void {
  it(`should test all available assertions in ${collectionName}`, () => {
    const assertionsById = keyBy(assertions, 'id');
    const allCollectionIds = new Set(Object.keys(assertionsById));
    const testedIds = new Set([...configMap.keys()].map(({ id }) => id));
    const diff = setDifference(allCollectionIds, testedIds);
    try {
      expect(diff, 'to be empty');
    } catch {
      throw new AssertionError({
        message: `Some assertions in collection "${collectionName}" are missing property test configurations:\n${[
          ...diff,
        ]
          .map((id) => `  ❌ ${assertionsById[id]} [${id}]`)
          .join('\n')}`,
      });
    }
  });
}
