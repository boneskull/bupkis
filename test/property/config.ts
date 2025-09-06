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
  invalid: PropertyTestConfigVariantConfig;
  /**
   * Generator for invalid input in negated form (should fail the negated
   * assertion)
   */
  invalidNegated?: PropertyTestConfigVariantConfig;
  /**
   * Generator for valid input (should pass the assertion)
   */
  valid: PropertyTestConfigVariantConfig;
  /**
   * Generator for valid input in negated form (should pass the negated
   * assertion)
   */
  validNegated?: PropertyTestConfigVariantConfig;
}

/**
 * {@link Parameters} from `fc` which are used in our property-based tests.
 *
 * This allows us to provide any config option for `fc.property()` for any of
 * our various use-cases. These configurations are applied in a cascading
 * manner, with variant-specific first, then config-level, then finally defaults
 * (defined elsewhere).
 *
 * Omits `examples` from `Parameters` because this test suite uses pure
 * property-based testing with generators rather than example-based testing. The
 * `examples` property is for providing specific test cases, while `generators`
 * defines how to create random inputs that should satisfy the assertion
 * properties.
 */
export type PropertyTestConfigParameters = Omit<Parameters<any>, 'examples'>;

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
interface PropertyTestConfigVariantConfig extends PropertyTestConfigParameters {
  generators: readonly [
    subject: fc.Arbitrary<any>,
    phrase: fc.Arbitrary<string>,
    ...fc.Arbitrary<any>[],
  ];
}
