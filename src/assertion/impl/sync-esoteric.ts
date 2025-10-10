/**
 * "Esoteric" object assertions that don't fit into more common categories.
 *
 * These are probably less commonly used, but still useful in certain scenarios.
 *
 * @module
 * @groupDescription Esoteric Assertions
 * Individual assertions are documented where they are exported.
 *
 * @showGroups
 */

import { z } from 'zod/v4';

import { isNonNullObject } from '../../guards.js';
import {
  DictionarySchema,
  PropertyKeySchema,
  UnknownSchema,
} from '../../schema.js';
import { createAssertion } from '../create.js';

const { getOwnPropertyDescriptor, isExtensible, isFrozen, isSealed } = Object;

/**
 * Asserts that an object has a null prototype (i.e.,
 * `Object.getPrototypeOf(obj) === null`).
 *
 * This is useful for checking if an object was created with
 * `Object.create(null)` or similar patterns that create truly "dictionary-like"
 * objects without any inherited properties.
 *
 * @example
 *
 * ```typescript
 * const obj = Object.create(null);
 * expect(obj, 'to have a null prototype'); // ✓ passes
 *
 * const regular = {};
 * expect(regular, 'to have a null prototype'); // ✗ fails - has Object.prototype
 * ```
 *
 * @group Esoteric Assertions
 * @bupkisAnchor object-to-have-a-null-prototype
 * @bupkisAssertionCategory object
 */
export const nullPrototypeAssertion = createAssertion(
  [['to have a null prototype', 'to be a dictionary']],
  DictionarySchema,
);

/**
 * Asserts that a given property key is an enumerable property of the target
 * object.
 *
 * This checks the `enumerable` descriptor property using
 * `Object.getOwnPropertyDescriptor()`. Only own properties (not inherited ones)
 * are considered, and the property must be enumerable (i.e., would appear in
 * `for...in` loops and `Object.keys()` results).
 *
 * @example
 *
 * ```typescript
 * const obj = { visible: 'value' };
 * Object.defineProperty(obj, 'hidden', {
 *   value: 'secret',
 *   enumerable: false,
 * });
 *
 * expect('visible', 'to be an enumerable property of', obj); // ✓ passes
 * expect('hidden', 'to be an enumerable property of', obj); // ✗ fails - not enumerable
 * expect('toString', 'to be an enumerable property of', obj); // ✗ fails - inherited property
 * ```
 *
 * @group Esoteric Assertions
 * @bupkisAnchor string-number-symbol-to-be-an-enumerable-property-of-non-null
 * @bupkisAssertionCategory object
 */
export const enumerablePropertyAssertion = createAssertion(
  [
    PropertyKeySchema,
    'to be an enumerable property of',
    z.unknown().nonoptional(),
  ],
  (subject, obj) => {
    if (!getOwnPropertyDescriptor(obj, subject)?.enumerable) {
      return {
        actual: false,
        expected: true,
        message: `Expected property ${String(subject)} to be enumerable`,
      };
    }
  },
);

/**
 * Asserts that an object has a specified property that is enumerable.
 *
 * This is an alternative form of {@link enumerablePropertyAssertion} with the
 * object and property key parameters in reverse order. It checks that the given
 * property exists on the object and has its `enumerable` descriptor set to
 * `true` using `Object.getOwnPropertyDescriptor()`. Only own properties (not
 * inherited ones) are considered.
 *
 * @example
 *
 * ```typescript
 * const obj = { visible: 'value' };
 * Object.defineProperty(obj, 'hidden', {
 *   value: 'secret',
 *   enumerable: false,
 * });
 *
 * expect(obj, 'to have enumerable property', 'visible'); // ✓ passes
 * expect(obj, 'to have enumerable property', 'hidden'); // ✗ fails - not enumerable
 * expect(obj, 'to have enumerable property', 'nonexistent'); // ✗ fails - property doesn't exist
 * ```
 *
 * @param subject - The object to check for the enumerable property
 * @param key - The property key to test for enumerability
 * @group Esoteric Assertions
 * @see {@link enumerablePropertyAssertion} - Alternative parameter order
 */
