import { AssertionError as NodeAssertionError } from 'node:assert';
import { describe, it } from 'node:test';
import { z } from 'zod/v4';

import {
  kBupkisAssertionError,
  kBupkisFailAssertionError,
  kBupkisNegatedAssertionError,
} from '../src/constant.js';
import {
  AssertionError,
  FailAssertionError,
  NegatedAssertionError,
} from '../src/error.js';
import { expect } from '../src/index.js';

describe('AssertionError', () => {
  describe('constructor', () => {
    it('should extend Node.js AssertionError', () => {
      const error = new AssertionError({ message: 'test error' });
      expect(error, 'to be an instance of', NodeAssertionError);
      expect(error, 'to be an instance of', AssertionError);
    });

    it('should have correct name', () => {
      const error = new AssertionError({ message: 'test error' });
      expect(error.name, 'to equal', 'AssertionError');
    });

    it('should have the bupkis marker symbol', () => {
      const error = new AssertionError({ message: 'test error' });
      expect(error[kBupkisAssertionError], 'to be true');
    });

    it('should preserve message and other properties', () => {
      const options = {
        actual: 'actual value',
        expected: 'expected value',
        message: 'Custom error message',
        operator: 'strictEqual',
      };
      const error = new AssertionError(options);
      // Note: Node.js AssertionError formats the message when actual/expected are provided
      expect(error.message, 'to contain', 'Custom error message');
      expect(error.actual, 'to equal', 'actual value');
      expect(error.expected, 'to equal', 'expected value');
      expect(error.operator, 'to equal', 'strictEqual');
    });
  });

  describe('isAssertionError', () => {
    it('should return true for AssertionError instances', () => {
      const error = new AssertionError({ message: 'test' });
      expect(AssertionError.isAssertionError(error), 'to be true');
    });

    it('should return true for subclass instances', () => {
      const failError = new FailAssertionError({ message: 'test' });
      const negatedError = new NegatedAssertionError({ message: 'test' });
      expect(AssertionError.isAssertionError(failError), 'to be true');
      expect(AssertionError.isAssertionError(negatedError), 'to be true');
    });

    it('should return false for regular Node.js AssertionError', () => {
      const error = new NodeAssertionError({ message: 'test' });
      expect(AssertionError.isAssertionError(error), 'to be false');
    });

    it('should return false for other error types', () => {
      const error = new Error('test');
      const typeError = new TypeError('test');
      expect(AssertionError.isAssertionError(error), 'to be false');
      expect(AssertionError.isAssertionError(typeError), 'to be false');
    });

    it('should return false for non-error values', () => {
      expect(AssertionError.isAssertionError(null), 'to be false');
      expect(AssertionError.isAssertionError(undefined), 'to be false');
      expect(AssertionError.isAssertionError('string'), 'to be false');
      expect(AssertionError.isAssertionError(42), 'to be false');
      expect(AssertionError.isAssertionError({}), 'to be false');
      expect(AssertionError.isAssertionError([]), 'to be false');
    });
  });

  describe('fromZodError', () => {
    it('should create AssertionError from ZodError with single value', () => {
      const schema = z.string();
      const result = schema.safeParse(42);
      expect(result.success, 'to be false');

      if (!result.success) {
        const stackStartFn = () => {};
        const values = [42] as readonly [unknown];
        const error = AssertionError.fromZodError(
          result.error,
          stackStartFn,
          values,
        );

        expect(error, 'to be an instance of', AssertionError);
        expect(error.actual, 'to equal', 42);
        expect(error.expected, 'to be an array');
        expect(error.expected, 'to have length', 0);
        expect(error.message, 'to contain', 'Assertion');
        expect(error.message, 'to contain', 'failed');
        expect(error.operator, 'to contain', 'AssertionError');
      }
    });

    it('should create AssertionError from ZodError with multiple values', () => {
      const schema = z.number().gt(10);
      const result = schema.safeParse(5);
      expect(result.success, 'to be false');

      if (!result.success) {
        const stackStartFn = () => {};
        const values = [5, 10] as unknown as readonly [unknown];
        const error = AssertionError.fromZodError(
          result.error,
          stackStartFn,
          values,
        );

        expect(error, 'to be an instance of', AssertionError);
        expect(error.actual, 'to equal', 5);
        expect(error.expected, 'to equal', 10);
        expect(error.message, 'to contain', 'Assertion');
        expect(error.message, 'to contain', 'failed');
      }
    });

    it('should create AssertionError with multiple expected values as array', () => {
      const schema = z.union([z.string(), z.number()]);
      const result = schema.safeParse(true);
      expect(result.success, 'to be false');

      if (!result.success) {
        const stackStartFn = () => {};
        const values = [true, 'string', 42, 'other'] as unknown as readonly [
          unknown,
        ];
        const error = AssertionError.fromZodError(
          result.error,
          stackStartFn,
          values,
        );

        expect(error, 'to be an instance of', AssertionError);
        expect(error.actual, 'to equal', true);
        expect(error.expected, 'to be an array');
        expect(error.expected, 'to have length', 3);
        expect(error.expected, 'to contain', 'string');
        expect(error.expected, 'to contain', 42);
        expect(error.expected, 'to contain', 'other');
      }
    });

    it('should include form errors in message', () => {
      // Create a schema that will generate form errors
      const schema = z.string().min(5, 'String too short');
      const result = schema.safeParse('hi');
      expect(result.success, 'to be false');

      if (!result.success) {
        const stackStartFn = () => {};
        const values = ['hi'] as readonly [unknown];
        const error = AssertionError.fromZodError(
          result.error,
          stackStartFn,
          values,
        );

        expect(error.message, 'to contain', 'String too short');
      }
    });

    it('should include field errors in message', () => {
      // Create a schema that will generate field errors
      const schema = z.object({
        age: z.number().positive('Age must be positive'),
        name: z.string().min(3, 'Name too short'),
      });
      const result = schema.safeParse({ age: -5, name: 'a' });
      expect(result.success, 'to be false');

      if (!result.success) {
        const stackStartFn = () => {};
        const values = [{ age: -5, name: 'a' }] as readonly [unknown];
        const error = AssertionError.fromZodError(
          result.error,
          stackStartFn,
          values,
        );

        expect(error.message, 'to contain', 'name');
        expect(error.message, 'to contain', 'Name too short');
        expect(error.message, 'to contain', 'age');
        expect(error.message, 'to contain', 'Age must be positive');
      }
    });

    it('should combine form and field errors in message', () => {
      // Create a custom schema with both form and field errors
      const schema = z
        .object({
          password: z.string().min(8, 'Password too short'),
          username: z.string().min(3, 'Username too short'),
        })
        .refine((data) => data.username !== data.password, {
          message: 'Username and password cannot be the same',
        });

      const result = schema.safeParse({ password: 'a', username: 'a' });
      expect(result.success, 'to be false');

      if (!result.success) {
        const stackStartFn = () => {};
        const values = [{ password: 'a', username: 'a' }] as readonly [unknown];
        const error = AssertionError.fromZodError(
          result.error,
          stackStartFn,
          values,
        );

        // Should contain field errors
        expect(error.message, 'to contain', 'username');
        expect(error.message, 'to contain', 'Username too short');
        expect(error.message, 'to contain', 'password');
        expect(error.message, 'to contain', 'Password too short');
        // Should contain form error
        expect(
          error.message,
          'to contain',
          'Username and password cannot be the same',
        );
      }
    });

    it('should preserve stackStartFn for stack trace management', () => {
      const schema = z.string();
      const result = schema.safeParse(42);
      expect(result.success, 'to be false');

      if (!result.success) {
        function outerFunction() {
          return innerFunction();
        }

        function innerFunction() {
          return createErrorFromZod();
        }

        function createErrorFromZod() {
          const values = [42] as readonly [unknown];
          return AssertionError.fromZodError(
            result.error!,
            createErrorFromZod,
            values,
          );
        }

        const error = outerFunction();

        // Error should have stack trace
        expect(error.stack, 'to be a string');

        // Stack should exclude createErrorFromZod (due to stackStartFn)
        expect(error.stack, 'not to contain', 'createErrorFromZod');

        // Stack should still include the outer functions
        expect(error.stack, 'to contain', 'innerFunction');
        expect(error.stack, 'to contain', 'outerFunction');
      }
    });

    it('should return AssertionError instance with correct properties', () => {
      const schema = z.number();
      const result = schema.safeParse('not a number');
      expect(result.success, 'to be false');

      if (!result.success) {
        const stackStartFn = () => {};
        const values = ['not a number'] as readonly [unknown];
        const error = AssertionError.fromZodError(
          result.error,
          stackStartFn,
          values,
        );

        // Should be proper AssertionError
        expect(error, 'to be an instance of', AssertionError);
        expect(error, 'to be an instance of', NodeAssertionError);
        expect(error.name, 'to equal', 'AssertionError');
        expect(error[kBupkisAssertionError], 'to be true');

        // Should have expected AssertionError properties
        expect(error.actual, 'to equal', 'not a number');
        expect(error.message, 'to be a string');
        expect(error.operator, 'to be a string');
        expect(error.stack, 'to be a string');
      }
    });

    it('should handle empty values array gracefully', () => {
      const schema = z.string();
      const result = schema.safeParse(42);
      expect(result.success, 'to be false');

      if (!result.success) {
        const stackStartFn = () => {};
        const values = [] as const;
        const error = AssertionError.fromZodError(
          result.error,
          stackStartFn,
          // @ts-expect-error should really not be empty
          values,
        );

        expect(error, 'to be an instance of', AssertionError);
        expect(error.actual, 'to be undefined');
        expect(error.expected, 'to be an array');
        expect(error.expected, 'to have length', 0);
      }
    });
  });
});

