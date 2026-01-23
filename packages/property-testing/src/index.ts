/**
 * Property-based testing harness for **BUPKIS** assertions.
 *
 * _See also:_ **[README](/documents/_bupkis_property-testing-1/)**
 *
 * @module @bupkis/property-testing
 * @category Testing Utilities
 * @showGroups
 *
 * @groupDescription Test Harness
 * Core functions for creating and running property-based tests.
 *
 * @groupDescription Direct Execution
 * Functions for directly executing assertions without the full harness.
 *
 * @groupDescription Configuration
 * Types for configuring property tests and their variants.
 *
 * @groupDescription Type Guards
 * Type guards for runtime type checking of configuration variants.
 *
 * @groupDescription Applicability Registry
 * Functions for tracking which assertions apply to which value types.
 *
 * @groupDescription Chain Generators
 * Arbitraries for generating assertion chain arguments.
 *
 * @groupDescription Generator Utilities
 * Helper functions for building fast-check arbitraries.
 *
 * @groupDescription Errors
 * Error classes thrown by the property testing harness.
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
  type PropertyTestConfig,
  type PropertyTestConfigParameters,
  type PropertyTestConfigVariant,
  type PropertyTestConfigVariantAsyncGenerators,
  type PropertyTestConfigVariantAsyncProperty,
  type PropertyTestConfigVariantModel,
  type PropertyTestConfigVariantProperty,
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
