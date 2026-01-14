/**
 * Assertion applicability registry for compositional property testing.
 *
 * Maps runtime values to assertions that would pass (or fail) for them,
 * enabling data-first generation of valid/invalid assertion chains.
 *
 * @packageDocumentation
 */

import type { AnySyncAssertion } from 'bupkis/types';

import { extractPhrases } from './harness.js';

/**
 * Represents an assertion with its applicability predicate.
 *
 * Used to determine whether a given assertion would pass for a particular
 * runtime value.
 */
export interface AssertionApplicability {
  /**
   * Predicate that returns `true` if the assertion would pass for the given
   * value.
   */
  appliesTo: (value: unknown) => boolean;

  /**
   * The assertion object.
   */
  assertion: AnySyncAssertion;

  /**
   * Phrase literals that can trigger this assertion.
   */
  phrases: readonly [string, ...string[]];
}

const { isArray } = Array;
const { isFinite, isNaN, isSafeInteger } = Number;

/**
 * Type predicates for non-parametric sync-basic assertions.
 *
 * These predicates mirror the validation logic of each assertion to determine
 * applicability without actually running the assertion.
 */
const predicates = {
  // Object type checks
  /**
   * @function
   */
  array: (v: unknown): boolean => isArray(v),
  // Async function check
  /**
   * @function
   */
  asyncFunction: (v: unknown): boolean =>
    typeof v === 'function' &&
    (v as { constructor: { name: string } }).constructor.name ===
      'AsyncFunction',
  /**
   * @function
   */
  bigint: (v: unknown): boolean => typeof v === 'bigint',
  /**
   * @function
   */
  boolean: (v: unknown): boolean => typeof v === 'boolean',
  // Class/constructor check
  /**
   * @function
   */
  class: (v: unknown): boolean =>
    typeof v === 'function' &&
    (v as { prototype?: { constructor?: unknown } }).prototype !== undefined &&
    (v as { prototype: { constructor?: unknown } }).prototype.constructor !==
      undefined,
  /**
   * @function
   */
  date: (v: unknown): boolean => v instanceof Date,

  /**
   * @function
   */
  defined: (v: unknown): boolean => v !== undefined,

  /**
   * @function
   */
  error: (v: unknown): boolean => v instanceof Error,
  /**
   * @function
   */
  false: (v: unknown): boolean => v === false,
  /**
   * @function
   */
  falsy: (v: unknown): boolean => !v,

  /**
   * @function
   */
  function: (v: unknown): boolean => typeof v === 'function',
  /**
   * @function
   */
  infinite: (v: unknown): boolean => v === Infinity || v === -Infinity,

  /**
   * @function
   */
  integer: (v: unknown): boolean =>
    typeof v === 'number' && isFinite(v) && isSafeInteger(v),
  // Number subcategory checks
  /**
   * @function
   */
  nan: (v: unknown): boolean => isNaN(v as number),

  /**
   * @function
   */
  negative: (v: unknown): boolean =>
    typeof v === 'number' && isFinite(v) && v < 0,
  /**
   * @function
   */
  negativeInfinity: (v: unknown): boolean => v === -Infinity,
  /**
   * @function
   */
  negativeInteger: (v: unknown): boolean =>
    typeof v === 'number' && isFinite(v) && isSafeInteger(v) && v < 0,
  // Null/undefined checks
  /**
   * @function
   */
  null: (v: unknown): boolean => v === null,
  /**
   * @function
   */
  number: (v: unknown): boolean => typeof v === 'number' && isFinite(v),
  /**
   * @function
   */
  object: (v: unknown): boolean => typeof v === 'object' && v !== null,
  /**
   * @function
   */
  positive: (v: unknown): boolean =>
    typeof v === 'number' && isFinite(v) && v > 0,
  /**
   * @function
   */
  positiveInfinity: (v: unknown): boolean => v === Infinity,
  /**
   * @function
   */
  positiveInteger: (v: unknown): boolean =>
    typeof v === 'number' && isFinite(v) && isSafeInteger(v) && v > 0,

  // Primitive check - must match Zod v4's z.number() behavior (excludes Infinity/NaN)
  /**
   * @function
   */
  primitive: (v: unknown): boolean => {
    if (v === null || v === undefined) {
      return true;
    }
    if (typeof v === 'string') {
      return true;
    }
    if (typeof v === 'boolean') {
      return true;
    }
    if (typeof v === 'bigint') {
      return true;
    }
    if (typeof v === 'symbol') {
      return true;
    }
    // z.number() in Zod v4 rejects Infinity, -Infinity, and NaN
    if (typeof v === 'number') {
      return isFinite(v) && !isNaN(v);
    }
    return false;
  },
  /**
   * @function
   */
  record: (v: unknown): boolean =>
    typeof v === 'object' &&
    v !== null &&
    !isArray(v) &&
    !(v instanceof Date) &&
    !(v instanceof RegExp) &&
    !(v instanceof Map) &&
    !(v instanceof Set) &&
    !(v instanceof WeakMap) &&
    !(v instanceof WeakSet) &&
    !(v instanceof Error),
  /**
   * @function
   */
  regexp: (v: unknown): boolean => v instanceof RegExp,
  /**
   * @function
   */
  set: (v: unknown): boolean => v instanceof Set,
  // Primitive type checks
  /**
   * @function
   */
  string: (v: unknown): boolean => typeof v === 'string',
  /**
   * @function
   */
  symbol: (v: unknown): boolean => typeof v === 'symbol',
  // Boolean literal checks
  /**
   * @function
   */
  true: (v: unknown): boolean => v === true,
  // Truthy/falsy checks
  /**
   * @function
   */
  truthy: (v: unknown): boolean => !!v,
  /**
   * @function
   */
  undefined: (v: unknown): boolean => v === undefined,

  /**
   * @function
   */
  weakMap: (v: unknown): boolean => v instanceof WeakMap,

  /**
   * @function
   */
  weakSet: (v: unknown): boolean => v instanceof WeakSet,
} as const;

