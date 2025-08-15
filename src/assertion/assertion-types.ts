/**
 * Core type definitions for the assertion system.
 *
 * This module defines all the fundamental types used throughout the assertion
 * framework, including assertion parts, implementation functions, parsed
 * values, and type inference utilities. These types enable type-safe assertion
 * creation and execution.
 *
 * @packageDocumentation
 */

import { type ArrayValues, type NonEmptyTuple } from 'type-fest';
import { type z } from 'zod/v4';

import type { createAssertion as _createAssertion } from './create.js';
import type { AsyncAssertions, SyncAssertions } from './impl/index.js';

/**
 * Union type representing any assertion, either synchronous or asynchronous.
 *
 * This type combines all possible assertion types into a single union for cases
 * where the synchronous/asynchronous nature is not known at compile time.
 *
 * @see {@link AnyAsyncAssertion} for async-specific assertions
 * @see {@link AnySyncAssertion} for sync-specific assertions
 */
export type AnyAssertion = AnyAsyncAssertion | AnySyncAssertion;

/**
 * Non-empty tuple type containing any assertions.
 *
 * Used to represent collections of assertions where at least one assertion must
 * be present.
 *
 * @see {@link AnyAssertion} for individual assertion types
 */
export type AnyAssertions = NonEmptyTuple<AnyAssertion>;

/**
 * Union type representing any asynchronous assertion.
 *
 * This includes both function-based and schema-based async assertions but
 * excludes synchronous assertions to maintain type safety.
 *
 * @see {@link AssertionFunctionAsync} for function-based async assertions
 * @see {@link AssertionSchemaAsync} for schema-based async assertions
 */
export type AnyAsyncAssertion =
  // | AssertionAsync<any, any, any>
  AssertionFunctionAsync<any, any, any> | AssertionSchemaAsync<any, any, any>;

/**
 * Non-empty tuple type containing any asynchronous assertions.
 *
 * Used to represent collections of async assertions where at least one
 * assertion must be present.
 *
 * @see {@link AnyAsyncAssertion} for individual async assertion types
 */
export type AnyAsyncAssertions = NonEmptyTuple<AnyAsyncAssertion>;

/**
 * Union type representing any synchronous assertion.
 *
 * This includes both function-based and schema-based sync assertions but
 * excludes asynchronous assertions to maintain type safety.
 *
 * @see {@link AssertionFunctionSync} for function-based sync assertions
 * @see {@link AssertionSchemaSync} for schema-based sync assertions
 */
export type AnySyncAssertion =
  | AssertionFunctionSync<any, any, any>
  | AssertionSchemaSync<any, any, any>;
// | AssertionSync<any, any, any>;

/**
 * Non-empty tuple type containing any synchronous assertions.
 *
 * Used to represent collections of sync assertions where at least one assertion
 * must be present.
 *
 * @see {@link AnySyncAssertion} for individual sync assertion types
 */
export type AnySyncAssertions = NonEmptyTuple<AnySyncAssertion>;

/**
 * Interface for the base abstract `Assertion` class.
 *
 * This interface defines the contract for assertion instances, including
 * properties for assertion parts, implementation, slots, and methods for
 * parsing and executing assertions both synchronously and asynchronously.
 */
export interface Assertion<
  Parts extends AssertionParts,
  Impl extends AssertionImpl<Parts>,
  Slots extends AssertionSlots<Parts>,
> {
  readonly id: string;

  /**
   * The implementation function or schema for this assertion.
   */
  readonly impl: Impl;

  /**
   * The assertion parts used to create this assertion.
   *
   * Available at runtime for introspection.
   */
  readonly parts: Parts;

  /**
   * The slots derived from assertion parts for validation.
   */
  readonly slots: Slots;

  /**
   * Returns the string representation of this assertion.
   */
  toString(): string;
}

export interface AssertionAsync<
  Parts extends AssertionParts = AssertionParts,
  Impl extends AssertionImplAsync<Parts> = AssertionImplAsync<Parts>,
  Slots extends AssertionSlots<Parts> = AssertionSlots<Parts>,
