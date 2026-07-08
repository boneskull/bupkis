import { describe, it } from 'node:test';

import { getSyncFunctionAssertions } from '../../bench/assertion-classifier.js';
import { expect } from '../../src/index.js';

const EXPECTED_TOTAL_ASSERTIONS = 66;

describe('Assertion Classification', () => {
  it('should categorize all sync-function assertions', async () => {
    const result = getSyncFunctionAssertions();
    expect(
      result.pure.length + result.schema.length,
      'to equal',
      EXPECTED_TOTAL_ASSERTIONS,
    );
  });
});
