/**
 * Types used throughout <span class="bupkis">BUPKIS</span>.
 *
 * May be useful for those building on top of <span
 * class="bupkis">BUPKIS</span>.
 *
 * @example
 *
 * ```ts
 * // namespace
 * import { types } from 'bupkis';
 * // subpath import
 * import type * as alsoTypes from 'bupkis/types';
 * ```
 *
 * @groupDescription Utility Types
 * Types used throughout <span class="bupkis">BUPKIS</span>.
 * @packageDocumentation
 */

import type {
  ArrayValues,
  TupleToUnion,
  Constructor as TypeFestConstructor,
  UnionToIntersection,
} from 'type-fest';
import type { LiteralStringUnion } from 'type-fest/source/literal-union.js';
import type { z } from 'zod';

import type {
  AnyAssertion,
  AnyAssertionWrapper,
  AnyAsyncAssertion,
  AnyAsyncAssertionWrapper,
  AnySyncAssertion,
  AnySyncAssertionWrapper,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Assertion,
  AssertionPart,
  AssertionParts,
  AssertionSlot,
  BuiltinAsyncAssertionWrapper,
  BuiltinSyncAssertionWrapper,
  CreateAssertionFn,
  CreateAsyncAssertionFn,
  GetAssertionArgs,
  GetAssertionInput,
  NoNeverTuple,
  NonExtendable,
  PhraseLiteral,
  PhraseLiteralChoice,
  PhraseLiteralChoiceSlot,
  PhraseLiteralSlot,
  SpreadAssertions,
} from './assertion/assertion-types.js';
import type { StandardSchemaV1 } from './standard-schema.js';
import type { ValueToSchemaOptions } from './value-to-schema.js';

import { type kExpectIt } from './constant.js';

/**
 * Creates a negated version of a tuple of
 * {@link AssertionPart | AssertionParts}.
 *
 * For {@link PhraseLiteral | PhraseLiterals}, creates a
 * {@link Negation | "not" variant}. For
 * {@link PhraseLiteralChoice | PhraseLiteralChoices}, creates negated versions
 * of each `Phrase` in the array.
 *
 * Does not affect Zod schemas.
 *
 * @template Parts Parts containing `PhraseLiterals` or `PhraseLiteralChoices`
 *   to negate.
 */
export type AddNegation<Parts extends readonly AssertionPart[]> =
  Parts extends readonly [
    infer First extends AssertionPart,
    ...infer Rest extends readonly AssertionPart[],
  ]
    ? First extends PhraseLiteralChoice
      ? readonly [
          {
            [K in keyof First]: First[K] extends PhraseLiteral
              ? Negation<First[K]>
              : never;
          },
          ...AddNegation<Rest>,
        ]
      : First extends PhraseLiteral
        ? readonly [Negation<First>, ...AddNegation<Rest>]
        : readonly [First, ...AddNegation<Rest>]
    : readonly [];

/**
 * Base set of properties included in both {@link Expect} and {@link ExpectAsync}.
 *
 * @preventExpand
 * @group Expect-Related
 */
export interface BaseExpect<
  SyncAssertionWrapper extends AnySyncAssertionWrapper,
  AsyncAssertionWrapper extends AnyAsyncAssertionWrapper,
> {
  __type: {
    async: AsyncAssertionWrapper;
    sync: SyncAssertionWrapper;
  };

  /**
   * Creates a new synchronous assertion.
   */
  createAssertion: CreateAssertionFn;

  /**
   * Creates a new asynchronous assertion.
   */
  createAsyncAssertion: CreateAsyncAssertionFn;
  /**
   * Fails immediately with optional `reason`.
   *
   * @param reason Reason for failure
   * @throws {AssertionError}
   */
  fail: FailFn;
}

/**
 * Configuration for valueToSchema benchmark generation.
 */
export interface BenchmarkConfig {
  /** Optional filter for input categories */
  categories?: string[];
  /** Complexity levels to test */
  complexityLevels: ComplexityLevel[];
  /** Number of benchmark iterations (1-10000) */
  iterations: number;
  /** ValueToSchemaOptions combinations to test */
  options?: Partial<ValueToSchemaOptions>[];
  /** Number of test data samples to generate (10-10000) */
  sampleSize: number;
  /** Benchmark timeout in milliseconds (1000-300000) */
  timeout: number;
  /** Number of warmup iterations (1-100) */
  warmupIterations: number;
}

/**
 * Type representing a dot-notation or bracket-notation keypath for accessing
 * nested object properties. Uses recursive template literal types to validate
 * keypath syntax.
 *
 * Supports paths like:
 *
 * - 'foo.bar'
 * - 'foo[0]'
 * - 'foo["bar-baz"]'
 * - 'foo.bar[1].baz'
 *
 * @public
 */

/**
 * Complete benchmark result.
 */
export interface BenchmarkResult {
  /** Computed insights and bottleneck identification */
  analysis: PerformanceAnalysis;
  /** Environment details when benchmark was run */
  executionContext: ExecutionContext;
  /** Total execution time in milliseconds */
  executionTime: number;
  /** Metadata about the benchmark run */
  metadata: {
    nodeVersion: string;
    timestamp: string;
    version: string;
  };
  /** Individual measurement results */
  results: PerformanceMetrics[];
  /** Benchmark suite identifier */
  suiteId: string;
}

export type * from './assertion/assertion-types.js';
export type { StandardSchemaV1 };

/**
 * The main API as returned by a {@link UseFn}.
 *
 * @template BaseSyncAssertionWrapper Base set of synchronous
 *   {@link Assertion | Assertions}; will be the builtin sync assertions, at
 *   minimum)
 * @template BaseAsyncAssertionWrapper Base set of asynchronous
 *   {@link Assertion | Assertions}; will be the builtin async assertions, at
 *   minimum)
 * @template ExtendedSyncAssertionWrapper Synchronous assertions extracted from
 *   `MixedAssertions`
 * @template ExtendedAsyncAssertionWrapper Asynchronous assertions extracted
 *   from `MixedAssertions`
 * @group Core API
 */
