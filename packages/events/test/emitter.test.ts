/**
 * EventEmitter sync assertion tests.
 */

import { use } from 'bupkis';
import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';

import { eventAssertions } from '../src/index.js';

const { expect, expect: e } = use(eventAssertions);

describe('@bupkis/events', () => {
  describe('sync assertions', () => {
    describe('to have listener for', () => {
      it('should pass when listener exists', () => {
        const emitter = new EventEmitter();
        emitter.on('data', () => {});
        e(emitter, 'to have listener for', 'data');
      });

      it('should fail when no listener exists', () => {
        const emitter = new EventEmitter();
        expect(() => e(emitter, 'to have listener for', 'data'), 'to throw');
      });

      it('should work with symbol events', () => {
        const emitter = new EventEmitter();
        const sym = Symbol('test');
        emitter.on(sym, () => {});
        e(emitter, 'to have listener for', sym);
      });
    });

    describe('not to have listener for', () => {
      it('should pass when no listener exists', () => {
        const emitter = new EventEmitter();
        e(emitter, 'not to have listener for', 'data');
      });

      it('should fail when listener exists', () => {
        const emitter = new EventEmitter();
        emitter.on('data', () => {});
        expect(
          () => e(emitter, 'not to have listener for', 'data'),
          'to throw',
        );
      });
    });

    describe('to have listeners for', () => {
      it('should pass when all listeners exist', () => {
        const emitter = new EventEmitter();
        emitter.on('data', () => {});
        emitter.on('end', () => {});
        e(emitter, 'to have listeners for', ['data', 'end']);
      });

      it('should fail when some listeners are missing', () => {
        const emitter = new EventEmitter();
        emitter.on('data', () => {});
        expect(
          () => e(emitter, 'to have listeners for', ['data', 'end']),
          'to throw',
        );
      });

      it('should fail when all listeners are missing', () => {
        const emitter = new EventEmitter();
        expect(
          () => e(emitter, 'to have listeners for', ['data', 'end']),
          'to throw',
        );
      });
    });

    describe('to have listener count', () => {
      it('should pass with correct count', () => {
        const emitter = new EventEmitter();
        emitter.on('data', () => {});
        emitter.on('data', () => {});
        e(emitter, 'to have listener count', 'data', 2);
      });

      it('should fail with wrong count', () => {
        const emitter = new EventEmitter();
        emitter.on('data', () => {});
        expect(
          () => e(emitter, 'to have listener count', 'data', 5),
          'to throw',
        );
      });

      it('should pass with zero count for no listeners', () => {
        const emitter = new EventEmitter();
        e(emitter, 'to have listener count', 'data', 0);
      });
    });

    describe('to have listeners', () => {
      it('should pass when emitter has listeners', () => {
        const emitter = new EventEmitter();
        emitter.on('data', () => {});
        e(emitter, 'to have listeners');
      });

      it('should fail for fresh emitter', () => {
        const emitter = new EventEmitter();
        expect(() => e(emitter, 'to have listeners'), 'to throw');
      });
    });

    describe('not to have listeners', () => {
      it('should pass for fresh emitter', () => {
        const emitter = new EventEmitter();
        e(emitter, 'not to have listeners');
      });

      it('should fail when listeners exist', () => {
        const emitter = new EventEmitter();
        emitter.on('x', () => {});
        expect(() => e(emitter, 'not to have listeners'), 'to throw');
      });
    });

    describe('to have max listeners', () => {
      it('should pass with matching value', () => {
        const emitter = new EventEmitter();
        emitter.setMaxListeners(20);
        e(emitter, 'to have max listeners', 20);
      });

      it('should fail with wrong value', () => {
        const emitter = new EventEmitter();
        emitter.setMaxListeners(10);
        expect(() => e(emitter, 'to have max listeners', 20), 'to throw');
      });

      it('should pass with default value', () => {
        const emitter = new EventEmitter();
        e(emitter, 'to have max listeners', 10); // Node.js default
      });
    });
  });
});
