/**
 * Error types thrown by _BUPKIS_, including {@link AssertionError}.
 *
 * @privateRemarks
 * Other custom errors should go here.
 * @packageDocumentation
 */

import { AssertionError as NodeAssertionError } from 'node:assert';

import {
  kBupkisAssertionError,
  kBupkisError,
  kBupkisFailAssertionError,
  kBupkisNegatedAssertionError,
} from './constant.js';
import { isA } from './guards.js';

const { hasOwn } = Object;

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
 * Options for {@link InvalidSchemaError}
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
export interface UnknownAssertionErrorOptions<T extends readonly unknown[]>
  extends ErrorOptions {
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
   * @internal
   */
  [kBupkisAssertionError] = true;

  override name = 'AssertionError';

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
 * Thrown from certain assertions when the result of `valueToSchema` is invalid.
 *
 * @group Errors
 */
export class InvalidSchemaError extends BupkisError {
  readonly code = 'ERR_BUPKIS_INVALID_SCHEMA';

  override name = 'InvalidSchemaError';

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
 * @internal
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

/**
 * Thrown when a value cannot be converted to a schema using `valueToSchema()`.
 *
 * @remarks
 * Currently, this includes the presence of an own property `__proto__` or an
 * empty object (because this will match anything; though maybe we should change
 * that).
 * @group Errors
 */
export class ValueToSchemaError extends BupkisError {
  readonly code = 'ERR_BUPKIS_SATISFACTION';

  override name = 'SatisfactionError';

  constructor(message: string, options: ErrorOptions = {}) {
    super(message, options);
  }
}