export interface Bupkis<
  BaseSyncAssertionWrapper extends AnySyncAssertionWrapper,
  BaseAsyncAssertionWrapper extends AnyAsyncAssertionWrapper,
  ExtendedSyncAssertionWrapper extends AnySyncAssertionWrapper,
  ExtendedAsyncAssertionWrapper extends AnyAsyncAssertionWrapper,
> {
  /**
   * A new {@link Expect} function which handles
   * {@link ExtendedSyncAssertionWrapper} and {@link BaseSyncAssertionWrapper}
   */
  expect: Expect<
    BaseSyncAssertionWrapper | ExtendedSyncAssertionWrapper,
    BaseAsyncAssertionWrapper | ExtendedAsyncAssertionWrapper
  >;
  /**
   * A new {@link ExpectAsync} function which handles
   * {@link ExtendedAsyncAssertionWrapper} and {@link BaseAsyncAssertionWrapper}
   */
  expectAsync: ExpectAsync<
    BaseAsyncAssertionWrapper | ExtendedAsyncAssertionWrapper,
    BaseSyncAssertionWrapper | ExtendedSyncAssertionWrapper
  >;
  /**
   * For composing arrays of assertions, one after another.
   *
   * The _only_ chainable API in <span class="bupkis">Bupkis</span>.
   *
   * @since 0.1.0
   * @example
   *
   * ```ts
   * const { expect } = use([...someAssertions]).use([...otherAssertions]);
   * ```
   */
  use: UseFn<
    BaseSyncAssertionWrapper | ExtendedSyncAssertionWrapper,
    BaseAsyncAssertionWrapper | ExtendedAsyncAssertionWrapper
  >;
}

/**
 * Complexity levels for test data generation.
 */
export type ComplexityLevel = 'complex' | 'medium' | 'simple';

/**
 * Helper type to concatenate two tuples
 *
 * @group Utility Types
 */
export type Concat<
  TupleA extends readonly unknown[],
  TupleB extends readonly unknown[],
> = readonly [...TupleA, ...TupleB];

/**
 * A constructor based on {@link TypeFestConstructor type-fest's Constructor}
 * with a default instance type argument.
 *
 * @group Utility Types
 */
export type Constructor<
  Instance = any,
  Args extends unknown[] = any[],
> = TypeFestConstructor<Instance, Args>;

export type DefFromZodType<T extends z.core.$ZodType | z.ZodType> =
  T extends z.ZodType
    ? T['def']
    : T extends z.core.$ZodType
      ? T['_zod']['def']
      : never;

/**
 * Execution context for benchmark runs.
 */
export interface ExecutionContext {
  /** CPU model */
  cpuModel: string;
  /** Total memory */
  memoryTotal: number;
  /** Node.js version */
  nodeVersion: string;
  /** Platform information */
  platform: string;
}

/**
 * Execution time statistics.
 */
export interface ExecutionTimeStats {
  /** Mean execution time */
  mean: number;
  /** Median execution time */
  median: number;
  /** 95th percentile execution time */
  p95: number;
  /** 99th percentile execution time */
  p99: number;
}

/**
 * The main synchronous assertion function.
 *
 * Contains properties in {@link ExpectSyncProps}.
 *
 * @template SyncAssertionWrapper All synchronous assertions available
 * @template AsyncAssertionWrapper All asynchronous assertions available; for
 *   use in {@link ExpectSyncProps.use} only.
 * @expandType ExpectSyncProps
 * @group Core API
 * @see {@link expect}
 */
export type Expect<
  SyncAssertionWrapper extends AnySyncAssertionWrapper =
    BuiltinSyncAssertionWrapper,
  AsyncAssertionWrapper extends AnyAsyncAssertionWrapper =
    BuiltinAsyncAssertionWrapper,
> = ExpectFunction<SyncAssertionWrapper> &
  ExpectSyncProps<SyncAssertionWrapper, AsyncAssertionWrapper>;

/**
 * The main asynchronous assertion function.
 *
 * Contains properties in {@link ExpectAsyncProps}.
 *
 * @template AsyncAssertions All asynchronous assertions available
 * @template SyncAssertions All synchronous assertions available; for use in
 *   {@link ExpectAsyncProps.use} only.
 * @expandType ExpectAsyncProps
 * @group Core API
 * @see {@link expectAsync}
 */
export type ExpectAsync<
  AsyncAssertionWrapper extends AnyAsyncAssertionWrapper =
    BuiltinAsyncAssertionWrapper,
  SyncAssertionWrapper extends AnySyncAssertionWrapper =
    BuiltinSyncAssertionWrapper,
> = ExpectAsyncFunction<AsyncAssertionWrapper> &
  ExpectAsyncProps<AsyncAssertionWrapper, SyncAssertionWrapper>;

/**
 * The callable function type for asynchronous assertions.
 *
 * This type represents the actual function signature of an async expect
 * function, created by mapping all available assertions to their respective
 * function signatures and combining them using intersection types. Each
 * assertion contributes its own overload to the final function type.
 *
 * The function signatures are derived from the {@link AssertionParts} of each
 * assertion, with parameters that match the expected slots for natural language
 * assertion calls.
 *
 * @example
 *
 * ```typescript
 * // Example function type derived from async assertions
 * const expectAsync: ExpectAsyncFunction<MyAsyncAssertions> = ...;
 * await expectAsync(promise, 'to resolve');
 * await expectAsync(promise, 'to resolve with value satisfying', expectedValue);
 * ```
 *
 * @template AsyncAssertions - Array of async assertion objects that define
 *   available assertion logic
 * @see {@link ExpectFunction} for the synchronous equivalent, with explanation of type union
 * @see {@link SlotsFromParts} for how assertion parts are converted to function parameters
 */
