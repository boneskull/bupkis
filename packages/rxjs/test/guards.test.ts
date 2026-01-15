import { expect } from 'bupkis';
import { describe, it } from 'node:test';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';

import { isObservable } from '../src/guards.js';

describe('@bupkis/rxjs', () => {
  describe('guards', () => {
    describe('isObservable', () => {
      it('should return true for Observable created with of()', () => {
        expect(isObservable(of(1, 2, 3)), 'to be true');
      });

      it('should return true for Subject', () => {
        expect(isObservable(new Subject()), 'to be true');
      });

      it('should return true for BehaviorSubject', () => {
        expect(isObservable(new BehaviorSubject(42)), 'to be true');
      });

      it('should return true for error Observable', () => {
        expect(isObservable(throwError(() => new Error('oops'))), 'to be true');
      });

      it('should return false for null', () => {
        expect(isObservable(null), 'to be false');
      });

      it('should return false for undefined', () => {
        expect(isObservable(undefined), 'to be false');
      });

      it('should return false for primitive values', () => {
        expect(isObservable(42), 'to be false');
        expect(isObservable('string'), 'to be false');
        expect(isObservable(true), 'to be false');
      });

      it('should return false for Promise', () => {
        expect(isObservable(Promise.resolve()), 'to be false');
      });

      it('should return false for plain object', () => {
        expect(isObservable({}), 'to be false');
      });

      it('should return false for array', () => {
        expect(isObservable([1, 2, 3]), 'to be false');
      });

      it('should return true for object with subscribe method (duck typing)', () => {
        const fakeObservable = {
          subscribe: () => {},
        };
        expect(isObservable(fakeObservable), 'to be true');
      });
    });
  });
});