> extends Assertion<Parts, Impl, Slots> {
  /**
   * Execute the assertion implementation asynchronously.
   *
   * @param parsedValues Parameters for the assertion implementation
   * @param args Raw parameters passed to `expectAsync()`
   * @param stackStartFn Function to use as stack start for error reporting
   * @param parseResult Optional parse result containing cached validation data
   */
  executeAsync(
    parsedValues: ParsedValues<Parts>,
    args: unknown[],
    stackStartFn: (...args: any[]) => any,
    parseResult?: ParsedResult<Parts>,
  ): Promise<void>;

  /**
   * Parses raw arguments asynchronously against this assertion's slots to
   * determine if they match this assertion.
   *
   * @param args Raw arguments provided to `expectAsync()`
   * @returns Result of parsing attempt
   */
  parseValuesAsync<Args extends readonly unknown[]>(
    args: Args,
  ): Promise<ParsedResult<Parts>>;
}

export interface AssertionFailure {
  /**
   * The actual value or condition that was encountered
   */
  actual?: unknown;
  /**
   * The expected value or condition that was not met
   */
  expected?: unknown;
  /**
   * A human-readable message describing the failure
   */
  message?: string | undefined;
}

/**
 * An async assertion with a function implementation.
 */
export interface AssertionFunctionAsync<
  Parts extends AssertionParts,
  Impl extends AssertionImplFnAsync<Parts>,
  Slots extends AssertionSlots<Parts>,
> extends AssertionAsync<Parts, Impl, Slots> {
  impl: Impl;
}

/**
 * A synchronous assertion with a function implementation.
 */
export interface AssertionFunctionSync<
  Parts extends AssertionParts,
  Impl extends AssertionImplFnSync<Parts>,
  Slots extends AssertionSlots<Parts>,
> extends AssertionSync<Parts, Impl, Slots> {
  impl: Impl;
}

/**
 * Any type of assertion implementation.
 */
export type AssertionImpl<Parts extends AssertionParts> =
  | AssertionImplAsync<Parts>
  | AssertionImplSync<Parts>;

/**
 * Union type representing any async assertion implementation.
 *
 * This encompasses both function-based and schema-based implementations for
 * asynchronous assertions, providing a type-safe way to handle async assertion
 * logic.
 *
 * @typeParam Parts - The assertion parts defining the structure
 * @see {@link AssertionImplFnAsync} for function-based async implementations
 * @see {@link AssertionImplSchemaAsync} for schema-based async implementations
 */
export type AssertionImplAsync<Parts extends AssertionParts> =
  | AssertionImplFnAsync<Parts>
  | AssertionImplSchemaAsync<Parts>;

/**
 * The implementation of an assertion as an async function.
 *
 * An asynchronous implementation function that validates assertion arguments
 * and returns a Promise resolving to validation results. The function receives
 * parsed values from the assertion parts and can return various types
 * indicating validation success or failure.
 *
 * @typeParam Parts - The assertion parts defining the structure
 * @param values - The parsed values corresponding to assertion parts
 * @returns Promise resolving to boolean indicating pass/fail, void for success,
 *   ZodType for dynamic validation, or AssertionFailure object for detailed
 *   error information
 * @see {@link AssertionImplFnSync} for sync function implementations
 * @see {@link ParsedValues} for the input parameter structure
 */
export type AssertionImplFnAsync<Parts extends AssertionParts> = (
  ...values: ParsedValues<Parts>
) => Promise<
  AssertionFailure | boolean | void | z.ZodType<ParsedSubject<Parts>>
>;

/**
 * The implementation of an assertion as a sync function.
 *
 * A synchronous implementation function that validates assertion arguments and
 * returns validation results. The function receives parsed values from the
 * assertion parts and can return various types indicating validation success or
 * failure.
 *
 * @typeParam Parts - The assertion parts defining the structure
 * @param values - The parsed values corresponding to assertion parts
 * @returns Boolean indicating pass/fail, void for success, ZodType for dynamic
 *   validation, or AssertionFailure object for detailed error information
 * @see {@link AssertionImplFnAsync} for async function implementations
 * @see {@link ParsedValues} for the input parameter structure
 */
export type AssertionImplFnSync<Parts extends AssertionParts> = (
  ...values: ParsedValues<Parts>
) => AssertionFailure | boolean | void | z.ZodType<ParsedSubject<Parts>>;

/**
 * Maps an {@link AssertionPart} to a parameter to an {@link AssertionImpl}.
 *
 * This omits {@link Phrase} parts, which are not received by the implementation.
 *
 * @knipignore
 */
