/**
 * Example: Async assertion property test config
 *
 * This shows how to write PropertyTestConfig for async assertions that involve
 * triggers and timeouts.
 */

import {
  extractPhrases,
  type PropertyTestConfig,
} from '@bupkis/property-testing';
import fc from 'fast-check';
import { EventEmitter } from 'node:events';

// Assume these are defined elsewhere
declare const expectAsync: (...args: unknown[]) => Promise<void>;
declare const toEmitFromAssertion: { readonly id: string };
declare const toEmitWithArgsFromAssertion: { readonly id: string };
declare const toEmitErrorFromAssertion: { readonly id: string };

/**
 * Config for toEmitFromAssertion
 *
 * Assertion signature: await expectAsync(trigger, 'to emit from', emitter,
 * eventName)
 *
 * Key patterns demonstrated:
 *
 * 1. Async: true flag for valid cases
 * 2. Trigger function as first tuple element
 * 3. AsyncProperty with nested rejection for invalid cases
 * 4. Short timeout (within: 50) for fast failure
 */
export const toEmitFromConfig: PropertyTestConfig = {
  invalid: {
    // Use asyncProperty for invalid async tests
    asyncProperty: () =>
      fc.asyncProperty(fc.string({ minLength: 1 }), async (eventName) => {
        const emitter = new EventEmitter();
        // Nest expectAsync to verify rejection
        await expectAsync(
          expectAsync(
            () => {}, // Empty trigger - no event emitted
            'to emit from',
            emitter,
            eventName,
            { within: 50 }, // Short timeout for fast failure
          ),
          'to reject',
        );
      }),
  },

  valid: {
    async: true, // Flag tells harness this is async
    generators: fc.string({ minLength: 1 }).chain((eventName) => {
      const emitter = new EventEmitter();
      return fc.tuple(
        fc.constant(() => emitter.emit(eventName)), // Trigger function
        fc.constantFrom(...extractPhrases(toEmitFromAssertion)),
        fc.constant(emitter), // Same emitter as trigger uses
        fc.constant(eventName),
      );
    }),
  },
};

/**
 * Config for toEmitWithArgsFromAssertion (compound assertion)
 *
 * Assertion signature: await expectAsync(trigger, 'to emit from', emitter,
 * eventName, 'with args', args)
 *
 * Key patterns demonstrated:
 *
 * 1. Multiple generated values (eventName + args)
 * 2. Compound phrase ('to emit from' ... 'with args')
 * 3. Invalid case emits wrong args to cause failure
 */
export const toEmitWithArgsFromConfig: PropertyTestConfig = {
  invalid: {
    asyncProperty: () =>
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.array(fc.oneof(fc.string(), fc.integer()), {
          maxLength: 3,
          minLength: 1,
        }),
        async (eventName, args) => {
          const emitter = new EventEmitter();
          await expectAsync(
            expectAsync(
              () => emitter.emit(eventName, 'wrong'), // Wrong args!
              'to emit from',
              emitter,
              eventName,
              'with args',
              args, // Expected these args
              { within: 50 },
            ),
            'to reject',
          );
        },
      ),
  },

  valid: {
    async: true,
    generators: fc
      .tuple(
        fc.string({ minLength: 1 }),
        fc.array(fc.oneof(fc.string(), fc.integer()), {
          maxLength: 3,
          minLength: 1,
        }),
      )
      .chain(([eventName, args]) => {
        const emitter = new EventEmitter();
        return fc.tuple(
          fc.constant(() => emitter.emit(eventName, ...args)), // Correct args
          fc.constant('to emit from'), // First phrase
          fc.constant(emitter),
          fc.constant(eventName),
          fc.constant('with args'), // Second phrase (literal)
          fc.constant(args),
        );
      }),
  },
};

/**
 * Config for toEmitErrorFromAssertion
 *
 * Assertion signature: await expectAsync(trigger, 'to emit error from',
 * emitter)
 *
 * Key patterns demonstrated:
 *
 * 1. Error event requires listener to prevent crash
 * 2. Fc.constant(null).chain() when no generated value needed
 */
export const toEmitErrorFromConfig: PropertyTestConfig = {
  invalid: {
    asyncProperty: () =>
      fc.asyncProperty(fc.constant(null), async () => {
        const emitter = new EventEmitter();
        emitter.on('error', () => {}); // Prevent unhandled error
        await expectAsync(
          expectAsync(
            () => {}, // No error emitted
            'to emit error from',
            emitter,
            { within: 50 },
          ),
          'to reject',
        );
      }),
  },

  valid: {
    async: true,
    generators: fc.constant(null).chain(() => {
      const emitter = new EventEmitter();
      emitter.on('error', () => {}); // IMPORTANT: Prevent unhandled error crash
      return fc.tuple(
        fc.constant(() => emitter.emit('error', new Error('test'))),
        fc.constantFrom(...extractPhrases(toEmitErrorFromAssertion)),
        fc.constant(emitter),
      );
    }),
  },
};

/**
 * Config for EventTarget assertion (toDispatchFromAssertion)
 *
 * Demonstrates EventTarget pattern vs EventEmitter
 */
export const toDispatchFromConfig: PropertyTestConfig = {
  invalid: {
    asyncProperty: () =>
      fc.asyncProperty(fc.string({ minLength: 1 }), async (eventType) => {
        const target = new EventTarget();
        await expectAsync(
          expectAsync(
            () => {}, // No event dispatched
            'to dispatch from',
            target,
            eventType,
            { within: 50 },
          ),
          'to reject',
        );
      }),
  },

  valid: {
    async: true,
    generators: fc.string({ minLength: 1 }).chain((eventType) => {
      const target = new EventTarget();
      return fc.tuple(
        fc.constant(() => target.dispatchEvent(new Event(eventType))),
        fc.constant('to dispatch from'),
        fc.constant(target),
        fc.constant(eventType),
      );
    }),
  },
};

/**
 * Config with explicit timeout option
 *
 * For assertions that accept { within: number } options
 */
export const toEmitFromWithOptionsConfig: PropertyTestConfig = {
  invalid: {
    asyncProperty: () =>
      fc.asyncProperty(fc.string({ minLength: 1 }), async (eventName) => {
        const emitter = new EventEmitter();
        await expectAsync(
          expectAsync(
            () => {},
            'to emit from',
            emitter,
            eventName,
            { within: 50 }, // Explicit short timeout
          ),
          'to reject',
        );
      }),
  },

  valid: {
    async: true,
    generators: fc.string({ minLength: 1 }).chain((eventName) => {
      const emitter = new EventEmitter();
      return fc.tuple(
        fc.constant(() => emitter.emit(eventName)),
        fc.constant('to emit from'),
        fc.constant(emitter),
        fc.constant(eventName),
        fc.constant({ within: 1000 }), // Options object in tuple
      );
    }),
  },
};
