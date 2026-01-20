/**
 * Tests for HTTP response assertions.
 */

import { use } from 'bupkis';
import { describe, it } from 'node:test';

import { httpAssertions } from '../src/assertions.js';

const { expect } = use(httpAssertions);

describe('@bupkis/http assertions', () => {
  describe('to have status', () => {
    describe('with numeric status code', () => {
      it('should pass when status matches exactly', () => {
        expect({ status: 200 }, 'to have status', 200);
        expect({ status: 404 }, 'to have status', 404);
        expect({ status: 500 }, 'to have status', 500);
      });

      it('should fail when status does not match', () => {
        expect(
          () => expect({ status: 404 }, 'to have status', 200),
          'to throw',
          /Expected response to have status 200/,
        );
      });

      it('should work with the alternate phrase "to respond with status"', () => {
        expect({ status: 200 }, 'to respond with status', 200);
      });
    });

    describe('with status category "ok"', () => {
      it('should pass for 2xx status codes', () => {
        expect({ status: 200 }, 'to have status', 'ok');
        expect({ status: 201 }, 'to have status', 'ok');
        expect({ status: 204 }, 'to have status', 'ok');
        expect({ status: 299 }, 'to have status', 'ok');
      });

      it('should fail for non-2xx status codes', () => {
        expect(
          () => expect({ status: 404 }, 'to have status', 'ok'),
          'to throw',
          /Expected response to have ok status/,
        );
        expect(
          () => expect({ status: 500 }, 'to have status', 'ok'),
          'to throw',
          /Expected response to have ok status/,
        );
      });
    });

    describe('with status category "redirect"', () => {
      it('should pass for 3xx status codes', () => {
        expect({ status: 300 }, 'to have status', 'redirect');
        expect({ status: 301 }, 'to have status', 'redirect');
        expect({ status: 302 }, 'to have status', 'redirect');
        expect({ status: 307 }, 'to have status', 'redirect');
        expect({ status: 308 }, 'to have status', 'redirect');
      });

      it('should fail for non-3xx status codes', () => {
        expect(
          () => expect({ status: 200 }, 'to have status', 'redirect'),
          'to throw',
          /Expected response to have redirect status/,
        );
      });
    });

    describe('with status category "client error"', () => {
      it('should pass for 4xx status codes', () => {
        expect({ status: 400 }, 'to have status', 'client error');
        expect({ status: 401 }, 'to have status', 'client error');
        expect({ status: 403 }, 'to have status', 'client error');
        expect({ status: 404 }, 'to have status', 'client error');
        expect({ status: 422 }, 'to have status', 'client error');
        expect({ status: 429 }, 'to have status', 'client error');
      });

      it('should fail for non-4xx status codes', () => {
        expect(
          () => expect({ status: 500 }, 'to have status', 'client error'),
          'to throw',
          /Expected response to have client error status/,
        );
      });
    });

    describe('with status category "server error"', () => {
      it('should pass for 5xx status codes', () => {
        expect({ status: 500 }, 'to have status', 'server error');
        expect({ status: 502 }, 'to have status', 'server error');
        expect({ status: 503 }, 'to have status', 'server error');
        expect({ status: 504 }, 'to have status', 'server error');
      });

      it('should fail for non-5xx status codes', () => {
        expect(
          () => expect({ status: 200 }, 'to have status', 'server error'),
          'to throw',
          /Expected response to have server error status/,
        );
      });
    });
  });

  describe('to have header', () => {
    describe('header existence', () => {
      it('should pass when header exists (using headers property)', () => {
        const response = {
          headers: { 'content-type': 'application/json' },
          status: 200,
        };
        expect(response, 'to have header', 'content-type');
      });

      it('should pass when header exists (using header property)', () => {
        const response = {
          header: { 'content-type': 'application/json' },
          status: 200,
        };
        expect(response, 'to have header', 'content-type');
      });

      it('should be case-insensitive for header names', () => {
        const response = {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        };
        expect(response, 'to have header', 'content-type');
        expect(response, 'to have header', 'CONTENT-TYPE');
        expect(response, 'to have header', 'Content-Type');
      });

      it('should fail when header does not exist', () => {
        const response = {
          headers: { 'content-type': 'application/json' },
          status: 200,
        };
        expect(
          () => expect(response, 'to have header', 'x-custom-header'),
          'to throw',
          /Expected response to have header "x-custom-header"/,
        );
      });

      it('should fail when response has no headers', () => {
        const response = { status: 200 };
        expect(
          () => expect(response, 'to have header', 'content-type'),
          'to throw',
          /Expected response to have header "content-type"/,
        );
      });

      it('should work with alternate phrase "to include header"', () => {
        const response = {
          headers: { 'content-type': 'application/json' },
          status: 200,
        };
        expect(response, 'to include header', 'content-type');
      });
    });

    describe('header with exact value', () => {
      it('should pass when header matches exact value', () => {
        const response = {
          headers: { 'content-type': 'application/json' },
          status: 200,
        };
        expect(response, 'to have header', 'content-type', 'application/json');
      });

      it('should fail when header value does not match', () => {
        const response = {
          headers: { 'content-type': 'text/html' },
          status: 200,
        };
        expect(
          () =>
            expect(
              response,
              'to have header',
              'content-type',
              'application/json',
            ),
          'to throw',
          /Expected header "content-type" to equal "application\/json"/,
        );
      });

      it('should handle array header values', () => {
        const response = {
          headers: { 'set-cookie': ['a=1', 'b=2'] },
          status: 200,
        };
        expect(response, 'to have header', 'set-cookie', 'a=1, b=2');
      });
    });

    describe('header with regex match', () => {
      it('should pass when header matches regex', () => {
        const response = {
          headers: { 'content-type': 'application/json; charset=utf-8' },
          status: 200,
        };
        expect(response, 'to have header', 'content-type', /json/);
        expect(response, 'to have header', 'content-type', /^application\//);
      });

      it('should fail when header does not match regex', () => {
        const response = {
          headers: { 'content-type': 'text/html' },
          status: 200,
        };
        expect(
          () => expect(response, 'to have header', 'content-type', /json/),
          'to throw',
          /Expected header "content-type" to match/,
        );
      });

      it('should handle complex regex patterns', () => {
        const response = {
          headers: { 'cache-control': 'max-age=3600, public' },
          status: 200,
        };
        expect(response, 'to have header', 'cache-control', /max-age=\d+/);
      });
    });
  });

  describe('to have body', () => {
    it('should pass when response has text body', () => {
      expect({ status: 200, text: 'Hello' }, 'to have body');
    });

    it('should pass when response has object body', () => {
      expect({ body: { users: [] }, status: 200 }, 'to have body');
    });

    it('should pass when response has empty object body', () => {
      // Empty object still counts as having a body
      expect({ body: {}, status: 200 }, 'to have body');
    });

    it('should pass when response has empty array body', () => {
      expect({ body: [], status: 200 }, 'to have body');
    });

    it('should fail when response has no body', () => {
      expect(
        () => expect({ status: 200 }, 'to have body'),
        'to throw',
        /Expected response to have a body/,
      );
    });

    it('should fail when response has empty string body', () => {
      expect(
        () => expect({ body: '', status: 200, text: '' }, 'to have body'),
        'to throw',
        /Expected response to have a body/,
      );
    });
  });

  describe('to have body (exact string)', () => {
    it('should pass when body text matches exactly', () => {
      expect(
        { status: 200, text: 'Hello, World!' },
        'to have body',
        'Hello, World!',
      );
    });

    it('should pass when body object stringifies to expected', () => {
      expect({ body: { id: 1 }, status: 200 }, 'to have body', '{"id":1}');
    });

    it('should fail when body does not match', () => {
      expect(
        () => expect({ status: 200, text: 'Hello' }, 'to have body', 'Goodbye'),
        'to throw',
        /Expected response body to equal string/,
      );
    });
  });

  describe('to have JSON body', () => {
    it('should pass when response has JSON content-type and body', () => {
      const response = {
        body: { users: [] },
        status: 200,
        type: 'application/json',
      };
      expect(response, 'to have JSON body');
    });

    it('should pass when JSON content-type is in headers', () => {
      const response = {
        body: { data: 'test' },
        headers: { 'content-type': 'application/json; charset=utf-8' },
        status: 200,
      };
      expect(response, 'to have JSON body');
    });

    it('should fail when content-type is not JSON', () => {
      const response = {
        body: '<html></html>',
        status: 200,
        type: 'text/html',
      };
      expect(
        () => expect(response, 'to have JSON body'),
        'to throw',
        /Expected response to have JSON content-type/,
      );
    });

    it('should fail when response has no body', () => {
      const response = {
        status: 204,
        type: 'application/json',
      };
      expect(
        () => expect(response, 'to have JSON body'),
        'to throw',
        /Expected response to have a JSON body/,
      );
    });
  });

  describe('to have JSON body satisfying', () => {
    it('should pass when body contains expected properties', () => {
      const response = {
        body: { email: 'john@example.com', id: 1, name: 'John' },
        status: 200,
      };
      expect(response, 'to have JSON body satisfying', { id: 1 });
      expect(response, 'to have JSON body satisfying', { name: 'John' });
      expect(response, 'to have JSON body satisfying', { id: 1, name: 'John' });
    });

    it('should pass with nested objects', () => {
      const response = {
        body: {
          meta: { version: '1.0' },
          user: { id: 1, profile: { age: 30, name: 'John' } },
        },
        status: 200,
      };
      expect(response, 'to have JSON body satisfying', {
        user: { profile: { name: 'John' } },
      });
    });

    it('should pass with arrays', () => {
      const response = {
        body: { users: [{ id: 1 }, { id: 2 }] },
        status: 200,
      };
      expect(response, 'to have JSON body satisfying', {
        users: [{ id: 1 }, { id: 2 }],
      });
    });

    it('should fail when property is missing', () => {
      const response = {
        body: { id: 1 },
        status: 200,
      };
      expect(
        () =>
          expect(response, 'to have JSON body satisfying', { name: 'John' }),
        'to throw',
        /Expected response body to satisfy specification/,
      );
    });

    it('should fail when property value differs', () => {
      const response = {
        body: { id: 1, name: 'Jane' },
        status: 200,
      };
      expect(
        () =>
          expect(response, 'to have JSON body satisfying', { name: 'John' }),
        'to throw',
        /Expected response body to satisfy specification/,
      );
    });
  });

  describe('to have body satisfying (regex)', () => {
    it('should pass when body matches regex', () => {
      expect(
        { status: 200, text: 'Hello, World!' },
        'to have body satisfying',
        /World/,
      );
      expect(
        { status: 200, text: '{"id":123}' },
        'to have body satisfying',
        /"id":\d+/,
      );
    });

    it('should fail when body does not match regex', () => {
      expect(
        () =>
          expect(
            { status: 200, text: 'Hello' },
            'to have body satisfying',
            /Goodbye/,
          ),
        'to throw',
        /Expected response body to match/,
      );
    });

    it('should fail when response has no body', () => {
      expect(
        () => expect({ status: 200 }, 'to have body satisfying', /anything/),
        'to throw',
        /Expected response to have a body/,
      );
    });
  });

  describe('to have body satisfying (object)', () => {
    it('should pass when body contains expected properties', () => {
      const response = {
        body: { extra: 'ignored', id: 1, name: 'John' },
        status: 200,
      };
      expect(response, 'to have body satisfying', { id: 1 });
    });

    it('should fail when body is missing expected property', () => {
      const response = {
        body: { id: 1 },
        status: 200,
      };
      expect(
        () => expect(response, 'to have body satisfying', { name: 'John' }),
        'to throw',
        /Expected response body to satisfy specification/,
      );
    });
  });

  describe('to redirect', () => {
    it('should pass for 3xx status codes', () => {
      expect({ status: 301 }, 'to redirect');
      expect({ status: 302 }, 'to redirect');
      expect({ status: 307 }, 'to redirect');
      expect({ status: 308 }, 'to redirect');
    });

    it('should fail for non-3xx status codes', () => {
      expect(
        () => expect({ status: 200 }, 'to redirect'),
        'to throw',
        /Expected response to be a redirect/,
      );
      expect(
        () => expect({ status: 404 }, 'to redirect'),
        'to throw',
        /Expected response to be a redirect/,
      );
    });
  });

  describe('to redirect to (URL)', () => {
    it('should pass when Location header matches exactly', () => {
      const response = {
        headers: { location: '/login' },
        status: 302,
      };
      expect(response, 'to redirect to', '/login');
    });

    it('should pass with full URL', () => {
      const response = {
        headers: { location: 'https://example.com/new-page' },
        status: 301,
      };
      expect(response, 'to redirect to', 'https://example.com/new-page');
    });

    it('should fail when not a redirect', () => {
      const response = {
        headers: { location: '/somewhere' },
        status: 200,
      };
      expect(
        () => expect(response, 'to redirect to', '/somewhere'),
        'to throw',
        /Expected response to be a redirect/,
      );
    });

    it('should fail when Location header is missing', () => {
      const response = { status: 302 };
      expect(
        () => expect(response, 'to redirect to', '/login'),
        'to throw',
        /Expected redirect response to have a Location header/,
      );
    });

    it('should fail when Location does not match', () => {
      const response = {
        headers: { location: '/dashboard' },
        status: 302,
      };
      expect(
        () => expect(response, 'to redirect to', '/login'),
        'to throw',
        /Expected redirect to "\/login"/,
      );
    });
  });

  describe('to redirect to (regex)', () => {
    it('should pass when Location header matches pattern', () => {
      const response = {
        headers: { location: '/auth/login?redirect=/dashboard' },
        status: 302,
      };
      expect(response, 'to redirect to', /\/auth/);
      expect(response, 'to redirect to', /redirect=/);
    });

    it('should fail when not a redirect', () => {
      const response = {
        headers: { location: '/somewhere' },
        status: 200,
      };
      expect(
        () => expect(response, 'to redirect to', /somewhere/),
        'to throw',
        /Expected response to be a redirect/,
      );
    });

    it('should fail when Location does not match pattern', () => {
      const response = {
        headers: { location: '/dashboard' },
        status: 302,
      };
      expect(
        () => expect(response, 'to redirect to', /login/),
        'to throw',
        /Expected redirect Location to match/,
      );
    });
  });
});
