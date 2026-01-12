/**
 * Diff utilities for generating rich assertion failure output.
 *
 * This module provides utilities for extracting meaningful actual/expected
 * values from Zod validation errors and generating high-quality diff output
 * using `jest-diff` for assertion failures.
 *
 * @packageDocumentation
 * @see {@link https://npm.im/jest-diff | jest-diff}
 */

import type { DiffOptions } from 'jest-diff';
import type { z } from 'zod';

import { diff } from 'jest-diff';
export type { DiffOptions };

const { isArray } = Array;
const { max } = Math;
const { stringify } = JSON;
const { entries, getOwnPropertyNames } = Object;

/**
 * Result of extracting diff values from a `ZodError`
 */
export interface DiffValues {
  /** The actual value that was validated */
  actual: unknown;
  /** The expected value (corrected version) */
  expected: unknown;
}

/**
 * Extracts actual and expected values from a `ZodError` for meaningful diffs.
 *
 * @function
 * @param zodError The `ZodError` to extract values from
 * @param subject The original subject that failed validation
 * @returns Object with actual and expected values for diff
 */
export const extractDiffValues = (
  zodError: z.ZodError,
  subject: unknown,
): DiffValues => {
  try {
    const actual = subject;

    let expected = subject != null ? deepClone(subject) : subject;

    for (const issue of zodError.issues) {
      try {
        const filteredPath = issue.path.filter(
          (key): key is number | string =>
            typeof key === 'string' || typeof key === 'number',
        );

        switch (issue.code) {
          case 'custom': {
            const params = issue.params as Record<string, unknown> | undefined;

            if (
              params?.bupkisType === 'missing_key' &&
              filteredPath.length > 0
            ) {
              const missingKey = filteredPath[0];
              if (typeof expected === 'object' && expected !== null) {
                expected = {
                  ...(expected as Record<string, unknown>),
                  [missingKey as string]: undefined,
                };
              }
            } else if (filteredPath.length > 0) {
              const actualValue = getValueAtPath(actual, filteredPath);
              if (actualValue === undefined) {
                expected = setValueAtPath(expected, filteredPath, undefined);
              }
            }
            break;
          }

          case 'invalid_format': {
            const actualValue = getValueAtPath(actual, filteredPath);
            let correctedValue = actualValue;

            const regexMatch = issue.message.match(/pattern (.+)/);
            if (regexMatch) {
              correctedValue = `<string matching ${regexMatch[1]}>`;
            } else {
              correctedValue = '<string in valid format>';
            }

            expected = setValueAtPath(expected, filteredPath, correctedValue);
            break;
          }

          case 'invalid_type': {
            const correctedValue = createCorrectValueForType(
              issue.expected,
              getValueAtPath(actual, filteredPath),
            );
            expected = setValueAtPath(expected, filteredPath, correctedValue);
            break;
          }

          case 'invalid_union': {
            // Union errors contain multiple sub-errors for each branch.
            // We can't determine a single "expected" value, so bail out
            // and let Zod's error message show all the union branch errors.
            return { actual: undefined, expected: undefined };
          }

          case 'invalid_value': {
            // Only use the corrected value if we have a concrete value from the schema
            if (issue.values && issue.values.length > 0) {
              const correctedValue = issue.values[0];
              expected = setValueAtPath(expected, filteredPath, correctedValue);
            } else {
              // No concrete value available, bail out to Zod's error message
              return { actual: undefined, expected: undefined };
            }
            break;
          }

          case 'too_big': {
            const actualValue = getValueAtPath(actual, filteredPath);
            let correctedValue;

            if (issue.origin === 'string' && typeof actualValue === 'string') {
              correctedValue = actualValue.slice(0, Number(issue.maximum));
            } else if (issue.origin === 'array' && isArray(actualValue)) {
              correctedValue = actualValue.slice(0, Number(issue.maximum));
            } else {
              correctedValue = issue.maximum;
            }

            expected = setValueAtPath(expected, filteredPath, correctedValue);
            break;
          }

          case 'too_small': {
            const actualValue = getValueAtPath(actual, filteredPath);
            let correctedValue;

            if (issue.origin === 'string' && typeof actualValue === 'string') {
              const needed = Number(issue.minimum) - actualValue.length;
              correctedValue = actualValue + 'x'.repeat(max(0, needed));
            } else if (issue.origin === 'array' && isArray(actualValue)) {
              const needed = Number(issue.minimum) - actualValue.length;
              correctedValue = actualValue.concat(
                new Array(max(0, needed)).fill(null),
              );
            } else {
              correctedValue = issue.minimum;
            }

            expected = setValueAtPath(expected, filteredPath, correctedValue);
            break;
          }

          case 'unrecognized_keys': {
            if (
              filteredPath.length === 0 &&
              typeof expected === 'object' &&
              expected !== null
            ) {
              const expectedCopy = {
                ...(expected as Record<string, unknown>),
              };
              for (const key of issue.keys) {
                delete expectedCopy[key];
              }
              expected = expectedCopy;
            }
            break;
          }

          default: {
            break;
          }
        }
      } catch {
        continue;
      }
    }

    return { actual, expected };
  } catch {
    return { actual: undefined, expected: undefined };
  }
};