export type AssertionImplPart<Part extends AssertionPart> = Part extends
  | PhraseLiteral
  | PhraseLiteralChoice
  ? never
  : Part extends z.ZodPromise
    ? Promise<z.infer<Part>>
    : z.infer<Part>;

/**
 * Maps {@link AssertionParts} to their corresponding {@link AssertionImplPart}.
 *
 * @knipignore
 */
export type AssertionImplParts<Parts extends readonly AssertionPart[]> =
  Parts extends readonly [
    infer First extends AssertionPart,
    ...infer Rest extends readonly AssertionPart[],
  ]
    ? readonly [AssertionImplPart<First>, ...AssertionImplParts<Rest>]
    : readonly [];

/**
 * A Zod schema implementation created with createAsync() - potentially
 * asynchronous
 */
/**
 * Type for an async assertion implementation using a Zod schema.
 *
 * This represents a branded Zod schema that validates the assertion subject
 * asynchronously. The schema must match the parsed subject type derived from
 * the assertion parts and is branded with 'async-schema' for compile-time type
 * safety.
 *
 * @typeParam Parts - The assertion parts tuple defining the assertion structure
 * @see {@link AssertionImplSchemaSync} for synchronous schema implementations
 * @see {@link AssertionImplFnAsync} for function-based async implementations
 * @see {@link ParsedSubject} for subject type derivation
 */
export type AssertionImplSchemaAsync<Parts extends AssertionParts> =
  z.core.$ZodBranded<z.ZodType<ParsedSubject<Parts>>, 'async-schema'>;

/**
 * Type for a synchronous assertion implementation using a Zod schema.
 *
 * This represents a branded Zod schema that validates the assertion subject
 * synchronously. The schema must match the parsed subject type derived from the
 * assertion parts and is branded with 'sync-schema' for compile-time type
 * safety.
 *
 * @typeParam Parts - The assertion parts tuple defining the assertion structure
 * @see {@link AssertionImplSchemaAsync} for asynchronous schema implementations
 * @see {@link AssertionImplFnSync} for function-based sync implementations
 * @see {@link ParsedSubject} for subject type derivation
 */
export type AssertionImplSchemaSync<Parts extends AssertionParts> =
  z.core.$ZodBranded<z.ZodType<ParsedSubject<Parts>>, 'sync-schema'>;

/**
 * Union type for all synchronous assertion implementations.
 *
 * This represents either a function-based or schema-based implementation for
 * synchronous assertions. Function implementations provide custom validation
 * logic, while schema implementations use Zod schemas for validation.
 *
 * @typeParam Parts - The assertion parts tuple defining the assertion structure
 * @see {@link AssertionImplFnSync} for function-based implementations
 * @see {@link AssertionImplSchemaSync} for schema-based implementations
 * @see {@link AssertionImplAsync} for async implementation unions
 */
/**
 * Union type for all synchronous assertion implementations.
 *
 * This represents either a function-based or schema-based implementation for
 * synchronous assertions. Function implementations provide custom validation
 * logic, while schema implementations use Zod schemas for validation.
 *
 * @typeParam Parts - The assertion parts tuple defining the assertion structure
 * @see {@link AssertionImplFnSync} for function-based implementations
 * @see {@link AssertionImplSchemaSync} for schema-based implementations
 * @see {@link AssertionImplAsync} for async implementation unions
 */
export type AssertionImplSync<Parts extends AssertionParts> =
  | AssertionImplFnSync<Parts>
  | AssertionImplSchemaSync<Parts>;

/**
 * Union type representing the fundamental building blocks of an assertion.
 *
 * An assertion part can be either a phrase (string literal or choice of
 * literals) that describes the natural language portion of the assertion, or a
 * Zod schema that defines validation constraints for assertion arguments.
 *
 * @example
 *
 * ```ts
 * // String literal phrase
 * type Part1 = 'to be a string';
 *
 * // String literal choice
 * type Part2 = ['to be', 'to equal'];
 *
 * // Zod schema for validation
 * type Part3 = z.ZodString;
 * ```
 *
 * @see {@link Phrase} for phrase-based parts
 * @see {@link AssertionParts} for complete assertion structure
 * @see {@link AssertionSlot} for compiled slot representation
 */
export type AssertionPart = Phrase | z.ZodType;

