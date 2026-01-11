/**
 * Test data arbitraries extracted from property tests.
 *
 * This module exports fast-check arbitraries for generating valid test data for
 * all assertions, extracted from the property test configurations. Used by
 * benchmarks to ensure accurate test data generation.
 *
 * @packageDocumentation
 */

export * from './async-parametric-generators.js';
export * from './sync-basic-generators.js';
export * from './sync-collection-generators.js';
export * from './sync-date-generators.js';
export * from './sync-esoteric-generators.js';
export * from './sync-parametric-generators.js';