export const enumerablePropertyAssertion2 = createAssertion(
  [z.unknown().nonoptional(), 'to have enumerable property', PropertyKeySchema],
  (_subject, key) =>
    z.custom(
      (value) =>
        isNonNullObject(value) &&
        key in value &&
        !!getOwnPropertyDescriptor(value, key)?.enumerable,
      {
        error: `Expected property "${String(key)}" to be enumerable`,
      },
    ),
);

/**
 * Asserts that an object is sealed using `Object.isSealed()`.
 *
 * A sealed object cannot have new properties added to it, and all existing
 * properties are marked as non-configurable. However, writable properties can
 * still be modified. This is less restrictive than being frozen but more
 * restrictive than being non-extensible.
 *
 * @example
 *
 * ```typescript
 * const obj = { prop: 'value' };
 * Object.seal(obj);
 *
 * expect(obj, 'to be sealed'); // ✓ passes
 *
 * obj.prop = 'new value'; // This still works
 * obj.newProp = 'fail'; // This will fail (in strict mode)
 *
 * const regular = {};
 * expect(regular, 'to be sealed'); // ✗ fails - not sealed
 * ```
 *
 * @group Esoteric Assertions
 * @bupkisAnchor unknown-to-be-sealed
 * @bupkisAssertionCategory object
 */
export const sealedAssertion = createAssertion(
  ['to be sealed'],
  UnknownSchema.refine((obj) => isSealed(obj)),
);

/**
 * Asserts that an object is frozen using `Object.isFrozen()`.
 *
 * A frozen object is completely immutable - no properties can be added,
 * removed, or modified, and no property descriptors can be changed. This is the
 * most restrictive object state. Frozen objects are automatically sealed and
 * non-extensible.
 *
 * @example
 *
 * ```typescript
 * const obj = { prop: 'value' };
 * Object.freeze(obj);
 *
 * expect(obj, 'to be frozen'); // ✓ passes
 *
 * // All of these operations will fail silently (or throw in strict mode):
 * obj.prop = 'new value'; // Cannot modify existing property
 * obj.newProp = 'fail'; // Cannot add new property
 * delete obj.prop; // Cannot delete property
 *
 * const regular = {};
 * expect(regular, 'to be frozen'); // ✗ fails - not frozen
 * ```
 *
 * @group Esoteric Assertions
 * @bupkisAnchor unknown-to-be-frozen
 * @bupkisAssertionCategory object
 */
export const frozenAssertion = createAssertion(['to be frozen'], (subject) => {
  if (!isFrozen(subject)) {
    return {
      actual: false,
      expected: true,
      message: `Expected object to be frozen`,
    };
  }
});

/**
 * Asserts that an object is extensible using `Object.isExtensible()`.
 *
 * An extensible object allows new properties to be added to it. This is the
 * default state for objects, but can be disabled using
 * `Object.preventExtensions()`, `Object.seal()`, or `Object.freeze()`. This
 * assertion is useful for testing that an object hasn't been made
 * non-extensible by any of these operations.
 *
 * @example
 *
 * ```typescript
 * const obj = {};
 * expect(obj, 'to be extensible'); // ✓ passes - objects are extensible by default
 *
 * obj.newProp = 'value'; // This works
 *
 * Object.preventExtensions(obj);
 * expect(obj, 'to be extensible'); // ✗ fails - no longer extensible
 *
 * const sealed = Object.seal({});
 * expect(sealed, 'to be extensible'); // ✗ fails - sealed objects are non-extensible
 *
 * const frozen = Object.freeze({});
 * expect(frozen, 'to be extensible'); // ✗ fails - frozen objects are non-extensible
 * ```
 *
 * @group Esoteric Assertions
 * @bupkisAnchor unknown-to-be-extensible
 * @bupkisAssertionCategory object
 */
export const extensibleAssertion = createAssertion(
  ['to be extensible'],
  UnknownSchema.refine((obj) => isExtensible(obj)),
);
