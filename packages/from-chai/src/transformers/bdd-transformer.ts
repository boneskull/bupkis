import {
  type CallExpression,
  type ExpressionStatement,
  type PropertyAccessExpression,
  type SourceFile,
  SyntaxKind,
} from 'ts-morph';

import type {
  TransformError,
  TransformMode,
  TransformWarning,
} from '../types.js';

import { getMatcherTransform, isMatcherSupported } from '../matchers/index.js';

/**
 * Result of transforming BDD expect calls in a file.
 */
export interface BddTransformResult {
  errors: TransformError[];
  transformCount: number;
  warnings: TransformWarning[];
}

/**
 * Language chains in Chai that are essentially noise words.
 */
const LANGUAGE_CHAINS = new Set([
  'also',
  'and',
  'at',
  'be',
  'been',
  'but',
  'does',
  'has',
  'have',
  'is',
  'of',
  'same',
  'still',
  'that',
  'to',
  'which',
  'with',
]);

/**
 * Properties that indicate the end of a chain (no args needed).
 */
const TERMINAL_PROPERTIES = new Set([
  'arguments',
  'empty',
  'exist',
  'extensible',
  'false',
  'frozen',
  'fulfilled',
  'NaN',
  'null',
  'ok',
  'rejected',
  'sealed',
  'true',
  'undefined',
]);

/**
 * Transform Chai BDD expect() calls to bupkis syntax.
 *
 * @function
 * @param sourceFile - The source file to transform
 * @param mode - How to handle unsupported matchers
 * @returns Transform results including counts, warnings, and errors
 */
