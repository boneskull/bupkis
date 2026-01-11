import { type CallExpression, type SourceFile, SyntaxKind } from 'ts-morph';

import type {
  TransformError,
  TransformMode,
  TransformWarning,
} from '../types.js';

import { getMatcherTransform, isMatcherSupported } from '../matchers/index.js';

interface ExpectTransformResult {
  errors: TransformError[];
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
  mode: TransformMode,
): ExpectTransformResult => {
  const warnings: TransformWarning[] = [];
  const errors: TransformError[] = [];
  let transformCount = 0;

  // Find all call expressions
  const callExpressions = sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression,
  );

  // Process in reverse order to avoid position shifts
  const expectCalls = callExpressions.filter(isJestExpectChain).reverse();

  for (const expectChain of expectCalls) {
    try {
      const result = transformSingleExpect(expectChain, mode);

      if (result.transformed) {
        transformCount++;
      }

      if (result.warning) {
        warnings.push(result.warning);
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

  return { errors, transformCount, warnings };
};

/**
 * Check if a call expression is a Jest expect() chain. Matches patterns like:
 *
 * - Expect(x).toBe(y)
 * - Expect(x).not.toBe(y)
 * - Expect(x).resolves.toBe(y)
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

  // Check for .toXxx() pattern
  return text.includes(').to') || text.includes(').not.');
};

interface SingleTransformResult {
  transformed: boolean;
  warning?: TransformWarning;
}

/**
 * Transform a single expect() chain.
 *
 * @function
 */
const transformSingleExpect = (
  node: CallExpression,
  mode: TransformMode,
): SingleTransformResult => {
  const fullText = node.getText();
  const pos = node.getStartLineNumber();
  const col = node.getStartLinePos();

  // Parse the expect chain
  const parsed = parseExpectChain(fullText);

  if (!parsed) {
    return { transformed: false };
  }

  const { matcher, matcherArgs, negated, subject } = parsed;

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
  subject: string;
}

/**
 * Parse a Jest expect() chain into its components.
 *
 * @function
 */
const parseExpectChain = (code: string): null | ParsedExpectChain => {
  // Match: expect(subject).matcher(args) or expect(subject).not.matcher(args)
  const regex = /^expect\((.+?)\)\.(not\.)?(\w+)\((.*)\)$/s;
  const match = code.match(regex);

  if (!match) {
    return null;
  }

  const [, subject, notPart, matcher, argsStr] = match;

  // Ensure required matches are present
  if (!subject || !matcher) {
    return null;
  }

  // Parse arguments using parseArguments which handles nested structures
  const matcherArgs = argsStr?.trim() ? parseArguments(argsStr) : [];

  return {
    matcher,
    matcherArgs,
    negated: Boolean(notPart),
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