export type ExpectAsyncFunction<
  AsyncAssertionWrapper extends AnyAsyncAssertionWrapper,
> = (<const Args extends unknown[]>(
  value: AssertValidChain<Args, AsyncAssertionWrapper>,
  ...args: Args
) => Promise<void>)
   & (
  (
  value: { [InvalidAssertionChain]: 'Only exists for autocompletion' },
  ...rest: LiteralStringUnion<
    PhraseSuggestions<AsyncAssertionWrapper>
  >[]
) => Promise<void>
);

/**
 * Properties available on asynchronous expect functions.
 *
 * This interface defines the additional properties and methods that are
 * attached to async expect functions, extending the base expect functionality
 * with async-specific features. These properties provide access to the
 * underlying assertions and enable function composition through the
 * {@link UseFn | `use`} method.
 *
 * @example
 *
 * ```typescript
 * const expectAsync: ExpectAsync<MyAsyncAssertions> =
 *   createExpectAsyncFunction(assertions);
 *
 * // Access the underlying assertions
 * console.log(expectAsync.assertions.length);
 *
 * // Compose with additional assertions
 * const { expectAsync: enhanced } = expectAsync.use(moreAssertions);
 * ```
 *
 * @template AsyncAssertions - Array of async assertion objects available to
 *   this expect function
 * @template SyncAssertions - Array of sync assertion objects available for
 *   composition via {@link UseFn | `use`}
 * @group Expect-Related
 */
export interface ExpectAsyncProps<
  AsyncAssertionWrapper extends AnyAsyncAssertionWrapper,
  SyncAssertionWrapper extends AnySyncAssertionWrapper,
> extends BaseExpect<SyncAssertionWrapper, AsyncAssertionWrapper> {
  /**
   * Tuple of all assertions available in this `expect()`.
   *
   * @preventExpand
   */
  assertions: SpreadAssertions<AsyncAssertionWrapper>;

  /**
   * {@inheritDoc ExpectItAsync}
   */
  it: ExpectItAsync<AsyncAssertionWrapper>;

  /**
   * {@inheritDoc UseFn}
   */
  use: UseFn<SyncAssertionWrapper, AsyncAssertionWrapper>;
}

/**
 * The function part of {@link Expect}.
 *
 * This is an intersection of all function signatures derived from the available
 * synchronous assertions.
 * 
 * This function is typed in two different forms:
 * 1) The first is the "real" type. All but the first args are collected, 
 * and asserts that it matches a real possible phrase. 
 * If no phrase matches, the first type becomes an impossible type (object with internal symbol, and text description)
 * 2) The second is a hack. The first value is always "impossible". 
 * However that doesn't stop typescript from attempting a match, and providing auto-complete support, based on all the possible
 * phrases from available assertions. Note that the autocompletion does not respect "valid" phrases.
 * 
 * @group Expect-Related
 */
export type ExpectFunction<
  SyncAssertionWrapper extends AnySyncAssertionWrapper,
> = (<
  const Args extends unknown[],
>(
  value: AssertValidChain<Args, SyncAssertionWrapper>,
  ...rest: Args
) => void) & (
  (
  value: { [InvalidAssertionChain]: 'Only exists for autocompletion' },
  ...rest: LiteralStringUnion<
    PhraseSuggestions<SyncAssertionWrapper>
  >[]
) => void
);

/**
 * Union of every phrase literal (and its `'not '`-negated form) contributed by
 * the assertions in `AssertionWrapper`.
 *
 * Used purely to drive editor autocompletion for the `phrase` parameters of
 * {@link ExpectFunction}/{@link ExpectAsyncFunction}. It is wrapped in
 * {@link LiteralStringUnion} at the use site so that the suggestions
 * surface while *any* string is still accepted — the assertion chain itself is
 * validated by the `value` gate ({@link AssertValidChain}), never here.
 *
 * @group Expect-Related
 */
type PhraseSuggestions<AssertionWrapper extends AnyAssertionWrapper> =
  AssertionWrapper extends NonExtendable<infer U extends AnyAssertion>
    ? PhrasesFromParts<U['parts']>
    : never;

/**
 * Extracts the union of phrase literals (with negations) from a tuple of
 * {@link AssertionParts}. {@link PhraseLiteral} parts are plain strings;
 * {@link PhraseLiteralChoice} parts are tuples of strings — both contribute
 * their literals plus the `'not '`-negated variants. Schema parts contribute
 * nothing.
 *
 * @template Parts - The assertion parts to scan for phrases
 */
type PhrasesFromParts<Parts extends readonly unknown[]> =
  Parts extends readonly [infer First, ...infer Rest]
    ? PhrasePartToLiteral<First> | PhrasesFromParts<Rest>
    : never;

/**
 * Converts a single {@link AssertionPart} into the phrase literals it
 * contributes (the literal itself plus its {@link Negation}). Non-phrase parts
 * resolve to `never`.
 *
 * @template Part - The assertion part to convert
 */
type PhrasePartToLiteral<Part> = Part extends readonly string[]
  ? ArrayValues<Part> | Negation<ArrayValues<Part>>
  : Part extends string
    ? Negation<Part> | Part
    : never;

/**
 * Creates embeddable assertion functions that can be used with `'to satisfy'`.
 *
 * This type generates a union of all possible `expect.it` function signatures
 * based on the available synchronous assertions. Each assertion contributes its
 * own function signature to create embeddable executors that can be used within
 * object patterns for complex validation scenarios.
 *
 * The resulting functions are designed to be used exclusively within `'to
 * satisfy'` assertion contexts, where they provide type-safe pattern matching
 * for nested object structures. Direct execution of these functions outside of
 * their intended context is not supported.
 *
 * @example
 *
 * ```typescript
 * // Create embeddable assertion functions
 * const isString = expect.it('to be a string');
 * const isPositive = expect.it('to be greater than', 0);
 *
 * // Use within 'to satisfy' patterns
 * expect(user, 'to satisfy', {
 *   name: isString,
 *   age: isPositive,
 *   email: /\S+@\S+/,
 * });
 * ```
 *
 * @template SyncAssertions - Array of synchronous assertion objects that define
 *   the available assertion logic for embeddable functions
 * @group Core API
 * @see {@link ExpectItFunction} for individual function signature generation
 * @see {@link ExpectItExecutor} for the executor function interface
 */
