/**
 * EventEmitter and EventTarget assertions for Bupkis.
 *
 * @packageDocumentation
 */

import { expect, schema, z } from 'bupkis';

import type { EventEmitterLike, TimeoutOptions, Trigger } from './types.js';

const { is } = Object;
const { stringify } = JSON;

import {
  EventEmitterSchema,
  EventNameSchema,
  EventSequenceSchema,
  EventTargetSchema,
  RequiredTimeoutOptionsSchema,
  TriggerSchema,
} from './schema.js';

/**
 * Default timeout for async assertions in milliseconds.
 */
const DEFAULT_TIMEOUT = 2000;

// #region Sync Assertions - Listener State

/**
 * Asserts that an emitter has at least one listener for the specified event.
 *
 * @example
 *
 * ```ts
 * const emitter = new EventEmitter();
 * emitter.on('data', () => {});
 * expect(emitter, 'to have listener for', 'data'); // passes
 * ```
 */
export const hasListenerForAssertion = expect.createAssertion(
  [EventEmitterSchema, 'to have listener for', EventNameSchema],
  (emitter: EventEmitterLike, eventName: string | symbol) => {
    const count = emitter.listenerCount(eventName);
    if (count > 0) {
      return true;
    }
    return {
      actual: count,
      expected: 1,
      message: `Expected emitter to have listener for '${String(eventName)}'`,
    };
  },
);

/**
 * Asserts that an emitter has listeners for all specified events.
 *
 * @example
 *
 * ```ts
 * const emitter = new EventEmitter();
 * emitter.on('data', () => {});
 * emitter.on('end', () => {});
 * expect(emitter, 'to have listeners for', ['data', 'end']); // passes
 * ```
 */
export const hasListenersForAssertion = expect.createAssertion(
  [EventEmitterSchema, 'to have listeners for', EventSequenceSchema],
  (emitter: EventEmitterLike, eventNames: (string | symbol)[]) => {
    const present: string[] = [];
    const missing: string[] = [];
    for (const eventName of eventNames) {
      if (emitter.listenerCount(eventName) > 0) {
        present.push(String(eventName));
      } else {
        missing.push(String(eventName));
      }
    }
    if (missing.length === 0) {
      return true;
    }
    return {
      actual: present,
      expected: eventNames.map(String),
      message: `Expected emitter to have listeners for ${missing.map((e) => `'${e}'`).join(', ')}`,
    };
  },
);

/**
 * Asserts that an emitter has exactly the specified number of listeners for an
 * event.
 *
 * @example
 *
 * ```ts
 * const emitter = new EventEmitter();
 * emitter.on('data', () => {});
 * emitter.on('data', () => {});
 * expect(emitter, 'to have listener count', 'data', 2); // passes
 * ```
 */
export const hasListenerCountAssertion = expect.createAssertion(
  [
    EventEmitterSchema,
    'to have listener count',
    EventNameSchema,
    schema.NonNegativeIntegerSchema,
  ],
  (emitter: EventEmitterLike, eventName: string | symbol, expected: number) => {
    const actual = emitter.listenerCount(eventName);
    if (actual === expected) {
      return true;
    }
    return {
      actual,
      expected,
      message: `Expected emitter to have ${expected} listener(s) for '${String(eventName)}', but found ${actual}`,
    };
  },
);

/**
 * Asserts that an emitter has at least one listener registered.
 *
 * Use `'not to have listeners'` to assert that an emitter has no listeners.
 *
 * @example
 *
 * ```ts
 * const emitter = new EventEmitter();
 * emitter.on('data', () => {});
 * expect(emitter, 'to have listeners'); // passes
 *
 * const fresh = new EventEmitter();
 * expect(fresh, 'not to have listeners'); // passes (negation)
 * ```
 */
export const hasListenersAssertion = expect.createAssertion(
  [EventEmitterSchema, 'to have listeners'],
  (emitter: EventEmitterLike) => {
    if (!emitter.eventNames) {
      return {
        message:
          'Cannot check for listeners: emitter does not support eventNames()',
      };
    }
    const events = emitter.eventNames();
    const totalListeners = events.reduce(
      (sum, e) => sum + emitter.listenerCount(e),
      0,
    );
    if (totalListeners > 0) {
      return true;
    }
    return {
      actual: totalListeners,
      expected: 1,
      message: 'Expected emitter to have at least 1 listener',
    };
  },
);