/**
 * Generates a rich diff string using jest-diff for assertion failures.
 *
 * @function
 * @param expected The expected value
 * @param actual The actual value
 * @param options Configuration options for diff generation
 * @returns A formatted diff string, or null if values are identical
 */
export const generateDiff = (
  expected: unknown,
  actual: unknown,
  options: DiffOptions = {},
): null | string => {
  if (!shouldGenerateDiff(actual, expected)) {
    return null;
  }

  return diff(expected, actual, {
    aAnnotation: 'expected',
    bAnnotation: 'actual',
    expand: false,
    includeChangeCounts: true,
    ...options,
  });
};

/**
 * Checks if two values should generate a meaningful diff.
 *
 * @function
 * @param actual The actual value
 * @param expected The expected value
 * @returns True if a diff should be generated, false otherwise
 */
export const shouldGenerateDiff = (
  actual: unknown,
  expected: unknown,
): boolean =>
  actual !== undefined && expected !== undefined && actual !== expected;

/**
 * Creates a corrected value for a given type
 *
 * @function
 */
const createCorrectValueForType = (
  expectedType: string,
  actualValue: unknown,
): unknown => {
  switch (expectedType) {
    case 'array':
      return isArray(actualValue) ? actualValue : [];
    case 'boolean':
      return typeof actualValue === 'boolean'
        ? actualValue
        : Boolean(actualValue);
    case 'null':
      return null;
    case 'number':
      return typeof actualValue === 'number'
        ? actualValue
        : Number(actualValue) || 0;
    case 'object':
      return typeof actualValue === 'object' && actualValue !== null
        ? actualValue
        : {};
    case 'string':
      if (typeof actualValue === 'string') {
        return actualValue;
      }
      if (actualValue == null) {
        return '';
      }
      if (typeof actualValue === 'object') {
        return stringify(actualValue);
      }
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      return `${actualValue}`;
    case 'undefined':
      return undefined;
    default:
      return `<${expectedType}>`;
  }
};

/**
 * Custom deep clone implementation for values that structuredClone can't
 * handle. Used as fallback when structuredClone fails.
 *
 * @function
 */
const customDeepClone = (value: unknown): unknown => {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (isArray(value)) {
    return value.map(customDeepClone);
  }

  if (value instanceof Error) {
    const cloned: Record<string, unknown> = {};
    for (const [key, val] of entries(value)) {
      cloned[key] = customDeepClone(val);
    }
    for (const prop of getOwnPropertyNames(value)) {
      if (!(prop in cloned)) {
        try {
          cloned[prop] = (value as unknown as Record<string, unknown>)[prop];
        } catch {
          // Skip properties that can't be accessed
        }
      }
    }
    return cloned;
  }

  const cloned: Record<string, unknown> = {};
  for (const [key, val] of entries(value)) {
    cloned[key] = customDeepClone(val);
  }
  return cloned;
};

/**
 * Deep clone a value to avoid mutating the original. Uses the native
 * structuredClone API which handles more types and circular references better
 * than a custom implementation. Falls back to custom implementation for values
 * containing functions.
 *
 * @function
 */
const deepClone = (value: unknown): unknown => {
  try {
    return structuredClone(value);
  } catch (error) {
    if (error instanceof Error && error.name === 'DataCloneError') {
      return customDeepClone(value);
    }
    throw error;
  }
};

/**
 * Gets a value at a specific path in an object
 *
 * @function
 */
const getValueAtPath = (
  obj: unknown,
  path: readonly (number | string)[],
): unknown => {
  if (path.length === 0) {
    return obj;
  }

  let current = obj;
  for (const key of path) {
    if (current == null) {
      return undefined;
    }
    current = (current as Record<number | string, unknown>)[key];
  }
  return current;
};

/**
 * Returns a new object with the value at the specified path set to the given
 * value.
 *
 * @function
 */
const setValueAtPath = (
  obj: unknown,
  path: readonly (number | string)[],
  value: unknown,
): unknown => {
  if (path.length === 0) {
    return value;
  }

  if (obj == null) {
    obj = typeof path[0] === 'number' ? [] : {};
  }

  const [head, ...tail] = path;
  if (head === undefined) {
    return obj;
  }

  const newValue =
    tail.length === 0
      ? value
      : setValueAtPath(
          (obj as Record<number | string, unknown>)[head],
          tail,
          value,
        );

  if (isArray(obj)) {
    const result = [...(obj as unknown[])];
    result[head as number] = newValue;
    return result;
  }

  let result: Record<number | string, unknown>;
  if (obj instanceof Error) {
    result = {};
    for (const prop of getOwnPropertyNames(obj)) {
      if (prop !== 'stack') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        result[prop] = (obj as any)[prop];
      }
    }
  } else {
    result = { ...(obj as Record<string, unknown>) };
  }

  result[head] = newValue;
  return result;
};
