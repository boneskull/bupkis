/**
 * Assertion classification utilities for benchmark suite partitioning.
 *
 * This module provides utilities to classify sync-function assertions by their
 * return types, enabling targeted performance analysis:
 *
 * - Pure assertions: return boolean or AssertionFailure
 * - Schema-based assertions: return Zod schema or AssertionParseRequest
 */

import { BupkisAssertionFunctionSync } from '../src/assertion/assertion-sync.js';
import { type AnyAssertion, SyncAssertions } from '../src/assertion/index.js';

/**
 * Classification result for sync-function assertions
 */
export interface AssertionClassification {
  /** Assertions that return boolean or AssertionFailure */
  pure: BupkisAssertionFunctionSync<any, any, any>[];
  /** Assertions that return Zod schema or AssertionParseRequest */
  schema: BupkisAssertionFunctionSync<any, any, any>[];
  /** Total number of sync-function assertions found */
  total: number;
}

/**
 * Type guard to check if assertion is a sync function-based implementation
 */
export const isSyncFunctionAssertion = <T extends AnyAssertion>(
  assertion: T,
): assertion is BupkisAssertionFunctionSync<any, any, any> & T =>
  assertion instanceof BupkisAssertionFunctionSync;

/**
 * Classifies a sync-function assertion by analyzing its implementation to
 * determine whether it returns pure values (boolean/AssertionFailure) or
 * schema-based values (Zod schema/AssertionParseRequest).
 *
 * NOTE: This function performs static analysis by examining the implementation
 * function source code since we cannot execute the functions without proper
 * arguments. The classification is based on return type patterns.
 */
export const classifyAssertion = (
  assertion: BupkisAssertionFunctionSync<any, any, any>,
): 'pure' | 'schema' => {
  const impl = assertion.impl as (...args: any[]) => any;
  const source = impl.toString();

  // Look for patterns that indicate schema-based return types
  const schemaPatterns = [
    // Direct Zod schema returns
    /return\s+\w*[Ss]chema/,
    // Zod method calls
    /\.(?:gt|gte|lt|lte|min|max|length|regex|email|url|uuid|includes|startsWith|endsWith)\(/,
    // Schema creation patterns
    /z\.(?:string|number|boolean|object|array|literal|enum|union|intersection|record|map|set)\(/,
    // AssertionParseRequest patterns
    /AssertionParseRequest/,
    // Schema variable assignments followed by return
    /(?:const|let|var)\s+\w*[Ss]chema\s*=.*?return\s+\w*[Ss]chema/s,
  ];

  // Look for patterns that indicate pure return types
  const purePatterns = [
    // Boolean returns
    /return\s+(?:true|false|\w+\s*[=!]==?\s*|\w+\s*[<>]=?\s*|\w+\s*instanceof\s+)/,
    // Comparison operations
    /return\s+[^;{]+[<>!=]=?[^;{]+/,
    // Method calls that typically return boolean
    /return\s+\w+\.(?:test|match|includes|startsWith|endsWith|every|some|hasOwnProperty)\(/,
    // AssertionFailure patterns
    /AssertionFailure/,
    // Error throwing (implicitly boolean/void)
    /throw\s+new\s+\w*Error/,
  ];

  // Check for schema patterns first
  const hasSchemaPattern = schemaPatterns.some((pattern) =>
    pattern.test(source),
  );
  if (hasSchemaPattern) {
    return 'schema';
  }

  // Check for pure patterns
  const hasPurePattern = purePatterns.some((pattern) => pattern.test(source));
  if (hasPurePattern) {
    return 'pure';
  }

  // Default classification based on common patterns
  // If the function is very short and simple, likely pure
  if (source.length < 200 && /return\s+[^;{]+;?\s*}?\s*$/.test(source)) {
    return 'pure';
  }

  // Default to schema if uncertain (safer for new schema-based assertions)
  return 'schema';
};

/**
 * Gets all sync-function assertions and classifies them by return type.
 *
 * @returns Classification results with total count and categorized assertions
 */
export const getSyncFunctionAssertions = (): AssertionClassification => {
  const syncFunctionAssertions = SyncAssertions.filter(isSyncFunctionAssertion);

  const pure: BupkisAssertionFunctionSync<any, any, any>[] = [];
  const schema: BupkisAssertionFunctionSync<any, any, any>[] = [];

  for (const assertion of syncFunctionAssertions) {
    const classification = classifyAssertion(assertion);
    if (classification === 'pure') {
      pure.push(assertion);
    } else {
      schema.push(assertion);
    }
  }

  return {
    pure,
    schema,
    total: syncFunctionAssertions.length,
  };
};
