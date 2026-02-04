/**
 * Result of extracting balanced content from a string.
 */
export interface ExtractedContent {
  /** The extracted content (without the delimiters) */
  content: string;

  /** The index after the closing delimiter */
  endIndex: number;
}

/**
 * Extract balanced content between delimiters, handling nesting and strings.
 *
 * This handles nested structures correctly (e.g., extracting `fetchData()` from
 * `(fetchData())`).
 *
 * @example
 *
 * ```ts
 * const result = extractBalancedContent('(foo(bar))', 0, '(', ')');
 * // result = { content: 'foo(bar)', endIndex: 10 }
 * ```
 *
 * @function
 * @param code - The code string to extract from
 * @param startIndex - The index of the opening delimiter (inclusive)
 * @param openChar - The opening delimiter character
 * @param closeChar - The closing delimiter character
 * @returns The extracted content and end index, or null if parsing fails
 */
export const extractBalancedContent = (
  code: string,
  startIndex: number,
  openChar = '(',
  closeChar = ')',
): ExtractedContent | null => {
  if (code[startIndex] !== openChar) {
    return null;
  }

  let depth = 1;
  let inString: null | string = null;
  const contentStart = startIndex + 1;

  for (let i = contentStart; i < code.length; i++) {
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
      if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          return {
            content: code.slice(contentStart, i).trim(),
            endIndex: i + 1,
          };
        }
      }
    }
  }

  // No matching closing delimiter found
  return null;
};

/**
 * Extract the subject from an expect() or similar call by finding the matching
 * closing parenthesis.
 *
 * This handles nested parentheses correctly (e.g., `expect(fetchData())`).
 *
 * @example
 *
 * ```ts
 * const result = extractCallSubject('expect(foo()).toBe(1)', 'expect(');
 * // result = { subject: 'foo()', rest: '.toBe(1)' }
 * ```
 *
 * @function
 * @param code - The code string starting with the function call
 * @param prefix - The prefix to look for (e.g., 'expect(', 'assert(')
 * @returns The subject and the rest of the string, or null if parsing fails
 */
export const extractCallSubject = (
  code: string,
  prefix: string,
): null | { rest: string; subject: string } => {
  if (!code.startsWith(prefix)) {
    return null;
  }

  const openIndex = prefix.length - 1; // Index of the opening paren
  const result = extractBalancedContent(code, openIndex, '(', ')');

  if (!result) {
    return null;
  }

  return {
    rest: code.slice(result.endIndex),
    subject: result.content,
  };
};

/**
 * Parse function arguments, handling nested structures.
 *
 * This correctly handles:
 *
 * - String literals (single, double, template)
 * - Nested parentheses, brackets, and braces
 * - Escaped characters in strings
 *
 * @example
 *
 * ```ts
 * parseArguments('a, b, c'); // ['a', 'b', 'c']
 * parseArguments('foo(1, 2), bar'); // ['foo(1, 2)', 'bar']
 * parseArguments('"a, b", c'); // ['"a, b"', 'c']
 * ```
 *
 * @function
 * @param argsStr - The arguments string (content between parentheses)
 * @returns An array of argument strings
 */
export const parseArguments = (argsStr: string): string[] => {
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
