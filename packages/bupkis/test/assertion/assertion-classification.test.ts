import { describe, it } from 'node:test';

import {
  classifyAssertion,
  getSyncFunctionAssertions,
  isSyncFunctionAssertion,
} from '../../bench/assertion-classifier.js';
import {
  bigintAssertion,
  functionResolveAssertion,
  mapContainsAssertion,
  SyncAssertions,
} from '../../src/assertion/index.js';
import { expect } from '../../src/index.js';

const EXPECTED_TOTAL_ASSERTIONS = 66;

describe('Assertion Classification', () => {
  describe('classifyAssertion', () => {
    it('should have valid classification types for all sync function assertions', () => {
      for (const assertion of SyncAssertions) {
        if (isSyncFunctionAssertion(assertion)) {
          const classification = classifyAssertion(assertion);
          expect(
            classification === 'pure' || classification === 'schema',
            'to be true',
          );
        }
      }
    });
  });

  describe('getSyncFunctionAssertions', () => {
    it('should categorize all sync-function assertions', async () => {
      const { pure, schema } = getSyncFunctionAssertions();
      expect(
        pure.length + schema.length,
        'to equal',
        EXPECTED_TOTAL_ASSERTIONS,
      );
    });

    it('should produce non-overlapping classifications', () => {
      const { pure, schema } = getSyncFunctionAssertions();
      const pureIds = new Set(pure.map((a) => a.id));
      const schemaIds = new Set(schema.map((a) => a.id));
      expect(pureIds.intersection(schemaIds), 'to be empty');
    });
  });

  describe('isSyncFunctionAssertion', () => {
    describe('when provided a sync function assertion', () => {
      it('should return true', () => {
        expect(isSyncFunctionAssertion(mapContainsAssertion), 'to be true');
      });
    });

    describe('when provided a sync schema assertion', () => {
      it('should return false', () => {
        expect(isSyncFunctionAssertion(bigintAssertion), 'to be false');
      });
    });

    describe('when provided a non-sync function assertion', () => {
      it('should return false', () => {
        expect(
          isSyncFunctionAssertion(functionResolveAssertion),
          'to be false',
        );
      });
    });
  });
});
