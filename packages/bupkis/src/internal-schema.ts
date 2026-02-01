/**
 * Internal schemas
 *
 * @internal
 * @packageDocumentation
 */

import { z } from 'zod';

import type { AssertionFailure, AssertionParseRequest } from './types.js';

import { isPhrase, isStandardSchema, isZodType } from './guards.js';

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
    actual: z.unknown().optional().meta({
      description: 'The actual value or description of what actually occurred',
    }),
    diff: z.string().optional().meta({
      description: 'Pre-computed diff string that bypasses jest-diff',
    }),
    diffOptions: z
      .record(z.string(), z.unknown())
      .optional()
      .meta({ description: 'Override options for jest-diff' }),
    expected: z.unknown().optional().meta({
      description:
        'The expected value or description of what was expected to occur',
    }),
    formatActual: z.function().optional().meta({
      description: 'Custom formatter for actual value in diff output',
    }),
    formatExpected: z.function().optional().meta({
      description: 'Custom formatter for expected value in diff output',
    }),
    message: z
      .string()
      .optional()
      .meta({ description: 'A human-readable message describing the failure' }),
  })
  .meta({
    description:
      'Potential return type of an assertion implementation function',
  });

/**
 * @internal
 */
const ZodTypeSchema = z
  .custom<z.ZodType>(isZodType, {
    error: 'Must be a Zod schema',
  })
  .meta({ description: 'A Zod schema within AssertionParts' });

/**
 * @internal
 */
const StandardSchemaSchema = z
  .custom(isStandardSchema, {
    error: 'Must be a Standard Schema v1',
  })
  .meta({ description: 'A Standard Schema v1 within AssertionParts' });

/**
 * Schema that accepts either Zod or Standard Schema validators.
 *
 * @internal
 */
const SchemaSchema = z
  .union([ZodTypeSchema, StandardSchemaSchema])
  .meta({ description: 'A Zod schema or Standard Schema v1' });

/** @internal */
const BaseAssertionParseRequestSchema = z.object({
  subject: z
    .unknown()
    .meta({ description: 'The subject value to be validated' }),
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
  .meta({ description: 'A phrase literal within AssertionParts' });

/**
 * @internal
 */
const PhraseLiteralChoiceSchema = z
  .array(PhraseLiteralSchema)
  .min(1, { error: 'Phrase literal choices must have at least one option' })
  .meta({
    description:
      'A choice of phrase literals, represented as an array of strings, within AssertionParts',
  });
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
  .meta({ description: 'A synchronous assertion implementation function' });

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
  .meta({ description: 'An async assertion implementation function' });

/**
 * Checks if a value is a schema (Zod or StandardSchema)
 *
 * @function
 * @param value - Value to check
 * @returns True if the value is a schema
 */
const isSchema = (value: unknown): boolean =>
  isZodType(value) || isStandardSchema(value);

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
  .refine(
    (parts) => {
      const first = parts[0];
      // Position 0 must be a schema or phrase
      if (isPhrase(first)) {
        // Shorthand: phrase-first means subject is implicitly z.unknown()
        return true;
      }
      if (isSchema(first)) {
        // Subject-first: position 1 must be a phrase
        const second = parts[1];
        return second !== undefined && isPhrase(second);
      }
      // Position 0 is neither schema nor phrase (shouldn't happen after array validation)
      return false;
    },
    {
      error:
        'Assertions must have a phrase at position 0 (phrase-first shorthand) or position 1 (after subject schema)',
    },
  )
  .meta({
    description: 'Assertion "parts" which define the input of an assertion',
  });

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
 * Type guard for an {@link AssertionParseRequest}.
 *
 * @function
 * @param value Value to check
 * @returns `true` if value is an AssertionParseRequest
 * @internal
 */
export const isAssertionParseRequest = (
  value: unknown,
): value is AssertionParseRequest => {
  return AssertionParseRequestSchema.safeParse(value).success;
};

/**
 * Schema for the input parameters of {@link createAssertion}.
 *
 * @internal
 */
export const CreateAssertionInputSchema = z
  .tuple([AssertionPartsSchema, AssertionImplSchemaSync])
  .meta({ description: 'Parameters for createAssertion()' });

/**
 * Schema for the input parameters of {@link createAsyncAssertion}.
 *
 * @internal
 */
export const CreateAssertionInputSchemaAsync = z
  .tuple([AssertionPartsSchema, AssertionImplSchemaAsync])
  .meta({ description: 'Parameters for createAsyncAssertion()' });