/**
 * Registry of non-parametric sync-basic assertions with applicability
 * predicates.
 *
 * This registry is built lazily when first accessed to avoid import-time side
 * effects.
 */
let registry: AssertionApplicability[] | undefined;

/**
 * Expected shape of the assertions object passed to
 * {@link createApplicabilityRegistry}.
 *
 * Derived from {@link predicates} keys with `Assertion` suffix.
 */
export type ApplicabilityAssertionMap = {
  [K in PredicateKey as AssertionKey<K>]: AnySyncAssertion;
};

/**
 * Maps predicate keys to assertion property names (e.g., `'string'` →
 * `'stringAssertion'`).
 */
type AssertionKey<K extends string> = `${K}Assertion`;

/**
 * Predicate keys that have corresponding assertions in bupkis.
 */
type PredicateKey = keyof typeof predicates;

const { keys } = Object;

/**
 * Creates the assertion applicability registry.
 *
 * Iterates over the predicate keys and builds entries by looking up the
 * corresponding assertion (e.g., `'string'` → `assertions.stringAssertion`).
 *
 * @function
 * @param assertions Object containing all sync-basic assertions, keyed by
 *   `{predicateName}Assertion`
 * @returns Array of assertion applicability entries
 */
export const createApplicabilityRegistry = (
  assertions: ApplicabilityAssertionMap,
): AssertionApplicability[] =>
  (keys(predicates) as PredicateKey[]).map((key) => {
    const assertionKey: AssertionKey<typeof key> = `${key}Assertion`;
    const assertion = assertions[assertionKey];
    return {
      appliesTo: predicates[key],
      assertion,
      phrases: extractPhrases(assertion),
    };
  });

/**
 * Gets or creates the default applicability registry using bupkis assertions.
 *
 * @function
 * @returns The assertion applicability registry
 */
export const getApplicabilityRegistry = async (): Promise<
  AssertionApplicability[]
> => {
  if (registry) {
    return registry;
  }

  // Dynamic import to avoid circular dependencies
  const assertions = await import('bupkis').then((m) => m.assertions);
  registry = createApplicabilityRegistry(assertions);
  return registry;
};

/**
 * Gets all assertions that would PASS for the given value.
 *
 * @function
 * @param value The runtime value to check
 * @param registryEntries The applicability registry to query
 * @returns Array of assertions that would pass
 */
export const getApplicableAssertions = (
  value: unknown,
  registryEntries: AssertionApplicability[],
): AssertionApplicability[] =>
  registryEntries.filter((e) => e.appliesTo(value));

/**
 * Gets all assertions that would FAIL for the given value.
 *
 * @function
 * @param value The runtime value to check
 * @param registryEntries The applicability registry to query
 * @returns Array of assertions that would fail
 */
export const getInapplicableAssertions = (
  value: unknown,
  registryEntries: AssertionApplicability[],
): AssertionApplicability[] =>
  registryEntries.filter((e) => !e.appliesTo(value));