/**
 * Non-empty tuple type representing the complete structure of an assertion.
 *
 * This defines the signature of an assertion by combining phrases (natural
 * language) and Zod schemas (validation constraints). The tuple must contain at
 * least one element and typically starts with a subject schema followed by
 * phrase literals and additional parameter schemas.
 *
 * @example
 *
 * ```ts
 * // Basic assertion: expect(value, 'to be a string')
 * type SimpleAssertion = ['to be a string'];
 *
 * // Parameterized assertion: expect(value, 'to be greater than', 5)
 * type ParametricAssertion = [z.number(), 'to be greater than', z.number()];
 *
 * // Choice-based assertion: expect(value, ['to be', 'to equal'], expected)
 * type ChoiceAssertion = [z.any(), ['to be', 'to equal'], z.any()];
 * ```
 *
 * @typeParam Parts - Extends the base AssertionPart array with tuple
 *   constraints
 * @see {@link AssertionPart} for individual part types
 * @see {@link AssertionSlots} for compiled slot representation
 * @see {@link _createAssertion} for assertion creation from parts
 */
export type AssertionParts = NonEmptyTuple<AssertionPart>;

/**
 * Type-level mapping from assertion parts to their corresponding validation
 * slots.
 *
 * This recursive type processes each assertion part and converts it to a slot
 * that can be used for runtime validation. Phrase literals become branded
 * string schemas, while Zod types are preserved as-is. The resulting tuple may
 * contain `never` entries for invalid parts that should be filtered out.
 *
 * @example
 *
 * ```ts
 * // Input parts
 * type Parts = ['to be a string', z.number()];
 *
 * // Resulting slots (simplified)
 * type Slots = [PhraseLiteralSlot<'to be a string'>, z.ZodNumber];
 * ```
 *
 * @typeParam Parts - The readonly array of assertion parts to process
 * @see {@link AssertionSlot} for individual slot type mapping
 * @see {@link AssertionSlots} for filtered and properly typed slot tuples
 * @see {@link NoNeverTuple} for filtering never entries
 */
export type AssertionPartsToSlots<Parts extends readonly AssertionPart[]> =
  Parts extends readonly [
    infer First extends AssertionPart,
    ...infer Rest extends readonly AssertionPart[],
  ]
    ? readonly [AssertionSlot<First>, ...AssertionPartsToSlots<Rest>]
    : readonly [];

export interface AssertionSchemaAsync<
  Parts extends AssertionParts,
  Impl extends AssertionImplSchemaAsync<Parts>,
  Slots extends AssertionSlots<Parts>,
> extends AssertionAsync<Parts, Impl, Slots> {
  impl: Impl;
}

export interface AssertionSchemaSync<
  Parts extends AssertionParts,
  Impl extends AssertionImplSchemaSync<Parts>,
  Slots extends AssertionSlots<Parts>,
> extends AssertionSync<Parts, Impl, Slots> {
  impl: Impl;
}

/**
 * Type-level mapping that converts an assertion part to its corresponding
 * validation slot.
 *
 * This maps each type of assertion part to a specific Zod schema that can be
 * used for runtime validation:
 *
 * - String literals become branded phrase literal slots
 * - String literal choices become branded phrase choice slots
 * - Zod types are preserved as-is
 * - Invalid parts become `never`
 *
 * @example
 *
 * ```ts
 * // String literal -> branded slot
 * type Slot1 = AssertionSlot<'to be a string'>; // PhraseLiteralSlot<'to be a string'>
 *
 * // Choice -> branded choice slot
 * type Slot2 = AssertionSlot<['to be', 'to equal']>; // PhraseLiteralChoiceSlot<['to be', 'to equal']>
 *
 * // Zod type -> preserved
 * type Slot3 = AssertionSlot<z.ZodString>; // z.ZodString
 * ```
 *
 * @typeParam Part - The assertion part to convert to a slot
 * @see {@link PhraseLiteralSlot} for string literal slots
 * @see {@link PhraseLiteralChoiceSlot} for choice-based slots
 * @see {@link AssertionSlots} for complete slot tuples
 */
export type AssertionSlot<Part extends AssertionPart> = Part extends string
  ? PhraseLiteralSlot<Part>
  : Part extends readonly [string, ...string[]]
    ? PhraseLiteralChoiceSlot<Part>
    : Part extends z.ZodType
      ? Part
      : never;