export type ExpectIt<
  SyncAssertionWrapper extends AnySyncAssertionWrapper =
    BuiltinSyncAssertionWrapper,
> = UnionToIntersection<
  SyncAssertionWrapper extends NonExtendable<infer U extends AnySyncAssertion>
    ? ExpectItFunction<U['parts']>
    : never
>;

/**
 * The function part of {@link ExpectIt}.
 */
export type ExpectItFunction<Parts extends AssertionParts> = (
  ...args: MutableOrReadonly<TupleTail<SlotsFromParts<Parts>>>
) => Parts[0] extends StandardSchemaV1<infer Input>
  ? ExpectItExecutor<Input>
  : ExpectItExecutor<unknown>;

/**
 * Validates an entire assertion chain (one or more assertions joined by
 * `'and'`) against the available assertions, producing the type the subject
 * value must satisfy.
 *
 * - When the chain is valid, resolves to `unknown` so any subject is accepted.
 * - When a chunk matches no assertion, resolves to a marker keyed by
 *   {@link InvalidAssertionChain} carrying `'No matching assertion'`.
 * - When the matches are mutually exclusive (their intersection is `never`),
 *   resolves to the same marker carrying `'Impossible assertion'`.
 *
 * @template Args - The assertion chain arguments (phrases and parameters)
 * @template AssertionWrapper - The available assertions to match against
 */
type AssertValidChain<
  Args extends unknown[],
  AssertionWrapper extends AnyAssertionWrapper,
> =
  TupleHasNever<
    AssertionChainToMatchedAssertions<Args, AssertionWrapper>
  > extends true
    ? { [InvalidAssertionChain]: 'No matching assertion' }
    : [AssertionChainToWidestType<Args, AssertionWrapper>] extends [never]
      ? { [InvalidAssertionChain]: 'Impossible assertion' }
      : unknown;

/**
 * Unique symbol used to brand invalid {@link AssertValidChain} results, ensuring
 * no real subject value can be assigned to them.
 */
declare const InvalidAssertionChain: unique symbol;

/**
 * Factory type for creating async embeddable assertion executors.
 *
 * This type generates a union of all possible `expectAsync.it` function
 * signatures based on the available asynchronous assertions. Each assertion
 * contributes its own function signature to create embeddable async executors
 * that can be used within async object patterns for complex validation
 * scenarios.
 *
 * The resulting functions are designed to be used exclusively within async `'to
 * satisfy'` assertion contexts, where they provide type-safe pattern matching
 * for nested object structures with `Promise`-based validation.
 *
 * @example
 *
 * ```typescript
 * // Create embeddable async assertion functions
 * const isAsyncString = expectAsync.it('to be a string');
 * const resolvesFast = expectAsync.it('to resolve quickly');
 *
 * // Use within async 'to satisfy' patterns
 * await expectAsync(asyncUser, 'to satisfy', {
 *   name: isAsyncString,
 *   loadPromise: resolvesFast,
 * });
 * ```
 *
 * @template AsyncAssertions - Array of asynchronous assertion objects that
 *   define the available assertion logic for the embeddable async functions
 * @group Core API
 * @see {@link ExpectItFunctionAsync} for individual function signature generation
 * @see {@link ExpectItExecutorAsync} for the executor function interface
 * @see {@link ExpectIt} for the synchronous equivalent
 */
export type ExpectItAsync<
  AsyncAssertionWrapper extends AnyAsyncAssertionWrapper =
    BuiltinAsyncAssertionWrapper,
> = UnionToIntersection<
  AsyncAssertionWrapper extends NonExtendable<infer U extends AnyAssertion>
    ? ExpectItFunctionAsync<U['parts']>
    : never
>;

/**
 * Interface for executor functions created by `expect.it()`.
 *
 * `ExpectItExecutor` functions are the result of calling `expect.it()` with
 * assertion parameters. They encapsulate the assertion logic and can be
 * executed later within `'to satisfy'` pattern matching contexts. These
 * functions are marked with an internal symbol to distinguish them from regular
 * functions during pattern validation.
 *
 * The executor accepts a subject value and performs the embedded assertion
 * logic against it. The subject type is constrained by the Zod schema that
 * represents the first part of the assertion definition, ensuring type safety
 * during pattern matching.
 *
 * @example
 *
 * ```typescript
 * const isStringExecutor = expect.it('to be a string');
 * // isStringExecutor is an ExpectItExecutor<string>
 *
 * // Used within satisfy patterns
 * expect({ name: 'Alice' }, 'to satisfy', {
 *   name: isStringExecutor, // Validates that name is a string
 * });
 * ```
 *
 * @template Subject - The type that constrains the subject parameter
 * @group Expect-Related
 * @see {@link ExpectItFunction} for the factory function that creates executors
 */
export interface ExpectItExecutor<Subject> {
  (subject: Subject): void;
  [kExpectIt]: true;
}

