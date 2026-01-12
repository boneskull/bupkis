import {
  createPropertyTestHarness,
  getVariants,
  type PropertyTestConfigParameters,
} from '@bupkis/property-testing';
import { describe, it } from 'node:test';

import { SyncEsotericAssertions } from '../../src/assertion/index.js';
import { expect, expectAsync } from '../custom-assertions.js';
import { testConfigs } from './configs/sync-esoteric.js';

const { runVariant } = createPropertyTestHarness({ expect, expectAsync });

const testConfigDefaults = {} satisfies PropertyTestConfigParameters;

describe('Property-Based Tests for Esoteric Assertions', () => {
  it(`should test all available assertions in SyncEsotericAssertions`, () => {
    expect(
      testConfigs,
      'to exhaustively test collection',
      'SyncEsotericAssertions',
      'from',
      SyncEsotericAssertions,
    );
  });

  for (const [assertion, testConfig] of testConfigs) {
    const { id } = assertion;
    const { params, variants } = getVariants(testConfig);
    describe(`Assertion: ${assertion} [${id}]`, () => {
      for (const [name, variant] of variants) {
        it(`should pass ${name} checks [${id}]`, async () => {
          await runVariant(variant, testConfigDefaults, params, name);
        });
      }
    });
  }
});
