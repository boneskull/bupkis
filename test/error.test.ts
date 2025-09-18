import { AssertionError as NodeAssertionError } from 'node:assert';
import { describe, it } from 'node:test';

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
