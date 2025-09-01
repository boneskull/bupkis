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

import { type z } from 'zod/v4';

import type { AsyncAssertions, SyncAssertions } from './impl/index.js';

export type AnyParsedValues = ParsedValues<readonly [any, ...any[]]>;
/**
 * Interface for the base abstract `Assertion` class.
 *
 * This interface defines the contract for assertion instances, including
 * properties for assertion parts, implementation, slots, and methods for
 * parsing and executing assertions both synchronously and asynchronously.
 */
export interface Assertion<
  Impl extends AssertionImpl<Parts>,
  Parts extends AssertionParts,
> {
  /**
   * Execute the assertion implementation synchronously.
   *
   * @param parsedValues Parameters for the assertion implementation
   * @param args Raw parameters passed to `expect()`
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

  readonly id: string;

  /**
   * The implementation function or schema for this assertion.
   */
  readonly impl: Impl;

  /**
   * Parses raw arguments synchronously against this assertion's slots to
   * determine if they match this assertion.
   *
   * @param args Raw arguments provided to `expect()`
   * @returns Result of parsing attempt
   */
  parseValues<Args extends readonly unknown[]>(args: Args): ParsedResult<Parts>;

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

  /**
   * The assertion parts used to create this assertion.
   *
   * Available at runtime for introspection.
   */
  readonly parts: Parts;

  /**
   * The slots derived from assertion parts for validation.
   */
  readonly slots: AssertionSlots<Parts>;

  /**
   * Returns the string representation of this assertion.
   */
  toString(): string;
}

// Union type for implementation function or static schema
export type AssertionImpl<Parts extends AssertionParts> = ThisType<void> &
  (
    | AssertionImplAsyncFn<Parts>
    | AssertionImplFn<Parts>
    | z.ZodType<ParsedSubject<Parts>>
  );

export type AssertionImplAsyncFn<Parts extends AssertionParts> = (
  ...values: ParsedValues<Parts>
) => Promise<boolean | void | z.ZodType<ParsedSubject<Parts>>>;

export type AssertionImplFn<
  Parts extends AssertionParts,
  Return extends boolean | void | z.ZodType<ParsedSubject<Parts>> =
    | boolean
    | void
    | z.ZodType<ParsedSubject<Parts>>,
> = (...values: ParsedValues<Parts>) => Return;

/**
 * Maps an {@link AssertionPart} to a parameter to an {@link AssertionImpl}.
 *
 * This omits {@link Phrase} parts, which are not received by the implementation.
 *
 * @knipignore
 */
export type AssertionImplPart<Part extends AssertionPart> = Part extends
  | readonly [string, ...string[]]
  | string
  ? never
  : Part extends z.ZodPromise
    ? Promise<z.infer<Part>>
    : z.infer<Part>;

/**
 * Maps {@link AssertionParts} to their corresponding {@link AssertionImplPart}.
 *
 * @knipignore
 */
export type AssertionImplParts<Parts extends AssertionParts> =
  Parts extends readonly [
    infer First extends AssertionPart,
    ...infer Rest extends AssertionParts,
  ]
    ? readonly [AssertionImplPart<First>, ...AssertionImplParts<Rest>]
    : readonly [];

export interface AssertionOptions {
  id?: string;
}

/**
 * An item of the first parameter to `createAssertion`, representing the inputs
 * and phrases.
 */
export type AssertionPart = Phrase | z.ZodType;

/**
 * The first parameter to `createAssertion`, representing the inputs and
 * phrases.
 */
export type AssertionParts = readonly AssertionPart[];

/**
 * Maps {@link AssertionParts} to their corresponding {@link AssertionSlots}.
 *
 * Can contain `never` entries and should be filtered with {@link NoNeverTuple}
 * to retain tupleness.
 */
export type AssertionPartsToSlots<Parts extends AssertionParts> =
  Parts extends readonly [
    infer First extends AssertionPart,
    ...infer Rest extends AssertionParts,
  ]
    ? readonly [AssertionSlot<First>, ...AssertionPartsToSlots<Rest>]
    : readonly [];

/**
 * A "slot" is derived from an {@link AssertionPart} and represents one Zod
 * schema which will be validated to determine if the given `Assertion` should
 * be executed for a set of input args.
 *
 * All schemas in {@link AssertionSlots} will be considered for validation to
 * match an `Assertion` to a set of input args.
 */
export type AssertionSlot<Part extends AssertionPart> = Part extends string
  ? PhraseLiteralSlot<Part>
  : Part extends readonly [string, ...string[]]
    ? PhraseLiteralChoiceSlot<Part>
    : Part extends z.ZodType
      ? Part
      : never;

