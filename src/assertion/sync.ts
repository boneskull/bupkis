/**
 * Synchronous assertion implementations.
 *
 * This module contains all built-in synchronous assertion implementations
 * including type checks, comparisons, equality tests, object satisfaction,
 * function behavior validation, and property checks. Each assertion is
 * implemented with proper error handling and type safety.
 *
 * @packageDocumentation
 */

import { CollectionAssertions } from './sync-collection.js';
import { EsotericAssertions } from './sync-esoteric.js';
import { ParametricAssertions } from './sync-parametric.js';
import { TypeAssertions } from './sync-type.js';

export const trapError = (fn: () => unknown) => {
  try {
    fn();
  } catch (err) {
    return err;
  }
};

export const SyncAssertions = [
  ...CollectionAssertions,
  ...TypeAssertions,
  ...EsotericAssertions,
  ...ParametricAssertions,
] as const;
