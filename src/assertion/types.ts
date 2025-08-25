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

import type { Assertions as AsyncAssertions } from './async-implementations.js';
import type { Assertions } from './implementations.js';

import { type NoNeverTuple } from '../expect-types.js';

export type AnyParsedValues = ParsedValues<readonly [any, ...any[]]>;
// Union type for implementation function or static schema
export type AssertionImpl<Parts extends AssertionParts> =
  | AssertionImplAsyncFn<Parts>
  | AssertionImplFn<Parts>
  | z.ZodType<ParsedSubject<Parts>>;

export type AssertionImplAsyncFn<Parts extends AssertionParts> = (
  this: null,
  ...values: ParsedValues<Parts>
) => Promise<boolean | void | z.ZodType<ParsedSubject<Parts>>>;

export type AssertionImplFn<
  Parts extends AssertionParts,
  Return extends boolean | void | z.ZodType<ParsedSubject<Parts>> =
    | boolean
    | void
    | z.ZodType<ParsedSubject<Parts>>,
> = (this: null, ...values: ParsedValues<Parts>) => Return;

/**
 * Maps an {@link AssertionPart} to a parameter to an {@link AssertionImpl}.
 *
 * This omits {@link Phrase} parts, which are not received by the implementation.
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
 */
export type AssertionImplParts<Parts extends AssertionParts> =
  Parts extends readonly [
    infer First extends AssertionPart,
    ...infer Rest extends AssertionParts,
  ]
    ? readonly [AssertionImplPart<First>, ...AssertionImplParts<Rest>]
    : readonly [];

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
    ? PhraseLiteralEnumSlot<Part>
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

export type BuiltinAssertion = (typeof Assertions)[number];

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
export type Phrase = PhraseLiteral | PhraseLiteralEnum;

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
 * It is represented internally as a `ZodEnum<ZodLiteral>`.
 */
export type PhraseLiteralEnum = readonly [string, ...string[]];

// Type-only helper: a branded ZodType that also carries the string tuple type
// via an intersected phantom property for better inference in IncludedSlots
export type PhraseLiteralEnumSlot<H extends readonly [string, ...string[]]> =
  z.core.$ZodBranded<z.ZodType, 'string-literal'> & {
    readonly __values: H;
  };

/**
 * The type of a phrase
 */
export type PhraseLiteralSlot<T extends string> = z.core.$ZodBranded<
  z.ZodLiteral<T>,
  'string-literal'
>;