/**
 * The list of "slots" derived from {@link AssertionParts}. Each slot is a Zod
 * schema that will be validated against input args.
 *
 * This is a tuple.
 */
export type AssertionSlots<Parts extends AssertionParts> =
  Parts extends readonly [
    infer First extends AssertionPart,
    ...infer _ extends AssertionParts,
  ]
    ? First extends readonly [string, ...string[]] | string
      ? NoNeverTuple<readonly [z.ZodUnknown, ...AssertionPartsToSlots<Parts>]>
      : NoNeverTuple<AssertionPartsToSlots<Parts>>
    : never;

/**
 * The base structure for parsed assertion results.
 *
 * @knipignore
 */
export interface BaseParsedResult<Parts extends AssertionParts> {
  /**
   * The string representation of the `Assertion` instance that the args were
   * parsed against.
   */
  assertion: string;

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
   * Failure reason if `success` is `false`.
   */
  reason?: string;

  /**
   * Whether the args were successfully parsed against the slots of
   * {@link assertion}.
   */
  success: boolean;
}

export type BuiltinAssertion = (typeof SyncAssertions)[number];

export type BuiltinAsyncAssertion = (typeof AsyncAssertions)[number];

export type HoleyParsedValues<Parts extends AssertionParts> = NoNeverTuple<
  Parts extends readonly [
    infer First extends AssertionPart,
    ...infer Rest extends AssertionParts,
  ]
    ? First extends readonly [string, ...string[]] | string
      ? readonly [
          unknown,
          AssertionImplPart<First>,
          ...AssertionImplParts<Rest>,
        ]
      : readonly [AssertionImplPart<First>, ...AssertionImplParts<Rest>]
    : readonly []
>;

/**
 * Strips `never` from a tuple type, retaining tupleness.
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
 * A result of `Assertion.parseValues()` or `Assertion.parseValuesAsync()`
 */
export type ParsedResult<Parts extends AssertionParts> =
  | ParsedResultFailure
  | ParsedResultSuccess<Parts>;

export interface ParsedResultFailure extends BaseParsedResult<never> {
  exactMatch?: never;
  parsedValues?: never;
  reason: string;
  success: false;
}

/**
 * The result of `Assertion.parseValues()` and `Assertion.parseValuesAsync()`
 * where all paramters have been matched to the slots of {@link assertion}.
 */
export interface ParsedResultSuccess<Parts extends AssertionParts>
  extends BaseParsedResult<Parts> {
  exactMatch: boolean;
  parsedValues: ParsedValues<Parts>;
  reason?: never;
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
 * The type for the head of the {@link ParsedValues} tuple representing the
 * subject of an expectation.
 */
export type ParsedSubject<Parts extends AssertionParts> =
  ParsedValues<Parts> extends readonly [infer Subject, ...any[]]
    ? Subject
    : never;

/**
 * A tuple of parsed input arguments which will be provided to an
 * {@link AssertionImpl assertion implementation}.
 */
export type ParsedValues<Parts extends AssertionParts> =
  HoleyParsedValues<Parts> extends readonly []
    ? never
    : HoleyParsedValues<Parts>;

/**
 * Either type of phrase.
 */
export type Phrase = PhraseLiteral | PhraseLiteralChoice;

/**
 * The type of a single phrase; a literal string. `expect()` will only match
 * this exact phrase in its exact parameter position.
 *
 * Caveat: if the first item in {@link AssertionParts} is a string, the first
 * slot will be reserved for the "subject" and its type will be `unknown`.
 *
 * @remarks
 * It is represented internally as a `ZodLiteral`.
 */
export type PhraseLiteral = string;

/**
 * The type of a phrase that can be a choice of string literals. `expect()` will
 * match _any_ of the provided literals in its exact parameter position.
 *
 * This can be thought of alternatively as a union.
 *
 * @remarks
 * It is represented internally as a `ZodLiteral` with multiple values.
 */
export type PhraseLiteralChoice = readonly [string, ...string[]];

/**
 * The type of a multi-phrase literal slot
 *
 * @privateRemarks
 * I am not sure this is actually necessary, since the values should be
 * derivable from the `values` prop of the `ZodLiteral`.
 */
export type PhraseLiteralChoiceSlot<H extends readonly [string, ...string[]]> =
  z.core.$ZodBranded<z.ZodType, 'string-literal'> & {
    readonly __values: H;
  }; /**
 * The type of a phrase literal slot.
 *
 * @privateRemarks
 * I am not sure this is actually necessary, since the values should be
 * derivable from the `values` prop of the `ZodLiteral`.
 */
export type PhraseLiteralSlot<T extends string> = z.core.$ZodBranded<
  z.ZodLiteral<T>,
  'string-literal'
>;