/**
 * Asserts that an emitter's maxListeners is set to the specified value.
 *
 * @example
 *
 * ```ts
 * const emitter = new EventEmitter();
 * emitter.setMaxListeners(20);
 * expect(emitter, 'to have max listeners', 20); // passes
 * ```
 */
export const hasMaxListenersAssertion = expect.createAssertion(
  [
    EventEmitterSchema,
    'to have max listeners',
    schema.NonNegativeIntegerSchema,
  ],
  (emitter: EventEmitterLike, expected: number) => {
    if (!emitter.getMaxListeners) {
      return {
        message:
          'Cannot check max listeners: emitter does not support getMaxListeners()',
      };
    }
    const actual = emitter.getMaxListeners();
    if (actual === expected) {
      return true;
    }
    return {
      actual,
      expected,
      message: `Expected emitter to have max listeners set to ${expected}, but was ${actual}`,
    };
  },
);

// #endregion

// #region Async Assertions - EventEmitter

/**
 * Helper that implements the "to emit from" logic.
 *
 * @function
 * @internal
 */
const toEmitFromImpl = async (
  trigger: Trigger,
  emitter: EventEmitterLike,
  eventName: string | symbol,
  options?: TimeoutOptions,
): Promise<true | { actual: string; expected: string; message: string }> => {
  const timeout = options?.within ?? DEFAULT_TIMEOUT;

  return new Promise<
    true | { actual: string; expected: string; message: string }
  >((resolve) => {
    /**
     * @function
     */
    const listener = () => {
      cleanup();
      resolve(true);
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve({
        actual: 'no emission',
        expected: `'${String(eventName)}' event`,
        message: `Expected '${String(eventName)}' to be emitted within ${timeout}ms`,
      });
    }, timeout).unref();

    /**
     * @function
     */
    const cleanup = () => {
      clearTimeout(timer);
      emitter.removeListener(eventName, listener);
    };

    emitter.once(eventName, listener);

    // Execute trigger after listener is set up
    const result = typeof trigger === 'function' ? trigger() : trigger;
    if (result && typeof result === 'object' && 'then' in result) {
      (result as Promise<unknown>).catch(() => {
        /* handled by timeout */
      });
    }
  });
};

/**
 * Asserts that a trigger causes an emitter to emit the specified event.
 *
 * @example
 *
 * ```ts
 * const emitter = new EventEmitter();
 * await expectAsync(
 *   () => emitter.emit('ready'),
 *   'to emit from',
 *   emitter,
 *   'ready',
 * ); // passes
 * ```
 */
export const toEmitFromAssertion = expect.createAsyncAssertion(
  [TriggerSchema, 'to emit from', EventEmitterSchema, EventNameSchema],
  async (
    trigger: Trigger,
    emitter: EventEmitterLike,
    eventName: string | symbol,
  ) => toEmitFromImpl(trigger, emitter, eventName),
);

/**
 * Asserts that a trigger causes an emitter to emit the specified event with
 * timeout options.
 *
 * @example
 *
 * ```ts
 * const emitter = new EventEmitter();
 * await expectAsync(
 *   () => emitter.emit('ready'),
 *   'to emit from',
 *   emitter,
 *   'ready',
 *   { within: 100 },
 * ); // passes or fails based on timing
 * ```
 */
export const toEmitFromWithOptionsAssertion = expect.createAsyncAssertion(
  [
    TriggerSchema,
    'to emit from',
    EventEmitterSchema,
    EventNameSchema,
    RequiredTimeoutOptionsSchema,
  ],
  async (
    trigger: Trigger,
    emitter: EventEmitterLike,
    eventName: string | symbol,
    options: TimeoutOptions,
  ) => toEmitFromImpl(trigger, emitter, eventName, options),
);