describe('FailAssertionError', () => {
  describe('constructor', () => {
    it('should extend AssertionError', () => {
      const error = new FailAssertionError({ message: 'test error' });
      expect(error, 'to be an instance of', AssertionError);
      expect(error, 'to be an instance of', FailAssertionError);
      expect(error, 'to be an instance of', NodeAssertionError);
    });

    it('should have correct name', () => {
      const error = new FailAssertionError({ message: 'test error' });
      expect(error.name, 'to equal', 'FailAssertionError');
    });

    it('should have both bupkis marker symbols', () => {
      const error = new FailAssertionError({ message: 'test error' });
      expect(error[kBupkisAssertionError], 'to be true');
      expect(error[kBupkisFailAssertionError], 'to be true');
    });

    it('should preserve message and other properties', () => {
      const options = {
        actual: 'actual value',
        expected: 'expected value',
        message: 'Fail error message',
      };
      const error = new FailAssertionError(options);
      expect(error.message, 'to equal', 'Fail error message');
      expect(error.actual, 'to equal', 'actual value');
      expect(error.expected, 'to equal', 'expected value');
    });
  });

  describe('isFailAssertionError', () => {
    it('should return true for FailAssertionError instances', () => {
      const error = new FailAssertionError({ message: 'test' });
      expect(FailAssertionError.isFailAssertionError(error), 'to be true');
    });

    it('should return false for regular AssertionError', () => {
      const error = new AssertionError({ message: 'test' });
      expect(FailAssertionError.isFailAssertionError(error), 'to be false');
    });

    it('should return false for NegatedAssertionError', () => {
      const error = new NegatedAssertionError({ message: 'test' });
      expect(FailAssertionError.isFailAssertionError(error), 'to be false');
    });

    it('should return false for other error types', () => {
      const error = new Error('test');
      const nodeError = new NodeAssertionError({ message: 'test' });
      expect(FailAssertionError.isFailAssertionError(error), 'to be false');
      expect(FailAssertionError.isFailAssertionError(nodeError), 'to be false');
    });

    it('should return false for non-error values', () => {
      expect(FailAssertionError.isFailAssertionError(null), 'to be false');
      expect(FailAssertionError.isFailAssertionError(undefined), 'to be false');
      expect(FailAssertionError.isFailAssertionError('string'), 'to be false');
      expect(FailAssertionError.isFailAssertionError(42), 'to be false');
      expect(FailAssertionError.isFailAssertionError({}), 'to be false');
    });
  });
});

