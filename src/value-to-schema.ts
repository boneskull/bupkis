import { z } from 'zod/v4';

import {
  isExpectItExecutor,
  isNonNullObject,
  isObject,
  isPromiseLike,
  isString,
  isZodType,
} from './guards.js';
import { RegExpSchema, WrappedPromiseLikeSchema } from './schema.js';

/**
 * Recursively converts an arbitrary value to a Zod v4 schema that would
 * validate values with the same structure.
 *
 * This function analyzes the runtime value and generates a corresponding Zod
 * schema that captures the value's structure and type information. It handles
 * primitives, objects, arrays, functions, and various built-in types, with
 * support for circular reference detection.
 *
 * @example
 *
 * ```typescript
 * // Primitive types
 * valueToSchema('hello'); // z.string()
 * valueToSchema(42); // z.number()
 * valueToSchema(true); // z.boolean()
 *
 * // Objects
 * valueToSchema({ name: 'John', age: 30 });
 * // z.object({ name: z.string(), age: z.number() })
 *
 * // Arrays
 * valueToSchema(['a', 'b', 'c']); // z.array(z.string())
 * valueToSchema([1, 'mixed']); // z.array(z.union([z.number(), z.string()]))
 *
 * // Nested structures
 * valueToSchema({ users: [{ name: 'John' }] });
 * // z.object({ users: z.array(z.object({ name: z.string() })) })
 * ```
 *
 * @param value - The value to convert to a schema
 * @param options - Configuration options for schema generation
 * @param visited - Internal WeakSet for circular reference detection
 * @returns A Zod schema that validates values matching the input's structure.
 *   This value is unfortunately untyped due to the complexity involved. But the
 *   schema works!
 */

