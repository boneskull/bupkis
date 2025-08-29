import { describe, it } from 'node:test';

import { expect } from '../../src/index.js';

describe('Esoteric assertions', () => {
  describe('to have a null prototype', () => {
    describe('when the object has a null prototype', () => {
      it('should pass', () => {
        const nullProtoObj = Object.create(null) as object;
        expect(
          () => expect(nullProtoObj, 'to have a null prototype'),
          'not to throw',
        );
      });
    });

    describe('when the object does not have a null prototype', () => {
      it('should fail', () => {
        const regularObj = {};
        expect(
          () => expect(regularObj, 'to have a null prototype'),
          'to throw',
        );
      });
    });
  });

  describe('to be sealed', () => {
    describe('when the object is sealed', () => {
      it('should pass', () => {
        const sealedObj = Object.seal({});
        expect(() => expect(sealedObj, 'to be sealed'), 'not to throw');
      });
    });

    describe('when the object is not sealed', () => {
      it('should fail', () => {
        const regularObj = {};
        expect(() => expect(regularObj, 'to be sealed'), 'to throw');
      });
    });
  });

  describe('to be frozen', () => {
    describe('when the object is frozen', () => {
      it('should pass', () => {
        const frozenObj = Object.freeze({});
        expect(() => expect(frozenObj, 'to be frozen'), 'not to throw');
      });
    });

    describe('when the object is not frozen', () => {
      it('should fail', () => {
        const regularObj = {};
        expect(() => expect(regularObj, 'to be frozen'), 'to throw');
      });
    });
  });

  describe('to be an enumerable property of', () => {
    describe('when the property is enumerable', () => {
      it('should pass', () => {
        const obj = { a: 1, b: 2 };
        Object.defineProperty(obj, 'c', {
          enumerable: false,
          value: 3,
        });

        expect(
          () => expect('a', 'to be an enumerable property of', obj),
          'not to throw',
        );
        expect(
          () => expect('b', 'to be an enumerable property of', obj),
          'not to throw',
        );
      });
    });

    describe('when the property is not enumerable', () => {
      it('should fail', () => {
        const obj = { a: 1, b: 2 };
        Object.defineProperty(obj, 'c', {
          enumerable: false,
          value: 3,
        });

        expect(
          () => expect('c', 'to be an enumerable property of', obj),
          'to throw',
        );
        expect(
          () => expect('nonexistent', 'to be an enumerable property of', obj),
          'to throw',
        );
      });
    });
  });
});