export const transformBddExpectCalls = (
  sourceFile: SourceFile,
  mode: TransformMode,
): BddTransformResult => {
  const warnings: TransformWarning[] = [];
  const errors: TransformError[] = [];
  let transformCount = 0;

  // Get all expression statements - we need to handle both:
  // 1. Call expressions: expect(x).to.equal(y)
  // 2. Property access expressions: expect(x).to.be.true
  const statements = sourceFile.getStatements();

  // Process in reverse to avoid position shifts
  const expectStatements = statements
    .filter((stmt) => {
      if (stmt.getKind() !== SyntaxKind.ExpressionStatement) {
        return false;
      }
      const text = stmt.getText();
      return text.startsWith('expect(');
    })
    .reverse();

  for (const stmt of expectStatements) {
    const exprStmt = stmt as ExpressionStatement;
    const expr = exprStmt.getExpression();

    try {
      const result = transformSingleExpect(expr, mode);

      if (result.transformed) {
        transformCount++;
        // Replace the entire statement
        exprStmt.replaceWithText(result.newCode + ';');
      }

      if (result.warning) {
        warnings.push(result.warning);
      }
    } catch (error) {
      const pos = stmt.getStartLineNumber();
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
  newCode: string;
  transformed: boolean;
  warning?: TransformWarning;
}

/**
 * Transform a single expect() expression.
 *
 * @function
 */
const transformSingleExpect = (
  expr: CallExpression | PropertyAccessExpression,
  mode: TransformMode,
): SingleTransformResult => {
  const fullText = expr.getText();
  const pos = expr.getStartLineNumber();
  const col = expr.getStartLinePos();

  // Parse the Chai chain
  const parsed = parseChaiChain(fullText);

  if (!parsed) {
    return { newCode: fullText, transformed: false };
  }

  const { args, matcher, negated, subject } = parsed;

  // Check if matcher is supported
  if (!isMatcherSupported(matcher)) {
    if (mode === 'strict') {
      throw new Error(`Unsupported matcher: ${matcher}`);
    }

    // Add TODO comment for best-effort mode
    const comment = `// TODO: Manual migration needed - unsupported matcher '${matcher}'`;
    return {
      newCode: `${comment}\n${fullText}`,
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
    return { newCode: fullText, transformed: false };
  }

  // Check for custom transformer
  if (transform.transform) {
    const customResult = transform.transform({
      matcherArgs: args,
      negated,
      originalExpression: fullText,
      subject,
    });

    if (customResult === null) {
      if (mode !== 'strict') {
        const comment = `// TODO: Manual migration needed - complex '${matcher}' usage`;
        return {
          newCode: `${comment}\n${fullText}`,
          transformed: false,
          warning: {
            column: col,
            line: pos,
            message: `Complex ${matcher} usage requires manual migration`,
            originalCode: fullText,
          },
        };
      }
      throw new Error(`Complex ${matcher} usage requires manual migration`);
    }

    return { newCode: customResult, transformed: true };
  }

  // Standard transformation
  const phrase = negated
    ? `not ${transform.bupkisPhrase}`
    : transform.bupkisPhrase;

  let newCode: string;
  if (args.length > 0) {
    newCode = `expect(${subject}, '${phrase}', ${args.join(', ')})`;
  } else {
    newCode = `expect(${subject}, '${phrase}')`;
  }

  return { newCode, transformed: true };
};

interface ParsedChaiChain {
  args: string[];
  matcher: string;
  negated: boolean;
  subject: string;
}

/**
 * Parse a Chai BDD chain into its components.
 *
 * Handles patterns like:
 *
 * - Expect(x).to.equal(y)
 * - Expect(x).to.be.true
 * - Expect(x).to.deep.equal(y)
 * - Expect(x).to.not.equal(y)
 * - Expect(x).not.to.equal(y)
 * - Expect(x).to.be.at.least(y)
 *
 * @function
 */
const parseChaiChain = (code: string): null | ParsedChaiChain => {
  // First, extract the subject from expect(subject)
  const expectMatch = code.match(/^expect\((.+?)\)\./);
  if (!expectMatch) {
    return null;
  }

  // Need to properly match balanced parentheses for the subject
  const subject = extractSubject(code);
  if (!subject) {
    return null;
  }

  // Get the chain part after expect(subject).
  const chainStart = code.indexOf(').') + 2;
  const chainPart = code.slice(chainStart);

  // Parse the chain into segments
  const { args, negated, segments } = parseChainSegments(chainPart);

  // Build the matcher name from significant segments
  const matcher = buildMatcherName(segments);

  if (!matcher) {
    return null;
  }

  return {
    args,
    matcher,
    negated,
    subject,
  };
};

/**
 * Extract the subject from expect(subject) handling nested parentheses.
 *
 * @function
 */
const extractSubject = (code: string): null | string => {
  if (!code.startsWith('expect(')) {
    return null;
  }

  let depth = 0;
  const start = 7; // After 'expect('

  for (let i = start; i < code.length; i++) {
    const char = code[i];

    if (char === '(') {
      depth++;
    } else if (char === ')') {
      if (depth === 0) {
        return code.slice(start, i);
      }
      depth--;
    }
  }

  return null;
};

interface ChainParseResult {
  args: string[];
  negated: boolean;
  segments: string[];
}

/**
 * Parse chain segments, extracting negation, terminal, and arguments.
 *
 * @function
 */
const parseChainSegments = (chain: string): ChainParseResult => {
  const rawSegments: string[] = [];
  let negated = false;
  let args: string[] = [];

  // Split by dots but be careful with method calls
  let current = '';
  let depth = 0;
  let inString: null | string = null;

  for (let i = 0; i < chain.length; i++) {
    const char = chain[i];
    const prevChar = chain[i - 1];

    // Handle string boundaries
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (inString === char) {
        inString = null;
      } else if (!inString) {
        inString = char;
      }
    }

    if (!inString) {
      if (char === '(' || char === '[' || char === '{') {
        depth++;
      } else if (char === ')' || char === ']' || char === '}') {
        depth--;
      }

      // Split on dot at depth 0
      if (char === '.' && depth === 0) {
        if (current) {
          rawSegments.push(current);
        }
        current = '';
        continue;
      }
    }

    current += char;
  }

  if (current) {
    rawSegments.push(current);
  }

  // Process segments - need to look ahead for terminal properties
  const significantSegments: string[] = [];

  for (let i = 0; i < rawSegments.length; i++) {
    const seg = rawSegments[i];
    const nextSeg = rawSegments[i + 1];

    // Check for method call with arguments
    const callMatch = seg.match(/^(\w+)\((.*)\)$/s);

    if (callMatch) {
      const [, name, argsStr] = callMatch;

      if (name === 'not') {
        negated = true;
      } else if (!LANGUAGE_CHAINS.has(name!)) {
        significantSegments.push(name!);
        if (argsStr?.trim()) {
          args = parseArguments(argsStr);
        }
      }
    } else {
      // Property access
      if (seg === 'not') {
        negated = true;
      } else if (TERMINAL_PROPERTIES.has(seg)) {
        // Terminal property - keep it
        significantSegments.push(seg);
      } else if (
        LANGUAGE_CHAINS.has(seg) &&
        nextSeg &&
        TERMINAL_PROPERTIES.has(nextSeg)
      ) {
        // Language chain followed by terminal - keep it (e.g., 'be' before 'true')
        significantSegments.push(seg);
      } else if (!LANGUAGE_CHAINS.has(seg)) {
        significantSegments.push(seg);
      }
    }
  }

  return { args, negated, segments: significantSegments };
};

/**
 * Build a matcher name from parsed segments.
 *
 * Handles compound matchers like 'deep.equal', 'be.true', 'have.property'.
 *
 * @function
 */
const buildMatcherName = (segments: string[]): null | string => {
  if (segments.length === 0) {
    return null;
  }

  // Try increasingly specific compound names
  // E.g., for ['be', 'at', 'least'], try 'be.at.least', then 'at.least', then 'least'
  for (let i = 0; i < segments.length; i++) {
    const name = segments.slice(i).join('.');
    if (isMatcherSupported(name)) {
      return name;
    }
  }

  // Try just the last segment
  const last = segments[segments.length - 1];
  if (last && isMatcherSupported(last)) {
    return last;
  }

  // Try combining adjacent pairs
  if (segments.length >= 2) {
    const compound =
      segments[segments.length - 2] + '.' + segments[segments.length - 1];
    if (isMatcherSupported(compound)) {
      return compound;
    }
  }

  // Return the full compound as a last resort (will likely be unsupported)
  return segments.join('.');
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
