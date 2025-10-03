/**
 * ESLint rule to require static methods of intrinsics to be dereferenced before
 * use
 *
 * This rule enforces that static methods of JavaScript intrinsics (like
 * Object.keys, Array.from, etc.) should be destructured before use instead of
 * being accessed directly. This can help with performance and bundle size by
 * allowing these methods to be reused throughout a module.
 *
 * @example
 *
 * ```js
 * // ❌ Bad
 * const keys = Object.keys(obj);
 * const arr = Array.from(iterable);
 *
 * // ✅ Good
 * const { keys } = Object;
 * const { from } = Array;
 * const objKeys = keys(obj);
 * const arr = from(iterable);
 * ```
 *
 * @packageDocumentation
 */

import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
const { freeze } = Object;

// Intrinsics found in the codebase that have static methods
const INTRINSICS_WITH_STATIC_METHODS = freeze(
  new Set(
    /** @type {const} */ ([
      'Array',
      'ArrayBuffer',
      'BigInt',
      'Boolean',
      'console',
      'DataView',
      'Date',
      'Error',
      'Float32Array',
      'Float64Array',
      'Int8Array',
      'Int16Array',
      'Int32Array',
      'Intl',
      'JSON',
      'Map',
      'Math',
      'Number',
      'Object',
      // 'Promise', // should not be destructured
      'Proxy',
      'Reflect',
      'RegExp',
      'Set',
      'String',
      'Symbol',
      'Uint8Array',
      'Uint16Array',
      'Uint32Array',
      'WeakMap',
      'WeakSet',
    ]),
  ),
);

/**
 * Rule to require static methods of intrinsics to be dereferenced before use
 */
export default ESLintUtils.RuleCreator.withoutDocs({
  create(context, [options]) {
    const intrinsics = new Set(
      options?.intrinsics ?? INTRINSICS_WITH_STATIC_METHODS,
    );
    const allowConsole = options?.allowConsole ?? false;

    // Skip console if allowed
    if (allowConsole) {
      intrinsics.delete('console');
    }

    return {
      MemberExpression(node) {
        // Check if this is a static method call on an intrinsic
        if (
          node.object.type === AST_NODE_TYPES.Identifier &&
          intrinsics.has(/** @type {any} */ (node.object.name)) &&
          node.property.type === AST_NODE_TYPES.Identifier &&
          !node.computed
        ) {
          const intrinsic = node.object.name;
          const method = node.property.name;

          context.report({
            data: {
              intrinsic,
              method,
            },
            messageId: 'preferDestructuring',
            node,
          });
        }
      },
    };
  },
  defaultOptions: [
    {
      allowConsole: false,
      intrinsics: [...INTRINSICS_WITH_STATIC_METHODS],
    },
  ],
  meta: {
    docs: {
      description:
        'Require static methods of intrinsics to be dereferenced before use',
    },
    messages: {
      preferDestructuring:
        'Prefer destructuring static method "{{method}}" from "{{intrinsic}}" instead of direct access',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          allowConsole: {
            default: false,
            description:
              'Whether to allow console.* methods without destructuring',
            type: 'boolean',
          },
          intrinsics: {
            description:
              'List of intrinsic names to check for static method usage',
            items: {
              type: 'string',
            },
            type: 'array',
          },
        },
        type: 'object',
      },
    ],
    type: 'suggestion',
  },
  name: 'require-intrinsic-destructuring',
});
