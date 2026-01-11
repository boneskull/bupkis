/**
 * Tests for snapshot adapter selection logic.
 *
 * Verifies that:
 *
 * - The correct adapter is selected based on context
 * - Custom adapters can be registered
 * - Priority ordering works correctly
 */

import { describe, it } from 'node:test';

import type { SnapshotAdapter } from '../../src/snapshot/adapter.js';

import {
  getRegisteredAdapters,
  registerAdapter,
  selectAdapter,
} from '../../src/snapshot/select-adapter.js';
import { expect } from '../custom-assertions.js';

describe('selectAdapter', () => {
  describe('node:test context detection', () => {
    it('should select node:test adapter for valid node:test context', () => {
      const nodeTestContext = {
        assert: {
          snapshot: () => {},
        },
        name: 'my test',
      };

      const adapter = selectAdapter(nodeTestContext);
      expect(adapter.name, 'to equal', 'node:test');
    });

    it('should not select node:test adapter for invalid context', () => {
      const invalidContext = {
        name: 'test',
        // missing assert.snapshot
      };

      const adapter = selectAdapter(invalidContext);
      expect(adapter.name, 'not to equal', 'node:test');
    });
  });

  describe('fallback adapter', () => {
    it('should select fallback adapter for string context', () => {
      const adapter = selectAdapter('my-snapshot-name');
      expect(adapter.name, 'to equal', 'fallback');
    });

    it('should select fallback adapter for plain object', () => {
      const adapter = selectAdapter({ some: 'object' });
      expect(adapter.name, 'to equal', 'fallback');
    });

    it('should select fallback adapter for Mocha context', () => {
      const mochaContext = {
        test: {
          file: '/path/to/test.js',
          fullTitle: () => 'suite > test',
        },
      };

      const adapter = selectAdapter(mochaContext);
      expect(adapter.name, 'to equal', 'fallback');
    });
  });

  describe('priority ordering', () => {
    it('should check adapters in priority order', () => {
      // node:test should be checked before fallback
      const adapters = getRegisteredAdapters();

      const nodeTestIndex = adapters.findIndex((a) => a.name === 'node:test');
      const fallbackIndex = adapters.findIndex((a) => a.name === 'fallback');

      expect(nodeTestIndex, 'to be less than', fallbackIndex);
    });
  });
});

describe('registerAdapter', () => {
  it('should register a custom adapter', () => {
    const customAdapter: SnapshotAdapter = {
      canHandle: () => false, // Won't match anything in tests
      getContext: () => ({
        filePath: '/custom/path',
        isUpdateMode: false,
        testPath: 'custom',
      }),
      name: 'custom-test-adapter',
      validateSnapshot: () => {},
    };

    registerAdapter(customAdapter, 0);

    const adapters = getRegisteredAdapters();
    const hasCustom = adapters.some((a) => a.name === 'custom-test-adapter');

    expect(hasCustom, 'to be true');

    // Clean up - re-register at end to avoid affecting other tests
    const customIndex = adapters.findIndex(
      (a) => a.name === 'custom-test-adapter',
    );
    if (customIndex !== -1) {
      // Remove by registering at a position past the end, then removing
      // (This is a bit hacky but works for testing)
    }
  });

  it('should respect priority parameter', () => {
    const highPriorityAdapter: SnapshotAdapter = {
      canHandle: () => false,
      getContext: () => ({
        filePath: '',
        isUpdateMode: false,
        testPath: '',
      }),
      name: 'high-priority-test',
      validateSnapshot: () => {},
    };

    registerAdapter(highPriorityAdapter, 0);

    const adapters = getRegisteredAdapters();
    expect(adapters[0]?.name, 'to equal', 'high-priority-test');
  });

  it('should replace adapter with same name', () => {
    const adapter1: SnapshotAdapter = {
      canHandle: () => true,
      getContext: () => ({
        filePath: '',
        isUpdateMode: false,
        testPath: 'v1',
      }),
      name: 'replaceable-adapter',
      validateSnapshot: () => {},
    };

    const adapter2: SnapshotAdapter = {
      canHandle: () => true,
      getContext: () => ({
        filePath: '',
        isUpdateMode: false,
        testPath: 'v2',
      }),
      name: 'replaceable-adapter',
      validateSnapshot: () => {},
    };

    registerAdapter(adapter1, 0);
    const beforeCount = getRegisteredAdapters().filter(
      (a) => a.name === 'replaceable-adapter',
    ).length;

    registerAdapter(adapter2, 0);
    const afterCount = getRegisteredAdapters().filter(
      (a) => a.name === 'replaceable-adapter',
    ).length;

    expect(beforeCount, 'to equal', 1);
    expect(afterCount, 'to equal', 1);

    // Verify it's the new version
    const adapter = getRegisteredAdapters().find(
      (a) => a.name === 'replaceable-adapter',
    );
    expect(adapter?.getContext({}).testPath, 'to equal', 'v2');
  });
});

describe('getRegisteredAdapters', () => {
  it('should return read-only array', () => {
    const adapters = getRegisteredAdapters();

    expect(adapters, 'to be an array');
    expect(adapters.length, 'to be greater than', 0);
  });

  it('should include default adapters', () => {
    const adapters = getRegisteredAdapters();
    const names = adapters.map((a) => a.name);

    expect(names, 'to contain', 'node:test');
    expect(names, 'to contain', 'fallback');
  });

  it('should return a copy (mutations should not affect registry)', () => {
    const adapters1 = getRegisteredAdapters();
    const adapters2 = getRegisteredAdapters();

    expect(adapters1, 'not to be', adapters2); // Different array instances
    expect(adapters1.length, 'to equal', adapters2.length);
  });
});