/**
 * Tuple type representing all validation slots derived from assertion parts.
 *
 * This type processes assertion parts to create a tuple of Zod schemas that can
 * be used for runtime argument validation. If the first part is a phrase, a
 * subject slot (`z.ZodUnknown`) is automatically prepended to accept the
 * assertion subject.
 *
 * The resulting tuple:
 *
 * 1. Has `never` entries filtered out to maintain proper tuple structure
 * 2. May include an implicit subject slot for phrase-first assertions
 * 3. Contains branded slots for phrase literals to enable phrase matching
 *
 * @example
 *
 * ```ts
 * // Phrase-first assertion gets subject slot
 * type Slots1 = AssertionSlots<['to be a string']>;
 * // Result: [z.ZodUnknown, PhraseLiteralSlot<'to be a string'>]
 *
 * // Schema-first assertion preserves structure
 * type Slots2 = AssertionSlots<[z.string(), 'to match', z.regexp()]>;
 * // Result: [z.ZodString, PhraseLiteralSlot<'to match'>, z.ZodRegExp]
 * ```
 *
 * @typeParam Parts - The assertion parts to convert to slots
 * @see {@link AssertionSlot} for individual slot mapping
 * @see {@link AssertionPartsToSlots} for the underlying mapping logic
 * @see {@link NoNeverTuple} for never filtering
 */
export type AssertionSlots<Parts extends AssertionParts = AssertionParts> =
  Parts extends readonly [
    infer First extends AssertionPart,
    ...infer _ extends AssertionParts,
  ]
    ? First extends PhraseLiteral | PhraseLiteralChoice
      ? NoNeverTuple<readonly [z.ZodUnknown, ...AssertionPartsToSlots<Parts>]>
      : NoNeverTuple<AssertionPartsToSlots<Parts>>
    : never;

export interface AssertionSync<
  Parts extends AssertionParts = AssertionParts,
  Impl extends AssertionImplSync<Parts> = AssertionImplSync<Parts>,
  Slots extends AssertionSlots<Parts> = AssertionSlots<Parts>,
> extends Assertion<Parts, Impl, Slots> {
  /**
   * Execute the assertion implementation synchronously.
   *
   * @param parsedValues Parameters for the assertion implementation
   * @param args Raw parameters passed to `expectSync()`
   * @param stackStartFn Function to use as stack start for error reporting
   * @param parseResult Optional parse result containing cached validation data
   */
  execute(
    parsedValues: ParsedValues<Parts>,
    args: unknown[],
    stackStartFn: (...args: any[]) => any,
    parseResult?: ParsedResult<Parts>,
  ): void;

  /**
   * Parses raw arguments synchronously against this assertion's slots to
   * determine if they match this assertion.
   *
   * @param args Raw arguments provided to `expectSync()`
   * @returns Result of parsing attempt
   */
  parseValues<Args extends readonly unknown[]>(args: Args): ParsedResult<Parts>;
}

/**
 * The base structure for parsed assertion results.
 *
 * @knipignore
 */
export interface BaseParsedResult<Parts extends AssertionParts> {
  /**
   * If success is `true`, then this will be `true` if all args matched the
   * slots _and_ none of those args infer as `unknown` or `any`.
   */
  exactMatch?: boolean;

  /**
   * Present only if `success` is `true`. The parsed values mapped to the slots
   * of {@link assertion}.
   */
  parsedValues?: ParsedValues<Parts>;

  /**
   * Whether the args were successfully parsed against the slots of
   * {@link assertion}.
   */
  success: boolean;
}

/**
 * Type for extracting individual builtin async assertion types.
 *
 * This type extracts the element types from the builtin async assertions array,
 * providing a union of all available async assertion types in the framework.
 *
 * @see {@link BuiltinAsyncAssertions} for the full array type
 * @see {@link AsyncAssertions} for the actual assertion implementations
 */
export type BuiltinAsyncAssertion = ArrayValues<BuiltinAsyncAssertions>;

/**
 * Type representing the collection of all builtin async assertions.
 *
 * This type represents the compile-time type of the `AsyncAssertions` constant,
 * providing type information for all async assertion implementations included
 * in the framework by default.
 *
 * @see {@link AsyncAssertions} for the actual assertion implementations
 * @see {@link BuiltinAsyncAssertion} for individual assertion types
 */