/**
 * Helper that implements the "to emit from with args" logic.
 *
 * @function
 * @internal
 */
const toEmitWithArgsFromImpl = async (
  trigger: Trigger,
  emitter: EventEmitterLike,
  eventName: string | symbol,
  expectedArgs: unknown[],
  options?: TimeoutOptions,
): Promise<true | { actual: unknown; expected: unknown; message: string }> => {
  const timeout = options?.within ?? DEFAULT_TIMEOUT;

  return new Promise<
    true | { actual: unknown; expected: unknown; message: string }
  >((resolve) => {
    /**
     * @function
     */
    const listener = (...args: unknown[]) => {
      cleanup();

      // Check args match
      if (args.length !== expectedArgs.length) {
        resolve({
          actual: args,
          expected: expectedArgs,
          message: `Expected event '${String(eventName)}' to be emitted with ${expectedArgs.length} argument(s), but got ${args.length}`,
        });
        return;
      }

      for (let i = 0; i < expectedArgs.length; i++) {
        if (!is(args[i], expectedArgs[i])) {
          resolve({
            actual: args,
            expected: expectedArgs,
            message: `Expected event '${String(eventName)}' argument ${i} to match`,
          });
          return;
        }
      }

      resolve(true);
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve({
        actual: 'no emission',
        expected: `'${String(eventName)}' event with args`,
        message: `Expected '${String(eventName)}' to be emitted within ${timeout}ms`,
      });
    }, timeout).unref();

    /**
     * @function
     */
    const cleanup = () => {
      clearTimeout(timer);
      emitter.removeListener(eventName, listener);
    };

    emitter.once(eventName, listener);

    const result = typeof trigger === 'function' ? trigger() : trigger;
    if (result && typeof result === 'object' && 'then' in result) {
      (result as Promise<unknown>).catch(() => {});
    }
  });
};

/**
 * Asserts that a trigger causes an emitter to emit the specified event with
 * specific arguments.
 *
 * @example
 *
 * ```ts
 * const emitter = new EventEmitter();
 * await expectAsync(
 *   () => emitter.emit('data', 'hello', 42),
 *   'to emit from',
 *   emitter,
 *   'data',
 *   'with args',
 *   ['hello', 42],
 * ); // passes
 * ```
 */
export const toEmitWithArgsFromAssertion = expect.createAsyncAssertion(
  [
    TriggerSchema,
    'to emit from',
    EventEmitterSchema,
    EventNameSchema,
    'with args',
    z.array(schema.UnknownSchema),
  ],
  async (
    trigger: Trigger,
    emitter: EventEmitterLike,
    eventName: string | symbol,
    expectedArgs: unknown[],
  ) => toEmitWithArgsFromImpl(trigger, emitter, eventName, expectedArgs),
);

/**
 * Asserts that a trigger causes an emitter to emit the specified event with
 * specific arguments and timeout options.
 */
export const toEmitWithArgsFromWithOptionsAssertion =
  expect.createAsyncAssertion(
    [
      TriggerSchema,
      'to emit from',
      EventEmitterSchema,
      EventNameSchema,
      'with args',
      z.array(schema.UnknownSchema),
      RequiredTimeoutOptionsSchema,
    ],
    async (
      trigger: Trigger,
      emitter: EventEmitterLike,
      eventName: string | symbol,
      expectedArgs: unknown[],
      options: TimeoutOptions,
    ) =>
      toEmitWithArgsFromImpl(
        trigger,
        emitter,
        eventName,
        expectedArgs,
        options,
      ),
  );

/**
 * Helper that implements the "to emit error from" logic.
 *
 * @function
 * @internal
 */
