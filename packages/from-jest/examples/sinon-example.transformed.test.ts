// Example Jest test file using mock matchers
// @ts-nocheck - This is a demo file; UserService is not defined
// NOTE: This file is intentionally broken! The jest.fn() calls need to be
// manually migrated to Sinon spies (sinon.spy() or sinon.stub()) for this
// code to work with @bupkis/sinon assertions.
import { describe, it, jest } from '@jest/globals';
import { use } from 'bupkis';
import sinonAssertions from '@bupkis/sinon';

const { expect } = use(sinonAssertions);

describe('UserService', () => {
  it('should call the API when fetching users', () => {
    const mockFetch = jest.fn().mockResolvedValue({ users: [] });
    const service = new UserService(mockFetch);

    service.getUsers();

    expect(mockFetch, 'was called');
    expect(mockFetch, 'was called times', 1);
    expect(mockFetch, 'was called with', ['/api/users']);
  });

  it('should pass options to the API', () => {
    const mockFetch = jest.fn().mockResolvedValue({ users: [] });
    const service = new UserService(mockFetch);

    service.getUsers({ limit: 10, page: 2 });

    expect(mockFetch, 'was called with', [
      '/api/users',
      { limit: 10, page: 2 },
    ]);
    expect(mockFetch, 'not was called with', ['/api/posts']);
  });

  it('should track multiple calls', () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({ users: [{ id: 1 }] })
      .mockResolvedValueOnce({ users: [{ id: 2 }] });

    const service = new UserService(mockFetch);

    service.getUsers();
    service.getUsers();

    expect(mockFetch, 'was called times', 2);
    expect(mockFetch.lastCall, 'to have args', ['/api/users']);
    expect(mockFetch.getCall(1 - 1), 'to have args', ['/api/users']);
    expect(mockFetch.getCall(2 - 1), 'to have args', ['/api/users']);
  });

  it('should check return values', () => {
    const calculator = jest.fn((a: number, b: number) => a + b);

    calculator(1, 2);
    calculator(3, 4);

    expect(calculator, 'to have returned');
    expect(calculator, 'to have returned times', 2);
    expect(calculator, 'to have returned with', 3);
    expect(calculator, 'to have returned with', 7);
    expect(calculator.lastCall, 'to have returned', 7);
    expect(calculator.getCall(1 - 1), 'to have returned', 3);
  });

  it('should work with Jest 29 aliases too', () => {
    const spy = jest.fn((x: number) => x * 2);
    spy(5);
    spy(10);

    // Call-related aliases (deprecated in Jest 26, removed in Jest 30)
    expect(spy, 'was called');
    expect(spy, 'was called times', 2);
    expect(spy, 'was called with', [5]);
    expect(spy.lastCall, 'to have args', [10]);
    expect(spy.getCall(1 - 1), 'to have args', [5]);

    // Return-related aliases
    expect(spy, 'to have returned');
    expect(spy, 'to have returned times', 2);
    expect(spy, 'to have returned with', 10);
    expect(spy.lastCall, 'to have returned', 20);
    expect(spy.getCall(1 - 1), 'to have returned', 10);
  });

  it('should mix with regular assertions', () => {
    const mockFetch = jest.fn().mockResolvedValue({ count: 42 });

    const result = mockFetch();

    expect(mockFetch, 'was called');
    expect(result, 'to deep equal', { count: 42 });
    expect(42, 'to be', 42);
  });
});
