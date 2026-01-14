/**
 * TypeScript type definitions for @bupkis/events.
 *
 * @packageDocumentation
 */

/**
 * Minimal interface representing an EventEmitter-like object.
 *
 * This interface captures the essential methods needed for event assertions,
 * supporting both Node.js EventEmitter and compatible implementations.
 */
export interface EventEmitterLike {
  /**
   * Synchronously calls each of the listeners registered for the event named
   * `eventName`, in the order they were registered.
   */
  emit(eventName: string | symbol, ...args: unknown[]): boolean;

  /**
   * Returns an array of event names for which listeners have been registered.
   */
  eventNames?(): (string | symbol)[];

  /**
   * Returns the current max listener value for the EventEmitter.
   */
  getMaxListeners?(): number;

  /**
   * Returns the number of listeners listening to the specified event.
   */
  listenerCount(eventName: string | symbol): number;

  /**
   * Adds a listener function to the end of the listeners array for the
   * specified event.
   */
  on(eventName: string | symbol, listener: (...args: unknown[]) => void): this;

  /**
   * Adds a one-time listener function for the specified event.
   */
  once(
    eventName: string | symbol,
    listener: (...args: unknown[]) => void,
  ): this;

  /**
   * Removes the specified listener from the listener array for the specified
   * event.
   */
  removeListener(
    eventName: string | symbol,
    listener: (...args: unknown[]) => void,
  ): this;
}

/**
 * Options for async assertions that support timeout configuration.
 */
export interface TimeoutOptions {
  /**
   * Maximum time in milliseconds to wait for the event. Defaults to
   * {@link DEFAULT_TIMEOUT} if not specified.
   */
  within?: number;
}

/**
 * A trigger that causes an event to be emitted.
 *
 * Can be either a function that triggers the event when called, or a Promise
 * that triggers the event when it settles.
 */
export type Trigger = (() => unknown) | Promise<unknown>;
