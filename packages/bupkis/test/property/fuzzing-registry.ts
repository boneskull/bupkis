/**
 * Registry of all fuzz targets for property-based testing.
 *
 * Consolidates test configurations from assertion tests and value-to-schema
 * tests into a unified format that the fuzzer can consume.
 *
 * @packageDocumentation
 */

import {
  createPropertyTestHarness,
  getVariants,
  type PropertyTestConfig,
} from '@bupkis/property-testing';
import fc from 'fast-check';

import type { AnyAssertion } from '../../src/types.js';

import { valueToSchema } from '../../src/value-to-schema.js';
import { expect, expectAsync } from '../custom-assertions.js';
import { testConfigs as asyncParametricConfigs } from './configs/async-parametric.js';
import { testConfigs as syncBasicConfigs } from './configs/sync-basic.js';
import { testConfigs as syncCollectionConfigs } from './configs/sync-collection.js';
import { testConfigs as syncDateConfigs } from './configs/sync-date.js';
import { testConfigs as syncEsotericConfigs } from './configs/sync-esoteric.js';
import { testConfigs as syncParametricConfigs } from './configs/sync-parametric.js';

const harness = createPropertyTestHarness({ expect, expectAsync });

/**
 * A fuzz target representing a single property test that can be executed by a
 * worker.
 *
 * Each fuzz target corresponds to one variant (valid, invalid, validNegated, or
 * invalidNegated) of an assertion's property test configuration, or a custom
 * property test like those for `valueToSchema`.
 */
export interface FuzzTarget {
  /**
   * Unique identifier for the fuzz target, typically in the format
   * "assertionId:variantName" or "category:testName".
   */
  id: string;

  /**
   * Whether this property test is asynchronous and requires `fc.check()` to be
   * awaited.
   */
  isAsync: boolean;

  /**
   * The fast-check property to execute. This is a self-contained property that
   * includes both the arbitraries and the predicate.
   */
  property: fc.IAsyncProperty<any> | fc.IProperty<any>;
}

/**
 * Map from an assertion to its property test configuration(s).
 *
 * Some assertions may have multiple configurations (e.g., testing different
 * parameter combinations), hence the union with an array type.
 */
type AssertionConfigMap = Map<
  AnyAssertion,
  PropertyTestConfig | PropertyTestConfig[]
>;

const allAssertionConfigs: AssertionConfigMap[] = [
  syncBasicConfigs,
  syncParametricConfigs,
  syncCollectionConfigs as AssertionConfigMap,
  syncDateConfigs,
  syncEsotericConfigs,
  asyncParametricConfigs,
];

const extractFuzzTargetsFromConfig = (
  assertion: AnyAssertion,
  config: PropertyTestConfig,
): FuzzTarget[] => {
  const targets: FuzzTarget[] = [];
  const { variants } = getVariants(config);

  for (const [variantName, variant] of variants) {
    const id = `${assertion.id}:${variantName}`;
    const { isAsync, property } = harness.extractProperty(
      variant,
      variantName,
      assertion,
    );
    targets.push({ id, isAsync, property });
  }

  return targets;
};

const extractAssertionFuzzTargets = (): FuzzTarget[] => {
  const targets: FuzzTarget[] = [];

  for (const configMap of allAssertionConfigs) {
    for (const [assertion, configOrConfigs] of configMap) {
      const configs = Array.isArray(configOrConfigs)
        ? configOrConfigs
        : [configOrConfigs];

      for (let i = 0; i < configs.length; i++) {
        const config = configs[i]!;
        const configTargets = extractFuzzTargetsFromConfig(assertion, config);

        if (configs.length > 1) {
          for (const target of configTargets) {
            target.id = `${target.id}[${i}]`;
          }
        }

        targets.push(...configTargets);
      }
    }
  }

  return targets;
};

/**
 * Generators for `valueToSchema` fuzz tests.
 *
 * These provide randomized inputs covering the main categories of values that
 * `valueToSchema` handles: primitives, objects, functions, and regular
 * expressions.
 */
