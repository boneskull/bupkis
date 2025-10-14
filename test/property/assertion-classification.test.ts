import * as fc from 'fast-check';
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  classifyAssertion,
  getSyncFunctionAssertions,
  isSyncFunctionAssertion,
} from '../../bench/assertion-classifier.js';
import { SyncAssertions } from '../../src/assertion/index.js';

describe('assertion classification properties', () => {
  it('should classify all sync function assertions into exactly two non-overlapping categories', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const classification = getSyncFunctionAssertions();

        // All assertions should be either pure or schema, never both
        const allIds = new Set([
          ...classification.pure.map((a) => a.id),
          ...classification.schema.map((a) => a.id),
        ]);
        const pureIds = new Set(classification.pure.map((a) => a.id));
        const schemaIds = new Set(classification.schema.map((a) => a.id));

        // No overlaps between pure and schema
        const intersection = new Set(
          [...pureIds].filter((id) => schemaIds.has(id)),
        );
        assert.equal(
          intersection.size,
          0,
          'Pure and schema categories should not overlap',
        );

        // Every assertion should be classified
        const syncFunctionAssertions = SyncAssertions.filter(
          isSyncFunctionAssertion,
        );
        assert.equal(
          allIds.size,
          syncFunctionAssertions.length,
          'All sync function assertions should be classified',
        );

        return true;
      }),
    );
  });

  it('should consistently classify the same assertion across multiple calls', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const syncFunctionAssertions = SyncAssertions.filter(
          isSyncFunctionAssertion,
        );

        for (const assertion of syncFunctionAssertions) {
          const classification1 = classifyAssertion(assertion);
          const classification2 = classifyAssertion(assertion);

          assert.equal(
            classification1,
            classification2,
            `Classification should be consistent for assertion ${assertion.id}`,
          );
        }

        return true;
      }),
    );
  });

  it('should have valid classification types for all sync function assertions', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const syncFunctionAssertions = SyncAssertions.filter(
          isSyncFunctionAssertion,
        );

        for (const assertion of syncFunctionAssertions) {
          const classification = classifyAssertion(assertion);

          assert.ok(
            classification === 'pure' || classification === 'schema',
            `Classification should be 'pure' or 'schema', got '${classification}' for assertion ${assertion.id}`,
          );
        }

        return true;
      }),
    );
  });

  it('should maintain stable classification across getSyncFunctionAssertions calls', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const classification1 = getSyncFunctionAssertions();
        const classification2 = getSyncFunctionAssertions();

        // Compare pure assertion IDs
        const pure1Ids = new Set(classification1.pure.map((a) => a.id));
        const pure2Ids = new Set(classification2.pure.map((a) => a.id));
        assert.deepEqual(
          [...pure1Ids].sort(),
          [...pure2Ids].sort(),
          'Pure assertion classification should be stable',
        );

        // Compare schema assertion IDs
        const schema1Ids = new Set(classification1.schema.map((a) => a.id));
        const schema2Ids = new Set(classification2.schema.map((a) => a.id));
        assert.deepEqual(
          [...schema1Ids].sort(),
          [...schema2Ids].sort(),
          'Schema assertion classification should be stable',
        );

        return true;
      }),
    );
  });

  it('should correctly identify sync function assertions', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const allSyncAssertions = SyncAssertions;
        const syncFunctionAssertions = allSyncAssertions.filter(
          isSyncFunctionAssertion,
        );

        // Verify that all identified assertions have function implementations
        for (const assertion of syncFunctionAssertions) {
          assert.ok(
            'impl' in assertion && typeof assertion.impl === 'function',
            `Sync function assertion ${assertion.id} should have function implementation`,
          );
        }

        // Verify we found at least some sync function assertions
        assert.ok(
          syncFunctionAssertions.length > 0,
          'Should find at least some sync function assertions',
        );

        return true;
      }),
    );
  });

  it('should have reasonable distribution between pure and schema classifications', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const classification = getSyncFunctionAssertions();

        // Both categories should have at least one assertion
        assert.ok(
          classification.pure.length > 0,
          'Should have at least one pure assertion',
        );
        assert.ok(
          classification.schema.length > 0,
          'Should have at least one schema assertion',
        );

        // Total should be reasonable (not empty)
        const total = classification.pure.length + classification.schema.length;
        assert.ok(
          total >= 10,
          `Should have reasonable number of sync function assertions (got ${total})`,
        );

        return true;
      }),
    );
  });
});