const toEmitErrorFromImpl = async (
  trigger: Trigger,
  emitter: EventEmitterLike,
  options?: TimeoutOptions,
): Promise<true | { actual: string; expected: string; message: string }> => {
  const timeout = options?.within ?? DEFAULT_TIMEOUT;

  return new Promise<
    true | { actual: string; expected: string; message: string }
  >((resolve) => {
    /**
     * @function
     */
    const listener = () => {
      cleanup();
      resolve(true);
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve({
        actual: 'no error emission',
        expected: "'error' event",
        message: `Expected 'error' event to be emitted within ${timeout}ms`,
      });
    }, timeout).unref();

    /**
     * @function
     */
    const cleanup = () => {
      clearTimeout(timer);
      emitter.removeListener('error', listener);
    };

    emitter.once('error', listener);

    const result = typeof trigger === 'function' ? trigger() : trigger;
    if (result && typeof result === 'object' && 'then' in result) {
      (result as Promise<unknown>).catch(() => {});
    }
  });
};

/**
 * Asserts that a trigger causes an emitter to emit the 'error' event.
 *
 * @example
 *
 * ```ts
 * const emitter = new EventEmitter();
 * await expectAsync(
 *   () => emitter.emit('error', new Error('oops')),
 *   'to emit error from',
 *   emitter,
 * ); // passes
 * ```
 */
export const toEmitErrorFromAssertion = expect.createAsyncAssertion(
  [TriggerSchema, 'to emit error from', EventEmitterSchema],
  async (trigger: Trigger, emitter: EventEmitterLike) =>
    toEmitErrorFromImpl(trigger, emitter),
);

/**
 * Asserts that a trigger causes an emitter to emit the 'error' event with
 * timeout options.
 */
export const toEmitErrorFromWithOptionsAssertion = expect.createAsyncAssertion(
  [
    TriggerSchema,
    'to emit error from',
    EventEmitterSchema,
    RequiredTimeoutOptionsSchema,
  ],
  async (
    trigger: Trigger,
    emitter: EventEmitterLike,
    options: TimeoutOptions,
  ) => toEmitErrorFromImpl(trigger, emitter, options),
);

/**
 * Helper that implements the "to emit events from" logic.
 *
 * @function
 * @internal
 */
const toEmitEventsFromImpl = async (
  trigger: Trigger,
  emitter: EventEmitterLike,
  expectedEvents: (string | symbol)[],
  options?: TimeoutOptions,
): Promise<
  | true
  | {
      actual: (string | symbol)[];
      expected: (string | symbol)[];
      message: string;
    }
> => {
  const timeout = options?.within ?? DEFAULT_TIMEOUT;

  return new Promise<
    | true
    | {
        actual: (string | symbol)[];
        expected: (string | symbol)[];
        message: string;
      }
  >((resolve) => {
    const received: (string | symbol)[] = [];
    const listeners: Map<string | symbol, () => void> = new Map();

    /**
     * @function
     */
    const cleanup = () => {
      clearTimeout(timer);
      for (const [event, listener] of listeners) {
        emitter.removeListener(event, listener);
      }
    };

    /**
     * @function
     */
    const checkComplete = () => {
      if (received.length === expectedEvents.length) {
        cleanup();
        // Verify order
        for (let i = 0; i < expectedEvents.length; i++) {
          if (received[i] !== expectedEvents[i]) {
            resolve({
              actual: received,
              expected: expectedEvents,
              message: `Expected events in order, but event ${i} was '${String(received[i])}' instead of '${String(expectedEvents[i])}'`,
            });
            return;
          }
        }
        resolve(true);
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve({
        actual: received,
        expected: expectedEvents,
        message: `Expected all events to be emitted within ${timeout}ms, but only received: ${received.map(String).join(', ') || '(none)'}`,
      });
    }, timeout).unref();

    // Set up listeners for each expected event
    for (const eventName of expectedEvents) {
      if (!listeners.has(eventName)) {
        /**
         * @function
         */
        const listener = () => {
          received.push(eventName);
          checkComplete();
        };
        listeners.set(eventName, listener);
        emitter.on(eventName, listener);
      }
    }

    const result = typeof trigger === 'function' ? trigger() : trigger;
    if (result && typeof result === 'object' && 'then' in result) {
      (result as Promise<unknown>).catch(() => {});
    }
  });
};

/**
 * Asserts that a trigger causes an emitter to emit events in the specified
 * order.
 *
 * @example
 *
 * ```ts
 * const emitter = new EventEmitter();
 * await expectAsync(
 *   () => {
 *     emitter.emit('start');
 *     emitter.emit('data');
 *     emitter.emit('end');
 *   },
 *   'to emit events from',
 *   emitter,
 *   ['start', 'data', 'end'],
 * ); // passes
 * ```
 */
