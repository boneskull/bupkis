import {
  createPropertyTestHarness,
  getVariants,
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from '@bupkis/property-testing';
import { describe, it } from 'node:test';

import { SyncCollectionAssertions } from '../../src/assertion/index.js';
import { expect, expectAsync } from '../custom-assertions.js';
import { testConfigs } from './configs/sync-collection-config.js';

const { runVariant } = createPropertyTestHarness({ expect, expectAsync });

const testConfigDefaults = {} satisfies PropertyTestConfigParameters;

describe('Property-Based Tests for Collection Assertions', () => {
  it(`should test all available assertions in SyncCollectionAssertions`, () => {
    expect(
      testConfigs,
      'to exhaustively test collection',
      'SyncCollectionAssertions',
      'from',
      SyncCollectionAssertions,
    );
  });

  for (const [assertion, testConfig] of testConfigs) {
    const { id } = assertion;
    describe(`Assertion: ${assertion} [${id}]`, () => {
      const runVariants = (configs: PropertyTestConfig[]) => {
        for (const config of configs) {
          const { params, variants } = getVariants(config);
          for (const [name, variant] of variants) {
            it(`should pass ${name} checks [${id}]`, async () => {
              await runVariant(
                variant,
                testConfigDefaults,
                params,
                name,
                assertion,
              );
            });
          }
        }
      };

      runVariants(Array.isArray(testConfig) ? testConfig : [testConfig]);
    });
  }
});
