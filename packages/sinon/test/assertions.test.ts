import { expect } from 'bupkis';
import { describe, it } from 'node:test';
import sinon from 'sinon';

import { sinonAssertions } from '../src/assertions.js';

const { expect: e } = expect.use(sinonAssertions);

describe('@bupkis/sinon', () => {
  describe('spy assertions', () => {
    describe('was called', () => {
      it('should pass when spy was called', () => {
        const spy = sinon.spy();
        spy();
        e(spy, 'was called');
      });

      it('should fail when spy was not called', () => {
        const spy = sinon.spy();
        expect(() => e(spy, 'was called'), 'to throw');
      });
    });

    describe('was not called', () => {
      it('should pass when spy was not called', () => {
        const spy = sinon.spy();
        e(spy, 'was not called');
      });

      it('should fail when spy was called', () => {
        const spy = sinon.spy();
        spy();
        expect(() => e(spy, 'was not called'), 'to throw');
      });
    });

    describe('was called times', () => {
      it('should pass when spy was called exact number of times', () => {
        const spy = sinon.spy();
        spy();
        spy();
        spy();
        e(spy, 'was called times', 3);
      });

      it('should fail when call count does not match', () => {
        const spy = sinon.spy();
        spy();
        expect(() => e(spy, 'was called times', 3), 'to throw');
      });
    });

    describe('was called once', () => {
      it('should pass when spy was called exactly once', () => {
        const spy = sinon.spy();
        spy();
        e(spy, 'was called once');
      });

      it('should fail when spy was called multiple times', () => {
        const spy = sinon.spy();
        spy();
        spy();
        expect(() => e(spy, 'was called once'), 'to throw');
      });
    });

    describe('was called twice', () => {
      it('should pass when spy was called exactly twice', () => {
        const spy = sinon.spy();
        spy();
        spy();
        e(spy, 'was called twice');
      });

      it('should fail when spy was not called twice', () => {
        const spy = sinon.spy();
        spy();
        expect(() => e(spy, 'was called twice'), 'to throw');
      });
    });

    describe('was called thrice', () => {
      it('should pass when spy was called exactly three times', () => {
        const spy = sinon.spy();
        spy();
        spy();
        spy();
        e(spy, 'was called thrice');
      });

      it('should fail when spy was not called three times', () => {
        const spy = sinon.spy();
        spy();
        spy();
        expect(() => e(spy, 'was called thrice'), 'to throw');
      });
    });

    describe('was called with', () => {
      it('should pass when spy was called with matching args', () => {
        const spy = sinon.spy();
        spy('foo', 42);
        e(spy, 'was called with', ['foo', 42]);
      });

      it('should pass with partial args (prefix match)', () => {
        const spy = sinon.spy();
        spy('foo', 42, 'extra');
        e(spy, 'was called with', ['foo', 42]);
      });

      it('should fail when args do not match', () => {
        const spy = sinon.spy();
        spy('bar');
        expect(() => e(spy, 'was called with', ['foo']), 'to throw');
      });

      it('should pass if any call matches', () => {
        const spy = sinon.spy();
        spy('first');
        spy('second');
        spy('target', 123);
        e(spy, 'was called with', ['target', 123]);
      });
    });

    describe('was always called with', () => {
      it('should pass when all calls match', () => {
        const spy = sinon.spy();
        spy('foo', 1);
        spy('foo', 2);
        spy('foo', 3);
        e(spy, 'was always called with', ['foo']);
      });

      it('should fail when any call does not match', () => {
        const spy = sinon.spy();
        spy('foo');
        spy('bar');
        expect(() => e(spy, 'was always called with', ['foo']), 'to throw');
      });
    });

    describe('was called with exactly', () => {
      it('should pass when args match exactly', () => {
        const spy = sinon.spy();
        spy('foo', 42);
        e(spy, 'was called with exactly', ['foo', 42]);
      });

      it('should fail when extra args present', () => {
        const spy = sinon.spy();
        spy('foo', 42, 'extra');
        expect(
          () => e(spy, 'was called with exactly', ['foo', 42]),
          'to throw',
        );
      });
    });

    describe('was never called with', () => {
      it('should pass when no call has matching args', () => {
        const spy = sinon.spy();
        spy('foo');
        spy('bar');
        e(spy, 'was never called with', ['baz']);
      });

      it('should fail when any call has matching args', () => {
        const spy = sinon.spy();
        spy('foo');
        expect(() => e(spy, 'was never called with', ['foo']), 'to throw');
      });
    });

    describe('was called on', () => {
      it('should pass when spy was called with correct this context', () => {
        const obj = { method: sinon.spy() };
        obj.method();
        e(obj.method, 'was called on', obj);
      });

      it('should fail when this context does not match', () => {
        const obj1 = { method: sinon.spy() };
        const obj2 = {};
        obj1.method.call(obj2);
        expect(() => e(obj1.method, 'was called on', obj1), 'to throw');
      });
    });

    describe('was always called on', () => {
      it('should pass when all calls used correct this context', () => {
        const obj = { method: sinon.spy() };
        obj.method();
        obj.method();
        e(obj.method, 'was always called on', obj);
      });

      it('should fail when any call used different this context', () => {
        const obj = { method: sinon.spy() };
        const other = {};
        obj.method();
        obj.method.call(other);
        expect(() => e(obj.method, 'was always called on', obj), 'to throw');
      });
    });

    describe('threw', () => {
      it('should pass when spy threw any error', () => {
        const stub = sinon.stub().throws(new Error('oops'));
        try {
          stub();
        } catch {
          // expected
        }
        e(stub, 'threw');
      });

      it('should pass when spy threw specific error type', () => {
        const stub = sinon.stub().throws(new TypeError('type error'));
        try {
          stub();
        } catch {
          // expected
        }
        e(stub, 'threw', 'TypeError');
      });

      it('should pass when spy threw specific error object', () => {
        const error = new TypeError('type error');
        const stub = sinon.stub().throws(error);
        try {
          stub();
        } catch {
          // expected
        }
        e(stub, 'threw', error);
      });

      it('should fail when spy did not throw', () => {
        const spy = sinon.spy();
        spy();
        expect(() => e(spy, 'threw'), 'to throw');
      });
    });

    describe('always threw', () => {
      it('should pass when spy always threw', () => {
        const stub = sinon.stub().throws(new Error('always'));
        try {
          stub();
        } catch {
          // expected
        }
        try {
          stub();
        } catch {
          // expected
        }
        e(stub, 'always threw');
      });

      it('should fail when spy did not always throw', () => {
        const stub = sinon.stub();
        stub.onFirstCall().throws(new Error('first'));
        stub.onSecondCall().returns('ok');
        try {
          stub();
        } catch {
          // expected
        }
        stub();
        expect(() => e(stub, 'always threw'), 'to throw');
      });
    });

    describe('to have returned (spy-level)', () => {
      it('should pass when spy returned at least once', () => {
        const stub = sinon.stub().returns(42);
        stub();
        e(stub, 'to have returned');
      });

      it('should pass when spy returned after throwing', () => {
        const stub = sinon.stub();
        stub.onFirstCall().throws(new Error('oops'));
        stub.onSecondCall().returns(42);
        try {
          stub();
        } catch {
          // expected
        }
        stub();
        e(stub, 'to have returned');
      });

      it('should fail when spy only threw', () => {
        const stub = sinon.stub().throws(new Error('always throws'));
        try {
          stub();
        } catch {
          // expected
        }
        expect(() => e(stub, 'to have returned'), 'to throw');
      });

      it('should fail when spy was never called', () => {
        const spy = sinon.spy();
        expect(() => e(spy, 'to have returned'), 'to throw');
      });

      it('should support alternate phrase "returned"', () => {
        const stub = sinon.stub().returns(42);
        stub();
        e(stub, 'returned');
      });
    });

    describe('to have returned times', () => {
      it('should pass when spy returned exact number of times', () => {
        const stub = sinon.stub().returns(42);
        stub();
        stub();
        stub();
        e(stub, 'to have returned times', 3);
      });

      it('should count only successful returns', () => {
        const stub = sinon.stub();
        stub.onFirstCall().throws(new Error('oops'));
        stub.onSecondCall().returns(1);
        stub.onThirdCall().returns(2);
        try {
          stub();
        } catch {
          // expected
        }
        stub();
        stub();
        e(stub, 'to have returned times', 2);
      });

      it('should fail when return count does not match', () => {
        const stub = sinon.stub().returns(42);
        stub();
        stub();
        expect(() => e(stub, 'to have returned times', 3), 'to throw');
      });

      it('should pass with 0 when all calls threw', () => {
        const stub = sinon.stub().throws(new Error('always throws'));
        try {
          stub();
        } catch {
          // expected
        }
        e(stub, 'to have returned times', 0);
      });
    });

    describe('to have returned with', () => {
      it('should pass when spy returned the value at least once', () => {
        const stub = sinon.stub().returns(42);
        stub();
        e(stub, 'to have returned with', 42);
      });

      it('should pass when any call returned the value', () => {
        const stub = sinon.stub();
        stub.onFirstCall().returns('first');
        stub.onSecondCall().returns('target');
        stub.onThirdCall().returns('third');
        stub();
        stub();
        stub();
        e(stub, 'to have returned with', 'target');
      });

      it('should fail when value was never returned', () => {
        const stub = sinon.stub().returns(42);
        stub();
        expect(() => e(stub, 'to have returned with', 99), 'to throw');
      });

      it('should fail when spy was never called', () => {
        const spy = sinon.spy();
        expect(() => e(spy, 'to have returned with', 42), 'to throw');
      });
    });
  });

  describe('spyCall assertions', () => {
    describe('to have args', () => {
      it('should pass when call has matching args', () => {
        const spy = sinon.spy();
        spy('foo', 42);
        e(spy.firstCall, 'to have args', ['foo', 42]);
      });

      it('should fail when args do not match', () => {
        const spy = sinon.spy();
        spy('foo');
        expect(() => e(spy.firstCall, 'to have args', ['bar']), 'to throw');
      });
    });

    describe('to have returned', () => {
      it('should pass when call returned expected value', () => {
        const stub = sinon.stub().returns(42);
        stub();
        e(stub.firstCall, 'to have returned', 42);
      });

      it('should fail when return value does not match', () => {
        const stub = sinon.stub().returns(42);
        stub();
        expect(() => e(stub.firstCall, 'to have returned', 99), 'to throw');
      });
    });

    describe('to have thrown', () => {
      it('should pass when call threw', () => {
        const stub = sinon.stub().throws(new Error('boom'));
        try {
          stub();
        } catch {
          // expected
        }
        e(stub.firstCall, 'to have thrown');
      });

      it('should fail when call did not throw', () => {
        const spy = sinon.spy();
        spy();
        expect(() => e(spy.firstCall, 'to have thrown'), 'to throw');
      });
    });

    describe('to have this', () => {
      it('should pass when call had correct this context', () => {
        const obj = { method: sinon.spy() };
        obj.method();
        e(obj.method.firstCall, 'to have this', obj);
      });

      it('should fail when this context does not match', () => {
        const obj = { method: sinon.spy() };
        const other = {};
        obj.method.call(other);
        expect(() => e(obj.method.firstCall, 'to have this', obj), 'to throw');
      });
    });
  });

  describe('call order assertions', () => {
    describe('was called before', () => {
      it('should pass when first spy was called before second', () => {
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        spy1();
        spy2();
        e(spy1, 'was called before', spy2);
      });

      it('should fail when order is reversed', () => {
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        spy2();
        spy1();
        expect(() => e(spy1, 'was called before', spy2), 'to throw');
      });
    });

    describe('was called after', () => {
      it('should pass when first spy was called after second', () => {
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        spy2();
        spy1();
        e(spy1, 'was called after', spy2);
      });

      it('should fail when order is reversed', () => {
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        spy1();
        spy2();
        expect(() => e(spy1, 'was called after', spy2), 'to throw');
      });
    });

    describe('given call order', () => {
      it('should pass when spies were called in order', () => {
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        const spy3 = sinon.spy();
        spy1();
        spy2();
        spy3();
        e([spy1, spy2, spy3], 'given call order');
      });

      it('should fail when order is wrong', () => {
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        spy2();
        spy1();
        expect(() => e([spy1, spy2], 'given call order'), 'to throw');
      });
    });
  });

  describe('to have calls satisfying', () => {
    it('should pass when all calls match the specification', () => {
      const spy = sinon.spy();
      spy(1);
      spy(2);
      spy(3);
      e(spy, 'to have calls satisfying', [
        { args: [1] },
        { args: [2] },
        { args: [3] },
      ]);
    });

    it('should support array shorthand for args', () => {
      const spy = sinon.spy();
      spy('a', 1);
      spy('b', 2);
      e(spy, 'to have calls satisfying', [
        ['a', 1],
        ['b', 2],
      ]);
    });

    it('should fail when call count does not match', () => {
      const spy = sinon.spy();
      spy(1);
      expect(
        () =>
          e(spy, 'to have calls satisfying', [{ args: [1] }, { args: [2] }]),
        'to throw',
      );
    });

    it('should fail when args do not match', () => {
      const spy = sinon.spy();
      spy(1);
      spy(99);
      expect(
        () =>
          e(spy, 'to have calls satisfying', [{ args: [1] }, { args: [2] }]),
        'to throw',
      );
    });

    it('should support checking returned values', () => {
      const stub = sinon.stub();
      stub.onFirstCall().returns(10);
      stub.onSecondCall().returns(20);
      stub();
      stub();
      e(stub, 'to have calls satisfying', [{ returned: 10 }, { returned: 20 }]);
    });
  });

  describe('alternate phrases', () => {
    it('should support "to have been called"', () => {
      const spy = sinon.spy();
      spy();
      e(spy, 'to have been called');
    });

    it('should support "to not have been called"', () => {
      const spy = sinon.spy();
      e(spy, 'to not have been called');
    });

    it('should support "to have been called with"', () => {
      const spy = sinon.spy();
      spy(42);
      e(spy, 'to have been called with', [42]);
    });

    it('should support "to have been called once"', () => {
      const spy = sinon.spy();
      spy();
      e(spy, 'to have been called once');
    });

    it('should support "to have been called on"', () => {
      const obj = { method: sinon.spy() };
      obj.method();
      e(obj.method, 'to have been called on', obj);
    });

    it('should support "to have thrown"', () => {
      const stub = sinon.stub().throws(new Error('oops'));
      try {
        stub();
      } catch {
        // expected
      }
      e(stub, 'to have thrown');
    });
  });
});
