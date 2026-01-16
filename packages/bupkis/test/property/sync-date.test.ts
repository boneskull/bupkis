import {
  createPropertyTestHarness,
  getVariants,
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
} from '@bupkis/property-testing';
import { describe, it } from 'node:test';

import * as assertions from '../../src/assertion/impl/sync-date.js';
import { expect, expectAsync } from '../custom-assertions.js';
import { testConfigs } from './configs/sync-date-config.js';

const { runVariant } = createPropertyTestHarness({ expect, expectAsync });

const SyncDateAssertions = Object.values(assertions);

const testConfigDefaults: PropertyTestConfigParameters = {} as const;

describe('Date/Time assertions property tests', () => {
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

  it('should exhaustively test collection SyncDateAssertions', () => {
    expect(
      testConfigs,
      'to exhaustively test collection',
      'SyncDateAssertions',
      'from',
      SyncDateAssertions,
    );
  });
});
