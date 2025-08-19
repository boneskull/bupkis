import { z } from 'zod/v4';
import { UnionToIntersection, Writable } from 'type-fest';

// ————————————————————————————————————————————————————————————————
// Types
// ————————————————————————————————————————————————————————————————

const kStringLiteral = Symbol('bupkis-string-literal');
const bupkisRegistry = z.registry<{
  value?: string;
  values?: readonly string[];
  [kStringLiteral]: true;
}>();

type ZodTypeTuple = readonly ZodLike[];

type ZodLike = z.ZodType | ZodFunction;

type ZodFunction = z.core.$ZodFunction;

const NOT = 'not';

const isZodLike = (value: unknown): value is ZodLike =>
  !!(
    value &&
    typeof value === 'object' &&
    'def' in value &&
    value.def &&
    typeof value.def === 'object' &&
    'type' in value.def
  );

const isZodFunction = (value: unknown): value is ZodFunction =>
  isZodLike(value) && value.def.type === 'function';

const isZodUnknown = (value: unknown): value is z.ZodUnknown =>
  isZodLike(value) && value.def.type === 'unknown';

const isZodAny = (value: unknown): value is z.ZodAny =>
  isZodLike(value) && value.def.type === 'any';

// Drop `never` elements from a tuple while keeping it a tuple
type CleanTuple<T extends readonly unknown[]> = T extends readonly [
  infer H,
  ...infer R,
]
  ? H extends never
    ? CleanTuple<R>
    : readonly [H, ...CleanTuple<R>]
  : readonly [];

type AssertionPart = string | readonly [string, ...string[]] | ZodLike;

type AssertionParts = readonly [AssertionPart, ...AssertionPart[]];

// Type-only helper: a branded ZodType that also carries the string tuple type
// via an intersected phantom property for better inference in IncludedSlots
type BrandedStringLiterals<H extends readonly [string, ...string[]]> =
  z.core.$ZodBranded<z.ZodType, 'string-literal'> & {
    readonly __values: H;
  };

// Map author-provided parts to slots (tuple of ZodType). Strings become
// branded literals we can filter out for the impl's value params.
type MapAssertionValuesTuple<Parts extends readonly AssertionPart[]> =
  Parts extends readonly []
    ? readonly []
    : Parts extends readonly [
          infer H extends AssertionPart,
          ...infer R extends readonly AssertionPart[],
        ]
      ? readonly [
          H extends string
            ? z.core.$ZodBranded<z.ZodLiteral<H>, 'string-literal'>
            : H extends readonly [string, ...string[]]
              ? BrandedStringLiterals<H>
              : H extends ZodLike
                ? H
                : never,
          ...MapAssertionValuesTuple<R>,
        ]
      : readonly [];

// If first part is a string, prepend subject slot z.unknown()
type AssertionSlots<Parts extends readonly AssertionPart[]> =
  Parts extends readonly [infer First, ...infer _]
    ? First extends string | readonly [string, ...string[]]
      ? CleanTuple<readonly [z.ZodUnknown, ...MapAssertionValuesTuple<Parts>]>
      : CleanTuple<MapAssertionValuesTuple<Parts>>
    : readonly [];

// Values tuple for the impl: omit branded-literal slots
type InferredSlots<Slots extends ZodTypeTuple> = CleanTuple<
  Slots extends readonly []
    ? readonly []
    : Slots extends readonly [
          infer First,
          ...infer Rest extends readonly z.ZodType[],
        ]
      ? readonly [
          First extends z.core.$ZodBranded<any, 'string-literal'>
            ? never
            : First extends z.ZodType
              ? z.infer<First>
              : First extends ZodFunction
                ? (...args: any[]) => any
                : never,
          ...InferredSlots<Rest>,
        ]
      : readonly []
>;

type ExpectLike = (...args: readonly unknown[]) => void;

type FirstInferred<Slots extends ZodTypeTuple> =
  InferredSlots<Slots> extends readonly [infer First, ...infer _]
    ? First
    : never;