export const toEmitEventsFromAssertion = expect.createAsyncAssertion(
  [
    TriggerSchema,
    'to emit events from',
    EventEmitterSchema,
    EventSequenceSchema,
  ],
  async (
    trigger: Trigger,
    emitter: EventEmitterLike,
    expectedEvents: (string | symbol)[],
  ) => toEmitEventsFromImpl(trigger, emitter, expectedEvents),
);

/**
 * Asserts that a trigger causes an emitter to emit events in the specified
 * order with timeout options.
 */
export const toEmitEventsFromWithOptionsAssertion = expect.createAsyncAssertion(
  [
    TriggerSchema,
    'to emit events from',
    EventEmitterSchema,
    EventSequenceSchema,
    RequiredTimeoutOptionsSchema,
  ],
  async (
    trigger: Trigger,
    emitter: EventEmitterLike,
    expectedEvents: (string | symbol)[],
    options: TimeoutOptions,
  ) => toEmitEventsFromImpl(trigger, emitter, expectedEvents, options),
);

// #endregion

// #region Async Assertions - EventTarget

/**
 * Helper that implements the "to dispatch from" logic.
 *
 * @function
 * @internal
 */
const toDispatchFromImpl = async (
  trigger: Trigger,
  target: EventTarget,
  eventType: string,
  options?: TimeoutOptions,
): Promise<true | { actual: string; expected: string; message: string }> => {
  const timeout = options?.within ?? DEFAULT_TIMEOUT;

  return new Promise<
    true | { actual: string; expected: string; message: string }
  >((resolve) => {
    /**
     * @function
     */
    const listener = () => {
      cleanup();
      resolve(true);
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve({
        actual: 'no dispatch',
        expected: `'${eventType}' event`,
        message: `Expected '${eventType}' to be dispatched within ${timeout}ms`,
      });
    }, timeout).unref();

    /**
     * @function
     */
    const cleanup = () => {
      clearTimeout(timer);
      target.removeEventListener(eventType, listener);
    };

    target.addEventListener(eventType, listener, { once: true });

    const result = typeof trigger === 'function' ? trigger() : trigger;
    if (result && typeof result === 'object' && 'then' in result) {
      (result as Promise<unknown>).catch(() => {});
    }
  });
};

/**
 * Asserts that a trigger causes an EventTarget to dispatch the specified event.
 *
 * @example
 *
 * ```ts
 * const target = new EventTarget();
 * await expectAsync(
 *   () => target.dispatchEvent(new Event('click')),
 *   'to dispatch from',
 *   target,
 *   'click',
 * ); // passes
 * ```
 */
export const toDispatchFromAssertion = expect.createAsyncAssertion(
  [TriggerSchema, 'to dispatch from', EventTargetSchema, z.string()],
  async (trigger: Trigger, target: EventTarget, eventType: string) =>
    toDispatchFromImpl(trigger, target, eventType),
);

/**
 * Asserts that a trigger causes an EventTarget to dispatch the specified event
 * with timeout options.
 */
export const toDispatchFromWithOptionsAssertion = expect.createAsyncAssertion(
  [
    TriggerSchema,
    'to dispatch from',
    EventTargetSchema,
    z.string(),
    RequiredTimeoutOptionsSchema,
  ],
  async (
    trigger: Trigger,
    target: EventTarget,
    eventType: string,
    options: TimeoutOptions,
  ) => toDispatchFromImpl(trigger, target, eventType, options),
);

/**
 * Helper that implements the "to dispatch from with detail" logic.
 *
 * @function
 * @internal
 */
