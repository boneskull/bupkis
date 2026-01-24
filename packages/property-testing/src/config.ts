/**
 * Contains types related to configuration of property-based tests; see
 * {@link PropertyTestConfig}.
 *
 * Given that there are so many assertions and the strategies to test them are
 * all very similar, it makes (at least some) sense to dynamically generate
 * tests based on configuration.
 *
 * @packageDocumentation
 */

import type fc from 'fast-check';
import type { Parameters } from 'fast-check';

import { z } from 'zod';

/**
 * Defines how to generate assertion arguments for property-based tests.
 *
 * Two forms are supported:
 *
 * 1. **Single Arbitrary** returning a tuple: Useful when subject/phrase/params
 *    have interdependencies and must be generated together.
 * 2. **Array of Arbitraries**: Each element generates one argument independently.
 *    Elements are: `[subject, phrase, ...params]`.
 *
 * @example Single arbitrary (coordinated generation):
 *
 * ```ts
 * fc.tuple(fc.string(), fc.constantFrom('to be a string'));
 * ```
 *
 * @example Array form (independent generation):
 *
 * ```ts
 * [fc.string(), fc.constantFrom('to be a string', 'to be str')];
 * ```
 *
 * @group Configuration
 */
export type GeneratorParams =
  | fc.Arbitrary<readonly [subject: unknown, phrase: string, ...unknown[]]>
  | readonly [
      subject: fc.Arbitrary<any>,
      phrase: fc.Arbitrary<string>,
      ...fc.Arbitrary<any>[],
    ];

/**
 * Extracts the concrete sync property variant type from a union.
 *
 * Used in type guards to narrow `PropertyTestConfigVariant` to its sync
 * property form.
 */
export type InferPropertyTestConfigVariantProperty<T> =
  T extends PropertyTestConfigVariantProperty<infer U>
    ? PropertyTestConfigVariantProperty<U>
    : never;

/**
 * Configuration for property-based tests that extends
 * {@link Parameters fast-check's Parameters}.
 *
 * Split into four different variants to allow specific configuration for valid
 * (non-throwing) and invalid (throwing) cases, both for normal and negated
 * assertions.
 *
 * Generally, only `valid` and `invalid` are needed, since for most assertions,
 * `valid` will be the same as `invalidNegated`, and `invalid` will be the same
 * as `validNegated`.
 *
 * @group Configuration
 */
export interface PropertyTestConfig extends PropertyTestConfigParameters {
  /**
   * Generator for invalid input (should fail the assertion)
   */
  invalid: PropertyTestConfigVariant;
  /**
   * Generator for invalid input in negated form (should fail the negated
   * assertion)
   */
  invalidNegated?: PropertyTestConfigVariant | undefined;
  /**
   * Generator for valid input (should pass the assertion)
   */
  valid: PropertyTestConfigVariant;
  /**
   * Generator for valid input in negated form (should pass the negated
   * assertion)
   */
  validNegated?: PropertyTestConfigVariant | undefined;
}

/**
 * {@link Parameters} from `fc` which are used in our property-based tests.
 *
 * This allows us to provide any config option for `fc.property()` for any of
 * our various use-cases. These configurations are applied in a cascading
 * manner, with variant-specific first, then config-level, then finally defaults
 * (defined elsewhere).
 *
 * @group Configuration
 */
export interface PropertyTestConfigParameters extends Parameters<any> {
  numRuns?: never;
  runSize?: 'large' | 'medium' | 'small' | undefined;
}

/**
 * Configuration for a specific variant of an assertion in property-based tests.
 *
 * For basic assertions, the `generators` tuple contains:
 *
 * - `subject`: Creates random values that should pass the assertion
 * - `phrase`: Creates phrase strings chosen from the assertion's phrase
 *   literal(s)
 *
 * For parameterized assertions, the "rest" of the tuple contains generators for
 * the parameter and extra phrase literals / parameters that may follow.
 *
 * @group Configuration
 */
export type PropertyTestConfigVariant =
  | PropertyTestConfigVariantAsyncGenerators
  | PropertyTestConfigVariantAsyncProperty<any>
  | PropertyTestConfigVariantProperty<any>
  | PropertyTestConfigVariantSyncGenerators;

