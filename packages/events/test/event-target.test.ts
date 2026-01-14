/**
 * EventTarget assertion tests.
 */

import { use } from 'bupkis';
import { describe, it } from 'node:test';

import { eventAssertions } from '../src/index.js';

const { expect, expectAsync } = use(eventAssertions);

describe('@bupkis/events', () => {
  describe('EventTarget assertions', () => {
    describe('to dispatch from', () => {
      it('should pass when event is dispatched synchronously', async () => {
        const target = new EventTarget();
        await expectAsync(
          () => target.dispatchEvent(new Event('click')),
          'to dispatch from',
          target,
          'click',
        );
      });

      it('should pass when event is dispatched asynchronously', async () => {
        const target = new EventTarget();
        await expectAsync(
          () => {
            setTimeout(
              () => target.dispatchEvent(new Event('load')),
              10,
            ).unref();
          },
          'to dispatch from',
          target,
          'load',
        );
      });

      it('should fail on timeout', async () => {
        const target = new EventTarget();
        await expectAsync(
          expectAsync(() => {}, 'to dispatch from', target, 'never', {
            within: 50,
          }),
          'to reject',
        );
      });
    });

    describe('to dispatch from with detail', () => {
      it('should pass with matching detail', async () => {
        const target = new EventTarget();
        await expectAsync(
          () =>
            target.dispatchEvent(
              new CustomEvent('custom', { detail: { count: 42, foo: 'bar' } }),
            ),
          'to dispatch from',
          target,
          'custom',
          'with detail',
          { count: 42, foo: 'bar' },
        );
      });

      it('should fail with wrong detail', async () => {
        const target = new EventTarget();
        await expectAsync(
          expectAsync(
            () =>
              target.dispatchEvent(
                new CustomEvent('custom', { detail: { foo: 'wrong' } }),
              ),
            'to dispatch from',
            target,
            'custom',
            'with detail',
            { foo: 'bar' },
          ),
          'to reject',
        );
      });

      it('should fail when receiving regular Event instead of CustomEvent', async () => {
        const target = new EventTarget();
        await expectAsync(
          expectAsync(
            () => target.dispatchEvent(new Event('custom')),
            'to dispatch from',
            target,
            'custom',
            'with detail',
            { foo: 'bar' },
          ),
          'to reject',
        );
      });

      it('should pass with null detail', async () => {
        const target = new EventTarget();
        await expectAsync(
          () =>
            target.dispatchEvent(new CustomEvent('custom', { detail: null })),
          'to dispatch from',
          target,
          'custom',
          'with detail',
          null,
        );
      });

      it('should pass with primitive detail', async () => {
        const target = new EventTarget();
        await expectAsync(
          () =>
            target.dispatchEvent(
              new CustomEvent('message', { detail: 'hello' }),
            ),
          'to dispatch from',
          target,
          'message',
          'with detail',
          'hello',
        );
      });

      it('should pass with array detail', async () => {
        const target = new EventTarget();
        await expectAsync(
          () =>
            target.dispatchEvent(
              new CustomEvent('data', { detail: [1, 2, 3] }),
            ),
          'to dispatch from',
          target,
          'data',
          'with detail',
          [1, 2, 3],
        );
      });
    });

    describe('timeout option', () => {
      it('should fail quickly with short timeout', async () => {
        const target = new EventTarget();
        const start = Date.now();
        await expectAsync(
          expectAsync(() => {}, 'to dispatch from', target, 'never', {
            within: 30,
          }),
          'to reject',
        );
        const elapsed = Date.now() - start;
        expect(elapsed, 'to be less than', 100);
      });
    });
  });
});
