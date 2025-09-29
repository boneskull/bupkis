import { AssertionError as NodeAssertionError } from 'node:assert';
import { describe, it } from 'node:test';

import {
  AssertionError,
  AssertionImplementationError,
  BupkisError,
  FailAssertionError,
  InvalidMetadataError,
  InvalidObjectSchemaError,
  NegatedAssertionError,
  SatisfactionError,
  UnexpectedAsyncError,
  UnknownAssertionError,
} from '../../src/error.js';
import { expect } from '../custom-assertions.js';

describe('Error classes', () => {
  describe('AssertionError', () => {
    it('should create instance with default options', () => {
      const error = new AssertionError({});

      expect(
        error,
        'to be an instance of',
        NodeAssertionError,
        'and',
        'to satisfy',
        {
          name: 'AssertionError',
        },
      );
    });

    it('should create instance with custom options', () => {
      const options = {
        actual: 'foo',
        expected: 'bar',
        message: 'Test assertion failed',
      };
      const error = new AssertionError(options);

      expect(error, 'to satisfy', options);
    });

    it('should have proper type guard', () => {
      const error = new AssertionError({});
      const nodeError = new NodeAssertionError({ message: 'test' });

      expect(AssertionError.isAssertionError(error), 'to be true');
      expect(AssertionError.isAssertionError(nodeError), 'to be false');
      expect(AssertionError.isAssertionError({}), 'to be false');
      expect(AssertionError.isAssertionError(null), 'to be false');
    });

    it('should serialize to JSON correctly', () => {
      const error = new AssertionError({
        actual: 42,
        expected: 'string',
        message: 'Test message',
      });

      const json = error.toJSON();

      expect(json, 'to satisfy', {
        actual: 42,
        expected: 'string',
        message: 'Test message',
        name: 'AssertionError',
        stack: expect.it('to be a string'),
      });
    });
  });

  describe('BupkisError', () => {
    it('should create instance with message', () => {
      const error = new BupkisError('Something went wrong');

      expect(error, 'to be an instance of', Error, 'and', 'to satisfy', {
        message: 'Something went wrong',
        name: 'BupkisError',
      });
    });

    it('should have proper type guard', () => {
      const bupkisError = new BupkisError('test');
      const regularError = new Error('test');

      expect(BupkisError.isBupkisError(bupkisError), 'to be true');
      expect(BupkisError.isBupkisError(regularError), 'to be false');
      expect(BupkisError.isBupkisError({}), 'to be false');
      expect(BupkisError.isBupkisError(null), 'to be false');
    });
  });

  describe('AssertionImplementationError', () => {
    it('should create instance with message only', () => {
      const error = new AssertionImplementationError('Implementation failed');

      expect(
        error,
        'to be an instance of',
        AssertionImplementationError,
        'and',
        'to satisfy',
        {
          code: 'ERR_BUPKIS_ASSERTION_IMPL',
          message: 'Implementation failed',
          name: 'AssertionImplementationError',
          result: undefined,
        },
      );
    });

    it('should create instance with message and options', () => {
      const result = { some: 'data' };
      const error = new AssertionImplementationError('Implementation failed', {
        cause: new Error('Root cause'),
        result,
      });

      expect(error, 'to satisfy', {
        cause: expect.it('to be an instance of', Error),
        result,
      });
    });
  });

  describe('FailAssertionError', () => {
    it('should create instance with options', () => {
      const error = new FailAssertionError({
        actual: 'actual value',
        expected: 'expected value',
        message: 'Explicit failure',
      });

      expect(
        error,
        'to be an instance of',
        FailAssertionError,
        'and',
        'to satisfy',
        {
          message: 'Explicit failure',
          name: 'FailAssertionError',
        },
      );
    });

    it('should have proper type guard', () => {
      const failError = new FailAssertionError({});
      const assertionError = new AssertionError({});

      expect(FailAssertionError.isFailAssertionError(failError), 'to be true');
      expect(
        FailAssertionError.isFailAssertionError(assertionError),
        'to be false',
      );
      expect(FailAssertionError.isFailAssertionError({}), 'to be false');
    });
  });

  describe('InvalidMetadataError', () => {
    it('should create instance with message only', () => {
      const error = new InvalidMetadataError('Invalid metadata provided');

      expect(
        error,
        'to be an instance of',
        InvalidMetadataError,
        'and',
        'to satisfy',
        {
          code: 'ERR_BUPKIS_INVALID_METADATA',
          message: 'Invalid metadata provided',
          metadata: undefined,
          name: 'InvalidMetadataError',
        },
      );
    });

    it('should create instance with message and options', () => {
      const metadata = { invalid: 'metadata' };
      const error = new InvalidMetadataError('Invalid metadata', {
        cause: new Error('Root cause'),
        metadata,
      });

      expect(error, 'to satisfy', {
        cause: expect.it('to be an instance of', Error),
        metadata,
      });
    });
  });

  describe('InvalidSchemaError', () => {
    it('should create instance with message only', () => {
      const error = new InvalidObjectSchemaError('Schema is invalid');

      expect(
        error,
        'to be an instance of',
        InvalidObjectSchemaError,
        'and',
        'to satisfy',
        {
          code: 'ERR_BUPKIS_INVALID_OBJECT_SCHEMA',
          message: 'Schema is invalid',
          name: 'InvalidObjectSchemaError',
          schema: undefined,
        },
      );
    });

    it('should create instance with message and options', () => {
      const schema = { type: 'invalid' };
      const error = new InvalidObjectSchemaError('Schema error', {
        cause: new Error('Schema validation failed'),
        schema,
      });

      expect(error, 'to satisfy', {
        cause: expect.it('to be an instance of', Error),
        schema,
      });
    });
  });

  describe('NegatedAssertionError', () => {
    it('should create instance with options', () => {
      const error = new NegatedAssertionError({
        actual: false,
        expected: true,
        message: 'Negated assertion failed',
      });

      expect(
        error,
        'to be an instance of',
        NegatedAssertionError,
        'and',
        'to be an instance of',
        AssertionError,
        'and',
        'to satisfy',
        {
          message: 'Negated assertion failed',
          name: 'NegatedAssertionError',
        },
      );
    });

    it('should have proper type guard', () => {
      const negatedError = new NegatedAssertionError({});
      const assertionError = new AssertionError({});

      expect(
        NegatedAssertionError.isNegatedAssertionError(negatedError),
        'to be true',
      );
      expect(
        NegatedAssertionError.isNegatedAssertionError(assertionError),
        'to be false',
      );
      expect(NegatedAssertionError.isNegatedAssertionError({}), 'to be false');
    });
  });

  describe('UnexpectedAsyncError', () => {
    it('should create instance with message', () => {
      const error = new UnexpectedAsyncError('Unexpected async operation');

      expect(
        error,
        'to be an instance of',
        UnexpectedAsyncError,
        'and',
        'to satisfy',
        {
          code: 'ERR_BUPKIS_UNEXPECTED_ASYNC',
          message: 'Unexpected async operation',
          name: 'UnexpectedAsyncError',
        },
      );
    });
  });

  describe('UnknownAssertionError', () => {
    it('should create instance with message and args', () => {
      const args = ['value', 'unknown assertion', 'param'] as const;
      const error = new UnknownAssertionError('Unknown assertion called', {
        args,
      });

      expect(
        error,
        'to be an instance of',
        UnknownAssertionError,
        'and',
        'to satisfy',
        {
          args,
          code: 'ERR_BUPKIS_UNKNOWN_ASSERTION',
          message: 'Unknown assertion called',
          name: 'UnknownAssertionError',
        },
      );
    });

    it('should preserve exact args type', () => {
      const args = [42, 'to be string', true] as const;
      const error = new UnknownAssertionError('Type mismatch', { args });

      expect(error.args, 'to satisfy', [42, 'to be string', true]);
    });
  });

  describe('ValueToSchemaError', () => {
    it('should create instance with message only', () => {
      const error = new SatisfactionError('Cannot convert value to schema');

      expect(
        error,
        'to be an instance of',
        SatisfactionError,
        'and',
        'to satisfy',
        {
          code: 'ERR_BUPKIS_SATISFACTION',
          message: 'Cannot convert value to schema',
          name: 'SatisfactionError',
        },
      );
    });

    it('should create instance with message and options', () => {
      const error = new SatisfactionError('Conversion failed', {
        cause: new Error('Invalid __proto__ property'),
      });

      expect(error.cause, 'to be an instance of', Error);
    });
  });

  describe('Error inheritance relationships', () => {
    it('should maintain proper inheritance chain for AssertionError variants', () => {
      const failError = new FailAssertionError({});
      const negatedError = new NegatedAssertionError({});

      expect(failError, 'to be an instance of', AssertionError);
      expect(failError, 'to be an instance of', NodeAssertionError);
      expect(negatedError, 'to be an instance of', AssertionError);
      expect(negatedError, 'to be an instance of', NodeAssertionError);
    });

    it('should maintain proper inheritance chain for BupkisError variants', () => {
      const implError = new AssertionImplementationError('test');
      const metadataError = new InvalidMetadataError('test');
      const schemaError = new InvalidObjectSchemaError('test');
      const asyncError = new UnexpectedAsyncError('test');
      const unknownError = new UnknownAssertionError('test', { args: [] });
      const satisfactionError = new SatisfactionError('test');

      const errors = [
        implError,
        metadataError,
        schemaError,
        asyncError,
        unknownError,
        satisfactionError,
      ];

      for (const error of errors) {
        expect(error, 'to be an instance of', Error);
      }
    });
  });

  describe('Error codes and names', () => {
    it('should have correct error codes for BupkisError subclasses', () => {
      const errors = {
        asyncError: new UnexpectedAsyncError('test'),
        implError: new AssertionImplementationError('test'),
        metadataError: new InvalidMetadataError('test'),
        satisfactionError: new SatisfactionError('test'),
        schemaError: new InvalidObjectSchemaError('test'),
        unknownError: new UnknownAssertionError('test', { args: [] }),
      };

      expect(errors, 'to satisfy', {
        asyncError: { code: 'ERR_BUPKIS_UNEXPECTED_ASYNC' },
        implError: { code: 'ERR_BUPKIS_ASSERTION_IMPL' },
        metadataError: { code: 'ERR_BUPKIS_INVALID_METADATA' },
        satisfactionError: { code: 'ERR_BUPKIS_SATISFACTION' },
        schemaError: { code: 'ERR_BUPKIS_INVALID_OBJECT_SCHEMA' },
        unknownError: { code: 'ERR_BUPKIS_UNKNOWN_ASSERTION' },
      });
    });

    it('should have correct names for all error classes', () => {
      const errors = {
        assertionError: new AssertionError({}),
        asyncError: new UnexpectedAsyncError('test'),
        bupkisError: new BupkisError('test'),
        failError: new FailAssertionError({}),
        implError: new AssertionImplementationError('test'),
        metadataError: new InvalidMetadataError('test'),
        negatedError: new NegatedAssertionError({}),
        satisfactionError: new SatisfactionError('test'),
        schemaError: new InvalidObjectSchemaError('test'),
        unknownError: new UnknownAssertionError('test', { args: [] }),
      };

      expect(errors, 'to satisfy', {
        assertionError: { name: 'AssertionError' },
        asyncError: { name: 'UnexpectedAsyncError' },
        bupkisError: { name: 'BupkisError' },
        failError: { name: 'FailAssertionError' },
        implError: { name: 'AssertionImplementationError' },
        metadataError: { name: 'InvalidMetadataError' },
        negatedError: { name: 'NegatedAssertionError' },
        satisfactionError: { name: 'SatisfactionError' },
        schemaError: { name: 'InvalidObjectSchemaError' },
        unknownError: { name: 'UnknownAssertionError' },
      });
    });
  });
});
