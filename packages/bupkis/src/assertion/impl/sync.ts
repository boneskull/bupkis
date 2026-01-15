/**
 * Synchronous assertion implementations.
 *
 * This module contains all built-in synchronous assertion implementations
 * including type checks, comparisons, equality tests, object satisfaction,
 * function behavior validation, and property checks. Each assertion is
 * implemented with proper error handling and type safety.
 *
 * @groupDescription Assertion Collections
 * Collections of individual assertions. For those building on top of <span class="bupkis">BUPKIS</span>.
 *
 * @packageDocumentation
 * @showGroups
 */

import { snapshotAssertion, snapshotAssertionWithOptions } from './snapshot.js';
import {
  arrayAssertion,
  asyncFunctionAssertion,
  bigintAssertion,
  booleanAssertion,
  classAssertion,
  dateAssertion,
  definedAssertion,
  emptyArrayAssertion,
  emptyObjectAssertion,
  emptyStringAssertion,
  errorAssertion,
  falseAssertion,
  falsyAssertion,
  functionAssertion,
  infiniteAssertion,
  integerAssertion,
  nanAssertion,
  negativeAssertion,
  negativeInfinityAssertion,
  negativeIntegerAssertion,
  nonEmptyStringAssertion,
  nullAssertion,
  numberAssertion,
  objectAssertion,
  positiveAssertion,
  positiveInfinityAssertion,
  positiveIntegerAssertion,
  primitiveAssertion,
  recordAssertion,
  regexpAssertion,
  setAssertion,
  stringAssertion,
  symbolAssertion,
  trueAssertion,
  truthyAssertion,
  undefinedAssertion,
  weakMapAssertion,
  weakSetAssertion,
} from './sync-basic.js';
import {
  arrayContainsAssertion,
  arrayItemSatisfiesAssertion,
  arraySizeAssertion,
  collectionSizeBetweenAssertion,
  collectionSizeGreaterThanAssertion,
  collectionSizeLessThanAssertion,
  emptyMapAssertion,
  emptySetAssertion,
  mapContainsAssertion,
  mapEntryAssertion,
  mapEqualityAssertion,
  mapKeyAssertion,
  mapSizeAssertion,
  mapValueAssertion,
  nonEmptyArrayAssertion,
  objectExactKeyAssertion,
  objectKeyAssertion,
  objectKeysAssertion,
  objectSizeAssertion,
  setContainsAssertion,
  setDifferenceEqualityAssertion,
  setDisjointAssertion,
  setEqualityAssertion,
  setIntersectionAssertion,
  setIntersectionEqualityAssertion,
  setSizeAssertion,
  setSubsetAssertion,
  setSupersetAssertion,
  setSymmetricDifferenceEqualityAssertion,
  setUnionEqualityAssertion,
} from './sync-collection.js';
import {
  afterAssertion,
  beforeAssertion,
  betweenAssertion,
  equalWithinAssertion,
  sameDateAssertion,
  validDateAssertion,
  weekdayAssertion,
  weekendAssertion,
} from './sync-date.js';
import {
  enumerablePropertyAssertion,
  enumerablePropertyAssertion2,
  extensibleAssertion,
  frozenAssertion,
  nullPrototypeAssertion,
  sealedAssertion,
} from './sync-esoteric.js';
import { SyncIterableAssertions } from './sync-iterable.js';
import {
  deepEqualAssertion,
  errorMessageAssertion,
  errorMessageMatchingAssertion,
  functionArityAssertion,
  functionThrowsAssertion,
  functionThrowsSatisfyingAssertion,
  functionThrowsTypeAssertion,
  functionThrowsTypeSatisfyingAssertion,
  instanceOfAssertion,
  numberCloseToAssertion,
  numberGreaterThanAssertion,
  numberGreaterThanOrEqualAssertion,
  numberLessThanAssertion,
  numberLessThanOrEqualAssertion,
  numberWithinRangeAssertion,
  oneOfAssertion,
  satisfiesAssertion,
  strictEqualityAssertion,
  stringBeginsWithAssertion,
  stringEndsWithAssertion,
  stringGreaterThanAssertion,
  stringGreaterThanOrEqualAssertion,
  stringIncludesAssertion,
  stringLengthAssertion,
  stringLessThanAssertion,
  stringLessThanOrEqualAssertion,
  stringMatchesAssertion,
  typeOfAssertion,
} from './sync-parametric.js';

/**
 * Tuple of all built-in date-related synchronous assertions.
 *
 * @group Assertion Collections
 */
export const SyncDateAssertions = [
  afterAssertion,
  beforeAssertion,
  betweenAssertion,
  equalWithinAssertion,
  sameDateAssertion,
  validDateAssertion,
  weekdayAssertion,
  weekendAssertion,
] as const;

