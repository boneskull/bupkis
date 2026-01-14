/**
 * Error types thrown by _BUPKIS_, including {@link AssertionError}.
 *
 * @privateRemarks
 * Other custom errors should go here.
 * @packageDocumentation
 */

import { AssertionError as NodeAssertionError } from 'node:assert';
import { type LiteralStringUnion } from 'type-fest/source/literal-union.js';

import {
  FAIL,
  kBupkisAssertionError,
  kBupkisError,
  kBupkisFailAssertionError,
  kBupkisNegatedAssertionError,
} from './constant.js';
import { isA } from './guards.js';

const { hasOwn } = Object;

/**
 * Options for {@link AssertionError}'s constructor
 *
 * @remarks
 * Based on Node.js' {@link NodeAssertionError}'s constructor options, sans
 * `operator`.
 * @group Error Options
 */
export type AssertionErrorOptions = Partial<
  Omit<
    NonNullable<ConstructorParameters<typeof NodeAssertionError>[0]>,
    'operator'
  >
> & { id: string };

/**
 * Options for {@link AssertionImplementationError}
 *
 * @group Error Options
 */
export interface AssertionImplementationErrorOptions extends ErrorOptions {
  /**
   * The result returned by an assertion implementation that caused this error.
   */
  result?: unknown;
}
export type FailAssertionErrorOptions = Omit<AssertionErrorOptions, 'id'>;

/**
 * Options for {@link InvalidMetadataError}
 *
 * @group Error Options
 */
export interface InvalidMetadataErrorOptions extends ErrorOptions {
  /**
   * The invalid metadata.
   */
  metadata?: unknown;
}

/**
 * Options for {@link InvalidObjectSchemaError}
 *
 * @group Error Options
 */
export interface InvalidSchemaErrorOptions extends ErrorOptions {
  /**
   * The invalid schema
   */
  schema?: unknown;
}

/**
 * Options for {@link UnknownAssertionError}
 *
 * @group Error Options
 */
export interface UnknownAssertionErrorOptions<
  T extends readonly unknown[],
> extends ErrorOptions {
  /**
   * The arguments passed to {@link bupkis!expect | expect} or
   * {@link bupkis!expectAsync | expectAsync} which caused this error.
   */
  args: T;
}

/**
 * _BUPKIS_' s custom `AssertionError` class, which is just a thin wrapper
 * around Node.js' {@link NodeAssertionError AssertionError}.
 *
 * @group Core API
 * @group Errors
 */
export class AssertionError extends NodeAssertionError {
  /**
   * Assertion ID of the assertion that caused this error.
   */
  readonly assertionId: LiteralStringUnion<typeof FAIL>;

  /**
   * @internal
   */
  [kBupkisAssertionError] = true;

  override name = 'AssertionError';

  constructor(options: AssertionErrorOptions) {
    super(options);
    this.assertionId = options.id;
  }

  /**
   * Type guard for an instance of this error.
   *
   * @param value Some value
   * @returns `true` if `value` is an instance of `AssertionError`
   */
  static isAssertionError(value: unknown): value is AssertionError {
    return (
      isA(value, NodeAssertionError) && hasOwn(value, kBupkisAssertionError)
    );
  }

  toJSON() {
    return {
      actual: this.actual,
      expected: this.expected,
      message: this.message,
      name: this.name,
      stack: this.stack,
    };
  }
}

/**
 * Base class for all custom errors thrown by <span
 * class="bupkis">BUPKIS</span>.
 *
 * Typically only thrown when it should be impossible to throw.
 *
 * @group Errors
 */
export class BupkisError extends Error {
  [kBupkisError] = true;

  override name = 'BupkisError';

  static isBupkisError(err: unknown): err is BupkisError {
    return isA(err, Error) && hasOwn(err, kBupkisError);
  }
}

/**
 * Error type used when an assertion implementation throws an error (this likely
 * means there's a bug in the assertion implementation).
 *
 * @group Errors
 */
export class AssertionImplementationError extends BupkisError {
  readonly code = 'ERR_BUPKIS_ASSERTION_IMPL';

