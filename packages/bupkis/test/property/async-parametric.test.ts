import {
  createPropertyTestHarness,
  getVariants,
  type PropertyTestConfigParameters,
} from '@bupkis/property-testing';
import { describe, it } from 'node:test';

import { AsyncParametricAssertions } from '../../src/assertion/index.js';
import { expect, expectAsync } from '../custom-assertions.js';
import { testConfigs } from './configs/async-parametric.js';

const { runVariant } = createPropertyTestHarness({ expect, expectAsync });

const testConfigDefaults: PropertyTestConfigParameters = {} as const;

describe('Property-Based Tests for Async Parametric Assertions', () => {
  it(`should test all available assertions in AsyncParametricAssertions`, () => {
    expect(
      testConfigs,
      'to exhaustively test collection',
      'AsyncParametricAssertions',
      'from',
      AsyncParametricAssertions,
    );
  });

  for (const [assertion, testConfig] of testConfigs) {
    const { id } = assertion;
    const { params, variants } = getVariants(testConfig);
    describe(`Assertion: ${assertion} [${id}]`, () => {
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
    });
  }
});