/**
 * Function signature for creating `ExpectItExecutor` instances.
 *
 * This type represents the factory function that creates embeddable assertion
 * executors from assertion parts. It takes the assertion parameters (excluding
 * the subject) and returns an executor function that can be embedded within
 * `'to satisfy'` patterns.
 *
 * The function signature is derived from assertion parts by removing the first
 * part (which becomes the subject type for the executor) and using the
 * remaining parts as parameters. This allows for natural language assertion
 * creation that mirrors the main `expect()` function but produces reusable
 * executor functions.
 *
 * The resulting executor is constrained to only work with subjects that match
 * the first assertion part, providing compile-time type safety for pattern
 * matching scenarios.
 *
 * @example
 *
 * ```typescript
 * // For assertion parts: [z.string(), 'to match', z.instanceof(RegExp)]
 * // Results in function: (pattern: RegExp) => ExpectItExecutor<z.ZodString>
 * const matchesPattern = expect.it('to match', /^[A-Z]/);
 *
 * expect({ code: 'ABC123' }, 'to satisfy', {
 *   code: matchesPattern, // Validates that code matches the pattern
 * });
 * ```
 *
 * @template Parts - Tuple of assertion parts that define the function signature
 *   and executor constraints
 * @see {@link ExpectItExecutor} for the returned executor interface
 * @see {@link TupleTail} for parameter extraction from assertion parts
 * @see {@link SlotsFromParts} for type slot generation
 */
/**
 * Interface for asynchronous executor functions created by `expectAsync.it()`.
 *
 * `ExpectItExecutorAsync` functions are the async equivalent of
 * {@link ExpectItExecutor}, designed for asynchronous assertion contexts. They
 * return `Promise`s and are marked with the same internal symbol for
 * identification. These executors can be embedded within `'to satisfy'`
 * patterns for async validation scenarios.
 *
 * @example
 *
 * ```typescript
 * const isAsyncStringExecutor = expectAsync.it('to be a string');
 * // isAsyncStringExecutor is an ExpectItExecutorAsync<string>
 *
 * // Used within async satisfy patterns
 * await expectAsync({ name: 'Alice' }, 'to satisfy', {
 *   name: isAsyncStringExecutor, // Async validation that name is a string
 * });
 * ```
 *
 * @template Subject - The type that constrains the subject parameter
 * @group Expect-Related
 * @see {@link ExpectItExecutor} for the synchronous equivalent
 */
export interface ExpectItExecutorAsync<Subject> {
  (subject: Subject): Promise<void>;
  /**
   * Internal marker to differentiate an `ExpectItExecutorAsync` function from
   * other functions.
   *
   * @internal
   */
  [kExpectIt]: true;
}

/**
 * Function signature for creating async `ExpectItExecutorAsync` instances.
 *
 * This type represents the factory function that creates embeddable async
 * assertion executors from assertion parts. It takes the assertion parameters
 * (excluding the subject) and returns an async executor function that can be
 * embedded within async `'to satisfy'` patterns.
 *
 * The function signature is derived from assertion parts by removing the first
 * part (which becomes the subject type for the executor) and using the
 * remaining parts as parameters. This allows for natural language assertion
 * creation that mirrors the main `expectAsync()` function but produces reusable
 * async executor functions.
 *
 * @example
 *
 * ```typescript
 * // For assertion parts: [z.string(), 'to match', z.instanceof(RegExp)]
 * // Results in function: (pattern: RegExp) => ExpectItExecutorAsync<string>
 * const matchesPatternAsync = expectAsync.it('to match', /^[A-Z]/);
 *
 * await expectAsync({ code: 'ABC123' }, 'to satisfy', {
 *   code: matchesPatternAsync, // Async validation that code matches the pattern
 * });
 * ```
 *
 * @template Parts - Tuple of assertion parts that define the function signature
 *   and executor constraints
 * @see {@link ExpectItExecutorAsync} for the returned async executor interface
 * @see {@link ExpectItFunction} for the synchronous equivalent
 * @see {@link TupleTail} for parameter extraction from assertion parts
 * @see {@link SlotsFromParts} for type slot generation
 */
export type ExpectItFunctionAsync<Parts extends AssertionParts> = (
  ...args: MutableOrReadonly<TupleTail<SlotsFromParts<Parts>>>
) => Parts[0] extends StandardSchemaV1<infer Input>
  ? ExpectItExecutorAsync<Input>
  : ExpectItExecutorAsync<unknown>;

/**
 * Properties of {@link expect}.
 *
 * @group Expect-Related
 */
export interface ExpectSyncProps<
  SyncAssertionWrapper extends AnySyncAssertionWrapper,
  AsyncAssertionWrapper extends AnyAsyncAssertionWrapper,
> extends BaseExpect<SyncAssertionWrapper, AsyncAssertionWrapper> {
  /**
   * Tuple of all assertions available in this `expect()`.
   *
   * @preventExpand
   */
  assertions: SpreadAssertions<SyncAssertionWrapper>;

  it: ExpectIt<SyncAssertionWrapper>;

  /**
   * Function to add more assertions to this `expect()`, returning a new
   * `expect()` and `expectAsync()` pair with the combined assertions.
   */
  use: UseFn<SyncAssertionWrapper, AsyncAssertionWrapper>;
}

/**
 * A function which immediately throws an {@link AssertionError}.
 *
 * Member of {@link BaseExpect}.
 *
 * @param reason Optional reason for failure
 * @group Core API
 * @see {@link fail}
 */
export type FailFn = (reason?: string) => never;

/**
 * Given a mixed array of assertions, filters out only the async assertions.
 */
/**
 * Given a mixed array of assertions, filters out only the async assertions.
 *
 * This utility type recursively examines each assertion in the input array and
 * constructs a new tuple containing only the asynchronous assertions. It uses
 * conditional types to test whether each assertion extends
 * {@link AnyAsyncAssertion} and includes it in the result if so.
 *
 * Used primarily by {@link UseFn} to separate async assertions from mixed
 * assertion arrays when composing expect functions.
 *
 * @example
 *
 * ```typescript
 * type Mixed = [
 *   SyncAssertion1,
 *   AsyncAssertion1,
 *   SyncAssertion2,
 *   AsyncAssertion2,
 * ];
 * type AsyncOnly = FilterAsyncAssertions<Mixed>; // [AsyncAssertion1, AsyncAssertion2]
 * ```
 *
 * @template MixedAssertions - Array that may contain both sync and async
 *   assertions
 * @see {@link FilterSyncAssertions} for extracting synchronous assertions
 * @see {@link UseFn} for the primary use case of this type
 */
