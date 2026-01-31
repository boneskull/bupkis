import { type CallExpression, type SourceFile, SyntaxKind } from 'ts-morph';

import type {
  MatcherTransform,
  MatcherTransformArgs,
  TransformError,
  TransformMode,
  TransformWarning,
} from '../types.js';

import {
  getMatcherTransform,
  getSinonMatcherTransform,
  isMatcherSupported,
  isMockMatcher,
  transformPromiseChain,
} from '../matchers/index.js';

/**
 * Options for transforming expect calls.
 */
export interface ExpectTransformOptions {
  /** Transform mode */
  mode: TransformMode;

  /** Enable mock matcher transformations (requires @bupkis/sinon) */
  sinon?: boolean;
}

/**
 * Detected mock matcher.
 */
export interface MockMatcherInfo {
  /** Jest matcher name */
  matcher: string;
}

interface ExpectTransformResult {
  errors: TransformError[];

  /** Mock matchers detected (when sinon not enabled) */
  mockMatchers: MockMatcherInfo[];

  /** Number of mock matchers transformed (when sinon enabled) */
  mockMatcherTransformCount: number;

  /** Number of promise matchers transformed (resolves/rejects) */
  promiseMatcherTransformCount: number;

  transformCount: number;
  warnings: TransformWarning[];
}

/**
 * Transform Jest expect() calls to bupkis syntax.
 *
 * @function
 */
export const transformExpectCalls = (
  sourceFile: SourceFile,
  options: ExpectTransformOptions,
): ExpectTransformResult => {
  const warnings: TransformWarning[] = [];
  const errors: TransformError[] = [];
  const mockMatchers: MockMatcherInfo[] = [];
  let transformCount = 0;
  let mockMatcherTransformCount = 0;
  let promiseMatcherTransformCount = 0;

  const { mode, sinon = false } = options;

  // Find all call expressions
  const callExpressions = sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression,
  );

  // Process in reverse order to avoid position shifts
  const expectCalls = callExpressions.filter(isJestExpectChain).reverse();

  for (const expectChain of expectCalls) {
    try {
      const result = transformSingleExpect(expectChain, mode, sinon);

      if (result.transformed) {
        transformCount++;
        if (result.wasMockMatcher) {
          mockMatcherTransformCount++;
        }
        if (result.wasPromiseMatcher) {
          promiseMatcherTransformCount++;
        }
      }

      if (result.warning) {
        warnings.push(result.warning);
      }

      if (result.mockMatcher) {
        mockMatchers.push(result.mockMatcher);
      }
    } catch (error) {
      const pos = expectChain.getStartLineNumber();
      errors.push({
        line: pos,
        message: error instanceof Error ? error.message : String(error),
      });

      if (mode === 'strict') {
        throw error;
      }
    }
  }

  return {
    errors,
    mockMatchers,
    mockMatcherTransformCount,
    promiseMatcherTransformCount,
    transformCount,
    warnings,
  };
};

/**
 * Check if a call expression is a Jest expect() chain. Matches patterns like:
 *
 * - `expect(x).toBe(y)`
 * - `expect(x).not.toBe(y)`
 * - `expect(x).resolves.toBe(y)`
 * - `expect(x).rejects.toBe(y)`
 * - `expect(x).resolves.not.toBe(y)`
 * - `expect(x).lastCalledWith(y)` // Jest 29 alias
 * - `expect(x).nthCalledWith(n, y)` // Jest 29 alias
 *
 * @function
 */
const isJestExpectChain = (node: CallExpression): boolean => {
  const text = node.getText();

  // Must start with expect(
  if (!text.startsWith('expect(')) {
    return false;
  }

  // Must have a matcher call (property access followed by call)
  const parent = node.getParent();
  if (!parent) {
    return false;
  }

  // Check for .toXxx(), .not.xxx(), .resolves., .rejects., or Jest 29 aliases (last*, nth*)
  return (
    text.includes(').to') ||
    text.includes(').not.') ||
    text.includes(').resolves.') ||
    text.includes(').rejects.') ||
    text.includes(').last') ||
    text.includes(').nth')
  );
};

interface SingleTransformResult {
  /** Mock matcher detected (when sinon not enabled) */
  mockMatcher?: MockMatcherInfo;

  transformed: boolean;
  warning?: TransformWarning;

  /** Whether a mock matcher was transformed (when sinon enabled) */
  wasMockMatcher?: boolean;

  /** Whether a promise matcher was transformed (resolves/rejects) */
  wasPromiseMatcher?: boolean;
}

/**
 * Apply a matcher transform to a node.
 *
 * @function
 */