/**
 * Variant configuration for async assertions using generator-based input.
 *
 * Identical to {@link PropertyTestConfigVariantSyncGenerators} but with `async:
 * true`, indicating that `expectAsync` should be used instead of `expect`.
 *
 * @group Configuration
 */
export interface PropertyTestConfigVariantAsyncGenerators extends PropertyTestConfigVariantSyncGenerators {
  async: true;
}

/**
 * Variant configuration using a custom async fast-check property.
 *
 * Use this when generator-based testing is insufficient and you need full
 * control over the property logic, such as testing complex async flows or
 * assertions that require special setup/teardown.
 *
 * @group Configuration
 */
export interface PropertyTestConfigVariantAsyncProperty<
  T = any,
> extends PropertyTestConfigParameters {
  asyncProperty: () => fc.IAsyncProperty<T> | fc.IAsyncPropertyWithHooks<T>;
}

/**
 * Variant configuration for model-based testing with fast-check commands.
 *
 * Enables stateful property testing where a sequence of commands is applied to
 * both a model (expected behavior) and a real implementation, verifying they
 * remain consistent.
 *
 * @group Configuration
 * @see {@link https://fast-check.dev/docs/advanced/model-based-testing/ | fast-check Model-Based Testing}
 */
export interface PropertyTestConfigVariantModel<
  Model extends object,
  Real,
> extends PropertyTestConfigParameters {
  commands: fc.Arbitrary<fc.Command<Model, Real>>[];
  commandsConstraints: fc.CommandsContraints;
  initialState: fc.ModelRunSetup<Model, Real>;
}

/**
 * Variant configuration using a custom sync fast-check property.
 *
 * Use this when generator-based testing is insufficient and you need full
 * control over the property logic, such as testing assertions with complex
 * preconditions or custom shrinking behavior.
 *
 * @group Configuration
 */
export interface PropertyTestConfigVariantProperty<
  T = any,
> extends PropertyTestConfigParameters {
  property: () => fc.IProperty<T> | fc.IPropertyWithHooks<T>;
}

/**
 * Variant configuration for sync assertions using generator-based input.
 *
 * This is the most common variant type. The harness automatically combines the
 * generators, runs the assertion, and verifies behavior based on the variant
 * name (valid/invalid/negated).
 *
 * @group Configuration
 */
export interface PropertyTestConfigVariantSyncGenerators extends PropertyTestConfigParameters {
  generators: GeneratorParams;
}

/**
 * Zod schema for {@link PropertyTestConfigParameters}.
 */
const PropertyTestConfigParametersSchema = z.looseObject({
  runSize: z.enum(['small', 'medium', 'large']).optional(),
});

/**
 * Zod schema for {@link PropertyTestConfigVariant}
 */
export const PropertyTestConfigVariantSchema = z.union([
  z.object({
    ...PropertyTestConfigParametersSchema.shape,
    generators: z.union([z.any(), z.array(z.any())]),
  }),
  z.object({
    ...PropertyTestConfigParametersSchema.shape,
    async: z.literal(true),
    generators: z.union([z.any(), z.array(z.any())]),
  }),
  z.object({
    ...PropertyTestConfigParametersSchema.shape,
    property: z.function({
      input: [],
      // eslint-disable-next-line zod/no-empty-custom-schema -- opaque type from fast-check
      output: z.custom<fc.IProperty<any> | fc.IPropertyWithHooks<any>>(),
    }),
  }),
  z.object({
    ...PropertyTestConfigParametersSchema.shape,
    asyncProperty: z.function({
      input: [],
      // eslint-disable-next-line zod/no-empty-custom-schema -- opaque type from fast-check
      output: z.custom<
        fc.IAsyncProperty<any> | fc.IAsyncPropertyWithHooks<any>
      >(),
    }),
  }),
]);

/**
 * Zod schema for {@link PropertyTestConfig}
 */
const PropertyTestConfigSchema: z.ZodType<PropertyTestConfig> =
  PropertyTestConfigParametersSchema.extend({
    invalid: z.lazy(() => PropertyTestConfigVariantSchema),
    invalidNegated: z.lazy(() => PropertyTestConfigVariantSchema).optional(),
    valid: z.lazy(() => PropertyTestConfigVariantSchema),
    validNegated: z.lazy(() => PropertyTestConfigVariantSchema).optional(),
  });

export { PropertyTestConfigSchema };