export type FilterAndWrapAsyncAssertions<
  MixedAssertions extends readonly AnyAssertion[],
> = TupleToUnion<{
  [K in keyof MixedAssertions]: MixedAssertions[K] extends AnyAsyncAssertion
    ? NonExtendable<MixedAssertions[K]>
    : never;
}>;

/**
 * Given a mixed array of assertions, extracts only the synchronous assertions.
 */
export type FilterAndWrapSyncAssertions<
  MixedAssertions extends readonly AnyAssertion[],
> = TupleToUnion<{
  [K in keyof MixedAssertions]: MixedAssertions[K] extends AnySyncAssertion
    ? NonExtendable<MixedAssertions[K]>
    : never;
}>;

/**
 * Options for test data generation.
 */
export interface GeneratorOptions {
  /** Whether to include edge cases (NaN, Infinity, etc.) */
  includeEdgeCases?: boolean;
  /** Maximum array size */
  maxArrayLength?: number;
  /** Maximum nesting depth for recursive structures */
  maxDepth?: number;
  /** Maximum object property count */
  maxObjectProperties?: number;
  /** Optional seed for reproducible generation */
  seedValue?: number;
}

/**
 * Represents a dot-notation or bracket-notation keypath for accessing nested
 * object properties.
 *
 * @group Utility Types
 */
export type Keypath<S extends string = string> =
  S extends `${infer K}.${infer Rest}`
    ? K extends string
      ? Rest extends string
        ? `${K}.${Keypath<Rest>}`
        : never
      : never
    : S extends `${infer K}[${infer Index}]${infer Rest}`
      ? K extends string
        ? Index extends `"${string}"` | `${number}` | `'${string}'`
          ? Rest extends ''
            ? `${K}[${Index}]`
            : Rest extends `.${infer RestPath}`
              ? `${K}[${Index}].${Keypath<RestPath>}`
              : Rest extends `[${infer NextIndex}]${infer RestPath}`
                ? `${K}[${Index}][${NextIndex}]${RestPath extends '' ? '' : Keypath<RestPath>}`
                : never
          : never
        : never
      : S;

/**
 * Maps `AssertionParts` to the corresponding argument types for `expect` and
 * `expectAsync` functions.
 *
 * This utility type transforms assertion parts into the actual parameter types
 * that users provide when calling expect functions. It handles both phrase
 * literals and Zod schemas, creating appropriate `TypeScript` types for each
 * slot.
 *
 * For phrase literals, it creates union types that include both the original
 * phrase and its negated version (with `"not "` prefix). For Zod schemas, it
 * extracts the inferred type. This enables natural language assertions with
 * optional negation support.
 *
 * @remarks
 * This type works recursively through the parts tuple, transforming each part
 * according to its type. The resulting tuple maintains the same structure as
 * the input but with user-facing `TypeScript` types instead of internal
 * assertion part types.
 * @example
 *
 * ```typescript
 * // Given parts: ['to be a', z.string()]
 * // Results in: ['to be a' | 'not to be a', string]
 * type Slots = MapExpectSlots<['to be a', z.string()]>;
 * // Usage: expect(value, 'to be a', 'hello') or expect(value, 'not to be a', 'hello')
 * ```
 *
 * @template Parts - Tuple of assertion parts to be converted to function
 *   parameter types
 * @see {@link SlotsFromParts} for the complete slot transformation including subject injection
 * @see {@link Negation} for how phrase negation is implemented
 */
export type MapExpectSlots<Parts extends readonly AssertionPart[]> =
  Parts extends readonly [
    infer First extends AssertionPart,
    ...infer Rest extends readonly AssertionPart[],
  ]
    ? readonly [
        AssertionSlot<First> extends PhraseLiteralSlot<infer StringLiteral>
          ? Negation<StringLiteral> | StringLiteral
          : AssertionSlot<First> extends PhraseLiteralChoiceSlot<
                infer StringLiterals
              >
            ?
                | ArrayValues<StringLiterals>
                | Negation<ArrayValues<StringLiterals>>
            : AssertionSlot<First> extends StandardSchemaV1<infer U>
              ? U extends (infer V)[]
                ? MutableOrReadonly<V[]>
                : U
              : never,
        ...MapExpectSlots<Rest>,
      ]
    : readonly [];

/**
 * Memory usage statistics.
 */
export interface MemoryStats {
  /** External memory */
  external: number;
  /** Total heap memory */
  heapTotal: number;
  /** Heap memory used */
  heapUsed: number;
}

/**
 * Makes tuple types accept both mutable and readonly variants.
 *
 * This utility type creates a union of both mutable and readonly versions of a
 * tuple type, providing flexibility for function parameters that should accept
 * either variant. This is particularly useful for assertion function parameters
 * where users may pass either `const` arrays (readonly) or regular arrays.
 *
 * The type handles both array types and specific tuple types, creating
 * appropriate unions for each case to maintain type safety while maximizing
 * usability.
 *
 * @example
 *
 * ```typescript
 * type FlexibleArgs = MutableOrReadonly<readonly [string, number]>;
 * // Results in: [string, number] | readonly [string, number]
 *
 * function acceptArgs(args: FlexibleArgs) { ... }
 * acceptArgs(['hello', 42]);           // ✓ mutable array
 * acceptArgs(['hello', 42] as const);  // ✓ readonly array
 * ```
 *
 * @template Tuple - The readonly tuple type to make flexible
 * @group Utility Types
 * @see {@link ExpectFunction} and {@link ExpectAsyncFunction} which use this for parameter flexibility
 */
export type MutableOrReadonly<Tuple extends readonly unknown[]> =
  Tuple extends readonly [infer First, ...infer Rest]
    ? [First, ...Rest] | readonly [First, ...Rest]
    : Tuple extends readonly (infer Item)[]
      ? Item[] | readonly Item[]
      : Tuple;

