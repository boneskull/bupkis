import { type CallExpression, type SourceFile, SyntaxKind } from 'ts-morph';

import type {
  TransformError,
  TransformMode,
  TransformWarning,
} from '../types.js';

import { getMatcherTransform, isMatcherSupported } from '../matchers/index.js';

/**
 * Result of transforming TDD assert calls in a file.
 */
export interface TddTransformResult {
  errors: TransformError[];
  transformCount: number;
  warnings: TransformWarning[];
}

/**
 * TDD assert methods that have negated variants with specific prefixes.
 *
 * Maps from the negated form to the base form.
 */
const NEGATION_MAPPINGS: Record<string, string> = {
  doesNotChange: 'changes',
  doesNotContainAllKeys: 'containsAllKeys',
  doesNotDecrease: 'decreases',
  doesNotHaveAllKeys: 'hasAllKeys',
  doesNotHaveAnyKeys: 'hasAnyKeys',
  doesNotIncrease: 'increases',
  doesNotThrow: 'throws',
  isNotArray: 'isArray',
  isNotBoolean: 'isBoolean',
  isNotEmpty: 'isEmpty',
  isNotExtensible: 'isExtensible',
  isNotFalse: 'isFalse',
  isNotFrozen: 'isFrozen',
  isNotFunction: 'isFunction',
  isNotNaN: 'isNaN',
  isNotNull: 'isNull',
  isNotNumber: 'isNumber',
  isNotObject: 'isObject',
  isNotOk: 'isOk',
  isNotSealed: 'isSealed',
  isNotString: 'isString',
  isNotTrue: 'isTrue',
  isNotUndefined: 'isUndefined',
  notDeepEqual: 'deepEqual',
  notDeepNestedPropertyVal: 'deepNestedPropertyVal',
  notDeepPropertyVal: 'deepPropertyVal',
  notEqual: 'equal',
  notExists: 'exists',
  notInclude: 'include',
  notIncludeDeepMembers: 'includeDeepMembers',
  notIncludeMembers: 'includeMembers',
  notInstanceOf: 'instanceOf',
  notMatch: 'match',
  notNestedProperty: 'nestedProperty',
  notNestedPropertyVal: 'nestedPropertyVal',
  notOk: 'ok',
  notOwnProperty: 'ownProperty',
  notProperty: 'property',
  notPropertyVal: 'propertyVal',
  notSameDeepOrderedMembers: 'sameDeepOrderedMembers',
  notSameMembers: 'sameMembers',
  notSameOrderedMembers: 'sameOrderedMembers',
  notStrictEqual: 'strictEqual',
  notTypeOf: 'typeOf',
};

/**
 * TDD assert methods that take only the value as first arg (unary assertions).
 *
 * These methods don't have an expected value - they check a property of the
 * value.
 */
const UNARY_ASSERTIONS = new Set([
  'exists',
  'isArray',
  'isBoolean',
  'isDefined',
  'isEmpty',
  'isExtensible',
  'isFalse',
  'isFinite',
  'isFrozen',
  'isFunction',
  'isNaN',
  'isNotArray',
  'isNotBoolean',
  'isNotEmpty',
  'isNotExtensible',
  'isNotFalse',
  'isNotFrozen',
  'isNotFunction',
  'isNotNaN',
  'isNotNull',
  'isNotNumber',
  'isNotObject',
  'isNotOk',
  'isNotSealed',
  'isNotString',
  'isNotTrue',
  'isNotUndefined',
  'isNull',
  'isNumber',
  'isObject',
  'isOk',
  'isSealed',
  'isString',
  'isTrue',
  'isUndefined',
  'notExists',
  'notOk',
  'ok',
]);

/**
 * Type assertions that need a type argument added.
 */
const TYPE_ASSERTIONS: Record<string, string> = {
  isArray: 'array',
  isBoolean: 'boolean',
  isFunction: 'function',
  isNotArray: 'array',
  isNotBoolean: 'boolean',
  isNotFunction: 'function',
  isNotNumber: 'number',
  isNotObject: 'object',
  isNotString: 'string',
  isNumber: 'number',
  isObject: 'object',
  isString: 'string',
};

/**
 * Transform Chai TDD assert.xxx() calls to bupkis syntax.
 *
 * @function
 * @param sourceFile - The source file to transform
 * @param mode - How to handle unsupported matchers
 * @returns Transform results including counts, warnings, and errors
 */
export const transformTddAssertCalls = (
  sourceFile: SourceFile,
  mode: TransformMode,
): TddTransformResult => {
  const warnings: TransformWarning[] = [];
  const errors: TransformError[] = [];
  let transformCount = 0;

  // Find all call expressions that start with 'assert.'
  const callExpressions = sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression,
  );

  // Process in reverse order to avoid position shifts
  const assertCalls = callExpressions
    .filter((call) => {
      const text = call.getText();
      return text.startsWith('assert.');
    })
    .reverse();

  for (const call of assertCalls) {
    try {
      const result = transformSingleAssert(call, mode);

      if (result.transformed) {
        transformCount++;
      }

      if (result.warning) {
        warnings.push(result.warning);
      }
    } catch (error) {
      const pos = call.getStartLineNumber();
      errors.push({
        line: pos,
        message: error instanceof Error ? error.message : String(error),
      });

      if (mode === 'strict') {
        throw error;
      }
    }
  }

  return { errors, transformCount, warnings };
};

