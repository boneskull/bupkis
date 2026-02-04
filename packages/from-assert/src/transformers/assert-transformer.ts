import { type CallExpression, type SourceFile, SyntaxKind } from 'ts-morph';

import type {
  AssertStyle,
  TransformError,
  TransformMode,
  TransformWarning,
} from '../types.js';

import {
  getBaseMethod,
  getMatcherTransform,
  isAsyncMethod,
  isLegacyMethod,
  isMatcherSupported,
  isNegatedMethod,
  UNSUPPORTED_METHODS,
} from '../matchers/index.js';

/**
 * Result of transforming assert calls in a file.
 */
export interface AssertTransformResult {
  errors: TransformError[];
  transformCount: number;

  /** Whether any async assertions (rejects/doesNotReject) were transformed */
  useExpectAsync: boolean;

  warnings: TransformWarning[];
}

/**
 * Transform node:assert calls to bupkis syntax.
 *
 * @function
 * @param sourceFile - The source file to transform
 * @param mode - How to handle unsupported assertions
 * @param assertStyle - Whether the import is strict or legacy mode
 * @returns Transform results including counts, warnings, and errors
 */
export const transformAssertCalls = (
  sourceFile: SourceFile,
  mode: TransformMode,
  assertStyle: AssertStyle = 'strict',
): AssertTransformResult => {
  const warnings: TransformWarning[] = [];
  const errors: TransformError[] = [];
  let transformCount = 0;
  let useExpectAsync = false;

  // Find all call expressions
  const callExpressions = sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression,
  );

  // Process in reverse order to avoid position shifts
  const assertCalls = callExpressions
    .filter((call) => {
      const text = call.getText();
      // Match both assert.xxx() and bare assert()
      return text.startsWith('assert.') || text.startsWith('assert(');
    })
    .reverse();

  for (const call of assertCalls) {
    try {
      const result = transformSingleAssert(call, mode, assertStyle);

      if (result.transformed) {
        transformCount++;
        if (result.usedExpectAsync) {
          useExpectAsync = true;
        }
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

  return { errors, transformCount, useExpectAsync, warnings };
};

interface SingleTransformResult {
  transformed: boolean;

  /** Whether expectAsync was used for this transformation */
  usedExpectAsync?: boolean;

  warning?: TransformWarning;
}

/**
 * Transform a single assert call.
 *
 * @function
 */
const transformSingleAssert = (
  call: CallExpression,
  mode: TransformMode,
  assertStyle: AssertStyle,
): SingleTransformResult => {
  const fullText = call.getText();
  const pos = call.getStartLineNumber();
  const col = call.getStartLinePos();

  // Handle bare assert(value) calls
  if (fullText.startsWith('assert(')) {
    const parsed = parseBareAssert(fullText);
    if (parsed) {
      const newCode = `expect(${parsed.subject}, 'to be truthy')`;
      call.replaceWithText(newCode);
      return { transformed: true };
    }
    return { transformed: false };
  }

  // Parse assert.method(args)
  const parsed = parseAssertCall(fullText);

  if (!parsed) {
    return { transformed: false };
  }

  const { args, method } = parsed;

  // Check for unsupported methods
  if (UNSUPPORTED_METHODS.has(method)) {
    if (mode === 'strict') {
      throw new Error(`Unsupported assert method: ${method}`);
    }

    // In best-effort mode, leave the code unchanged but return a warning
    // The user will need to manually migrate this assertion
    return {
      transformed: false,
      warning: {
        column: col,
        line: pos,
        message: `Unsupported assert method '${method}' - manual migration needed`,
        originalCode: fullText,
      },
    };
  }

  // Get the base method name (for looking up in matchers)
  const negated = isNegatedMethod(method);
  const baseMatcher = getBaseMethod(method);

  // Check if matcher is supported
  if (!isMatcherSupported(baseMatcher)) {
    if (mode === 'strict') {
      throw new Error(`Unsupported assert method: ${method}`);
    }

    // In best-effort mode, leave the code unchanged but return a warning
    return {
      transformed: false,
      warning: {
        column: col,
        line: pos,
        message: `Unsupported assert method '${method}' - manual migration needed`,
        originalCode: fullText,
      },
    };
  }

  const transform = getMatcherTransform(baseMatcher);

  if (!transform) {
    return { transformed: false };
  }

  // Determine subject and matcher args
  const subject = args[0] ?? '';
  const matcherArgs = args.slice(1);

  // Check for legacy loose assertions and add warning
  // Note: baseMatcher will be 'equal' for both 'equal' and 'notEqual' (via getBaseMethod)
  if (
    assertStyle === 'legacy' &&
    isLegacyMethod(baseMatcher) &&
    baseMatcher === 'equal'
  ) {
    // In legacy mode with loose equality, transform but return a warning
    // The warning alerts the user that behavior may differ (loose vs strict equality)
    const phrase = negated
      ? `not ${transform.bupkisPhrase}`
      : transform.bupkisPhrase;
    const newCode =
      matcherArgs.length > 0
        ? `expect(${subject}, '${phrase}', ${matcherArgs.join(', ')})`
        : `expect(${subject}, '${phrase}')`;
    call.replaceWithText(newCode);

    return {
      transformed: true,
      warning: {
        column: col,
        line: pos,
        message: `Loose equality assertion '${method}' converted to strict - verify behavior`,
        originalCode: fullText,
      },
    };
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
      // Custom transformer returned null - needs manual migration
      // Leave code unchanged and return warning
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

  // Determine if this is an async assertion
  const isAsync = isAsyncMethod(baseMatcher);

  // Build the phrase
  const phrase = negated
    ? `not ${transform.bupkisPhrase}`
    : transform.bupkisPhrase;

  // Build the new code
  const expectFn = isAsync ? 'expectAsync' : 'expect';
  let newCode: string;

  if (matcherArgs.length > 0) {
    // Handle special case for rejects with Error type
    if (baseMatcher === 'rejects' && matcherArgs.length > 0 && !negated) {
      newCode = `${expectFn}(${subject}, 'to reject with', ${matcherArgs.join(', ')})`;
    } else {
      newCode = `${expectFn}(${subject}, '${phrase}', ${matcherArgs.join(', ')})`;
    }
  } else {
    newCode = `${expectFn}(${subject}, '${phrase}')`;
  }

  call.replaceWithText(newCode);
  return { transformed: true, usedExpectAsync: isAsync };
};

interface ParsedAssertCall {
  args: string[];
  method: string;
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

  // Parse arguments
  const args = argsStr?.trim() ? parseArguments(argsStr) : [];

  return { args, method };
};

interface ParsedBareAssert {
  subject: string;
}

/**
 * Parse a bare assert(value) call.
 *
 * @function
 */
const parseBareAssert = (code: string): null | ParsedBareAssert => {
  // Match assert(value) - need to handle nested parens
  if (!code.startsWith('assert(')) {
    return null;
  }

  const subject = extractSubject(code, 7); // Start after 'assert('
  if (!subject) {
    return null;
  }

  return { subject };
};

/**
 * Extract the subject from inside parentheses, handling nested structures.
 *
 * @function
 */
const extractSubject = (code: string, startIndex: number): null | string => {
  let depth = 1;
  let inString: null | string = null;

  for (let i = startIndex; i < code.length; i++) {
    const char = code[i];
    const prevChar = code[i - 1];

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
      if (char === '(') {
        depth++;
      } else if (char === ')') {
        depth--;
        if (depth === 0) {
          return code.slice(startIndex, i).trim();
        }
      }
    }
  }

  return null;
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