export type BuiltinAsyncAssertions = typeof AsyncAssertions;

/**
 * Type for extracting individual builtin sync assertion types.
 *
 * This type extracts the element types from the builtin sync assertions array,
 * providing a union of all available synchronous assertion types in the
 * framework.
 *
 * @see {@link BuiltinSyncAssertions} for the full array type
 * @see {@link SyncAssertions} for the actual assertion implementations
 */
export type BuiltinSyncAssertion = ArrayValues<BuiltinSyncAssertions>;

/**
 * Type representing the collection of all builtin sync assertions.
 *
 * This type represents the compile-time type of the `SyncAssertions` constant,
 * providing type information for all synchronous assertion implementations
 * included in the framework by default.
 *
 * @see {@link SyncAssertions} for the actual assertion implementations
 * @see {@link BuiltinSyncAssertion} for individual assertion types
 */
export type BuiltinSyncAssertions = typeof SyncAssertions;

/**
 * Utility type for parsed values that may be empty.
 *
 * This type processes assertion parts recursively to produce parsed values,
 * handling the case where no assertion parts are present (resulting in an empty
 * tuple). It uses `NoNeverTuple` to filter out `never` types that may arise
 * during the recursive processing.
 *
 * @typeParam Parts - The assertion parts to process
 * @see {@link ParsedValues} for the standard parsed values type
 * @see {@link NoNeverTuple} for never-type filtering
 */
export type MaybeEmptyParsedValues<Parts extends readonly AssertionPart[]> =
  NoNeverTuple<
    Parts extends readonly [
      infer First extends AssertionPart,
      ...infer Rest extends readonly AssertionPart[],
    ]
      ? First extends PhraseLiteral | PhraseLiteralChoice
        ? readonly [
            unknown,
            AssertionImplPart<First>,
            ...AssertionImplParts<Rest>,
          ]
        : readonly [AssertionImplPart<First>, ...AssertionImplParts<Rest>]
      : readonly []
  >;

/**
 * Utility type that removes `never` entries from a tuple while preserving tuple
 * structure.
 *
 * This recursive type filters out `never` types from tuple types, which can
 * occur during type-level transformations. It maintains the readonly tuple
 * structure while removing invalid entries.
 *
 * @example
 *
 * ```ts
 * type WithNever = readonly [string, never, number, never];
 * type Filtered = NoNeverTuple<WithNever>; // readonly [string, number]
 *
 * type Empty = NoNeverTuple<readonly [never, never]>; // readonly []
 * type Mixed = NoNeverTuple<readonly [boolean, never, string]>; // readonly [boolean, string]
 * ```
 *
 * @typeParam T - The readonly tuple type to filter
 * @see {@link AssertionPartsToSlots} for usage in slot processing
 * @see {@link AssertionSlots} for filtered slot tuples
 */
export type NoNeverTuple<T extends readonly unknown[]> = T extends readonly [
  infer First,
  ...infer Rest,
]
  ? [First] extends [never]
    ? readonly [...NoNeverTuple<Rest>]
    : readonly [First, ...NoNeverTuple<Rest>]
  : readonly [];
/**
 * Union type representing the result of parsing assertion arguments.
 *
 * This represents either a successful parse (containing validated arguments) or
 * a parse failure (indicating arguments don't match the assertion). Used by
 * `parseValues()` and `parseValuesAsync()` methods to communicate whether the
 * assertion can be executed with the given arguments.
 *
 * @example
 *
 * ```ts
 * // Successful parse
 * const success: ParsedResult<Parts> = {
 *   success: true,
 *   exactMatch: true,
 *   parsedValues: [subject, ...params],
 * };
 *
 * // Parse failure
 * const failure: ParsedResult<Parts> = {
 *   success: false,
 * };
 * ```
 *
 * @typeParam Parts - The assertion parts tuple defining expected structure
 * @see {@link ParsedResultSuccess} for successful parse results
 * @see {@link ParsedResultFailure} for failed parse results
 * @see {@link AssertionSync.parseValues} and {@link AssertionAsync.parseValuesAsync} for usage context
 */
export type ParsedResult<Parts extends AssertionParts = AssertionParts> =
  | ParsedResultFailure
  | ParsedResultSuccess<Parts>;

