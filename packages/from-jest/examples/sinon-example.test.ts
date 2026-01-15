// Example Jest test file using mock matchers
// @ts-nocheck - This is a demo file; UserService is not defined
import { describe, expect, it, jest } from '@jest/globals';

describe('UserService', () => {
  it('should call the API when fetching users', () => {
    const mockFetch = jest.fn().mockResolvedValue({ users: [] });
    const service = new UserService(mockFetch);

    service.getUsers();

    expect(mockFetch).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/users');
  });

  it('should pass options to the API', () => {
    const mockFetch = jest.fn().mockResolvedValue({ users: [] });
    const service = new UserService(mockFetch);

    service.getUsers({ limit: 10, page: 2 });

    expect(mockFetch).toHaveBeenCalledWith('/api/users', {
      limit: 10,
      page: 2,
    });
    expect(mockFetch).not.toHaveBeenCalledWith('/api/posts');
  });

  it('should track multiple calls', () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({ users: [{ id: 1 }] })
      .mockResolvedValueOnce({ users: [{ id: 2 }] });

    const service = new UserService(mockFetch);

    service.getUsers();
    service.getUsers();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith('/api/users');
    expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/users');
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/users');
  });

  it('should check return values', () => {
    const calculator = jest.fn((a: number, b: number) => a + b);

    calculator(1, 2);
    calculator(3, 4);

    expect(calculator).toHaveReturned();
    expect(calculator).toHaveReturnedTimes(2);
    expect(calculator).toHaveReturnedWith(3);
    expect(calculator).toHaveReturnedWith(7);
    expect(calculator).toHaveLastReturnedWith(7);
    expect(calculator).toHaveNthReturnedWith(1, 3);
  });

  it('should work with Jest 29 aliases too', () => {
    const spy = jest.fn((x: number) => x * 2);
    spy(5);
    spy(10);

    // Call-related aliases (deprecated in Jest 26, removed in Jest 30)
    expect(spy).toBeCalled();
    expect(spy).toBeCalledTimes(2);
    expect(spy).toBeCalledWith(5);
    expect(spy).lastCalledWith(10);
    expect(spy).nthCalledWith(1, 5);

    // Return-related aliases
    expect(spy).toReturn();
    expect(spy).toReturnTimes(2);
    expect(spy).toReturnWith(10);
    expect(spy).lastReturnedWith(20);
    expect(spy).nthReturnedWith(1, 10);
  });

  it('should mix with regular assertions', () => {
    const mockFetch = jest.fn().mockResolvedValue({ count: 42 });

    const result = mockFetch();

    expect(mockFetch).toHaveBeenCalled();
    expect(result).toEqual({ count: 42 });
    expect(42).toBe(42);
  });
});
