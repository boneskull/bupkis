/**
 * Internal schemas
 *
 * @internal
 * @packageDocumentation
 */

import { z } from 'zod/v4';

import type {
  AssertionFailure,
  AssertionMetadata,
  AssertionParseRequest,
} from './types.js';

import { isZodType } from './guards.js';

/**
 * Schema for internal assertion metadata.
 *
 * Used by documentation tooling.
 */

export const AssertionMetadataSchema: z.ZodType<AssertionMetadata> = z
  .looseObject({
    anchor: z.string().describe('Anchor ID for linking to this assertion.'),
    category: z
      .enum([
        'collections',
        'date',
        'equality',
        'error',
        'function',
        'numeric',
        'object',
        'other',
        'primitives',
        'promise',
        'strings',
      ])
      .describe('Category to map to page of logically grouped assertions'),
    redirect: z
      .string()
      .optional()
      .describe(
        'Redirect for assertion to its documentation page, including anchor',
      ),
  })
  .describe(
    'Metadata associated with an assertion, for internal use by documentation tooling.',
  );

/**
 * Schema for {@link AssertionFailure}.
 *
 * @internal
 */

const AssertionFailureSchema: z.ZodType<AssertionFailure> = z
  .object({
    actual: z
      .unknown()
      .optional()
      .describe('The actual value or description of what actually occurred'),
    expected: z
      .unknown()
      .optional()
      .describe(
        'The expected value or description of what was expected to occur',
      ),
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
    schema: ZodTypeSchema.describe('The sync Zod schema to validate against'),
  }),
  z.object({
    ...BaseAssertionParseRequestSchema.shape,
    asyncSchema: ZodTypeSchema.describe(
      'The async Zod schema to validate against',
    ),
  }),
]);

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
    ZodTypeSchema,
    z.function({
      input: z.tuple([z.unknown()], z.unknown()),
      output: z.union([
        z.void(),
        z.boolean(),
        ZodTypeSchema,
        AssertionFailureSchema,
        AssertionParseRequestSchema,
      ]),
    }),
  ])
  .describe('A synchronous assertion implementation function');

const AssertionImplSchemaAsync = z
  .union([
    ZodTypeSchema,
    z.function({
      input: z.tuple([z.unknown()], z.unknown()),
      output: z.union([
        z.void(),
        z.boolean(),
        ZodTypeSchema,
        AssertionFailureSchema,
        AssertionParseRequestSchema,
        z.promise(z.void()),
        z.promise(z.boolean()),
        z.promise(ZodTypeSchema),
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
    z.union([PhraseLiteralSchema, PhraseLiteralChoiceSchema, ZodTypeSchema]),
  )
  .min(1, { error: 'At least one part is required for an assertion' })
  .refine(
    (parts) => {
      // Special validation for 'and': it can only appear if followed by a ZodType
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === 'and') {
          // 'and' must be followed by another part, and that part must be a ZodType
          if (i === parts.length - 1 || !isZodType(parts[i + 1])) {
            return false;
          }
        }
      }
      return true;
    },
    { error: '"and" can only appear when followed by a Zod schema' },
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
  .tuple([
    AssertionPartsSchema,
    AssertionImplSchemaSync,
    z.optional(AssertionMetadataSchema),
  ])
  .describe('Parameters for createAssertion()');

/**
 * @internal
 */
export const CreateAssertionInputSchemaAsync = z
  .tuple([
    AssertionPartsSchema,
    AssertionImplSchemaAsync,
    z.optional(AssertionMetadataSchema),
  ])
  .describe('Parameters for createAsyncAssertion()');

/**
 * @function
 * @param value
 * @returns
 * @knipignore
 */
export const isMetadata = (value: unknown): value is AssertionMetadata =>
  AssertionMetadataSchema.safeParse(value).success;
