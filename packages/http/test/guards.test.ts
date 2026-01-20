/**
 * Tests for HTTP response type guards.
 */

import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import { isHttpResponse } from '../src/guards.js';

describe('@bupkis/http', () => {
  describe('isHttpResponse()', () => {
    it('should return true for object with numeric status', () => {
      expect(isHttpResponse({ status: 200 }), 'to be', true);
    });

    it('should return true for supertest-like response', () => {
      const response = {
        body: { users: [] },
        headers: { 'content-type': 'application/json' },
        status: 200,
        text: '{"users":[]}',
        type: 'application/json',
      };
      expect(isHttpResponse(response), 'to be', true);
    });

    it('should return true for response with header property (superagent style)', () => {
      const response = {
        body: {},
        header: { 'content-type': 'text/plain' },
        status: 404,
        text: 'Not Found',
      };
      expect(isHttpResponse(response), 'to be', true);
    });

    it('should return false for null', () => {
      expect(isHttpResponse(null), 'to be', false);
    });

    it('should return false for undefined', () => {
      expect(isHttpResponse(undefined), 'to be', false);
    });

    it('should return false for primitive values', () => {
      expect(isHttpResponse(42), 'to be', false);
      expect(isHttpResponse('string'), 'to be', false);
      expect(isHttpResponse(true), 'to be', false);
    });

    it('should return false for object without status', () => {
      expect(isHttpResponse({ headers: {} }), 'to be', false);
    });

    it('should return false for object with non-numeric status', () => {
      expect(isHttpResponse({ status: '200' }), 'to be', false);
      expect(isHttpResponse({ status: null }), 'to be', false);
    });

    it('should return false for array', () => {
      expect(isHttpResponse([200]), 'to be', false);
    });

    it('should return true for minimal response with only status', () => {
      expect(isHttpResponse({ status: 500 }), 'to be', true);
    });

    it('should return true for response with extra properties', () => {
      const response = {
        body: {},
        customProperty: 'value',
        headers: {},
        request: {},
        status: 200,
      };
      expect(isHttpResponse(response), 'to be', true);
    });
  });
});