describe('NegatedAssertionError', () => {
  describe('constructor', () => {
    it('should extend AssertionError', () => {
      const error = new NegatedAssertionError({ message: 'test error' });
      expect(error, 'to be an instance of', AssertionError);
      expect(error, 'to be an instance of', NegatedAssertionError);
      expect(error, 'to be an instance of', NodeAssertionError);
    });

    it('should have correct name', () => {
      const error = new NegatedAssertionError({ message: 'test error' });
      expect(error.name, 'to equal', 'NegatedAssertionError');
    });

    it('should have both bupkis marker symbols', () => {
      const error = new NegatedAssertionError({ message: 'test error' });
      expect(error[kBupkisAssertionError], 'to be true');
      expect(error[kBupkisNegatedAssertionError], 'to be true');
    });

    it('should preserve message and other properties', () => {
      const options = {
        actual: 'actual value',
        expected: 'expected value',
        message: 'Negated error message',
      };
      const error = new NegatedAssertionError(options);
      expect(error.message, 'to equal', 'Negated error message');
      expect(error.actual, 'to equal', 'actual value');
      expect(error.expected, 'to equal', 'expected value');
    });
  });

  describe('isNegatedAssertionError', () => {
    it('should return true for NegatedAssertionError instances', () => {
      const error = new NegatedAssertionError({ message: 'test' });
      expect(
        NegatedAssertionError.isNegatedAssertionError(error),
        'to be true',
      );
    });

    it('should return false for regular AssertionError', () => {
      const error = new AssertionError({ message: 'test' });
      expect(
        NegatedAssertionError.isNegatedAssertionError(error),
        'to be false',
      );
    });

    it('should return false for FailAssertionError', () => {
      const error = new FailAssertionError({ message: 'test' });
      expect(
        NegatedAssertionError.isNegatedAssertionError(error),
        'to be false',
      );
    });

    it('should return false for other error types', () => {
      const error = new Error('test');
      const nodeError = new NodeAssertionError({ message: 'test' });
      expect(
        NegatedAssertionError.isNegatedAssertionError(error),
        'to be false',
      );
      expect(
        NegatedAssertionError.isNegatedAssertionError(nodeError),
        'to be false',
      );
    });

    it('should return false for non-error values', () => {
      expect(
        NegatedAssertionError.isNegatedAssertionError(null),
        'to be false',
      );
      expect(
        NegatedAssertionError.isNegatedAssertionError(undefined),
        'to be false',
      );
      expect(
        NegatedAssertionError.isNegatedAssertionError('string'),
        'to be false',
      );
      expect(NegatedAssertionError.isNegatedAssertionError(42), 'to be false');
      expect(NegatedAssertionError.isNegatedAssertionError({}), 'to be false');
    });
  });
});

