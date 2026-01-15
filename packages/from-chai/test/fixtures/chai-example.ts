// @ts-nocheck - This is a Chai fixture file, intentionally not type-checked
/**
 * Example Chai test file for integration testing. This file demonstrates
 * various Chai assertion patterns.
 */
import chai, { assert, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { describe, it } from 'node:test';

chai.use(chaiAsPromised);

interface User {
  id: number;
  name: string;
  email: string;
}

const getUser = (): User => ({
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
});

const throwError = (): never => {
  throw new Error('Something went wrong');
};

describe('User Service', () => {
  describe('BDD style (expect)', () => {
    it('should return a user with correct properties', () => {
      const user = getUser();
      expect(user).to.have.property('id');
      expect(user.id).to.equal(1);
      expect(user.name).to.be.a('string');
      expect(user.email).to.contain('@');
    });

    it('should handle truthiness checks', () => {
      const user = getUser();
      expect(user).to.exist;
      expect(user.id).to.be.ok;
      expect(user.name === 'Alice').to.be.true;
      expect(user.name === 'Bob').to.be.false;
    });

    it('should handle negations', () => {
      const user = getUser();
      expect(user.name).to.not.equal('Bob');
      expect(user.email).not.to.be.empty;
    });

    it('should handle deep equality', () => {
      const user = getUser();
      expect(user).to.deep.equal({
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
      });
    });

    it('should handle arrays', () => {
      const users = [getUser()];
      expect(users).to.have.length(1);
      expect(users).to.include(users[0]);
      expect(users).to.not.be.empty;
    });

    it('should handle numbers', () => {
      const user = getUser();
      expect(user.id).to.be.above(0);
      expect(user.id).to.be.below(100);
      expect(user.id).to.be.at.least(1);
      expect(user.id).to.be.at.most(1);
    });

    it('should handle errors', () => {
      expect(throwError).to.throw();
      expect(throwError).to.throw(Error);
    });

    it('should handle type checks', () => {
      const user = getUser();
      expect(user).to.be.an('object');
      expect(user.name).to.be.a('string');
    });
  });

  describe('TDD style (assert)', () => {
    it('should return correct user data', () => {
      const user = getUser();
      assert.equal(user.id, 1);
      assert.strictEqual(user.name, 'Alice');
      assert.isString(user.email);
    });

    it('should handle truthiness', () => {
      const user = getUser();
      assert.isTrue(user.id === 1);
      assert.isFalse(user.id === 2);
      assert.isOk(user);
      assert.isNotNull(user);
    });

    it('should handle deep equality', () => {
      const user = getUser();
      assert.deepEqual(user, {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
      });
    });

    it('should handle arrays', () => {
      const users = [getUser()];
      assert.lengthOf(users, 1);
      assert.include(users, users[0]);
      assert.isArray(users);
    });

    it('should handle numbers', () => {
      const user = getUser();
      assert.isAbove(user.id, 0);
      assert.isBelow(user.id, 100);
      assert.isAtLeast(user.id, 1);
      assert.isAtMost(user.id, 1);
    });

    it('should handle errors', () => {
      assert.throws(throwError);
      assert.throws(throwError, Error);
    });

    it('should handle type checks', () => {
      const user = getUser();
      assert.isObject(user);
      assert.typeOf(user.name, 'string');
    });
  });
});