type RestInferred<Slots extends ZodTypeTuple> =
  InferredSlots<Slots> extends readonly [infer _, ...infer Rest]
    ? Rest
    : readonly [];

type AssertionImpl<Slots extends ZodTypeTuple> = (
  context: {
    expect: ExpectLike;
    slots: Slots;
    raw: unknown[];
    inverted?: boolean;
  },
  subject: FirstInferred<Slots>,
  ...values: RestInferred<Slots>
) => Awaited<void>;

// Compute impl params directly from the author-provided Values tuple
type TailInferValues<Parts extends readonly AssertionPart[]> = CleanTuple<
  Parts extends readonly []
    ? readonly []
    : Parts extends readonly [
          infer H extends AssertionPart,
          ...infer R extends readonly AssertionPart[],
        ]
      ? readonly [
          H extends z.ZodType
            ? z.infer<H>
            : H extends ZodFunction
              ? (...args: any[]) => any
              : never,
          ...TailInferValues<R>,
        ]
      : readonly []
>;

type SubjectFromValues<Parts extends readonly AssertionPart[]> =
  Parts extends readonly [infer First, ...infer _]
    ? First extends string | readonly [string, ...string[]]
      ? unknown
      : First extends z.ZodType
        ? z.infer<First>
        : First extends ZodFunction
          ? (...args: any[]) => any
          : never
    : never;

type RestFromValues<Parts extends readonly AssertionPart[]> =
  Parts extends readonly [
    infer _,
    ...infer Rest extends readonly AssertionPart[],
  ]
    ? TailInferValues<Rest>
    : readonly [];

type AssertionImplFor<Parts extends readonly AssertionPart[]> = (
  context: { expect: ExpectLike; slots: AssertionSlots<Parts> },
  subject: SubjectFromValues<Parts>,
  ...values: Writable<RestFromValues<Parts>>
) => Awaited<void>;

// ————————————————————————————————————————————————————————————————
// Factory
// ————————————————————————————————————————————————————————————————

function createAssertion<const Parts extends readonly AssertionPart[]>(
  values: Parts,
  impl: AssertionImplFor<Parts>,
): Assertion<AssertionSlots<Parts>> {
  // Delegate to the class static factory to keep existing call sites intact
  return Assertion.fromParts(values, impl);
}

class AssertionError extends Error {}

// ————————————————————————————————————————————————————————————————
// Core Assertion + shared validation
// ————————————————————————————————————————————————————————————————

const inferParsedValues = <Slots extends ZodTypeTuple>(
  parsedValues: unknown[],
): InferredSlots<Slots> => {
  return parsedValues as unknown as InferredSlots<Slots>;
};

// Attempt to retrieve our registered metadata for a slot. Handles direct registration,
// branded wrappers, and falls back to .meta() if available.
function getStringLiteralMeta(
  slot: unknown,
):
  | { [k: symbol]: true; value?: string; values?: readonly string[] }
  | undefined {
  const anySlot = slot as any;
  const tryLookup = (s: any) =>
    (s?.lookup && typeof s.lookup === 'function'
      ? s.lookup(bupkisRegistry)
      : undefined) ?? (bupkisRegistry as any)?.lookup?.(s);

  // direct lookup
  let meta = tryLookup(anySlot);
  if (!meta && anySlot?._def?.innerType) {
    meta = tryLookup(anySlot._def.innerType);
  }
  if (!meta && typeof anySlot.meta === 'function') {
    meta = anySlot.meta();
  }
  return meta && kStringLiteral in meta ? meta : undefined;
}

class Assertion<Slots extends ZodTypeTuple> {
  readonly slots: Slots;
  readonly impl: AssertionImpl<typeof this.slots>;

