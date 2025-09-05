/**
 * Property test configuration and utilities.
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
 * - First generator: Creates random values that should pass the assertion
 * - Second generator: Creates random phrase strings from the assertion's parts
 *
 * For parameterized assertions, the tuple contains:
 *
 * - First generator: Creates random subjects (values being tested)
 * - Second generator: Creates random phrase strings from the assertion's parts
 * - Additional generators: Create parameters for the assertion
 */
interface PropertyTestConfigVariantConfig extends PropertyTestConfigParameters {
  generators: readonly [
    fc.Arbitrary<any>,
    fc.Arbitrary<string>,
    ...fc.Arbitrary<any>[],
  ];
}
