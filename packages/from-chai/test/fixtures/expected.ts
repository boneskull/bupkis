/**
 * Example Chai test file for integration testing. This file demonstrates
 * various Chai assertion patterns.
 */
import { describe, it } from 'node:test';
import { expect } from 'bupkis';

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
      expect(user, 'to have property', 'id');
      expect(user.id, 'to be', 1);
      expect(user.name, 'to be a', 'string');
      expect(user.email, 'to contain', '@');
    });

    it('should handle truthiness checks', () => {
      const user = getUser();
      expect(user, 'to be defined');
      expect(user.id, 'to be truthy');
      expect(user.name === 'Alice', 'to be true');
      expect(user.name === 'Bob', 'to be false');
    });

    it('should handle negations', () => {
      const user = getUser();
      expect(user.name, 'not to be', 'Bob');
      expect(user.email, 'not to be empty');
    });

    it('should handle deep equality', () => {
      const user = getUser();
      expect(user, 'to deep equal', {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
      });
    });

    it('should handle arrays', () => {
      const users = [getUser()];
      expect(users, 'to have length', 1);
      expect(users, 'to contain', users[0]);
      expect(users, 'not to be empty');
    });

    it('should handle numbers', () => {
      const user = getUser();
      expect(user.id, 'to be greater than', 0);
      expect(user.id, 'to be less than', 100);
      expect(user.id, 'to be greater than or equal to', 1);
      expect(user.id, 'to be less than or equal to', 1);
    });

    it('should handle errors', () => {
      expect(throwError, 'to throw');
      expect(throwError, 'to throw', Error);
    });

    it('should handle type checks', () => {
      const user = getUser();
      expect(user, 'to be a', 'object');
      expect(user.name, 'to be a', 'string');
    });
  });

  describe('TDD style (assert)', () => {
    it('should return correct user data', () => {
      const user = getUser();
      expect(user.id, 'to be', 1);
      expect(user.name, 'to be', 'Alice');
      expect(user.email, 'to be a', 'string');
    });

    it('should handle truthiness', () => {
      const user = getUser();
      expect(user.id === 1, 'to be true');
      expect(user.id === 2, 'to be false');
      expect(user, 'to be truthy');
      expect(user, 'not to be null');
    });

    it('should handle deep equality', () => {
      const user = getUser();
      expect(user, 'to deep equal', {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
      });
    });

    it('should handle arrays', () => {
      const users = [getUser()];
      expect(users, 'to have length', 1);
      expect(users, 'to contain', users[0]);
      expect(users, 'to be a', 'array');
    });

    it('should handle numbers', () => {
      const user = getUser();
      expect(user.id, 'to be greater than', 0);
      expect(user.id, 'to be less than', 100);
      expect(user.id, 'to be greater than or equal to', 1);
      expect(user.id, 'to be less than or equal to', 1);
    });

    it('should handle errors', () => {
      expect(throwError, 'to throw');
      expect(throwError, 'to throw', Error);
    });

    it('should handle type checks', () => {
      const user = getUser();
      expect(user, 'to be a', 'object');
      expect(user.name, 'to be a', 'string');
    });
  });
});
