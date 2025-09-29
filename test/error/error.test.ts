import { AssertionError as NodeAssertionError } from 'node:assert';
import { describe, it } from 'node:test';

import {
  AssertionError,
  AssertionImplementationError,
  BupkisError,
  FailAssertionError,
  InvalidMetadataError,
  InvalidSchemaError,
  NegatedAssertionError,
  UnexpectedAsyncError,
  UnknownAssertionError,
  ValueToSchemaError,
} from '../../src/error.js';
import { expect } from '../custom-assertions.js';

describe('Error classes', () => {
  describe('AssertionError', () => {
    it('should create instance with default options', () => {
      const error = new AssertionError({});

      expect(error, 'to be an instance of', AssertionError);
      expect(error, 'to be an instance of', NodeAssertionError);
      expect(error.name, 'to equal', 'AssertionError');
    });

    it('should create instance with custom options', () => {
      const options = {
        actual: 'foo',
        expected: 'bar',
        message: 'Test assertion failed',
      };
      const error = new AssertionError(options);

      expect(error.message, 'to equal', 'Test assertion failed');
      expect(error.actual, 'to equal', 'foo');
      expect(error.expected, 'to equal', 'bar');
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

      expect(json, 'to have property', 'message');
      expect(json, 'to have property', 'actual');
      expect(json, 'to have property', 'expected');
      expect(json, 'to have property', 'name');
      expect(json, 'to have property', 'stack');
      expect(json.message, 'to equal', 'Test message');
      expect(json.actual, 'to equal', 42);
      expect(json.expected, 'to equal', 'string');
    });
  });

  describe('BupkisError', () => {
    it('should create instance with message', () => {
      const error = new BupkisError('Something went wrong');

      expect(error, 'to be an instance of', BupkisError);
      expect(error, 'to be an instance of', Error);
      expect(error.name, 'to equal', 'BupkisError');
      expect(error.message, 'to equal', 'Something went wrong');
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

      expect(error, 'to be an instance of', AssertionImplementationError);
      expect(error, 'to be an instance of', BupkisError);
      expect(error.name, 'to equal', 'AssertionImplementationError');
      expect(error.code, 'to equal', 'ERR_BUPKIS_ASSERTION_IMPL');
      expect(error.message, 'to equal', 'Implementation failed');
      expect(error.result, 'to be undefined');
    });

    it('should create instance with message and options', () => {
      const result = { some: 'data' };
      const error = new AssertionImplementationError('Implementation failed', {
        cause: new Error('Root cause'),
        result,
      });

      expect(error.result, 'to equal', result);
      expect(error.cause, 'to be an instance of', Error);
    });
  });

  describe('FailAssertionError', () => {
    it('should create instance with options', () => {
      const error = new FailAssertionError({
        actual: 'actual value',
        expected: 'expected value',
        message: 'Explicit failure',
      });

      expect(error, 'to be an instance of', FailAssertionError);
      expect(error, 'to be an instance of', AssertionError);
      expect(error.name, 'to equal', 'FailAssertionError');
      expect(error.message, 'to equal', 'Explicit failure');
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

      expect(error, 'to be an instance of', InvalidMetadataError);
      expect(error, 'to be an instance of', BupkisError);
      expect(error.name, 'to equal', 'InvalidMetadataError');
      expect(error.code, 'to equal', 'ERR_BUPKIS_INVALID_METADATA');
      expect(error.message, 'to equal', 'Invalid metadata provided');
      expect(error.metadata, 'to be undefined');
    });

    it('should create instance with message and options', () => {
      const metadata = { invalid: 'metadata' };
      const error = new InvalidMetadataError('Invalid metadata', {
        cause: new Error('Root cause'),
        metadata,
      });

      expect(error.metadata, 'to equal', metadata);
      expect(error.cause, 'to be an instance of', Error);
    });
  });

  describe('InvalidSchemaError', () => {
    it('should create instance with message only', () => {
      const error = new InvalidSchemaError('Schema is invalid');

      expect(error, 'to be an instance of', InvalidSchemaError);
      expect(error, 'to be an instance of', BupkisError);
      expect(error.name, 'to equal', 'InvalidSchemaError');
      expect(error.code, 'to equal', 'ERR_BUPKIS_INVALID_SCHEMA');
      expect(error.message, 'to equal', 'Schema is invalid');
      expect(error.schema, 'to be undefined');
    });

    it('should create instance with message and options', () => {
      const schema = { type: 'invalid' };
      const error = new InvalidSchemaError('Schema error', {
        cause: new Error('Schema validation failed'),
        schema,
      });

      expect(error.schema, 'to equal', schema);
      expect(error.cause, 'to be an instance of', Error);
    });
  });

  describe('NegatedAssertionError', () => {
    it('should create instance with options', () => {
      const error = new NegatedAssertionError({
        actual: false,
        expected: true,
        message: 'Negated assertion failed',
      });

      expect(error, 'to be an instance of', NegatedAssertionError);
      expect(error, 'to be an instance of', AssertionError);
      expect(error.name, 'to equal', 'NegatedAssertionError');
      expect(error.message, 'to equal', 'Negated assertion failed');
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

      expect(error, 'to be an instance of', UnexpectedAsyncError);
      expect(error, 'to be an instance of', BupkisError);
      expect(error.name, 'to equal', 'UnexpectedAsyncError');
      expect(error.code, 'to equal', 'ERR_BUPKIS_UNEXPECTED_ASYNC');
      expect(error.message, 'to equal', 'Unexpected async operation');
    });
  });

  describe('UnknownAssertionError', () => {
    it('should create instance with message and args', () => {
      const args = ['value', 'unknown assertion', 'param'] as const;
      const error = new UnknownAssertionError('Unknown assertion called', {
        args,
      });

      expect(error, 'to be an instance of', UnknownAssertionError);
      expect(error, 'to be an instance of', BupkisError);
      expect(error.name, 'to equal', 'UnknownAssertionError');
      expect(error.code, 'to equal', 'ERR_BUPKIS_UNKNOWN_ASSERTION');
      expect(error.message, 'to equal', 'Unknown assertion called');
      expect(error.args, 'to equal', args);
    });

    it('should preserve exact args type', () => {
      const args = [42, 'to be string', true] as const;
      const error = new UnknownAssertionError('Type mismatch', { args });

      expect(error.args[0], 'to equal', 42);
      expect(error.args[1], 'to equal', 'to be string');
      expect(error.args[2], 'to equal', true);
    });
  });

  describe('ValueToSchemaError', () => {
    it('should create instance with message only', () => {
      const error = new ValueToSchemaError('Cannot convert value to schema');

      expect(error, 'to be an instance of', ValueToSchemaError);
      expect(error, 'to be an instance of', BupkisError);
      expect(error.name, 'to equal', 'SatisfactionError');
      expect(error.code, 'to equal', 'ERR_BUPKIS_SATISFACTION');
      expect(error.message, 'to equal', 'Cannot convert value to schema');
    });

    it('should create instance with message and options', () => {
      const error = new ValueToSchemaError('Conversion failed', {
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
      const schemaError = new InvalidSchemaError('test');
      const asyncError = new UnexpectedAsyncError('test');
      const unknownError = new UnknownAssertionError('test', { args: [] });
      const valueError = new ValueToSchemaError('test');

      const errors = [
        implError,
        metadataError,
        schemaError,
        asyncError,
        unknownError,
        valueError,
      ];

      for (const error of errors) {
        expect(error, 'to be an instance of', BupkisError);
        expect(error, 'to be an instance of', Error);
      }
    });
  });

  describe('Error codes and names', () => {
    it('should have correct error codes for BupkisError subclasses', () => {
      const implError = new AssertionImplementationError('test');
      const metadataError = new InvalidMetadataError('test');
      const schemaError = new InvalidSchemaError('test');
      const asyncError = new UnexpectedAsyncError('test');
      const unknownError = new UnknownAssertionError('test', { args: [] });
      const valueError = new ValueToSchemaError('test');

      expect(implError.code, 'to equal', 'ERR_BUPKIS_ASSERTION_IMPL');
      expect(metadataError.code, 'to equal', 'ERR_BUPKIS_INVALID_METADATA');
      expect(schemaError.code, 'to equal', 'ERR_BUPKIS_INVALID_SCHEMA');
      expect(asyncError.code, 'to equal', 'ERR_BUPKIS_UNEXPECTED_ASYNC');
      expect(unknownError.code, 'to equal', 'ERR_BUPKIS_UNKNOWN_ASSERTION');
      expect(valueError.code, 'to equal', 'ERR_BUPKIS_SATISFACTION');
    });

    it('should have correct names for all error classes', () => {
      const assertionError = new AssertionError({});
      const bupkisError = new BupkisError('test');
      const implError = new AssertionImplementationError('test');
      const failError = new FailAssertionError({});
      const metadataError = new InvalidMetadataError('test');
      const schemaError = new InvalidSchemaError('test');
      const negatedError = new NegatedAssertionError({});
      const asyncError = new UnexpectedAsyncError('test');
      const unknownError = new UnknownAssertionError('test', { args: [] });
      const valueError = new ValueToSchemaError('test');

      expect(assertionError.name, 'to equal', 'AssertionError');
      expect(bupkisError.name, 'to equal', 'BupkisError');
      expect(implError.name, 'to equal', 'AssertionImplementationError');
      expect(failError.name, 'to equal', 'FailAssertionError');
      expect(metadataError.name, 'to equal', 'InvalidMetadataError');
      expect(schemaError.name, 'to equal', 'InvalidSchemaError');
      expect(negatedError.name, 'to equal', 'NegatedAssertionError');
      expect(asyncError.name, 'to equal', 'UnexpectedAsyncError');
      expect(unknownError.name, 'to equal', 'UnknownAssertionError');
      expect(valueError.name, 'to equal', 'SatisfactionError'); // Note: Different from class name
    });
  });
});
