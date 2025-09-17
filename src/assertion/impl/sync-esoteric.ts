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

import { DictionarySchema, PropertyKeySchema } from '../../schema.js';
import { createAssertion } from '../create.js';

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
 */
export const nullPrototypeAssertion = createAssertion(
  ['to have a null prototype'],
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
 */
export const enumerablePropertyAssertion = createAssertion(
  [PropertyKeySchema, 'to be an enumerable property of', z.looseObject({})],
  (subject, obj) => !!Object.getOwnPropertyDescriptor(obj, subject)?.enumerable,
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
 */
export const sealedAssertion = createAssertion(
  ['to be sealed'],
  z.any().refine((obj) => Object.isSealed(obj)),
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
 */
export const frozenAssertion = createAssertion(
  ['to be frozen'],
  z.any().refine((obj) => Object.isFrozen(obj)),
);

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
 */
export const extensibleAssertion = createAssertion(
  ['to be extensible'],
  z.any().refine((obj) => Object.isExtensible(obj)),
);
