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

import { z } from 'zod/v4';

export type InferPropertyTestConfigVariantAsyncProperty<T> =
  T extends PropertyTestConfigVariantAsyncProperty<infer U>
    ? PropertyTestConfigVariantAsyncProperty<U>
    : never;

export type InferPropertyTestConfigVariantModel<
  T extends PropertyTestConfigVariant,
> =
  T extends PropertyTestConfigVariantModel<infer M, infer R>
    ? PropertyTestConfigVariantModel<M, R>
    : never;
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
 */
export type PropertyTestConfigVariant =
  | PropertyTestConfigVariantAsyncGenerators
  | PropertyTestConfigVariantAsyncProperty<any>
  | PropertyTestConfigVariantProperty<any>
  | PropertyTestConfigVariantSyncGenerators;

export interface PropertyTestConfigVariantAsyncGenerators
  extends PropertyTestConfigVariantSyncGenerators {
  async: true;
}

export interface PropertyTestConfigVariantAsyncProperty<T = any>
  extends PropertyTestConfigParameters {
  asyncProperty: () => fc.IAsyncProperty<T> | fc.IAsyncPropertyWithHooks<T>;
}

export interface PropertyTestConfigVariantModel<Model extends object, Real>
  extends PropertyTestConfigParameters {
  commands: fc.Arbitrary<fc.Command<Model, Real>>[];
  commandsConstraints: fc.CommandsContraints;
  initialState: fc.ModelRunSetup<Model, Real>;
}

export interface PropertyTestConfigVariantProperty<T = any>
  extends PropertyTestConfigParameters {
  property: () => fc.IProperty<T> | fc.IPropertyWithHooks<T>;
}

export interface PropertyTestConfigVariantSyncGenerators
  extends PropertyTestConfigParameters {
  generators:
    | fc.Arbitrary<readonly [subject: unknown, phrase: string, ...unknown[]]>
    | readonly [
        subject: fc.Arbitrary<any>,
        phrase: fc.Arbitrary<string>,
        ...fc.Arbitrary<any>[],
      ];
}

// Shared schema for PropertyTestConfigParameters
const PropertyTestConfigParametersSchema = z.looseObject({
  runSize: z.enum(['small', 'medium', 'large']).optional(),
});

/**
 * Zod schema for {@link PropertyTestConfigVariant}
 */
export const PropertyTestConfigVariantSchema = z.union([
  // PropertyTestConfigVariantSyncGenerators
  z.object({
    ...PropertyTestConfigParametersSchema.shape,
    generators: z.union([
      z.any(), // fc.Arbitrary<readonly [subject: unknown, phrase: string, ...unknown[]]>
      z.array(z.any()), // readonly [subject: fc.Arbitrary<any>, phrase: fc.Arbitrary<string>, ...fc.Arbitrary<any>[]]
    ]),
  }),
  // PropertyTestConfigVariantAsyncGenerators
  z.object({
    ...PropertyTestConfigParametersSchema.shape,
    async: z.literal(true),
    generators: z.union([z.any(), z.array(z.any())]),
  }),
  // PropertyTestConfigVariantProperty<T>
  z.object({
    ...PropertyTestConfigParametersSchema.shape,
    property: z.function({
      input: [],
      output: z.custom<fc.IProperty<any> | fc.IPropertyWithHooks<any>>(),
    }),
  }),
  // PropertyTestConfigVariantAsyncProperty<T>
  z.object({
    ...PropertyTestConfigParametersSchema.shape,
    asyncProperty: z.function({
      input: [],
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