const applyTransform = (
  node: CallExpression,
  transform: MatcherTransform,
  args: MatcherTransformArgs,
  mode: TransformMode,
  col: number,
  pos: number,
): SingleTransformResult => {
  const { matcherArgs, negated, originalExpression, subject } = args;

  // Check for custom transformer
  if (transform.transform) {
    const customResult = transform.transform(args);

    if (customResult === null) {
      // Transformer returned null - needs manual migration
      if (mode !== 'strict') {
        const comment = `// TODO: Manual migration needed - complex '${transform.jestMatcher}' usage`;
        node.replaceWithText(`${comment}\n${originalExpression}`);
      }

      return {
        transformed: false,
        warning: {
          column: col,
          line: pos,
          message: `Complex ${transform.jestMatcher} usage requires manual migration`,
          originalCode: originalExpression,
        },
      };
    }

    node.replaceWithText(customResult);
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

  node.replaceWithText(newCode);
  return { transformed: true };
};

/**
 * Transform a single expect() chain.
 *
 * @function
 */
const transformSingleExpect = (
  node: CallExpression,
  mode: TransformMode,
  sinon: boolean,
): SingleTransformResult => {
  const fullText = node.getText();
  const pos = node.getStartLineNumber();
  const col = node.getStartLinePos();

  // Parse the expect chain
  const parsed = parseExpectChain(fullText);

  if (!parsed) {
    return { transformed: false };
  }

  const { matcher, matcherArgs, negated, promiseModifier, subject } = parsed;

  // Handle promise modifiers (resolves/rejects)
  if (promiseModifier) {
    const result = transformPromiseChain(
      subject,
      promiseModifier,
      matcher,
      matcherArgs,
      negated,
    );

    if (result.success) {
      node.replaceWithText(result.code);
      return { transformed: true, wasPromiseMatcher: true };
    }

    // Transformation failed - add TODO comment
    if (mode !== 'strict') {
      const comment = `// TODO: Manual migration needed - unsupported '${promiseModifier}.${matcher}' pattern`;
      node.replaceWithText(`${comment}\n${fullText}`);
    }

    return {
      transformed: false,
      warning: {
        column: col,
        line: pos,
        message: `Unsupported promise matcher pattern: ${promiseModifier}.${matcher}`,
        originalCode: fullText,
      },
    };
  }

  // Check for mock matchers
  if (isMockMatcher(matcher)) {
    if (!sinon) {
      // Don't transform, just detect and record
      return {
        mockMatcher: { matcher },
        transformed: false,
      };
    }

    // Use sinon transform
    const sinonTransform = getSinonMatcherTransform(matcher);
    if (sinonTransform) {
      const result = applyTransform(
        node,
        sinonTransform,
        { matcherArgs, negated, originalExpression: fullText, subject },
        mode,
        col,
        pos,
      );
      // Mark as mock matcher transform
      if (result.transformed) {
        result.wasMockMatcher = true;
      }
      return result;
    }
  }

  // Check if matcher is supported
  if (!isMatcherSupported(matcher)) {
    if (mode === 'strict') {
      throw new Error(`Unsupported matcher: ${matcher}`);
    }

    // Add TODO comment for best-effort mode
    const comment = `// TODO: Manual migration needed - unsupported matcher '${matcher}'`;
    node.replaceWithText(`${comment}\n${fullText}`);

    return {
      transformed: false,
      warning: {
        column: col,
        line: pos,
        message: `Unsupported matcher: ${matcher}`,
        originalCode: fullText,
      },
    };
  }

  const transform = getMatcherTransform(matcher);

  if (!transform) {
    return { transformed: false };
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
      // Transformer returned null - needs manual migration
      if (mode !== 'strict') {
        const comment = `// TODO: Manual migration needed - complex '${matcher}' usage`;
        node.replaceWithText(`${comment}\n${fullText}`);
      }

      return {
        transformed: false,
        warning: {
          column: col,
          line: pos,
          message: `Complex ${matcher} usage requires manual migration`,
          originalCode: fullText,
        },
      };
    }

    node.replaceWithText(customResult);
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

  node.replaceWithText(newCode);
  return { transformed: true };
};

interface ParsedExpectChain {
  matcher: string;
  matcherArgs: string[];
  negated: boolean;
  /** Promise modifier (resolves/rejects) if present */
  promiseModifier?: 'rejects' | 'resolves';
  subject: string;
}

/**
 * Parse a Jest expect() chain into its components.
 *
 * Supports patterns like:
 *
 * - `expect(x).toBe(y)`
 * - `expect(x).not.toBe(y)`
 * - `expect(x).resolves.toBe(y)`
 * - `expect(x).rejects.toBe(y)`
 * - `expect(x).resolves.not.toBe(y)`
 * - `expect(x).rejects.not.toBe(y)`
 *
 * @function
 */
const parseExpectChain = (code: string): null | ParsedExpectChain => {
  // Match: expect(subject).[resolves.|rejects.]?[not.]?matcher(args)
  const regex =
    /^expect\((.+?)\)\.((?:resolves|rejects)\.)?(not\.)?(\w+)\((.*)\)$/s;
  const match = code.match(regex);

  if (!match) {
    return null;
  }

  const [, subject, modifierPart, notPart, matcher, argsStr] = match;

  // Ensure required matches are present
  if (!subject || !matcher) {
    return null;
  }

  // Parse arguments using parseArguments which handles nested structures
  const matcherArgs = argsStr?.trim() ? parseArguments(argsStr) : [];

  // Extract promise modifier (remove trailing dot)
  const promiseModifier = modifierPart
    ? (modifierPart.slice(0, -1) as 'rejects' | 'resolves')
    : undefined;

  return {
    matcher,
    matcherArgs,
    negated: Boolean(notPart),
    promiseModifier,
    subject: subject.trim(),
  };
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