  override name = 'AssertionImplementationError';

  readonly result: unknown;

  constructor(
    message: string,
    options: AssertionImplementationErrorOptions = {},
  ) {
    const { result, ...rest } = options;
    super(message, rest);
    this.result = result;
  }

  static isAssertionImplementationError(
    err: unknown,
  ): err is AssertionImplementationError {
    return isA(err, AssertionImplementationError);
  }
}

/**
 * Variant of an {@link AssertionError} that is thrown when
 * {@link bupkis!expect.fail} is called.
 *
 * @group Errors
 */
export class FailAssertionError extends AssertionError {
  /**
   * @internal
   */
  [kBupkisFailAssertionError] = true;

  override name = 'FailAssertionError';

  constructor(options?: FailAssertionErrorOptions) {
    super({ ...options, id: FAIL });
  }

  static isFailAssertionError(err: unknown): err is FailAssertionError {
    return (
      isA(err, FailAssertionError) && hasOwn(err, kBupkisFailAssertionError)
    );
  }
}

/**
 * Error type used when assertion metadata is invalid.
 *
 * @remarks
 * This should never be thrown unless someone monkeyed with the metadata
 * registry.
 * @group Errors
 */
export class InvalidMetadataError extends BupkisError {
  readonly code = 'ERR_BUPKIS_INVALID_METADATA';

  readonly metadata?: unknown;

  override name = 'InvalidMetadataError';

  constructor(message: string, options: InvalidMetadataErrorOptions = {}) {
    const { metadata, ...rest } = options;
    super(message, rest);
    this.metadata = metadata;
  }
}

/**
 * Thrown from certain assertions when a parameter cannot be used as an "object
 * schema"
 *
 * @group Errors
 */
export class InvalidObjectSchemaError extends BupkisError {
  readonly code = 'ERR_BUPKIS_INVALID_OBJECT_SCHEMA';

  override name = 'InvalidObjectSchemaError';

  readonly schema?: unknown;

  constructor(message: string, options: InvalidSchemaErrorOptions = {}) {
    const { schema, ...rest } = options;
    super(message, rest);
    this.schema = schema;
  }
}

/**
 * Error type used internally to catch failed negated assertions.
 *
 * @group Errors
 */
export class NegatedAssertionError extends AssertionError {
  [kBupkisNegatedAssertionError] = true;

  override name = 'NegatedAssertionError';

  static isNegatedAssertionError(err: unknown): err is NegatedAssertionError {
    return (
      isA(err, AssertionError) && hasOwn(err, kBupkisNegatedAssertionError)
    );
  }
}

/**
 * Thrown when a value cannot be converted to a schema using `valueToSchema()`.
 *
 * @remarks
 * Currently, this is thrown when encountering an empty object as a value
 * (because this will match anything; though maybe we should change that).
 * @group Errors
 */
export class SatisfactionError extends BupkisError {
  readonly code = 'ERR_BUPKIS_SATISFACTION';

  override name = 'SatisfactionError';

  constructor(message: string, options: ErrorOptions = {}) {
    super(message, options);
  }
}

/**
 * Thrown when `expect()` is called with something async.
 *
 * @group Errors
 */
export class UnexpectedAsyncError extends BupkisError {
  readonly code = 'ERR_BUPKIS_UNEXPECTED_ASYNC';

  override name = 'UnexpectedAsyncError';
}

/**
 * Thrown when we cannot match the parameters to {@link bupkis!expect | expect}
 * or {@link bupkis!expectAsync | expectAsync} to any known assertion.
 *
 * @group Errors
 */
export class UnknownAssertionError<
  T extends readonly unknown[],
> extends BupkisError {
  readonly args: T;

  readonly code = 'ERR_BUPKIS_UNKNOWN_ASSERTION';

  override name = 'UnknownAssertionError';

  constructor(message: string, options: UnknownAssertionErrorOptions<T>) {
    const { args, ...rest } = options;
    super(message, rest);
    this.args = args;
  }
}