const valueToSchemaGenerators = {
  functions: fc.oneof(
    fc.constant(() => {}),
    fc.constant(() => {}),
    fc.constant(async () => {}),
    fc.constant(function* generator() {}),
  ),

  objectWithRegexp: fc.record({
    flags: fc.string(),
    name: fc.string(),
    pattern: fc.oneof(
      fc.constant(/test/),
      fc.constant(/\d+/),
      fc.constant(/[a-z]*/),
    ),
  }),

  primitive: fc.oneof(
    fc.constant(null),
    fc.constant(undefined),
    fc.boolean(),
    fc.string(),
    fc.integer(),
    fc.float(),
    fc.bigInt(),
    fc.constant(NaN),
    fc.constant(Infinity),
    fc.constant(-Infinity),
    fc.constant(Symbol('test')),
  ),

  regexp: fc.oneof(
    fc.constant(/test/),
    fc.constant(/\d+/g),
    fc.constant(/[a-z]*/i),
    fc.constant(/^start.*end$/m),
  ),

  simpleObject: fc.record({
    bool: fc.boolean(),
    num: fc.integer(),
    str: fc.string(),
  }),
};

const extractValueToSchemaFuzzTargets = (): FuzzTarget[] => [
  {
    id: 'valueToSchema:primitive',
    isAsync: false,
    property: fc.property(valueToSchemaGenerators.primitive, (value) => {
      try {
        const schema = valueToSchema(value);
        const result = schema.safeParse(value);
        return result.success;
      } catch {
        return true;
      }
    }),
  },
  {
    id: 'valueToSchema:literalPrimitives',
    isAsync: false,
    property: fc.property(valueToSchemaGenerators.primitive, (value) => {
      const schema = valueToSchema(value, { literalPrimitives: true });
      const result = schema.safeParse(value);
      return result.success;
    }),
  },
  {
    id: 'valueToSchema:regexp',
    isAsync: false,
    property: fc.property(valueToSchemaGenerators.regexp, (regexp) => {
      const schema = valueToSchema(regexp, { literalRegExp: true });
      const result = schema.safeParse(regexp);
      return result.success;
    }),
  },
  {
    id: 'valueToSchema:simpleObject',
    isAsync: false,
    property: fc.property(valueToSchemaGenerators.simpleObject, (obj) => {
      const schema = valueToSchema(obj, { strict: true });
      const result = schema.safeParse(obj);
      return result.success;
    }),
  },
  {
    id: 'valueToSchema:functions',
    isAsync: false,
    property: fc.property(valueToSchemaGenerators.functions, (fn) => {
      const schema = valueToSchema(fn);
      const result = schema.safeParse(fn);
      return result.success;
    }),
  },
  {
    id: 'valueToSchema:objectWithRegexp',
    isAsync: false,
    property: fc.property(valueToSchemaGenerators.objectWithRegexp, (obj) => {
      const schema = valueToSchema(obj, { literalRegExp: true });
      const result = schema.safeParse(obj);
      return result.success;
    }),
  },
];

let cachedTargets: FuzzTarget[] | undefined;

/**
 * Returns all registered fuzz targets.
 *
 * This includes property tests from all assertion categories as well as custom
 * `valueToSchema` tests. Results are cached after the first call.
 */
export const getAllFuzzTargets = (): FuzzTarget[] => {
  if (!cachedTargets) {
    cachedTargets = [
      ...extractAssertionFuzzTargets(),
      ...extractValueToSchemaFuzzTargets(),
    ];
  }
  return cachedTargets;
};

/**
 * Finds a fuzz target by its unique identifier.
 *
 * @param id - The target ID (e.g., "stringAssertion:valid")
 * @returns The matching fuzz target, or `undefined` if not found
 */
export const getFuzzTargetById = (id: string): FuzzTarget | undefined =>
  getAllFuzzTargets().find((t) => t.id === id);

/**
 * Returns the IDs of all registered fuzz targets.
 *
 * Useful for building the work queue in the fuzzer orchestrator.
 */
export const getFuzzTargetIds = (): string[] =>
  getAllFuzzTargets().map((t) => t.id);