/**
 * Tuple of all built-in esoteric synchronous assertions.
 *
 * @group Assertion Collections
 */
export const SyncEsotericAssertions = [
  nullPrototypeAssertion,
  frozenAssertion,
  enumerablePropertyAssertion,
  enumerablePropertyAssertion2,
  sealedAssertion,
  extensibleAssertion,
] as const;

/**
 * Tuple of all built-in basic synchronous assertions.
 *
 * @group Assertion Collections
 */

export const SyncBasicAssertions = [
  arrayAssertion,
  asyncFunctionAssertion,
  bigintAssertion,
  booleanAssertion,
  classAssertion,
  dateAssertion,
  definedAssertion,
  emptyArrayAssertion,
  emptyObjectAssertion,
  emptyStringAssertion,
  errorAssertion,
  falseAssertion,
  falsyAssertion,
  functionAssertion,
  infiniteAssertion,
  integerAssertion,
  nanAssertion,
  negativeAssertion,
  negativeInfinityAssertion,
  negativeIntegerAssertion,
  nonEmptyStringAssertion,
  nullAssertion,
  numberAssertion,
  objectAssertion,
  positiveAssertion,
  positiveInfinityAssertion,
  positiveIntegerAssertion,
  primitiveAssertion,
  recordAssertion,
  regexpAssertion,
  setAssertion,
  stringAssertion,
  symbolAssertion,
  trueAssertion,
  truthyAssertion,
  undefinedAssertion,
  weakMapAssertion,
  weakSetAssertion,
] as const;

/**
 * Tuple of all built-in parametric synchronous assertions.
 *
 * @group Assertion Collections
 */
export const SyncParametricAssertions = [
  instanceOfAssertion,
  typeOfAssertion,
  numberGreaterThanAssertion,
  numberLessThanAssertion,
  numberGreaterThanOrEqualAssertion,
  numberLessThanOrEqualAssertion,
  numberWithinRangeAssertion,
  numberCloseToAssertion,
  stringGreaterThanAssertion,
  stringLessThanAssertion,
  stringGreaterThanOrEqualAssertion,
  stringLessThanOrEqualAssertion,
  stringBeginsWithAssertion,
  stringEndsWithAssertion,
  oneOfAssertion,
  functionArityAssertion,
  errorMessageAssertion,
  errorMessageMatchingAssertion,
  strictEqualityAssertion,
  deepEqualAssertion,
  functionThrowsAssertion,
  functionThrowsTypeAssertion,
  functionThrowsSatisfyingAssertion,
  functionThrowsTypeSatisfyingAssertion,
  stringIncludesAssertion,
  stringLengthAssertion,
  stringMatchesAssertion,
  satisfiesAssertion,
] as const;

/**
 * @group Assertion Collections
 */
export const SyncCollectionAssertions = [
  mapContainsAssertion,
  mapSizeAssertion,
  emptyMapAssertion,
  setContainsAssertion,
  setSizeAssertion,
  emptySetAssertion,
  arrayContainsAssertion,
  arrayItemSatisfiesAssertion,
  arraySizeAssertion,
  nonEmptyArrayAssertion,
  objectKeysAssertion,
  objectSizeAssertion,
  objectExactKeyAssertion,
  objectKeyAssertion,
  setEqualityAssertion,
  setSubsetAssertion,
  setSupersetAssertion,
  setIntersectionAssertion,
  setDisjointAssertion,
  setUnionEqualityAssertion,
  setIntersectionEqualityAssertion,
  setDifferenceEqualityAssertion,
  setSymmetricDifferenceEqualityAssertion,
  mapKeyAssertion,
  mapValueAssertion,
  mapEntryAssertion,
  mapEqualityAssertion,
  collectionSizeGreaterThanAssertion,
  collectionSizeLessThanAssertion,
  collectionSizeBetweenAssertion,
] as const;

/**
 * Tuple of snapshot-related synchronous assertions.
 *
 * @group Assertion Collections
 */
export const SyncSnapshotAssertions = [
  snapshotAssertion,
  snapshotAssertionWithOptions,
] as const;

/**
 * Tuple of all built-in synchronous assertions.
 *
 * @group Assertion Collections
 */
export const SyncAssertions = [
  ...SyncCollectionAssertions,
  ...SyncBasicAssertions,
  ...SyncParametricAssertions,
  ...SyncEsotericAssertions,
  ...SyncDateAssertions,
  ...SyncSnapshotAssertions,
  ...SyncIterableAssertions,
] as const;

export * from './snapshot.js';
// Re-export collection tuples for compatibility
// Re-export all individual assertions for convenience
export * from './sync-basic.js';
export * from './sync-collection.js';
export * from './sync-date.js';
export * from './sync-esoteric.js';
export * from './sync-iterable.js';
export * from './sync-parametric.js';
