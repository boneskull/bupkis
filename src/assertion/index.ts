/**
 * Assertion creation and management utilities.
 *
 * This module provides the main `Assertion` class and factory functions for
 * creating custom assertions. It serves as the primary interface for assertion
 * construction and configuration.
 *
 * @packageDocumentation
 */

import { Assertion } from './assertion.js';

export const { fromParts: createAssertion } = Assertion;

export { Assertion };
