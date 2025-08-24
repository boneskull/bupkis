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

export type AssertionPart = readonly [string, ...string[]] | string | z.ZodType;

export type AssertionParts = readonly AssertionPart[];

export type AssertionSlot<Part extends AssertionPart> = Part extends string
  ? BupkisStringLiteral<Part>
  : Part extends readonly [string, ...string[]]
    ? BupkisStringLiterals<Part>
    : Part extends z.ZodType
      ? Part
      : never;

export type AssertionSlots<Parts extends AssertionParts> =
  Parts extends readonly [
    infer First extends AssertionPart,
    ...infer _ extends AssertionParts,
  ]
    ? First extends readonly [string, ...string[]] | string
      ? NoNeverTuple<readonly [z.ZodUnknown, ...MapAssertionParts<Parts>]>
      : NoNeverTuple<MapAssertionParts<Parts>>
    : never;

export type BuiltinAssertion = (typeof Assertions)[number];

export type BuiltinAsyncAssertion = (typeof AsyncAssertions)[number];

export type BupkisStringLiteral<T extends string> = z.core.$ZodBranded<
  z.ZodLiteral<T>,
  'string-literal'
>;
// If first part is a string, prepend subject slot z.unknown()

// Type-only helper: a branded ZodType that also carries the string tuple type
// via an intersected phantom property for better inference in IncludedSlots
export type BupkisStringLiterals<H extends readonly [string, ...string[]]> =
  z.core.$ZodBranded<z.ZodType, 'string-literal'> & {
    readonly __values: H;
  };

export type NoNeverTuple<T extends readonly unknown[]> = T extends readonly [
  infer First,
  ...infer Rest,
]
  ? [First] extends [never]
    ? readonly [...NoNeverTuple<Rest>]
    : readonly [First, ...NoNeverTuple<Rest>]
  : readonly [];

export type ParsedResult<Parts extends AssertionParts> = {
  assertion: string;
} & (
  | {
      exactMatch: boolean;
      parsedValues: ParsedValues<Parts>;
      reason?: never;
      success: true;
    }
  | {
      exactMatch?: never;
      parsedValues?: never;
      reason: string;
      success: false;
    }
);
// Map author-provided parts to slots (tuple of ZodType). Strings become
// branded literals we can filter out for the impl's value params.

// Type for subject (first element of parsed values)
export type ParsedSubject<Parts extends AssertionParts> =
  ParsedValues<Parts> extends readonly [infer Subject, ...any[]]
    ? Subject
    : never;

export type ParsedValues<Parts extends AssertionParts> =
  MaybeEmptyParsedValues<Parts> extends readonly []
    ? never
    : MaybeEmptyParsedValues<Parts>;

type InferredPart<Part extends AssertionPart> = Part extends
  | readonly [string, ...string[]]
  | string
  ? never
  : Part extends z.ZodPromise
    ? Promise<z.infer<Part>>
    : z.infer<Part>;

type InferredParts<Parts extends AssertionParts> = Parts extends readonly [
  infer First extends AssertionPart,
  ...infer Rest extends AssertionParts,
]
  ? readonly [InferredPart<First>, ...InferredParts<Rest>]
  : readonly [];

type MapAssertionParts<Parts extends AssertionParts> = Parts extends readonly [
  infer First extends AssertionPart,
  ...infer Rest extends AssertionParts,
]
  ? readonly [AssertionSlot<First>, ...MapAssertionParts<Rest>]
  : readonly [];

type MaybeEmptyParsedValues<Parts extends AssertionParts> = NoNeverTuple<
  Parts extends readonly [
    infer First extends AssertionPart,
    ...infer Rest extends AssertionParts,
  ]
    ? First extends readonly [string, ...string[]] | string
      ? readonly [unknown, InferredPart<First>, ...InferredParts<Rest>]
      : readonly [InferredPart<First>, ...InferredParts<Rest>]
    : readonly []
>;