interface SingleTransformResult {
  transformed: boolean;
  warning?: TransformWarning;
}

/**
 * Transform a single assert.xxx() call.
 *
 * @function
 */
const transformSingleAssert = (
  call: CallExpression,
  mode: TransformMode,
): SingleTransformResult => {
  const fullText = call.getText();
  const pos = call.getStartLineNumber();
  const col = call.getStartLinePos();

  // Parse assert.method(args)
  const parsed = parseAssertCall(fullText);

  if (!parsed) {
    return { transformed: false };
  }

  const { args, method, negated } = parsed;

  // Get the base method name (for looking up in matchers)
  const baseMatcher = negated ? (NEGATION_MAPPINGS[method] ?? method) : method;

  // Check if matcher is supported
  if (!isMatcherSupported(baseMatcher)) {
    if (mode === 'strict') {
      throw new Error(`Unsupported assert method: ${method}`);
    }

    // Add TODO comment for best-effort mode
    const comment = `// TODO: Manual migration needed - unsupported assert method '${method}'`;
    call.replaceWithText(`${comment}\n${fullText}`);

    return {
      transformed: false,
      warning: {
        column: col,
        line: pos,
        message: `Unsupported assert method: ${method}`,
        originalCode: fullText,
      },
    };
  }

  const transform = getMatcherTransform(baseMatcher);

  if (!transform) {
    return { transformed: false };
  }

  // Determine subject and matcher args
  let subject: string;
  let matcherArgs: string[];

  if (UNARY_ASSERTIONS.has(method)) {
    // Unary: assert.isTrue(value) -> expect(value, 'to be true')
    subject = args[0] ?? '';
    matcherArgs = [];

    // For type assertions, add the type as an argument
    const typeArg = TYPE_ASSERTIONS[method];
    if (typeArg) {
      matcherArgs = [`'${typeArg}'`];
    }
  } else {
    // Binary: assert.equal(actual, expected) -> expect(actual, 'to be', expected)
    subject = args[0] ?? '';
    matcherArgs = args.slice(1);
  }

  // Check for custom transformer
  if (transform.transform) {
    const customResult = transform.transform({
      matcherArgs,
      negated,
      originalExpression: fullText,
      subject,
    });

    if (customResult === null) {
      if (mode !== 'strict') {
        const comment = `// TODO: Manual migration needed - complex '${method}' usage`;
        call.replaceWithText(`${comment}\n${fullText}`);
      }

      return {
        transformed: false,
        warning: {
          column: col,
          line: pos,
          message: `Complex ${method} usage requires manual migration`,
          originalCode: fullText,
        },
      };
    }

    call.replaceWithText(customResult);
    return { transformed: true };
  }

  // Standard transformation
  const phrase = negated
    ? `not ${transform.bupkisPhrase}`
    : transform.bupkisPhrase;

  let newCode: string;
  if (matcherArgs.length > 0) {
    newCode = `expect(${subject}, '${phrase}', ${matcherArgs.join(', ')})`;
  } else {
    newCode = `expect(${subject}, '${phrase}')`;
  }

  call.replaceWithText(newCode);
  return { transformed: true };
};

interface ParsedAssertCall {
  args: string[];
  method: string;
  negated: boolean;
}

/**
 * Parse an assert.xxx(args) call.
 *
 * @function
 */
const parseAssertCall = (code: string): null | ParsedAssertCall => {
  // Match assert.method(args)
  const match = code.match(/^assert\.(\w+)\((.*)\)$/s);

  if (!match) {
    return null;
  }

  const [, method, argsStr] = match;

  if (!method) {
    return null;
  }

  // Check if this is a negated method
  const negated = method in NEGATION_MAPPINGS;

  // Parse arguments
  const args = argsStr?.trim() ? parseArguments(argsStr) : [];

  return { args, method, negated };
};

/**
 * Parse function arguments, handling nested structures.
 *
 * @function
 */
const parseArguments = (argsStr: string): string[] => {
  const args: string[] = [];
  let current = '';
  let depth = 0;
  let inString: null | string = null;

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];
    const prevChar = argsStr[i - 1];

    // Handle string boundaries
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (inString === char) {
        inString = null;
      } else if (!inString) {
        inString = char;
      }
    }

    // Track nesting depth (only outside strings)
    if (!inString) {
      if (char === '(' || char === '[' || char === '{') {
        depth++;
      } else if (char === ')' || char === ']' || char === '}') {
        depth--;
      }

      // Split on comma at depth 0
      if (char === ',' && depth === 0) {
        args.push(current.trim());
        current = '';
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
};
