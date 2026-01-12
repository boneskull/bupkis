/**
 * Property-based testing harness for bupkis assertions.
 *
 * @module @bupkis/property-testing
 * @category Testing Utilities
 */

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
  extractPhrases,
  getVariants,
  type PropertyTestHarnessContext,
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
