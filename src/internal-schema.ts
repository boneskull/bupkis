/**
 * Internal schemas
 *
 * @internal
 * @packageDocumentation
 */

import { z } from 'zod/v4';

import type { AssertionFailure, AssertionParseRequest } from './types.js';

import { isStandardSchema, isZodType } from './guards.js';

/**
 * Schema for {@link AssertionFailure}.
 *
 * @internal
 */

// Note: We use a loose type here because z.function() has complex
// inference that doesn't exactly match our AssertionFailure interface.
// This schema is only used for validation (safeParse), not for type inference.
const AssertionFailureSchema = z
  .object({
    actual: z
      .unknown()
      .optional()
      .describe('The actual value or description of what actually occurred'),
    diff: z
      .string()
      .optional()
      .describe('Pre-computed diff string that bypasses jest-diff'),
    diffOptions: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Override options for jest-diff'),
    expected: z
      .unknown()
      .optional()
      .describe(
        'The expected value or description of what was expected to occur',
      ),
    formatActual: z
      .function()
      .optional()
      .describe('Custom formatter for actual value in diff output'),
    formatExpected: z
      .function()
      .optional()
      .describe('Custom formatter for expected value in diff output'),
    message: z
      .string()
      .optional()
      .describe('A human-readable message describing the failure'),
  })
  .describe('Potential return type of an assertion implementation function');

/**
 * @internal
 */
const ZodTypeSchema = z
  .custom<z.ZodType>(isZodType, {
    error: 'Must be a Zod schema',
  })
  .describe('A Zod schema within AssertionParts');

/**
 * @internal
 */
const StandardSchemaSchema = z
  .custom(isStandardSchema, {
    error: 'Must be a Standard Schema v1',
  })
  .describe('A Standard Schema v1 within AssertionParts');

/**
 * Schema that accepts either Zod or Standard Schema validators.
 *
 * @internal
 */
const SchemaSchema = z
  .union([ZodTypeSchema, StandardSchemaSchema])
  .describe('A Zod schema or Standard Schema v1');

/** @internal */
const BaseAssertionParseRequestSchema = z.object({
  subject: z.unknown().describe('The subject value to be validated'),
});

/**
 * @internal
 */
const AssertionParseRequestSchema: z.ZodType<AssertionParseRequest> = z.union([
  z.object({
    ...BaseAssertionParseRequestSchema.shape,
    schema: SchemaSchema.describe('The sync schema to validate against'),
  }),
  z.object({
    ...BaseAssertionParseRequestSchema.shape,
    asyncSchema: SchemaSchema.describe('The async schema to validate against'),
  }),
]) as z.ZodType<AssertionParseRequest>;

/**
 * @internal
 */
const PhraseLiteralSchema = z
  .stringFormat('PhraseLiteral', (value) => !value.startsWith('not '), {
    error: 'Phrase literals may not begin with "not "',
  })
  .min(1, { error: 'Phrase literals must be at least 1 character long' })
  .describe('A phrase literal within AssertionParts');

/**
 * @internal
 */
const PhraseLiteralChoiceSchema = z
  .array(PhraseLiteralSchema)
  .min(1, { error: 'Phrase literal choices must have at least one option' })
  .describe(
    'A choice of phrase literals, represented as an array of strings, within AssertionParts',
  );
/**
 * @internal
 */
const AssertionImplSchemaSync = z
  .union([
    SchemaSchema,
    z.function({
      input: z.tuple([z.unknown()], z.unknown()),
      output: z.union([
        z.void(),
        z.boolean(),
        SchemaSchema,
        AssertionFailureSchema,
        AssertionParseRequestSchema,
      ]),
    }),
  ])
  .describe('A synchronous assertion implementation function');

const AssertionImplSchemaAsync = z
  .union([
    SchemaSchema,
    z.function({
      input: z.tuple([z.unknown()], z.unknown()),
      output: z.union([
        z.void(),
        z.boolean(),
        SchemaSchema,
        AssertionFailureSchema,
        AssertionParseRequestSchema,
        z.promise(z.void()),
        z.promise(z.boolean()),
        z.promise(SchemaSchema),
        z.promise(AssertionFailureSchema),
        z.promise(AssertionParseRequestSchema),
      ]),
    }),
  ])
  .describe('An async assertion implementation function');

/**
 * @internal
 */
const AssertionPartsSchema = z
  .array(
    z.union([PhraseLiteralSchema, PhraseLiteralChoiceSchema, SchemaSchema]),
  )
  .min(1, { error: 'At least one part is required for an assertion' })
  .refine(
    (parts) => {
      // Special validation for 'and': it can only appear if followed by a schema
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === 'and') {
          // 'and' must be followed by another part, and that part must be a schema
          const nextPart = parts[i + 1];
          if (
            i === parts.length - 1 ||
            !(isZodType(nextPart) || isStandardSchema(nextPart))
          ) {
            return false;
          }
        }
      }
      return true;
    },
    { error: '"and" can only appear when followed by a schema' },
  )
  .describe('Assertion "parts" which define the input of an assertion');

/**
 * Type guard for a {@link AssertionFailure}.
 *
 * This cannot live in `guards.ts` because it would create a cycle.
 *
 * @function
 * @param value Value to check
 * @returns `true` if value is an AssertionFailure
 * @internal
 */
export const isAssertionFailure = (
  value: unknown,
): value is AssertionFailure => {
  return AssertionFailureSchema.safeParse(value).success;
};

/**
 * @function
 */
export const isAssertionParseRequest = (
  value: unknown,
): value is AssertionParseRequest => {
  return AssertionParseRequestSchema.safeParse(value).success;
};

/**
 * @internal
 */
export const CreateAssertionInputSchema = z
  .tuple([AssertionPartsSchema, AssertionImplSchemaSync])
  .describe('Parameters for createAssertion()');

/**
 * @internal
 */
export const CreateAssertionInputSchemaAsync = z
  .tuple([AssertionPartsSchema, AssertionImplSchemaAsync])
  .describe('Parameters for createAsyncAssertion()');