  // Static factory: build an Assertion instance from author-provided parts
  static fromParts<const Parts extends readonly AssertionPart[]>(
    parts: Parts,
    impl: AssertionImplFor<Parts>,
  ): Assertion<AssertionSlots<Parts>> {
    if (!parts || parts.length === 0) {
      throw new TypeError('At least one value is required for an assertion');
    }
    // Build slots tuple: prepend z.unknown() if first is string or string[]; map strings -> branded literals
    const firstIsString =
      typeof parts[0] === 'string' || Array.isArray(parts[0]);
    const mapped = (parts as readonly AssertionPart[]).map((value) => {
      if (Array.isArray(value)) {
        const enumSchema = z.enum(value as readonly [string, ...string[]]);
        return enumSchema
          .brand('string-literal' as const)
          .register(bupkisRegistry, {
            [kStringLiteral]: true,
            values: value as readonly string[],
          })
          .meta({
            [kStringLiteral]: true,
            values: value,
          }) as unknown as BrandedStringLiterals<
          readonly [string, ...string[]]
        >;
      }
      return typeof value === 'string'
        ? z
            .literal(value)
            .brand('string-literal' as const)
            .register(bupkisRegistry, {
              [kStringLiteral]: true,
              value,
            })
            .meta({ [kStringLiteral]: true, value })
        : (value as ZodLike);
    });

    const slots = (firstIsString
      ? [z.unknown(), ...mapped]
      : mapped) as unknown as AssertionSlots<Parts>;

    return new Assertion(slots, impl as unknown as AssertionImpl<typeof slots>);
  }

  constructor(slots: Slots, impl: AssertionImpl<typeof slots>) {
    this.slots = slots;
    this.impl = impl;
  }

  validate(args: unknown[]): ParsedResult<Slots> {
    return parseValues(this.slots, args);
  }

  run(expect: ExpectLike, ...args: unknown[]) {
    // Validate before running
    const { success, parsedValues } = this.validate(args);
    if (!success) {
      throw new AssertionError('Type validation failed for assertion');
    }
    // Call implementation
    return callImpl(this.impl, expect, this.slots, parsedValues, args);
  }
}

export type ParsedResult<Slots extends ZodTypeTuple> =
  | {
      success: true;
      parsedValues: InferredSlots<Slots>;
    }
  | {
      success: false;
      parsedValues: [];
    };

// Shared validation/match helper
function parseValues<
  Slots extends ZodTypeTuple,
  Args extends readonly unknown[],
>(slots: Slots, args: Args): ParsedResult<Slots> {
  const parsed: unknown[] = [];
  if (slots.length !== args.length) {
    return { success: false, parsedValues: [] };
  }
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]!;
    const arg = args[i];
    const meta = 'meta' in slot ? slot.meta() : undefined;
    // our branded literal slots are also tagged in meta for runtime
    if (meta) {
      if ('value' in meta) {
        if (arg !== meta.value) {
          return { success: false, parsedValues: [] };
        }
      } else if ('values' in meta) {
        const allowed = meta.values as readonly string[];
        if (!allowed.includes(arg as any)) {
          return { success: false, parsedValues: [] };
        }
      }
      // skip from impl params
      continue;
    }
    // unknown/any accept anything
    if (isZodUnknown(slot) || isZodAny(slot)) {
      parsed.push(arg);
      continue;
    }
    if (isZodFunction(slot)) {
      // Function slots are special: we don't validate the function itself,
      // but we do ensure it matches the expected input/output types.
      if (typeof arg !== 'function') {
        return { success: false, parsedValues: [] };
      }
      // If we had a specific function type, we could validate it here
      // (e.g., check input/output types), but for now, we just accept it.
      parsed.push(arg);
      continue;
    }
    const result = slot.safeParse(arg);
    if (!result.success) {
      return { success: false, parsedValues: [] };
    }
    parsed.push(result.data);
  }
  return { success: true, parsedValues: inferParsedValues<Slots>(parsed) };
}

function callImpl<Slots extends ZodTypeTuple>(
  impl: AssertionImpl<Slots>,
  expect: ExpectLike,
  slots: Slots,
  parsed: InferredSlots<Slots>,
  rawArgs: unknown[],
) {
  const [subject, ...rest] = parsed as unknown as [
    FirstInferred<Slots>,
    ...RestInferred<Slots>,
  ];
  return impl({ expect, slots, raw: rawArgs }, subject, ...rest);
}