/**
 * Interface representing a failed argument parsing attempt.
 *
 * When assertion arguments don't match the expected slots (wrong number of
 * arguments, type mismatches, phrase literal mismatches), parsing fails and
 * returns this interface. The assertion cannot be executed with the provided
 * arguments.
 *
 * @see {@link ParsedResultSuccess} for successful parsing results
 * @see {@link BaseParsedResult} for shared result properties
 */
export interface ParsedResultFailure extends BaseParsedResult<never> {
  exactMatch?: never;
  parsedValues?: never;
  success: false;
}

/**
 * Interface representing a successful argument parsing attempt.
 *
 * When assertion arguments successfully match the expected slots, this
 * interface contains the validated arguments and metadata about the match
 * quality. The assertion can be executed using the `parsedValues`.
 *
 * @typeParam Parts - The assertion parts tuple defining the expected structure
 * @see {@link ParsedResultFailure} for failed parsing results
 * @see {@link BaseParsedResult} for shared result properties
 */
export interface ParsedResultSuccess<Parts extends AssertionParts>
  extends BaseParsedResult<Parts> {
  exactMatch: boolean;
  parsedValues: ParsedValues<Parts>;
  /**
   * Optional cached subject validation result for optimized schema assertions.
   * When present, indicates that subject validation was already performed
   * during parseValues() and doesn't need to be repeated in execute().
   */
  subjectValidationResult?:
    | {
        data: any;
        success: true;
      }
    | {
        error: z.ZodError;
        success: false;
      };
  success: true;
}

/**
 * Type extracting the subject (first argument) from parsed assertion values.
 *
 * This utility type extracts the subject of an assertion from the parsed values
 * tuple. The subject is always the first element and represents the value being
 * tested by the assertion.
 *
 * @example
 *
 * ```ts
 * // For assertion: expect(value, 'to be a string')
 * type Subject = ParsedSubject<Parts>; // typeof value
 *
 * // For assertion: expect(42, 'to be greater than', 10)
 * type NumericSubject = ParsedSubject<NumericParts>; // number
 * ```
 *
 * @typeParam Parts - The assertion parts tuple defining the assertion structure
 * @see {@link ParsedValues} for the complete parsed values tuple
 * @see {@link AssertionImpl} for how subjects are used in implementations
 */
export type ParsedSubject<Parts extends AssertionParts> =
  ParsedValues<Parts> extends readonly [infer Subject, ...any[]]
    ? Subject
    : never;

/**
 * Tuple type containing validated arguments for assertion execution.
 *
 * This represents the final processed arguments that will be passed to an
 * assertion implementation function. The tuple contains the subject (first)
 * followed by any additional parameters, with phrase literals filtered out
 * since they're not passed to implementations.
 *
 * @example
 *
 * ```ts
 * // For assertion: expect(value, 'to be greater than', 10)
 * // ParsedValues = [typeof value, 10] (phrase literal removed)
 *
 * // For assertion: expect(obj, 'to satisfy', shape)
 * // ParsedValues = [typeof obj, typeof shape]
 * ```
 *
 * @typeParam Parts - The assertion parts tuple defining the expected structure
 * @see {@link ParsedSubject} for extracting just the subject
 * @see {@link MaybeEmptyParsedValues} for the underlying value processing
 * @see {@link AssertionImpl} for how these values are consumed
 */
export type ParsedValues<Parts extends AssertionParts = AssertionParts> =
  MaybeEmptyParsedValues<Parts> extends readonly []
    ? never
    : MaybeEmptyParsedValues<Parts>;

/**
 * Union type combining both phrase literal types.
 *
 * A phrase represents the natural language portion of an assertion that
 * describes the expected behavior. It can be either a single string literal or
 * a choice between multiple string literals.
 *
 * @example
 *
 * ```ts
 * // Single phrase literal
 * type Phrase1 = PhraseLiteral; // "to be a string"
 *
 * // Choice phrase literal
 * type Phrase2 = PhraseLiteralChoice; // ["to be", "to equal"]
 * ```
 *
 * @see {@link PhraseLiteral} for single string phrases
 * @see {@link PhraseLiteralChoice} for choice-based phrases
 * @see {@link AssertionPart} for how phrases fit into assertion structure
 */
export type Phrase = PhraseLiteral | PhraseLiteralChoice;