describe('Error hierarchy and inheritance', () => {
  it('should maintain correct inheritance chain', () => {
    const assertionError = new AssertionError({ message: 'test' });
    const failError = new FailAssertionError({ message: 'test' });
    const negatedError = new NegatedAssertionError({ message: 'test' });

    // All should be instances of base classes
    expect(assertionError, 'to be an instance of', NodeAssertionError);
    expect(failError, 'to be an instance of', NodeAssertionError);
    expect(negatedError, 'to be an instance of', NodeAssertionError);

    expect(failError, 'to be an instance of', AssertionError);
    expect(negatedError, 'to be an instance of', AssertionError);

    // But specific type guards should be precise
    expect(AssertionError.isAssertionError(assertionError), 'to be true');
    expect(AssertionError.isAssertionError(failError), 'to be true');
    expect(AssertionError.isAssertionError(negatedError), 'to be true');

    expect(
      FailAssertionError.isFailAssertionError(assertionError),
      'to be false',
    );
    expect(FailAssertionError.isFailAssertionError(failError), 'to be true');
    expect(
      FailAssertionError.isFailAssertionError(negatedError),
      'to be false',
    );

    expect(
      NegatedAssertionError.isNegatedAssertionError(assertionError),
      'to be false',
    );
    expect(
      NegatedAssertionError.isNegatedAssertionError(failError),
      'to be false',
    );
    expect(
      NegatedAssertionError.isNegatedAssertionError(negatedError),
      'to be true',
    );
  });

  it('should handle stack traces properly', () => {
    const error = new AssertionError({ message: 'test error' });
    expect(error.stack, 'to be a string');
    expect(error.stack, 'to contain', 'test error');
  });

  it('should respect stackStartFn parameter for stack trace modification', () => {
    // stackStartFn is used to omit certain functions from the stack trace.
    // When provided, it tells Node.js AssertionError to start the stack trace
    // from the function specified, excluding that function and any functions
    // called after it in the call chain.

    function outerFunction() {
      return innerFunction();
    }

    function innerFunction() {
      return createErrorWithStackStart();
    }

    function createErrorWithStackStart() {
      // Create error without stackStartFn - should include this function in stack
      const errorWithoutStackStart = new AssertionError({
        message: 'without stackStartFn',
      });

      // Create error with stackStartFn - should exclude this function from stack
      // This is useful for hiding internal implementation details from users
      const errorWithStackStart = new AssertionError({
        message: 'with stackStartFn',
        stackStartFn: createErrorWithStackStart,
      });

      return { errorWithoutStackStart, errorWithStackStart };
    }

    const { errorWithoutStackStart, errorWithStackStart } = outerFunction();

    // Both errors should have stack traces
    expect(errorWithoutStackStart.stack, 'to be a string');
    expect(errorWithStackStart.stack, 'to be a string');

    // Error without stackStartFn should include createErrorWithStackStart in stack
    expect(
      errorWithoutStackStart.stack,
      'to contain',
      'createErrorWithStackStart',
    );

    // Error with stackStartFn should NOT include createErrorWithStackStart in stack
    // (because stackStartFn points to createErrorWithStackStart, omitting it)
    expect(
      errorWithStackStart.stack,
      'not to contain',
      'createErrorWithStackStart',
    );

    // Both should still contain the outer function calls
    expect(errorWithoutStackStart.stack, 'to contain', 'innerFunction');
    expect(errorWithStackStart.stack, 'to contain', 'innerFunction');
    expect(errorWithoutStackStart.stack, 'to contain', 'outerFunction');
    expect(errorWithStackStart.stack, 'to contain', 'outerFunction');

    // The error with stackStartFn should have a shorter stack trace
    const stackLinesWithout =
      errorWithoutStackStart.stack?.split('\n').length || 0;
    const stackLinesWith = errorWithStackStart.stack?.split('\n').length || 0;
    expect(stackLinesWith, 'to be less than', stackLinesWithout);
  });
});