const Assertions = [
  createAssertion(
    [
      ['to be a', 'to be an'],
      z.enum([
        'string',
        'number',
        'boolean',
        'undefined',
        'null',
        'bigint',
        'symbol',
        'object',
        'function',
        'array',
      ]),
    ],
    (_, subject, type) => {
      switch (type) {
        case 'array': {
          if (!Array.isArray(subject)) {
            throw new AssertionError(`Expected ${subject} to be an array`);
          }
          break;
        }
        case 'null': {
          if (subject !== null) {
            throw new AssertionError(`Expected ${subject} to be null`);
          }
          break;
        }
        default:
          if (typeof subject !== type) {
            throw new AssertionError(`Expected ${subject} to be a ${type}`);
          }
      }
    },
  ),
  createAssertion(['to be a string'], ({ expect }, subject) => {
    expect(subject, 'to be a', 'string');
  }),
  createAssertion(
    [z.number(), 'to be greater than', z.number()],
    (_, subject, other) => {
      if (!(subject > other)) {
        throw new AssertionError(
          `Expected ${subject} to be greater than ${other}`,
        );
      }
    },
  ),
  createAssertion(
    [z.number(), 'to be less than', z.number()],
    (_, subject, other) => {
      if (!(subject < other)) {
        throw new AssertionError(
          `Expected ${subject} to be less than ${other}`,
        );
      }
    },
  ),
  createAssertion(['to be', z.any()], (_, subject, ...[value]) => {
    if (subject !== value) {
      throw new AssertionError(
        `Expected ${subject} to be ${value}, but it was not`,
      );
    }
  }),
  createAssertion([z.function(), 'to throw'], (_, subject) => {
    let threw = false;
    try {
      subject();
    } catch (err) {
      threw = true;
    }
    if (!threw) {
      throw new AssertionError('Expected function to throw');
    }
  }),
  createAssertion(
    [z.function(), ['not to throw', 'to not throw']],
    ({ expect }, subject) => {
      try {
        expect(subject, 'to throw');
      } catch (err) {
        throw new AssertionError(
          `Expected function not to throw, but it did: ${err}`,
        );
      }
    },
  ),
] as const;

type BuiltinAssertion = (typeof Assertions)[number];

// ————————————————————————————————————————————————————————————————
// expect() typing from Assertions tuple
// ————————————————————————————————————————————————————————————————

type IncludedSlots<Slots extends readonly unknown[]> = Slots extends readonly [
  infer Head,
  ...infer Tail,
]
  ? [
      Head extends z.core.$ZodBranded<
        z.ZodLiteral<infer StringLiteral>,
        'string-literal'
      >
        ? StringLiteral
        : Head extends BrandedStringLiterals<infer H>
          ? H[number]
          : Head extends ZodLike
            ? z.infer<Head>
            : never,
      ...IncludedSlots<Tail>,
    ]
  : [];

type ExpectOverloadFor<T extends AnyAssertion> =
  T extends Assertion<infer Slots>
    ? (...args: IncludedSlots<Slots>) => void
    : never;

type ExpectOverloads = ExpectOverloadFor<BuiltinAssertion>;

type Expect = UnionToIntersection<ExpectOverloads>;

const expect = ((...args: unknown[]) => {
  // Ambiguity check: ensure only one match
  let found: { assertion: AnyAssertion; parsedValues: unknown[] } | undefined;
  for (const assertion of Assertions) {
    const { parsedValues, success } = parseValues(assertion.slots, args);
    if (success) {
      if (found) {
        throw new Error('Multiple matching assertions found');
      }
      found = { assertion, parsedValues };
    }
  }
  if (found) {
    const { assertion, parsedValues } = found;
    return callImpl(
      assertion.impl,
      expect as ExpectLike,
      assertion.slots,
      parsedValues as any,
      args,
    );
  }
  throw new TypeError('No matching assertion found');
}) as unknown as Expect;

// Re-export for external use if needed
export { expect };

export type AnyAssertion = Assertion<any>;