/**
 * Type representing a single phrase literal string.
 *
 * This is a string literal that `expect()` will match exactly in its parameter
 * position. The phrase describes the natural language expectation for the
 * assertion. If the first item in assertion parts is a phrase literal, a
 * subject slot (`unknown`) is automatically added.
 *
 * Phrases cannot start with "not " as this would conflict with negation logic.
 *
 * @example
 *
 * ```ts
 * // Valid phrase literals
 * type Phrase1 = 'to be a string';
 * type Phrase2 = 'to have length';
 * type Phrase3 = 'to contain';
 *
 * // Usage in assertion
 * createAssertion(['to be a string'], z.string());
 * // expect(value, 'to be a string') ✓
 * ```
 *
 * @see {@link PhraseLiteralChoice} for multi-option phrases
 * @see {@link PhraseLiteralSlot} for compiled slot representation
 * @see {@link AssertionPart} for how phrases fit into assertion structure
 */
export type PhraseLiteral = string;

/**
 * Type representing a choice between multiple phrase literals.
 *
 * This allows an assertion to accept any of several equivalent phrase options,
 * providing flexibility in natural language expression. The type is a non-empty
 * readonly tuple of strings.
 *
 * @example
 *
 * ```ts
 * // Choice phrase literal
 * type Choice = ['to be', 'to equal'];
 *
 * // Usage in assertion
 * createAssertion(
 *   [z.any(), ['to be', 'to equal'], z.any()],
 *   (subject, expected) => subject === expected,
 * );
 *
 * // Both work:
 * // expect(value, 'to be', expected) ✓
 * // expect(value, 'to equal', expected) ✓
 * ```
 *
 * @see {@link PhraseLiteral} for single phrase options
 * @see {@link PhraseLiteralChoiceSlot} for compiled slot representation
 * @see {@link AssertionPart} for how phrases fit into assertion structure
 */
export type PhraseLiteralChoice = NonEmptyTuple<string>;

/**
 * Branded Zod type representing a compiled choice phrase slot.
 *
 * This is the runtime representation of a {@link PhraseLiteralChoice} that has
 * been processed into a validation slot. It includes metadata about the
 * available choice values for runtime phrase matching.
 *
 * @privateRemarks
 * The `__values` property might be redundant since values should be derivable
 * from the ZodLiteral metadata, but it provides type-level access to the
 * choices.
 * @typeParam H - The readonly tuple of string choices
 * @see {@link PhraseLiteralChoice} for the source type
 * @see {@link PhraseLiteralSlot} for single phrase slots
 * @see {@link AssertionSlot} for slot type mapping
 */
export type PhraseLiteralChoiceSlot<H extends readonly [string, ...string[]]> =
  z.core.$ZodBranded<z.ZodType, 'string-literal'> & {
    readonly __values: H;
  };
/**
 * Branded Zod type representing a compiled phrase literal slot.
 *
 * This is the runtime representation of a {@link PhraseLiteral} that has been
 * processed into a validation slot. The slot is branded with 'string-literal'
 * to distinguish it from regular string validation during assertion matching.
 *
 * @privateRemarks
 * This type might be redundant since the value should be derivable from the
 * ZodLiteral's value property, but it provides type-level access to the
 * literal.
 * @typeParam T - The string literal type
 * @see {@link PhraseLiteral} for the source type
 * @see {@link PhraseLiteralChoiceSlot} for choice phrase slots
 * @see {@link AssertionSlot} for slot type mapping
 */
export type PhraseLiteralSlot<T extends string> = z.core.$ZodBranded<
  z.ZodLiteral<T>,
  'string-literal'
>; /**
 * Object which can returned by assertion implementation functions to provide
 * contextual information to an `AssertionError`
 */

/**
 * Type for a raw (unbranded) synchronous schema assertion implementation.
 *
 * This represents a standard Zod schema without branding that validates the
 * assertion subject synchronously. Unlike {@link AssertionImplSchemaSync}, this
 * type is not branded and represents the underlying schema before it is
 * processed by the assertion creation system.
 *
 * @typeParam Parts - The assertion parts tuple defining the assertion structure
 * @see {@link AssertionImplSchemaSync} for the branded version
 * @see {@link ParsedSubject} for subject type derivation
 */
export type RawAssertionImplSchemaSync<Parts extends AssertionParts> =
  z.ZodType<ParsedSubject<Parts>>;