/**
 * Creates a negated version of a phrase literal by prefixing `"not "`.
 *
 * This utility type transforms assertion phrases into their negated
 * equivalents, enabling the natural language negation feature in <span
 * class="bupkis">BUPKIS</span> assertions. When users provide phrases like
 * `"not to be a string"`, this type helps the system understand and process the
 * negation.
 *
 * The negation is applied at the type level during assertion matching and
 * affects how the assertion logic is executed - negated assertions expect the
 * opposite result.
 *
 * @example
 *
 * ```typescript
 * type Negated = Negation<'to be a string'>; // "not to be a string"
 * type AlsoNegated = Negation<'to equal'>; // "not to equal"
 *
 * // Usage in assertions:
 * expect(42, 'not to be a string'); // Uses negated assertion logic
 * ```
 *
 * @template S - The string literal phrase to be negated
 * @see {@link AddNegation} for applying negation to entire `AssertionParts` tuples
 * @see {@link MapExpectSlots} for how negation is incorporated into function signatures
 */
export type Negation<S extends string> = `not ${S}`;

/**
 * Performance analysis results.
 */
export interface PerformanceAnalysis {
  /** Identified bottlenecks */
  bottlenecks: Array<{
    category: string;
    impact: 'high' | 'low' | 'medium';
    opsPerSecond: number;
    reason: string;
  }>;
  /** Statistical outliers */
  outliers: Array<{
    category: string;
    deviation: number;
    options: ValueToSchemaOptions;
    value: number;
  }>;
  /** Summary statistics */
  summary: {
    averageOpsPerSecond: number;
    fastestCategory: string;
    slowestCategory: string;
    totalExecutionTime: number;
  };
  /** Performance trends */
  trends: Array<{
    description: string;
    factor: string;
    impact: number;
  }>;
}

/**
 * Performance metrics for a benchmark run.
 */
export interface PerformanceMetrics {
  /** Timing statistics */
  executionTime: ExecutionTimeStats;
  /** Category of input being measured */
  inputCategory: string;
  /** Memory allocation data (if available) */
  memoryUsage?: MemoryStats;
  /** Throughput measurement (operations per second) */
  operationsPerSecond: number;
  /** Configuration used for this measurement */
  options: ValueToSchemaOptions;
  /** When measurement was taken */
  timestamp: Date;
}

/**
 * Converts `AssertionParts` to complete function parameter types for expect
 * functions.
 *
 * This utility type prepares assertion parts for use as function parameters by
 * applying several transformations:
 *
 * 1. Injects an `unknown` type for the subject parameter if the first part is a
 *    phrase literal
 * 2. Maps the remaining parts to their corresponding `TypeScript` types via
 *    {@link MapExpectSlots}
 * 3. Filters out `never` types to ensure a clean tuple structure
 *
 * The subject injection is a key feature - when assertions start with phrases
 * like `"to be a string"`, users still need to provide the subject being tested
 * as the first argument to expect functions.
 *
 * @remarks
 * This type is essential for bridging the gap between assertion definitions and
 * user-facing function signatures. The subject injection ensures that all
 * assertions have a consistent calling pattern regardless of whether they
 * explicitly define a subject parameter.
 * @example
 *
 * ```typescript
 * // Assertion parts: ['to equal', z.string()]
 * // Results in: [unknown, 'to equal' | 'not to equal', string]
 * type Slots = SlotsFromParts<['to equal', z.string()]>;
 *
 * // Usage: expect(subject, 'to equal', 'expected')
 * //        expect(subject, 'not to equal', 'unexpected')
 * ```
 *
 * @template Parts - Tuple of assertion parts that define the assertion
 *   structure
 * @group Expect-Related
 * @see {@link MapExpectSlots} for the core slot mapping logic
 * @see {@link NoNeverTuple} for never-type filtering
 */
export type SlotsFromParts<Parts extends AssertionParts> = NoNeverTuple<
  Parts extends readonly [infer First extends AssertionPart, ...infer _]
    ? First extends PhraseLiteral | PhraseLiteralChoice
      ? [unknown, ...MapExpectSlots<Parts>]
      : MapExpectSlots<Parts>
    : never
>;

/**
 * Gets the tail (all elements except the first) of a tuple type.
 *
 * Unlike ArrayTail from type-fest, this preserves the tuple structure as a
 * readonly tuple rather than converting to an array type.
 *
 * @example
 *
 * ```typescript
 * type Example = TupleTail<readonly [string, number, boolean]>; // readonly [number, boolean]
 * type Single = TupleTail<readonly [string]>; // readonly []
 * type Empty = TupleTail<readonly []>; // readonly []
 * ```
 *
 * @template T - The tuple type to get the tail of
 * @group Utility Types
 */
export type TupleTail<T extends readonly unknown[]> = T extends readonly [
  unknown,
  ...infer Rest,
]
  ? Rest
  : readonly [];

/**
 * The type of a `use()` function.
 *
 * @group Core API
 */
export interface UseFn<
  BaseSyncAssertionWrapper extends AnySyncAssertionWrapper,
  BaseAsyncAssertionWrapper extends AnyAsyncAssertionWrapper,
> {
  /**
   * @template MixedAssertions Mixed set of assertions to add; may include both
   *   sync and async assertions
   * @param assertions Array of assertion classes to add
   * @returns New {@link expect} and {@link expectAsync} functions with the
   *   combined assertions
   */
  <const MixedAssertions extends readonly AnyAssertion[]>(
    assertions: MixedAssertions,
  ): Bupkis<
    BaseSyncAssertionWrapper,
    BaseAsyncAssertionWrapper,
    FilterAndWrapSyncAssertions<MixedAssertions>,
    FilterAndWrapAsyncAssertions<MixedAssertions>
  >;
}

/**
 * Maps Zod `def.type` strings to their corresponding `ZodType` classes.
 *
 * This allows for type-safe discrimination of `ZodType`s based on their
 * internal `def.type` property in Zod v4.
 *
 * @group Utility Types
 */