const toDispatchWithDetailFromImpl = async (
  trigger: Trigger,
  target: EventTarget,
  eventType: string,
  expectedDetail: unknown,
  options?: TimeoutOptions,
): Promise<true | { actual: unknown; expected: unknown; message: string }> => {
  const timeout = options?.within ?? DEFAULT_TIMEOUT;

  return new Promise<
    true | { actual: unknown; expected: unknown; message: string }
  >((resolve) => {
    /**
     * @function
     */
    const listener = (event: Event) => {
      cleanup();

      if (!(event instanceof CustomEvent)) {
        resolve({
          actual: event.constructor.name,
          expected: 'CustomEvent',
          message: `Expected a CustomEvent, but got ${event.constructor.name}`,
        });
        return;
      }

      // Simple deep equality check for detail
      const actualDetail = event.detail as unknown;
      if (stringify(actualDetail) !== stringify(expectedDetail)) {
        resolve({
          actual: actualDetail,
          expected: expectedDetail,
          message: `Expected CustomEvent detail to match`,
        });
        return;
      }

      resolve(true);
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve({
        actual: 'no dispatch',
        expected: `'${eventType}' CustomEvent with detail`,
        message: `Expected '${eventType}' to be dispatched within ${timeout}ms`,
      });
    }, timeout).unref();

    /**
     * @function
     */
    const cleanup = () => {
      clearTimeout(timer);
      target.removeEventListener(eventType, listener);
    };

    target.addEventListener(eventType, listener, { once: true });

    const result = typeof trigger === 'function' ? trigger() : trigger;
    if (result && typeof result === 'object' && 'then' in result) {
      (result as Promise<unknown>).catch(() => {});
    }
  });
};

/**
 * Asserts that a trigger causes an EventTarget to dispatch a CustomEvent with
 * specific detail.
 *
 * @example
 *
 * ```ts
 * const target = new EventTarget();
 * await expectAsync(
 *   () =>
 *     target.dispatchEvent(
 *       new CustomEvent('custom', { detail: { foo: 'bar' } }),
 *     ),
 *   'to dispatch from',
 *   target,
 *   'custom',
 *   'with detail',
 *   { foo: 'bar' },
 * ); // passes
 * ```
 */
export const toDispatchWithDetailFromAssertion = expect.createAsyncAssertion(
  [
    TriggerSchema,
    'to dispatch from',
    EventTargetSchema,
    z.string(),
    'with detail',
    schema.UnknownSchema,
  ],
  async (
    trigger: Trigger,
    target: EventTarget,
    eventType: string,
    expectedDetail: unknown,
  ) => toDispatchWithDetailFromImpl(trigger, target, eventType, expectedDetail),
);

/**
 * Asserts that a trigger causes an EventTarget to dispatch a CustomEvent with
 * specific detail and timeout options.
 */
export const toDispatchWithDetailFromWithOptionsAssertion =
  expect.createAsyncAssertion(
    [
      TriggerSchema,
      'to dispatch from',
      EventTargetSchema,
      z.string(),
      'with detail',
      schema.UnknownSchema,
      RequiredTimeoutOptionsSchema,
    ],
    async (
      trigger: Trigger,
      target: EventTarget,
      eventType: string,
      expectedDetail: unknown,
      options: TimeoutOptions,
    ) =>
      toDispatchWithDetailFromImpl(
        trigger,
        target,
        eventType,
        expectedDetail,
        options,
      ),
  );

// #endregion

/**
 * All event assertions for use with `expect.use()`.
 */
export const eventAssertions = [
  // Sync - Listener State
  hasListenerForAssertion,
  hasListenersForAssertion,
  hasListenerCountAssertion,
  hasListenersAssertion,
  hasMaxListenersAssertion,
  // Async - EventEmitter (base + with options variants)
  toEmitFromAssertion,
  toEmitFromWithOptionsAssertion,
  toEmitWithArgsFromAssertion,
  toEmitWithArgsFromWithOptionsAssertion,
  toEmitErrorFromAssertion,
  toEmitErrorFromWithOptionsAssertion,
  toEmitEventsFromAssertion,
  toEmitEventsFromWithOptionsAssertion,
  // Async - EventTarget (base + with options variants)
  toDispatchFromAssertion,
  toDispatchFromWithOptionsAssertion,
  toDispatchWithDetailFromAssertion,
  toDispatchWithDetailFromWithOptionsAssertion,
] as const;
