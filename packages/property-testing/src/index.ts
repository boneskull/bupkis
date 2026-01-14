/**
 * Property-based testing harness for bupkis assertions.
 *
 * @module @bupkis/property-testing
 * @category Testing Utilities
 */

export {
  type AssertionApplicability,
  createApplicabilityRegistry,
  getApplicabilityRegistry,
  getApplicableAssertions,
  getInapplicableAssertions,
} from './applicability.js';

export {
  buildChainArgs,
  type ChainArgs,
  type ChainGeneratorConfig,
  diverseValueArbitrary,
  invalidChainArbitrary,
  invalidNegatedChainArbitrary,
  validChainArbitrary,
  validNegatedChainArbitrary,
} from './chain-generators.js';

export {
  type GeneratorParams,
  type InferPropertyTestConfigVariantAsyncProperty,
  type InferPropertyTestConfigVariantModel,
  type InferPropertyTestConfigVariantProperty,
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
  PropertyTestConfigSchema,
  type PropertyTestConfigVariant,
  type PropertyTestConfigVariantAsyncGenerators,
  type PropertyTestConfigVariantAsyncProperty,
  type PropertyTestConfigVariantModel,
  type PropertyTestConfigVariantProperty,
  PropertyTestConfigVariantSchema,
  type PropertyTestConfigVariantSyncGenerators,
} from './config.js';

export {
  createPropertyTestHarness,
  type ExpectationResult,
  expectUsing,
  expectUsingAsync,
  type ExpectUsingOptions,
  extractPhrases,
  getVariants,
  isGeneratorsTuple,
  isPropertyTestConfigVariantAsyncGenerators,
  isPropertyTestConfigVariantAsyncProperty,
  isPropertyTestConfigVariantGenerators,
  isPropertyTestConfigVariantProperty,
  PropertyTestGeneratorError,
  type PropertyTestHarnessContext,
  WrongAssertionError,
} from './harness.js';

export {
  calculateNumRuns,
  filteredAnything,
  filteredObject,
  hasKeyDeep,
  hasValueDeep,
  objectFilter,
  safeRegexStringFilter,
} from './util.js';