export interface ZodTypeMap {
  any: z.ZodAny;
  array: z.ZodArray;
  bigint: z.ZodBigInt;
  boolean: z.ZodBoolean;
  catch: z.ZodCatch;
  custom: z.ZodCustom;
  date: z.ZodDate;
  default: z.ZodDefault;
  enum: z.ZodEnum;
  function: z.ZodFunction;
  intersection: z.ZodIntersection;
  lazy: z.ZodLazy;
  literal: z.ZodLiteral;
  map: z.ZodMap;
  never: z.ZodNever;
  nonoptional: z.ZodNonOptional;
  null: z.ZodNull;
  nullable: z.ZodNullable;
  number: z.ZodNumber;
  object: z.ZodObject;
  optional: z.ZodOptional;
  pipe: z.ZodPipe;
  promise: z.ZodPromise;
  readonly: z.ZodReadonly;
  record: z.ZodRecord;
  set: z.ZodSet;
  string: z.ZodString;
  symbol: z.ZodSymbol;
  tuple: z.ZodTuple;
  undefined: z.ZodUndefined;
  union: z.ZodUnion;
  unknown: z.ZodUnknown;
  void: z.ZodVoid;
}

/**
 * Splits an assertion chain on `'and'` and matches each chunk against the
 * available assertions, rejoining on failure (see {@link RejoinMatchChunks}).
 */
type AssertionChainToMatchedAssertions<
  Args extends unknown[],
  Assertions extends AnyAssertionWrapper,
> = RejoinMatchChunks<SplitOnAnd<Args>, Assertions>;

/**
 * @groupDescription Benchmark Types
 * Types for valueToSchema() benchmark functionality.
 */

/**
 * Computes the "widest" subject type that simultaneously satisfies every
 * assertion in a chain. Within a chunk the matched assertions' input types are
 * unioned; across chunks they are intersected. Mutually exclusive chunks
 * collapse to `never`.
 */
type AssertionChainToWidestType<
  Args extends unknown[],
  Assertions extends AnyAssertionWrapper,
> = TupleToIntersection<
  MapChunkInputs<AssertionChainToMatchedAssertions<Args, Assertions>>
>;

/**
 * Maps a tuple of matched assertions (per chunk) to a tuple of their input
 * types via {@link MatchedAssertionInput}.
 */
type MapChunkInputs<Matched extends readonly unknown[]> = {
  [K in keyof Matched]: MatchedAssertionInput<Matched[K]>;
};

/**
 * Union of the {@link NonExtendable | wrapped} assertions whose
 * {@link GetAssertionArgs | argument type} is satisfied by `Chunk`, or `never`.
 * Distributes over `Assertions`. This per-chunk walk over the whole assertion
 * union is the expensive part (see the section comment on scaling).
 */
type MatchAssertionChunk<Chunk, Assertions extends AnyAssertionWrapper> =
  Assertions extends NonExtendable<infer U extends AnyAssertion>
    ? Chunk extends GetAssertionArgs<U>
      ? Assertions
      : never
    : never;

/**
 * Unwraps matched {@link NonExtendable | wrapped} assertion(s) into the union of
 * their {@link GetAssertionInput | input types}; `never` yields `never`.
 */
type MatchedAssertionInput<Matched> =
  Matched extends NonExtendable<infer U extends AnyAssertion>
    ? GetAssertionInput<U>
    : never;

/**
 * Matches each chunk produced by {@link SplitOnAnd} against the available
 * assertions, rejoining over `'and'` when a chunk fails.
 *
 * {@link SplitOnAnd} splits on _every_ `'and'`, but some assertions carry a bare
 * `'and'` in their own parts (e.g. `'to be between' X 'and' Y`), so a chunk
 * like `['to be between', X]` matches nothing on its own. When a chunk fails to
 * match, this rejoins it with the following chunk (reinserting the `'and'` that
 * `SplitOnAnd` removed) and retries — the type-level analogue of the runtime
 * `generateRejoinPermutations` fallback. A genuinely unmatched final chunk
 * yields `never`, so {@link TupleHasNever} still flags invalid chains.
 */
type RejoinMatchChunks<
  Chunks extends readonly unknown[],
  Assertions extends AnyAssertionWrapper,
> = Chunks extends readonly [
  infer Chunk extends unknown[],
  ...infer Rest extends unknown[][],
]
  ? MatchAssertionChunk<Chunk, Assertions> extends infer Matched
    ? [Matched] extends [never]
      ? Rest extends readonly [
          infer Next extends unknown[],
          ...infer Rest2 extends unknown[][],
        ]
        ? RejoinMatchChunks<[[...Chunk, 'and', ...Next], ...Rest2], Assertions>
        : readonly [never]
      : readonly [Matched, ...RejoinMatchChunks<Rest, Assertions>]
    : never
  : readonly [];

/**
 * Splits a chain on the literal `'and'`, producing a tuple of chunks.
 */
type SplitOnAnd<
  Parts extends unknown[],
  Current extends unknown[] = [],
  Acc extends unknown[][] = [],
> = Parts extends [infer Head, ...infer Tail]
  ? Head extends 'and'
    ? SplitOnAnd<Tail, [], [...Acc, Current]>
    : SplitOnAnd<Tail, [...Current, Head], Acc>
  : [...Acc, Current];

/**
 * Resolves to `true` when any element of the tuple `T` is `never`.
 */
type TupleHasNever<T extends readonly unknown[]> = T extends readonly [
  infer Head,
  ...infer Tail,
]
  ? [Head] extends [never]
    ? true
    : TupleHasNever<Tail>
  : false;

/**
 * Intersects every element of the tuple `T`, preserving per-element unions
 * (`[Foo | Bar, Baz]` becomes `(Foo | Bar) & Baz`).
 */
type TupleToIntersection<T extends readonly unknown[]> = T extends readonly [
  infer Head,
  ...infer Tail,
]
  ? Head & TupleToIntersection<Tail>
  : unknown;
