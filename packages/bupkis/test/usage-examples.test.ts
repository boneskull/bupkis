import { describe, it } from 'node:test';

import { expect } from './custom-assertions.js';

describe('examples from usage.md', () => {
  describe('Embeddable assertions', () => {
    it('should create reusable assertion functions within satisfy patterns', () => {
      const isString = expect.it('to be a string');
      const isPositiveNumber = expect.it('to be greater than', 0);

      // Test valid cases within 'to satisfy' context
      expect({ count: 42, name: 'hello' }, 'to satisfy', {
        count: isPositiveNumber,
        name: isString,
      });

      // Test invalid cases should throw
      expect(() => {
        expect({ count: 42, name: 123 }, 'to satisfy', {
          count: isPositiveNumber,
          name: isString,
        });
      }, 'to fail');

      expect(() => {
        expect({ count: -5, name: 'hello' }, 'to satisfy', {
          count: isPositiveNumber,
          name: isString,
        });
      }, 'to fail');
    });

    it('should validate complex objects with embeddable assertions', () => {
      const user = {
        age: 30,
        email: 'alice@example.com',
        metadata: {
          lastLogin: '2024-01-15',
          preferences: {
            notifications: true,
            theme: 'dark',
          },
        },
        name: 'Alice Johnson',
        roles: ['admin', 'user'],
      };
      expect(user, 'to satisfy', {
        age: expect.it('to be greater than', 18),
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        metadata: {
          lastLogin: expect.it('to match', /^\d{4}-\d{2}-\d{2}$/),
          preferences: {
            notifications: expect.it('to be a boolean'),
            theme: expect.it('to be one of', ['light', 'dark']),
          },
        },
        name: expect.it('to be a string'),
        roles: expect.it('to be an array'),
      });
    });

    it('should support mixed pattern types', () => {
      const apiResponse = {
        data: {
          id: 12345,
          tags: ['urgent', 'review'],
          title: 'Important Document',
        },
        status: 'success',
        timestamp: '2024-01-15T10:30:00Z',
      };
      expect(apiResponse, 'to satisfy', {
        data: {
          id: expect.it('to be a number'),
          tags: expect.it('to be an array'),
          title: expect.it('to contain', 'Document'),
        },
        status: 'success',
        timestamp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
      });
    });

    it('should support complex assertion types', () => {
      const config = {
        database: {
          credentials: {
            password: 'secret123',
            username: 'admin',
          },
          host: 'localhost',
          port: 5432,
        },
        features: ['auth', 'logging', 'monitoring'],
      };
      expect(config, 'to satisfy', {
        database: {
          credentials: expect.it('to be an object'),
          host: expect.it('to be a string'),
          port: expect.it('to be between', 1024, 65535),
        },
        features: expect.it('to have length', 3),
      });
    });

    it('should support nested object assertions', () => {
      const product = {
        name: 'Laptop',
        price: 999.99,
        specs: {
          cpu: 'Intel i7',
          ram: '16GB',
          storage: '512GB SSD',
        },
      };
      expect(product, 'to satisfy', {
        name: expect.it('to be a string'),
        price: expect.it('to be a number'),
        specs: expect.it('to satisfy', {
          cpu: expect.it('to contain', 'Intel'),
          ram: expect.it('to match', /^\d+GB$/),
          storage: expect.it('to be a string'),
        }),
      });
    });

    it('should support "to be one of" assertion', () => {
      expect('red', 'to be one of', ['red', 'green', 'blue']);
      expect(42, 'to be one of', [1, 2, 3, 42, 100]);
      expect(
        () => expect('yellow', 'to be one of', ['red', 'green', 'blue']),
        'to fail',
      );
      expect('purple', 'not to be one of', ['red', 'green', 'blue']);
    });
  });
});
