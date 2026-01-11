/**
 * Integration tests for snapshot assertions.
 *
 * Tests the complete snapshot flow with actual test contexts.
 */

import stringify from 'json-stable-stringify';
import { describe, it } from 'node:test';

import { expect } from '../../src/index.js';
import { supportsNodeTestSnapshots } from '../../src/snapshot/node-version.js';

describe(
  'Snapshot Integration Tests',
  { skip: !supportsNodeTestSnapshots },
  () => {
    describe('with node:test', () => {
      it('should create and match snapshots with node:test context', (t) => {
        const data = {
          age: 30,
          name: 'Alice',
          roles: ['admin', 'user'],
        };

        // This should delegate to node:test's native snapshot
        expect(data, 'to match snapshot', t);
      });

      it('should support different phrase variations', (t) => {
        const value = { test: 'value' };

        // All these should work
        expect(value, 'to match snapshot', t);
        // Note: Can't test all variations in one test due to snapshot counter
      });

      it('should handle complex nested objects', (t) => {
        const complex = {
          metadata: {
            createdAt: new Date('2025-01-12T00:00:00.000Z'),
            tags: ['important', 'urgent'],
          },
          user: {
            profile: {
              name: 'Bob',
              settings: {
                notifications: true,
                theme: 'dark',
              },
            },
          },
        };

        expect(complex, 'to match snapshot', t);
      });

      it('should handle arrays', (t) => {
        const arr = [1, 2, 3, { nested: 'value' }, ['deep', 'array']];

        expect(arr, 'to match snapshot', t);
      });

      it('should handle primitives', (t) => {
        expect('simple string', 'to match snapshot', t);
      });

      it('should handle numbers', (t) => {
        expect(42, 'to match snapshot', t);
      });

      it('should handle booleans', (t) => {
        expect(true, 'to match snapshot', t);
      });

      it('should handle null', (t) => {
        expect(null, 'to match snapshot', t);
      });
    });

    describe('with explicit names', () => {
      it('should work with string snapshot names', () => {
        const data = { explicit: 'name' };

        expect(data, 'to match snapshot', 'explicit-snapshot-name');
      });

      it('should allow multiple explicit snapshots', () => {
        expect({ step: 1 }, 'to match snapshot', 'multi-step-1');
        expect({ step: 2 }, 'to match snapshot', 'multi-step-2');
        expect({ step: 3 }, 'to match snapshot', 'multi-step-3');
      });
    });

    describe('with custom serializers', () => {
      it('should use custom serializer when provided', (t) => {
        const data = {
          public: 'visible',
          secret: 'password123',
        };

        expect(data, 'to match snapshot', t, 'with options', {
          serializer: (value: typeof data) => {
            return stringify({ ...value, secret: '[REDACTED]' }, { space: 2 });
          },
        });
      });

      it('should handle custom serializer for complex objects', (t) => {
        const user = {
          creditCard: '1234-5678-9012-3456',
          email: 'user@example.com',
          id: 123,
          password: 'secret',
        };

        expect(user, 'to match snapshot', t, 'with options', {
          serializer: (value: typeof user) => {
            const sanitized = {
              ...value,
              creditCard: value.creditCard.replace(/\d/g, 'X'),
              password: '[REDACTED]',
            };
            return String(stringify(sanitized, { space: 2 }));
          },
        });
      });
    });

    describe('chaining with other assertions', () => {
      it('should chain snapshots with other assertions', (t) => {
        const user = {
          age: 30,
          email: 'alice@example.com',
          name: 'Alice',
        };

        expect(
          user,
          'to satisfy',
          { name: 'Alice' },
          'and',
          'to have property',
          'email',
          'and',
          'to match snapshot',
          t,
        );
      });

      it('should chain with type assertions', (t) => {
        const value = 'test string';

        expect(value, 'to be a string', 'and', 'to match snapshot', t);
      });
    });

    describe('error handling', () => {
      it('should work with Error objects', (t) => {
        const error = new Error('Test error message');
        error.name = 'CustomError';

        expect(error, 'to match snapshot', t);
      });

      it('should work with custom error properties', (t) => {
        const error = Object.assign(new TypeError('Type mismatch'), {
          code: 'ERR_TYPE',
          statusCode: 400,
        });

        expect(error, 'to match snapshot', t);
      });
    });

    describe('special types', () => {
      it('should handle Maps', (t) => {
        const map = new Map<string, string | { nested: string }>([
          ['key1', 'value1'],
          ['key2', { nested: 'value' }],
        ]);

        expect(map, 'to match snapshot', t);
      });

      it('should handle Sets', (t) => {
        const set = new Set([1, 2, 3, 'string', { obj: 'value' }]);

        expect(set, 'to match snapshot', t);
      });

      it('should handle Dates', (t) => {
        const date = new Date('2025-01-12T00:00:00.000Z');

        expect(date, 'to match snapshot', t);
      });

      it('should handle RegExp', (t) => {
        const pattern = /test.*pattern/gi;

        expect(pattern, 'to match snapshot', t);
      });
    });

    describe('circular references', () => {
      it('should handle circular object references', (t) => {
        const obj: { name: string; self?: unknown } = { name: 'circular' };
        obj.self = obj;

        expect(obj, 'to match snapshot', t);
      });

      it('should handle circular array references', (t) => {
        const arr: any[] = [1, 2, 3];
        arr.push(arr);

        expect(arr, 'to match snapshot', t);
      });
    });

    describe('real-world scenarios', () => {
      it('should snapshot API response shape', (t) => {
        const apiResponse = {
          data: {
            meta: {
              page: 1,
              pageSize: 10,
              total: 2,
            },
            users: [
              {
                email: 'alice@example.com',
                id: 1,
                name: 'Alice',
                roles: ['admin'],
              },
              {
                email: 'bob@example.com',
                id: 2,
                name: 'Bob',
                roles: ['user'],
              },
            ],
          },
          headers: {
            'content-type': 'application/json',
            'x-request-id': 'abc-123',
          },
          status: 200,
        };

        expect(apiResponse, 'to match snapshot', t);
      });

      it('should snapshot component output', (t) => {
        // Simulate a component render result
        const componentOutput = {
          props: {
            children: [
              {
                props: { children: 'User Profile' },
                type: 'h2',
              },
              {
                props: { children: 'Name: Alice' },
                type: 'p',
              },
              {
                props: {
                  children: 'Edit',
                  onClick: '[Function]',
                },
                type: 'button',
              },
            ],
            className: 'user-card',
          },
          type: 'div',
        };

        expect(componentOutput, 'to match snapshot', t);
      });

      it('should snapshot configuration objects', (t) => {
        const config = {
          database: {
            host: 'localhost',
            name: 'test-db',
            port: 5432,
            type: 'postgres',
          },
          features: {
            authentication: true,
            caching: false,
            rateLimit: true,
          },
          logging: {
            format: 'json',
            level: 'info',
            outputs: ['console', 'file'],
          },
          server: {
            host: 'localhost',
            port: 3000,
            protocol: 'http',
          },
        };

        expect(config, 'to match snapshot', t);
      });
    });
  },
);
