/**
 * Async assertion tests for EventEmitter.
 */

import { use } from 'bupkis';
import { EventEmitter as EventEmitter3 } from 'eventemitter3';
import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';

import { eventAssertions } from '../src/index.js';

const { expect, expectAsync } = use(eventAssertions);

/**
 * Helper to create a delayed emission.
 *
 * @param emitter - EventEmitter to emit from
 * @param event - Event name
 * @param delay - Delay in ms
 * @param args - Arguments to emit
 */
const delayedEmit = (
  emitter: EventEmitter,
  event: string,
  delay: number,
  ...args: unknown[]
): void => {
  setTimeout(() => emitter.emit(event, ...args), delay).unref();
};

describe('@bupkis/events', () => {
  describe('async assertions', () => {
    describe('to emit from', () => {
      it('should pass when event is emitted synchronously', async () => {
        const emitter = new EventEmitter();
        await expectAsync(
          () => emitter.emit('ready'),
          'to emit from',
          emitter,
          'ready',
        );
      });

      it('should pass when event is emitted asynchronously', async () => {
        const emitter = new EventEmitter();
        await expectAsync(
          () => delayedEmit(emitter, 'ready', 10),
          'to emit from',
          emitter,
          'ready',
        );
      });

      it('should pass with Promise trigger', async () => {
        const emitter = new EventEmitter();
        // Use setImmediate to ensure listener is fully registered before emission
        await expectAsync(
          new Promise<void>((resolve) => {
            setImmediate(() => {
              emitter.emit('ready');
              resolve();
            });
          }),
          'to emit from',
          emitter,
          'ready',
        );
      });

      it('should fail on timeout', async () => {
        const emitter = new EventEmitter();
        await expectAsync(
          expectAsync(() => {}, 'to emit from', emitter, 'nope', {
            within: 50,
          }),
          'to reject',
        );
      });

      it('should work with symbol events', async () => {
        const emitter = new EventEmitter();
        const sym = Symbol('test');
        await expectAsync(
          () => emitter.emit(sym),
          'to emit from',
          emitter,
          sym,
        );
      });
    });

    describe('to emit from with args', () => {
      it('should pass with matching args', async () => {
        const emitter = new EventEmitter();
        await expectAsync(
          () => emitter.emit('data', 'hello', 42),
          'to emit from',
          emitter,
          'data',
          'with args',
          ['hello', 42],
        );
      });

      it('should fail with wrong args', async () => {
        const emitter = new EventEmitter();
        await expectAsync(
          expectAsync(
            () => emitter.emit('data', 'hello', 99),
            'to emit from',
            emitter,
            'data',
            'with args',
            ['hello', 42],
          ),
          'to reject',
        );
      });

      it('should fail with wrong arg count', async () => {
        const emitter = new EventEmitter();
        await expectAsync(
          expectAsync(
            () => emitter.emit('data', 'hello'),
            'to emit from',
            emitter,
            'data',
            'with args',
            ['hello', 42],
          ),
          'to reject',
        );
      });

      it('should support expect.it() for custom assertions on args', async () => {
        const emitter = new EventEmitter();
        await expectAsync(
          () => emitter.emit('data', { count: 42, extra: 'ignored' }),
          'to emit from',
          emitter,
          'data',
          'with args',
          [
            expect.it('to satisfy', {
              count: expect.it('to be greater than', 0),
            }),
          ],
        );
      });
    });

    describe('to emit error from', () => {
      it('should pass when error event is emitted', async () => {
        const emitter = new EventEmitter();
        // Prevent unhandled error
        emitter.on('error', () => {});
        await expectAsync(
          () => emitter.emit('error', new Error('oops')),
          'to emit error from',
          emitter,
        );
      });

      it('should fail when no error is emitted', async () => {
        const emitter = new EventEmitter();
        emitter.on('error', () => {});
        await expectAsync(
          expectAsync(() => {}, 'to emit error from', emitter, { within: 50 }),
          'to reject',
        );
      });
    });

    describe('to emit events from', () => {
      it('should pass when events are emitted in order', async () => {
        const emitter = new EventEmitter();
        await expectAsync(
          () => {
            emitter.emit('start');
            emitter.emit('data');
            emitter.emit('end');
          },
          'to emit events from',
          emitter,
          ['start', 'data', 'end'],
        );
      });

      it('should fail when events are out of order', async () => {
        const emitter = new EventEmitter();
        await expectAsync(
          expectAsync(
            () => {
              emitter.emit('end');
              emitter.emit('start');
            },
            'to emit events from',
            emitter,
            ['start', 'end'],
            { within: 50 },
          ),
          'to reject',
        );
      });

      it('should fail when not all events are emitted', async () => {
        const emitter = new EventEmitter();
        await expectAsync(
          expectAsync(
            () => {
              emitter.emit('start');
            },
            'to emit events from',
            emitter,
            ['start', 'end'],
            { within: 50 },
          ),
          'to reject',
        );
      });
    });

    describe('with eventemitter3 (duck-typed)', () => {
      it('should work with to have listener for', () => {
        const emitter = new EventEmitter3();
        emitter.on('data', () => {});
        expect(emitter, 'to have listener for', 'data');
      });

      it('should work with to emit from', async () => {
        const emitter = new EventEmitter3();
        await expectAsync(
          () => emitter.emit('ready'),
          'to emit from',
          emitter,
          'ready',
        );
      });

      it('should work with to emit from with args', async () => {
        const emitter = new EventEmitter3();
        await expectAsync(
          () => emitter.emit('data', 'hello', 42),
          'to emit from',
          emitter,
          'data',
          'with args',
          ['hello', 42],
        );
      });
    });
  });
});
