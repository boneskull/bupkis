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
import type { z } from 'zod/v4';

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
    // Start with the original subject as the actual value
    const actual = subject;

    // Create a copy to modify as the expected value
    let expected = subject != null ? deepClone(subject) : subject;

    // Process each issue to build the expected value
    for (const issue of zodError.issues) {
      try {
        // Filter path to only string/number keys (symbols are rare in practice)
        const filteredPath = issue.path.filter(
          (key): key is number | string =>
            typeof key === 'string' || typeof key === 'number',
        );

        switch (issue.code) {
          case 'invalid_format': {
            // For format errors (e.g., regex patterns), show what the pattern expects
            const actualValue = getValueAtPath(actual, filteredPath);
            let correctedValue = actualValue;

            // Try to extract pattern info from the message
            const regexMatch = issue.message.match(/pattern (.+)/);
            if (regexMatch) {
              // For regex patterns, create a placeholder that indicates the expected pattern
              correctedValue = `<string matching ${regexMatch[1]}>`;
            } else {
              // Fallback for other format errors
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
            // For union errors, we can't easily determine the "correct" value
            // but we can try to provide a hint based on the error context
            const actualValue = getValueAtPath(actual, filteredPath);

            // Check if this is a top-level union error (like regex OR object)
            if (filteredPath.length === 0) {
              // For top-level union errors, try to suggest an alternative format
              if (typeof actualValue === 'object' && actualValue !== null) {
                // If actual is an object, the union might expect a string pattern
                expected = '<string matching pattern>';
              } else if (typeof actualValue === 'string') {
                // If actual is a string, the union might expect an object structure
                expected = '<object satisfying schema>';
              } else {
                expected = '<value matching union schema>';
              }
            } else {
              // For nested union errors, provide a generic placeholder
              expected = setValueAtPath(
                expected,
                filteredPath,
                '<value matching union schema>',
              );
            }
            break;
          }

          case 'invalid_value': {
            // For literal/enum errors, use the first valid value
            const correctedValue =
              issue.values && issue.values.length > 0
                ? issue.values[0]
                : '<valid value>';
            expected = setValueAtPath(expected, filteredPath, correctedValue);
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
            // Remove unrecognized keys from expected
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
            // For other error types, just mark that something should be different
            // but don't try to guess what the correct value should be
            break;
          }
        }
      } catch {
        // If we can't process an individual issue, continue with others
        continue;
      }
    }

    return { actual, expected };
  } catch {
    // If anything goes wrong, return undefined to fall back to pretty error
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
      // For primitive types (number, boolean, etc.) - we know it's not an object here
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

  // Special handling for Error objects to preserve non-enumerable properties
  if (value instanceof Error) {
    const cloned: Record<string, unknown> = {};
    // Copy enumerable properties
    for (const [key, val] of entries(value)) {
      cloned[key] = customDeepClone(val);
    }
    // Copy non-enumerable properties that are important for Error objects
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

  // For regular objects, create a new object and copy properties
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
    // Handle DataCloneError for values that can't be cloned (functions, symbols, etc.)
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
    // Need to create the structure
    obj = typeof path[0] === 'number' ? [] : {};
  }

  if (isArray(obj)) {
    const result = [...(obj as unknown[])];
    const [head, ...tail] = path;

    if (head !== undefined) {
      if (tail.length === 0) {
        result[head as number] = value;
      } else {
        result[head as number] = setValueAtPath(
          result[head as number],
          tail,
          value,
        );
      }
    }

    return result;
  } else {
    let result: Record<number | string, unknown>;

    // Handle Error objects and other objects with non-enumerable properties
    if (obj instanceof Error) {
      // For Error objects, copy all own properties (including non-enumerable ones)
      result = {};
      for (const prop of getOwnPropertyNames(obj)) {
        if (prop !== 'stack') {
          // Skip stack to reduce noise
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          result[prop] = (obj as any)[prop];
        }
      }
    } else {
      // For regular objects, use spread operator
      result = { ...(obj as Record<string, unknown>) };
    }

    const [head, ...tail] = path;

    if (head !== undefined) {
      if (tail.length === 0) {
        result[head] = value;
      } else {
        result[head] = setValueAtPath(result[head], tail, value);
      }
    }

    return result;
  }
};
