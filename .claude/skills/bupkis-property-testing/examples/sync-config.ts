/**
 * Example: Sync assertion property test config
 *
 * This shows how to write a PropertyTestConfig for a sync assertion that checks
 * if an EventEmitter has a listener for a specific event.
 */

import {
  extractPhrases,
  type PropertyTestConfig,
} from '@bupkis/property-testing';
import fc from 'fast-check';
import { EventEmitter } from 'node:events';

// Assume this is your assertion definition
declare const hasListenerForAssertion: {
  readonly id: string;
};

/**
 * Config for hasListenerForAssertion
 *
 * Assertion signature: expect(emitter, 'to have listener for', eventName)
 *
 * Key patterns demonstrated:
 *
 * 1. Fc.chain() to create configured emitter and return same reference
 * 2. ExtractPhrases() for assertions with multiple phrase variants
 * 3. Different strategies for valid vs invalid cases
 */
export const hasListenerForConfig: PropertyTestConfig = {
  // Invalid case: emitter has NO listener for the event
  // This comes first alphabetically (ESLint sort-keys)
  invalid: {
    generators: fc.string({ minLength: 1 }).chain((eventName) =>
      fc.tuple(
        fc.constant(new EventEmitter()), // Fresh emitter, no listeners
        fc.constantFrom(...extractPhrases(hasListenerForAssertion)),
        fc.constant(eventName),
      ),
    ),
  },

  // Valid case: emitter HAS a listener for the event
  valid: {
    generators: fc.string({ minLength: 1 }).chain((eventName) => {
      // Create and configure emitter inside chain
      const emitter = new EventEmitter();
      emitter.on(eventName, () => {}); // Add listener for generated event

      return fc.tuple(
        fc.constant(emitter), // Same emitter we configured
        fc.constantFrom(...extractPhrases(hasListenerForAssertion)),
        fc.constant(eventName), // Same event name
      );
    }),
  },
};

/**
 * Config for hasListenerCountAssertion
 *
 * Assertion signature: expect(emitter, 'to have listener count', eventName,
 * count)
 *
 * Key patterns demonstrated:
 *
 * 1. Fc.tuple() to generate multiple related values
 * 2. Fc.filter() to ensure actual !== expected for invalid cases
 * 3. Loop to add exact number of listeners
 */
export const hasListenerCountConfig: PropertyTestConfig = {
  invalid: {
    generators: fc
      .tuple(
        fc.string({ minLength: 1 }),
        fc.integer({ min: 0, max: 5 }), // actual count
        fc.integer({ min: 0, max: 5 }), // expected count
      )
      .filter(([_, actual, expected]) => actual !== expected) // Must differ
      .chain(([eventName, actualCount, expectedCount]) => {
        const emitter = new EventEmitter();
        // Add actualCount listeners
        for (let i = 0; i < actualCount; i++) {
          emitter.on(eventName, () => {});
        }
        return fc.tuple(
          fc.constant(emitter),
          fc.constant('to have listener count'),
          fc.constant(eventName),
          fc.constant(expectedCount), // Expect wrong count
        );
      }),
  },

  valid: {
    generators: fc
      .tuple(fc.string({ minLength: 1 }), fc.integer({ min: 0, max: 5 }))
      .chain(([eventName, count]) => {
        const emitter = new EventEmitter();
        // Add exactly 'count' listeners
        for (let i = 0; i < count; i++) {
          emitter.on(eventName, () => {});
        }
        return fc.tuple(
          fc.constant(emitter),
          fc.constant('to have listener count'),
          fc.constant(eventName),
          fc.constant(count), // Expect correct count
        );
      }),
  },
};

/**
 * Config for non-parametric assertion (hasListenersAssertion)
 *
 * Assertion signature: expect(emitter, 'to have listeners')
 *
 * Key patterns demonstrated:
 *
 * 1. Array syntax for non-parametric assertions (subject + phrase only)
 * 2. No chaining needed when object doesn't depend on other generated values
 */
export const hasListenersConfig: PropertyTestConfig = {
  // Invalid: fresh emitter with no listeners
  // Array syntax is appropriate for non-parametric assertions
  invalid: {
    generators: [
      fc.constant(new EventEmitter()),
      fc.constant('to have listeners'),
    ],
  },

  // Valid: emitter with at least one listener
  valid: {
    generators: fc.string({ minLength: 1 }).chain((eventName) => {
      const emitter = new EventEmitter();
      emitter.on(eventName, () => {});
      return fc.tuple(fc.constant(emitter), fc.constant('to have listeners'));
    }),
  },
};
