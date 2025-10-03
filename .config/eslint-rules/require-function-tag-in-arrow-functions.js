/**
 * ESLint rule to require `@function` tag in JSDoc comments for arrow functions
 *
 * @packageDocumentation
 */

import {
  AST_NODE_TYPES,
  AST_TOKEN_TYPES,
  ESLintUtils,
} from '@typescript-eslint/utils';

/**
 * @import {TSESTree} from '@typescript-eslint/typescript-estree';
 */
/**
 * ESLint rule to require `@function` tag in JSDoc comments for arrow functions
 *
 * This rule enforces the presence of `@function` tags in JSDoc comments for
 * arrow functions to improve code documentation and maintain consistency with
 * the project's documentation standards.
 *
 * The rule supports:
 *
 * - Named arrow functions (`const foo = () => {}`)
 * - Arrow functions in object properties (`{ method: () => {} }`)
 * - Arrow functions in assignments (`obj.method = () => {}`)
 * - Export declarations (`export const foo = () => {}`)
 *
 * Configuration options:
 *
 * - `requireForNamed`: Whether to require `@function` tags for named arrow
 *   functions (default: `true`)
 * - `requireForAnonymous`: Whether to require `@function` tags for anonymous
 *   arrow functions (default: `false`)
 */
export default ESLintUtils.RuleCreator.withoutDocs({
  create(context, [options]) {
    const sourceCode = context.sourceCode;

    /**
     * Determines if an arrow function should require a @function tag based on
     * its context.
     *
     * This function identifies "named" arrow functions, which are arrow
     * functions that are assigned to a variable, property, or exported. These
     * are distinguished from anonymous arrow functions used in callbacks or
     * inline expressions.
     *
     * Supported patterns:
     *
     * - Variable declarations: `const foo = () => {}`
     * - Object properties: `{ method: () => {} }`
     * - Property assignments: `obj.method = () => {}`
     * - Export declarations: `export const foo = () => {}`
     *
     * @example
     *
     * ```ts
     * // Returns true for these patterns:
     * const myFunc = () => {}; // Variable declaration
     * obj.method = () => {}; // Property assignment
     * const obj = { method: () => {} }; // Object property
     * export const func = () => {}; // Export declaration
     *
     * // Returns false for these patterns:
     * [1, 2, 3].map(() => {}); // Anonymous callback
     * setTimeout(() => {}, 100); // Anonymous callback
     * ```
     *
     * @function
     * @param {TSESTree.ArrowFunctionExpression} node - The arrow function AST
     *   node to check
     * @returns {boolean} True if this arrow function should be considered
     *   "named" and potentially require a @function tag based on its syntactic
     *   context
     */
    const shouldRequireTag =
      /**
       * @function
       */
      (node) => {
        const parent = node.parent;

        if (
          parent?.type === AST_NODE_TYPES.VariableDeclarator &&
          parent.id?.type === AST_NODE_TYPES.Identifier
        ) {
          return true;
        }

        if (
          parent?.type === AST_NODE_TYPES.AssignmentExpression &&
          parent.left?.type === AST_NODE_TYPES.MemberExpression
        ) {
          return true;
        }

        if (parent?.type === AST_NODE_TYPES.Property && parent.key) {
          return true;
        }

        if (
          parent?.type === AST_NODE_TYPES.VariableDeclarator &&
          parent.parent?.parent?.type === AST_NODE_TYPES.ExportNamedDeclaration
        ) {
          return true;
        }

        return false;
      };

    /**
     * Determines whether a specific arrow function should be flagged by this
     * rule based on the configured options and the function's naming context.
     *
     * This function combines the result of `shouldRequireTag()` (which
     * determines if an arrow function is "named") with the user's configuration
     * options to decide if the rule should be applied to this specific arrow
     * function.
     *
     * @example
     *
     * ```ts
     * // With options: { requireForNamed: true, requireForAnonymous: false }
     *
     * const namedFunc = () => {}; // Returns true (named + requireForNamed)
     * [1, 2].map(() => {}); // Returns false (anonymous + !requireForAnonymous)
     *
     * // With options: { requireForNamed: false, requireForAnonymous: true }
     *
     * const namedFunc = () => {}; // Returns false (named + !requireForNamed)
     * [1, 2].map(() => {}); // Returns true (anonymous + requireForAnonymous)
     * ```
     *
     * @function
     * @param {TSESTree.ArrowFunctionExpression} node - The arrow function AST
     *   node to evaluate
     * @returns {boolean} True if this arrow function should be flagged for
     *   missing `@function` tag, false if it should be ignored by this rule
     */
    const isNamedArrowFunction =
      /**
       * @function
       */
      (node) => {
        const isNamed = shouldRequireTag(node);

        if (isNamed && options.requireForNamed) {
          return true;
        }

        if (!isNamed && options.requireForAnonymous) {
          return true;
        }

        return false;
      };

    /**
     * Finds the JSDoc comment associated with an arrow function, if any exists.
     *
     * This function is crucial for the rule's functionality because arrow
     * functions don't have JSDoc comments directly attached to them. Instead,
     * the JSDoc comment is typically attached to the parent node (variable
     * declaration, object property, etc.).
     *
     * The function looks for JSDoc comments in the appropriate location based
     * on the arrow function's syntactic context:
     *
     * - For variable declarations: Looks before the entire variable declaration
     * - For object properties: Looks before the property definition
     * - For assignments: Looks before the assignment expression
     * - For other cases: Falls back to looking before the arrow function itself
     *
     * @example
     *
     * ```ts
     * // These patterns will find the JSDoc comment:
     *
     * // Pattern 1: Variable declaration
     * // JSDoc here
     * // const func = () => {};              // Finds comment before variable declaration
     *
     * // Pattern 2: Object property
     * // const obj = {
     * //   // JSDoc here
     * //   method: () => {}                  // Finds comment before property
     * // };
     *
     * // Pattern 3: Assignment expression
     * // // JSDoc here
     * // obj.method = () => {};              // Finds comment before assignment
     * ```
     *
     * @function
     * @param {TSESTree.ArrowFunctionExpression} node - The arrow function AST
     *   node
     * @returns {TSESTree.Comment | undefined} The JSDoc comment node if found,
     *   undefined otherwise
     */
    const getJSDocComment =
      /**
       * @function
       */
      (node) => {
        // For named arrow functions (variable declarations), look for JSDoc on the variable declarator
        const parent = node.parent;
        /** @type {TSESTree.Node} */
        let targetNode = node;

        switch (parent?.type) {
          case AST_NODE_TYPES.AssignmentExpression: {
            // For assignments like obj.foo = () => {}, look before the assignment
            targetNode = parent;
            break;
          }
          case AST_NODE_TYPES.Property: {
            // For object properties, look before the property
            targetNode = parent;
            break;
          }
          case AST_NODE_TYPES.VariableDeclarator: {
            // Look for comments before the variable declaration
            const variableDeclaration = parent.parent;
            if (
              variableDeclaration?.type === AST_NODE_TYPES.VariableDeclaration
            ) {
              // Check if the variable declaration is exported
              if (
                variableDeclaration.parent?.type ===
                AST_NODE_TYPES.ExportNamedDeclaration
              ) {
                targetNode = variableDeclaration.parent;
              } else {
                targetNode = variableDeclaration;
              }
            }
            break;
          }
        }

        const comments = sourceCode.getCommentsBefore(targetNode);
        const comment = comments.findLast(
          (comment) =>
            comment.type === AST_TOKEN_TYPES.Block &&
            comment.value.startsWith('*'),
        );

        // If we didn't find a comment and we're dealing with an exported variable,
        // also try looking before the variable declarator itself
        if (!comment && parent?.type === AST_NODE_TYPES.VariableDeclarator) {
          const declaratorComments = sourceCode.getCommentsBefore(parent);
          return declaratorComments.findLast(
            (comment) =>
              comment.type === AST_TOKEN_TYPES.Block &&
              comment.value.startsWith('*'),
          );
        }

        return comment;
      };
    return {
      ArrowFunctionExpression(node) {
        if (!isNamedArrowFunction(node)) {
          return;
        }

        const comment = getJSDocComment(node);

        if (!comment) {
          context.report({
            fix(fixer) {
              // Insert JSDoc before the appropriate node (variable declaration, assignment, etc.)
              const parent = node.parent;
              /** @type {TSESTree.Node} */
              let insertTarget = node;

              switch (parent?.type) {
                case AST_NODE_TYPES.AssignmentExpression: {
                  insertTarget = parent;
                  break;
                }
                case AST_NODE_TYPES.Property: {
                  insertTarget = parent;
                  break;
                }
                case AST_NODE_TYPES.VariableDeclarator: {
                  const variableDeclaration = parent.parent;
                  if (
                    variableDeclaration?.type ===
                    AST_NODE_TYPES.VariableDeclaration
                  ) {
                    // Check if the variable declaration is exported
                    if (
                      variableDeclaration.parent?.type ===
                      AST_NODE_TYPES.ExportNamedDeclaration
                    ) {
                      insertTarget = variableDeclaration.parent;
                    } else {
                      insertTarget = variableDeclaration;
                    }
                  }
                  break;
                }
              }

              return fixer.insertTextBefore(
                insertTarget,
                '/**\n * @function\n */\n',
              );
            },
            messageId: 'missingJSDoc',
            node,
          });
          return;
        }

        if (!/^\s*\*\s*@function\s*$/m.test(comment.value)) {
          context.report({
            fix(fixer) {
              // Add @function tag to existing JSDoc
              const value = comment.value;

              // For JSDoc comments, insert @function before the last line
              // The comment.value doesn't include /* and */, so we need to add them back
              const lines = value.split('\n');

              // Find where to insert @function (before the closing line)
              // Look for the last line that contains content (not just whitespace)
              let insertIndex = lines.length;
              for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i]?.trim();
                if (line && !line.match(/^\s*$/)) {
                  insertIndex = i + 1;
                  break;
                }
              }

              // Insert @function at the appropriate position
              const beforeLines = lines.slice(0, insertIndex);
              const afterLines = lines.slice(insertIndex);

              const newLines = [...beforeLines, ' * @function', ...afterLines];

              const updatedValue = newLines.join('\n');
              return fixer.replaceText(comment, `/*${updatedValue}*/`);
            },
            messageId: 'missingFunctionTag',
            node,
          });
        }
      },
    };
  },
  defaultOptions: [
    {
      requireForAnonymous: false,
      requireForNamed: true,
    },
  ],
  meta: {
    docs: {
      description:
        'Require @function tag in JSDoc comments for arrow functions',
    },
    fixable: 'code',
    messages: {
      missingFunctionTag: 'JSDoc comment should include @function tag',
      missingJSDoc:
        'Arrow function should have JSDoc comment with @function tag',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          requireForAnonymous: {
            type: 'boolean',
          },
          requireForNamed: {
            type: 'boolean',
          },
        },
        type: 'object',
      },
    ],
    type: 'suggestion',
  },
  name: 'require-function-tag-in-arrow-functions',
});
