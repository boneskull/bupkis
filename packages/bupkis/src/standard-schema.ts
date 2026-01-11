/**
 * Standard Schema v1 specification types.
 *
 * These types define the Standard Schema interface that enables
 * interoperability between different validation libraries (Zod, Valibot,
 * ArkType, etc.).
 *
 * @packageDocumentation
 * @see {@link https://standardschema.dev | Standard Schema Specification}
 */

/**
 * The Standard Schema interface.
 *
 * This is the primary interface that validation libraries implement to be
 * Standard Schema compliant. The interface is designed to be minimal and
 * non-invasive, tucked behind the `~standard` property to avoid API conflicts.
 *
 * @template Input - The input type accepted by the schema
 * @template Output - The output type produced after successful validation
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  /**
   * The Standard Schema properties.
   *
   * This property uses a tilde prefix to:
   *
   * - Avoid conflicts with existing library APIs
   * - De-prioritize in IDE autocomplete (tilde sorts after alphanumeric)
   * - Signal special/internal nature of the property
   */
  readonly '~standard': StandardSchemaV1.Props<Input, Output>;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace StandardSchemaV1 {
  /**
   * The result interface if validation fails.
   *
   * Contains an array of issues describing what went wrong during validation.
   */
  export interface FailureResult {
    /**
     * The issues of failed validation.
     *
     * Always present and non-empty when validation fails.
     */
    readonly issues: ReadonlyArray<Issue>;
  }

  /**
   * Infers the input type of a Standard Schema.
   *
   * Utility type for extracting the input type from a schema instance.
   *
   * @template Schema - The Standard Schema to extract the input type from
   */
  export type InferInput<Schema extends StandardSchemaV1> = NonNullable<
    Schema['~standard']['types']
  >['input'];

  /**
   * Infers the output type of a Standard Schema.
   *
   * Utility type for extracting the output type from a schema instance.
   *
   * @template Schema - The Standard Schema to extract the output type from
   */
  export type InferOutput<Schema extends StandardSchemaV1> = NonNullable<
    Schema['~standard']['types']
  >['output'];

  /**
   * The issue interface of the failure output.
   *
   * Describes a single validation problem, including a human-readable message
   * and optional path to the problematic value in nested structures.
   */
  export interface Issue {
    /**
     * The error message of the issue.
     *
     * Human-readable description of what validation rule was violated.
     */
    readonly message: string;

    /**
     * The path of the issue, if any.
     *
     * For nested structures, indicates where in the object/array hierarchy the
     * validation failed. Can contain property keys or path segment objects.
     */
    readonly path?: ReadonlyArray<PathSegment | PropertyKey> | undefined;
  }

  /**
   * The path segment interface of the issue.
   *
   * Allows path elements to carry additional metadata beyond just the key.
   */
  export interface PathSegment {
    /**
     * The key representing a path segment.
     *
     * Can be a string, number, or symbol identifying the path component.
     */
    readonly key: PropertyKey;
  }

  /**
   * The Standard Schema properties interface.
   *
   * Contains the actual validation logic and metadata required by the spec.
   *
   * @template Input - The input type accepted by the schema
   * @template Output - The output type produced after successful validation
   */
  export interface Props<Input = unknown, Output = Input> {
    /**
     * Inferred types associated with the schema.
     *
     * Optional property that allows TypeScript type inference for the schema.
     * Not all libraries may provide this.
     */
    readonly types?: Types<Input, Output> | undefined;

    /**
     * Validates unknown input values.
     *
     * This function performs validation and returns either a success result
     * with the validated/transformed data, or a failure result with validation
     * issues. May return a Promise for async validation.
     *
     * @param value - The unknown value to validate
     * @returns Result object or Promise resolving to result object
     */
    readonly validate: (
      value: unknown,
    ) => Promise<Result<Output>> | Result<Output>;

    /**
     * The vendor name of the schema library.
     *
     * Examples: 'zod', 'valibot', 'arktype', 'yup', etc.
     */
    readonly vendor: string;

    /**
     * The version number of the standard.
     *
     * Currently only version 1 is defined. Future versions will increment this
     * number to maintain backward compatibility.
     */
    readonly version: 1;
  }

  /**
   * The result interface of the validate function.
   *
   * A discriminated union that represents either successful or failed
   * validation.
   */
  export type Result<Output> = FailureResult | SuccessResult<Output>;

  /**
   * The result interface if validation succeeds.
   *
   * Contains the validated/transformed output value and explicitly sets
   * `issues` to undefined to distinguish from failure results.
   *
   * @template Output - The output type after successful validation
   */
  export interface SuccessResult<Output> {
    /**
     * The non-existent issues.
     *
     * Explicitly undefined to create a discriminated union with FailureResult.
     */
    readonly issues?: undefined;

    /**
     * The typed output value.
     *
     * This may be the same as the input or a transformed version, depending on
     * the schema's validation logic.
     */
    readonly value: Output;
  }

  /**
   * The Standard Schema types interface.
   *
   * Provides TypeScript type information for schemas that support type
   * inference.
   *
   * @template Input - The input type of the schema
   * @template Output - The output type of the schema
   */
  export interface Types<Input = unknown, Output = Input> {
    /**
     * The input type of the schema.
     *
     * The type of values that can be passed to the validate function.
     */
    readonly input: Input;

    /**
     * The output type of the schema.
     *
     * The type of values produced after successful validation.
     */
    readonly output: Output;
  }
}