export const valueToSchema = (
  value: unknown,
  options: ValueToSchemaOptions = {},
  visited = new WeakSet<object>(),
): z.ZodType<any> => {
  const {
    _currentDepth = 0,
    literalEmptyObjects = false,
    literalPrimitives = false,
    literalRegExp = false,
    literalTuples = false,
    maxDepth = 10,
    noMixedArrays = false,
    strict = false,
  } = options;

  // Prevent infinite recursion
  if (_currentDepth >= maxDepth) {
    return z.unknown();
  }

  // Handle primitives
  if (value === null) {
    return z.null();
  }

  if (value === undefined) {
    return literalPrimitives
      ? z.custom<undefined>((val: unknown) => val === undefined, {
          message: 'Expected undefined',
        })
      : z.undefined();
  }
  if (Number.isNaN(value as number)) {
    return z.nan();
  }
  if (value === Infinity || value === -Infinity) {
    return z.literal(value);
  }

  const valueType = typeof value;

  switch (valueType) {
    case 'bigint':
      return literalPrimitives ? z.literal(value as bigint) : z.bigint();
    case 'boolean':
      return literalPrimitives ? z.literal(value as boolean) : z.boolean();
    case 'function':
      // Check if this is an ExpectItExecutor
      if (isExpectItExecutor(value)) {
        // Only allow nested assertions when strict is false (e.g., "to satisfy" semantics)
        if (strict) {
          throw new TypeError(
            'ExpectItExecutor (expect.it) functions are not allowed in strict mode. ' +
              'Use "to satisfy" assertions for nested expectations.',
          );
        }
        // Return a schema that executes the ExpectItExecutor when validated
        return z.custom<unknown>(
          (subject: unknown) => {
            try {
              value(subject);
              return true;
            } catch {
              return false;
            }
          },
          {
            message: 'Failed expect.it assertion',
          },
        );
      }
      return z.function();
    case 'number':
      return literalPrimitives ? z.literal(value as number) : z.number();
    case 'string':
      return literalPrimitives ? z.literal(value as string) : z.string();
    case 'symbol':
      return z.symbol();
  }

  // Handle objects
  if (typeof value === 'object' && value !== null) {
    // Check for circular references
    if (visited.has(value)) {
      // Return a recursive schema reference or unknown for circular refs
      return z.unknown();
    }

    visited.add(value);

    try {
      // Check for objects with own __proto__ property - these can cause unexpected behavior
      if (Object.hasOwn(value, '__proto__')) {
        throw new TypeError(
          'Objects with an own "__proto__" property are not supported by valueToSchema',
        );
      }

      // Handle built-in object types
      if (value instanceof Date) {
        // Check if it's a valid date
        if (isNaN(value.getTime())) {
          // For invalid dates, use a literal or custom validator
          return z.custom<Date>(
            (val) => val instanceof Date && isNaN(val.getTime()),
            {
              message: 'Expected an invalid Date',
            },
          );
        }
        return z.date();
      }

      if (value instanceof RegExp) {
        if (literalRegExp) {
          return RegExpSchema;
        }
        return z.coerce.string().regex(value);
      }

      if (value instanceof Map) {
        return z.instanceof(Map);
      }

      if (value instanceof Set) {
        return z.instanceof(Set);
      }

      if (value instanceof WeakMap) {
        return z.instanceof(WeakMap);
      }

      if (value instanceof WeakSet) {
        return z.instanceof(WeakSet);
      }

      if (value instanceof Error) {
        return z.instanceof(Error);
      }

      if (isPromiseLike(value)) {
        return WrappedPromiseLikeSchema;
      }

      // Handle arrays
      if (Array.isArray(value)) {
        // For arrays, we need to preserve undefined values while allowing
        // other elements to use the original literalPrimitives setting
        const filteredValue = value; // Always process all elements

        if (filteredValue.length === 0) {
          // For empty arrays, use z.tuple() if literalTuples is enabled
          if (literalTuples) {
            return z.tuple([]);
          }
          return z.array(z.never());
        }

        const elementSchemas = filteredValue.map((item) => {
          // Use literal mode for undefined values to preserve them exactly,
          // but use the original setting for other values
          const itemLiteralPrimitives =
            item === undefined ? true : literalPrimitives;

          return valueToSchema(
            item,
            {
              ...options,
              _currentDepth: _currentDepth + 1,
              literalPrimitives: itemLiteralPrimitives,
            },
            visited,
          );
        });

        // Use z.tuple() if literalTuples is enabled
        if (literalTuples) {
          return z.tuple(elementSchemas as [z.ZodType, ...z.ZodType[]]);
        }

        if (!noMixedArrays) {
          // Helper function to generate structural keys for schemas
          const getSchemaKey = <T extends z.core.SomeType | z.ZodType>(
            zodType: T,
          ): string => {
            const schema = zodType as z.ZodType;
            if (isZodType(schema, 'literal')) {
              return `${schema.constructor.name}:${String(schema.def.values)}`;
            }

            if (isZodType(schema, 'array')) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              const elementKey = getSchemaKey((schema.def as any).element);
              return `ZodArray<${elementKey}>`;
            }

            if (isZodType(schema, 'object')) {
              // For objects, create a key based on the property keys and their types
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              const shape = (schema.def as any).shape as Record<
                string,
                z.ZodType
              >;
              const shapeKeys = Object.keys(shape)
                .sort()
                .map((key) => {
                  const propSchema = shape[key]!;
                  return `${key}:${getSchemaKey(propSchema)}`;
                });
              return `ZodObject<{${shapeKeys.join(',')}}>`;
            }

            if (isZodType(schema, 'union')) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              const optionKeys = ((schema.def as any).options as z.ZodType[])
                .map((option) => getSchemaKey(option))
                .sort();
              return `ZodUnion<[${optionKeys.join(',')}]>`;
            }

            // For other types, use the constructor name
            return schema.constructor.name;
          };

          const seenSchemaKeys = new Set<string>();
          const uniqueSchemas: z.ZodType[] = [];

          for (const schema of elementSchemas) {
            const schemaKey = getSchemaKey(schema);

            if (!seenSchemaKeys.has(schemaKey)) {
              seenSchemaKeys.add(schemaKey);
              uniqueSchemas.push(schema);
            }
          }

          if (uniqueSchemas.length === 1) {
            return z.array(uniqueSchemas[0]!);
          } else {
            return z.array(
              z.union(uniqueSchemas as [z.ZodType, z.ZodType, ...z.ZodType[]]),
            );
          }
        } else {
          // Use the first element's schema for all elements
          return z.array(elementSchemas[0]!);
        }
      }

      // Handle plain objects
      if (isNonNullObject(value)) {
        const schemaShape: Record<string, z.ZodType<any>> = {};
        const undefinedKeys: string[] = [];

        for (const [key, val] of Object.entries(value)) {
          if (isString(key)) {
            // Skip undefined values unless we're in literalPrimitives mode
            // This prevents objects with only undefined values from matching any object
            if (val === undefined && !literalPrimitives) {
              continue;
            }

            if (val === undefined && literalPrimitives) {
              // Track keys that should have undefined values
              undefinedKeys.push(key);
              schemaShape[key] = z.undefined();
            } else {
              schemaShape[key] = valueToSchema(
                val,
                {
                  ...options,
                  _currentDepth: _currentDepth + 1,
                },
                visited,
              );
            }
          }
        }

        // Create the base object schema
        const baseSchema = strict
          ? z.strictObject(schemaShape)
          : z.looseObject(schemaShape);

        // If we have undefined keys in literalPrimitives mode, add validation to ensure they exist
        if (undefinedKeys.length > 0 && literalPrimitives) {
          return baseSchema.superRefine((data, ctx) => {
            if (typeof data !== 'object' || data === null) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Expected an object',
              });
              return;
            }

            const obj = data as Record<string, unknown>;
            for (const key of undefinedKeys) {
              if (!Object.hasOwn(obj, key)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Expected property "${key}" to exist with value undefined`,
                  path: [key],
                });
              }
            }
          });
        }

        // Check if this is an empty object and literalEmptyObjects is enabled
        if (Object.keys(schemaShape).length === 0 && literalEmptyObjects) {
          // Create a schema that only matches empty objects
          return z.custom<Record<string, never>>(
            (val) => isObject(val) && Object.keys(val).length === 0,
            {
              message: 'Expected an empty object with no own properties',
            },
          );
        }

        return baseSchema;
      }

      // Handle other object types (ArrayBuffer, etc.)
      return z.custom<object>(
        (val) => typeof val === 'object' && val !== null,
        { message: 'Expected an object' },
      );
    } finally {
      visited.delete(value);
    }
  }

  // Fallback for unknown types
  return z.unknown();
};

/**
 * Options for {@link valueToSchema}
 */
export interface ValueToSchemaOptions {
  /**
   * Current depth (internal)
   *
   * @internal
   */
  _currentDepth?: number;

  /**
   * If `true`, treat empty objects `{}` as literal empty objects that only
   * match objects with zero own properties
   *
   * @defaultValue false
   */
  literalEmptyObjects?: boolean;

  /**
   * If `true`, use literal schema for primitive values instead of type schema
   *
   * @defaultValue false
   */
  literalPrimitives?: boolean;

  /**
   * If `true`, treat `RegExp` literals as `RegExp` literals; otherwise treat as
   * strings and attempt match
   *
   * @defaultValue false
   */
  literalRegExp?: boolean;

  /**
   * If `true`, treat arrays as tuples wherever possible.
   *
   * Implies `false` for {@link noMixedArrays}.
   *
   * @defaultValue false
   */
  literalTuples?: boolean;

  /**
   * Maximum nesting depth to prevent stack overflow
   *
   * @defaultValue 10
   */
  maxDepth?: number;

  /**
   * Whether to allow mixed types in arrays
   *
   * If {@link literalTuples} is `true`, this option is ignored and treated as
   * `false`.
   *
   * @defaultValue false
   */
  noMixedArrays?: boolean;

  /**
   * If `true`, will disallow unknown properties in parsed objects
   *
   * @defaultValue false
   */
  strict?: boolean;
}

/**
 * Predefined options for {@link valueToSchema} optimized for object satisfaction
 * checks.
 *
 * Uses literal primitives and tuples for exact matching while allowing extra
 * properties.
 */
export const valueToSchemaOptionsForSatisfies = Object.freeze({
  literalEmptyObjects: true,
  literalPrimitives: true,
  literalRegExp: false,
  literalTuples: true,
  strict: false,
} as const) satisfies ValueToSchemaOptions;

/**
 * Predefined options for {@link valueToSchema} optimized for deep equality
 * checks.
 *
 * Uses literal primitives, regexp, and tuples with strict validation for exact
 * matching.
 */
export const valueToSchemaOptionsForDeepEqual = Object.freeze({
  literalEmptyObjects: true,
  literalPrimitives: true,
  literalRegExp: true,
  literalTuples: true,
  strict: true,
} as const) satisfies ValueToSchemaOptions;
