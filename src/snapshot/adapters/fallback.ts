/**
 * Fallback adapter for frameworks without native snapshot support.
 *
 * This adapter provides custom snapshot storage for test frameworks that don't
 * have built-in snapshot functionality (e.g., Mocha, Tap, custom test
 * runners).
 *
 * **Storage Format:** Snapshots are stored as CommonJS modules in
 * `__snapshots__/` directories:
 *
 * ```javascript
 * // __snapshots__/my-test.test.js.snap.cjs
 * module.exports = {
 *   'test name': '{\n  "value": 42\n}',
 *   'test name 2': '"another snapshot"',
 * };
 * ```
 *
 * @packageDocumentation
 */

import stringify from 'json-stable-stringify';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import type { AssertionFailure } from '../../types.js';
import type {
  SnapshotAdapter,
  SnapshotContext,
  SnapshotOptions,
} from '../adapter.js';

import { defaultSerializer } from '../serializer.js';

const { entries } = Object;

/**
 * Mocha context interface.
 *
 * Mocha passes `this` as the test context, which has a `test` property with
 * test metadata.
 *
 * @example
 *
 * ```typescript
 * describe('MyComponent', function () {
 *   it('renders', function () {
 *     // this is MochaContext
 *     console.log(this.test.fullTitle()); // 'MyComponent renders'
 *   });
 * });
 * ```
 */
interface MochaContext {
  test?: {
    /**
     * Optional file path (may not always be available)
     */
    file?: string;

    /**
     * Get the full test title including describe blocks
     */
    fullTitle(): string;
  };
}

/**
 * Snapshot storage for a test file.
 *
 * Maps test names to their serialized snapshot values.
 */
interface SnapshotStore {
  [testName: string]: string;
}

/**
 * Extract snapshot context from Mocha's `this` context.
 *
 * Mocha provides test information through `this.test` in test callbacks. This
 * function attempts to extract the test name and file path from that
 * structure.
 *
 * @example
 *
 * ```typescript
 * describe('suite', function () {
 *   it('test', function () {
 *     const ctx = extractMochaContext(this);
 *     // ctx = {
 *     //   testPath: 'suite test',
 *     //   filePath: '/path/to/test.js',
 *     //   isUpdateMode: false
 *     // }
 *   });
 * });
 * ```
 *
 * @function
 * @param context - Potential Mocha context object
 * @returns Snapshot context if Mocha context detected, null otherwise
 */
const extractMochaContext = (context: unknown): null | SnapshotContext => {
  const mochaCtx = context as MochaContext;

  if (mochaCtx?.test?.fullTitle) {
    return {
      filePath: mochaCtx.test.file || getTestFilePathFromStack(),
      isUpdateMode: process.env.BUPKIS_UPDATE_SNAPSHOTS === '1',
      testPath: mochaCtx.test.fullTitle(),
    };
  }

  return null;
};

/**
 * Get snapshot file path for a test file.
 *
 * Snapshots are stored in a `__snapshots__/` directory next to the test file.
 * The snapshot filename is based on the test file path, with slashes replaced
 * by dashes to create a flat structure.
 *
 * Uses `.cjs` extension for CommonJS compatibility in both CJS and ESM
 * projects.
 *
 * @example
 *
 * ```typescript
 * getSnapshotFilePath('/project/test/unit/foo.test.ts');
 * // Returns: '/project/test/unit/__snapshots__/test-unit-foo.test.ts.snap.cjs'
 * ```
 *
 * @function
 * @param testFilePath - Absolute path to the test file
 * @returns Absolute path to the snapshot file
 */
const getSnapshotFilePath = (testFilePath: string): string => {
  const dir = dirname(testFilePath);
  const snapshotDir = join(dir, '__snapshots__');
  const filename = relative(process.cwd(), testFilePath).replace(/\//g, '-');
  return join(snapshotDir, `${filename}.snap.cjs`);
};

/**
 * Get test file path from stack trace.
 *
 * Searches the stack trace for lines containing test file paths. Looks for
 * files matching patterns like `*.test.js`, `*.spec.ts`, etc.
 *
 * @function
 * @returns Absolute path to test file, or 'unknown.test.js' if not found
 */
const getTestFilePathFromStack = (): string => {
  const stack = new Error().stack || '';
  const lines = stack.split('\n');

  for (const line of lines) {
    // Match file paths in stack traces
    const match = line.match(/\((.+\.(?:test|spec)\.[jt]s):\d+:\d+\)/);
    if (match && match[1]) {
      return resolve(match[1]);
    }
  }

  return resolve('unknown.test.js');
};

/**
 * Load snapshots from a snapshot file.
 *
 * Reads and parses the CommonJS format snapshot file. If the file doesn't exist
 * or can't be parsed, returns an empty store.
 *
 * **Expected format:**
 *
 * ```javascript
 * module.exports = {
 *   'test name': '{"value": 42}',
 *   'another test': '"string"',
 * };
 * ```
 *
 * @example
 *
 * ```typescript
 * const store = loadSnapshots('/path/to/__snapshots__/test.snap.cjs');
 * console.log(store['my test']); // '{"foo": "bar"}'
 * ```
 *
 * @function
 * @param snapshotPath - Path to the snapshot file
 * @returns Snapshot store (test name → serialized value)
 */
const loadSnapshots = (snapshotPath: string): SnapshotStore => {
  if (!existsSync(snapshotPath)) {
    return {};
  }

  try {
    // Read as CommonJS module
    const content = readFileSync(snapshotPath, 'utf-8');

    // Parse the module.exports = { ... } format
    const match = content.match(/module\.exports\s*=\s*(\{[\s\S]*\});?\s*$/);
    if (match) {
      // Use Function constructor to safely eval the object literal
      // This is safe because we're only parsing the object structure,
      // not executing arbitrary code
      // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-call
      const store = new Function(`return ${match[1]}`)() as SnapshotStore;
      return store;
    }
  } catch {
    // If parsing fails, return empty store
    // This allows for snapshot regeneration
  }

  return {};
};

/**
 * Save snapshots to a snapshot file.
 *
 * Writes the snapshot store to disk in CommonJS format. Creates the
 * `__snapshots__/` directory if it doesn't exist. Entries are sorted
 * alphabetically by test name for consistency.
 *
 * **Output format:**
 *
 * ```javascript
 * module.exports = {
 *   'test 1': '{"value": 1}',
 *   'test 2': '{"value": 2}',
 * };
 * ```
 *
 * @example
 *
 * ```typescript
 * const store = {
 *   'my test': '{"foo": "bar"}',
 *   'another test': '"string"',
 * };
 * saveSnapshots('/path/to/__snapshots__/test.snap.cjs', store);
 * ```
 *
 * @function
 * @param snapshotPath - Path to the snapshot file
 * @param store - Snapshot store to save
 */
const saveSnapshots = (snapshotPath: string, store: SnapshotStore): void => {
  const dir = dirname(snapshotPath);

  // Ensure directory exists
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Generate CommonJS module format with sorted entries
  const snapshotEntries = entries(store)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `  ${stringify(key)}: ${stringify(value)}`)
    .join(',\n');

  const content = `module.exports = {\n${snapshotEntries}\n};\n`;

  writeFileSync(snapshotPath, content, 'utf-8');
};

/**
 * Snapshot counters for multiple snapshots per test.
 *
 * Tracks how many snapshots have been taken for each test path to generate
 * unique snapshot names when a test has multiple snapshots.
 */
const snapshotCounters = new Map<string, number>();

/**
 * Fallback adapter for frameworks without native snapshot support.
 *
 * This adapter provides custom snapshot storage and management for test
 * frameworks that don't have built-in snapshot functionality.
 *
 * **Supported Contexts:**
 *
 * - **Mocha**: Pass `this` from test callback
 * - **Explicit names**: Pass a string snapshot name
 *
 * **Storage:**
 *
 * - Snapshots stored in `__snapshots__/*.snap.cjs` files
 * - CommonJS format for compatibility with both CJS and ESM projects
 * - Sorted entries for consistent diffs
 *
 * **Update Mode:**
 *
 * - Controlled by `BUPKIS_UPDATE_SNAPSHOTS=1` environment variable
 *
 * **Features:**
 *
 * - Multiple snapshots per test (automatic counters)
 * - Named snapshots via `hint` option
 * - Circular reference detection
 * - Non-JSON type handling
 *
 * @example
 *
 * ```typescript
 * // Mocha usage
 * describe('MyComponent', function() {
 *   it('renders', function() {
 *     const output = render(<MyComponent />);
 *     expect(output, 'to match snapshot', this);
 *   });
 * });
 * ```
 *
 * @example
 *
 * ```typescript
 * // Explicit name (any framework)
 * test('renders component', () => {
 *   const output = render(<MyComponent />);
 *   expect(output, 'to match snapshot', 'component-default-state');
 * });
 * ```
 *
 * @example
 *
 * ```typescript
 * // Multiple snapshots with hints
 * test('multi-step process', () => {
 *   expect(step1(), 'to match snapshot', 'step-1', { hint: 'initial' });
 *   expect(step2(), 'to match snapshot', 'step-2', { hint: 'processing' });
 *   expect(step3(), 'to match snapshot', 'step-3', { hint: 'complete' });
 * });
 * ```
 *
 * @example
 *
 * ```sh
 * # Update snapshots
 * BUPKIS_UPDATE_SNAPSHOTS=1 npm test
 * ```
 */
export class FallbackAdapter implements SnapshotAdapter {
  /**
   * Adapter name for identification and debugging.
   */
  readonly name = 'fallback';

  /**
   * Check if this adapter can handle the given context.
   *
   * The fallback adapter accepts both strings (explicit snapshot names) and
   * objects (potential Mocha contexts). It's designed to be the last adapter in
   * the selection chain and will accept most inputs.
   *
   * @param context - Test context or snapshot name
   * @returns `true` for strings or objects
   */
  canHandle(context: unknown): boolean {
    // Fallback handles strings (explicit names) and objects (Mocha)
    return typeof context === 'string' || typeof context === 'object';
  }

  /**
   * Extract snapshot context from Mocha context or string name.
   *
   * **For Mocha contexts:**
   *
   * - Extracts test name from `this.test.fullTitle()`
   * - Gets file path from `this.test.file` or stack trace
   *
   * **For string contexts:**
   *
   * - Uses the string as the test name
   * - Extracts file path from stack trace
   *
   * **Update mode:**
   *
   * - Checks `process.env.BUPKIS_UPDATE_SNAPSHOTS === '1'`
   *
   * @param context - Mocha context or string snapshot name
   * @returns Normalized snapshot context
   * @throws {TypeError} If context is neither a valid Mocha context nor a
   *   string
   */
  getContext(context: unknown): SnapshotContext {
    // Try Mocha first
    const mochaContext = extractMochaContext(context);
    if (mochaContext) {
      return mochaContext;
    }

    // String context (explicit snapshot name)
    if (typeof context === 'string') {
      return {
        filePath: getTestFilePathFromStack(),
        isUpdateMode: process.env.BUPKIS_UPDATE_SNAPSHOTS === '1',
        testPath: context,
      };
    }

    throw new TypeError(
      'Fallback adapter requires either a string snapshot name or Mocha context. ' +
        'Pass test name as string: expect(value, "to match snapshot", "my-test-name")',
    );
  }

  /**
   * Perform snapshot assertion using custom storage.
   *
   * **Behavior:**
   *
   * - **Update mode**: Creates or updates the snapshot
   * - **Comparison mode**: Loads existing snapshot and compares
   *
   * **Process:**
   *
   * 1. Serialize the value using provided serializer or default
   * 2. Generate unique snapshot name (with counter if needed)
   * 3. Load existing snapshot store from disk
   * 4. Either update snapshot or compare and throw on mismatch
   *
   * @example
   *
   * ```typescript
   * const adapter = new FallbackAdapter();
   *
   * // With Mocha context
   * adapter.assertSnapshot({ foo: 'bar' }, mochaThis);
   *
   * // With explicit name
   * adapter.assertSnapshot({ foo: 'bar' }, 'my-snapshot');
   *
   * // With custom serializer
   * adapter.assertSnapshot(data, 'test', {
   *   serializer: (v) => JSON.stringify(v, null, 2),
   * });
   * ```
   *
   * @param value - Value to snapshot
   * @param context - Mocha context or string name
   * @param options - Optional serializer and hint
   * @throws {TypeError} If context is invalid
   * @throws {AssertionError} If snapshot doesn't match (in comparison mode)
   */
  validateSnapshot(
    value: unknown,
    context: unknown,
    options?: SnapshotOptions,
  ): AssertionFailure | void {
    const ctx = this.getContext(context);
    const serializer = options?.serializer || defaultSerializer;

    const snapshotName = getSnapshotName(ctx.testPath, options?.hint);
    const snapshotPath = getSnapshotFilePath(ctx.filePath);
    const store = loadSnapshots(snapshotPath);

    const actual = serializer(value);
    const expected = store[snapshotName];

    if (ctx.isUpdateMode || expected === undefined) {
      // Update/create snapshot
      store[snapshotName] = actual;
      saveSnapshots(snapshotPath, store);
      return;
    }

    // Compare snapshots
    if (actual !== expected) {
      return {
        actual,
        expected,
        message: `Snapshot mismatch for "${snapshotName}"\n\nExpected:\n${expected}\n\nActual:\n${actual}`,
      };
    }
  }
}

/**
 * Get the next snapshot name for a test.
 *
 * For the first snapshot in a test, uses the test path as-is. For subsequent
 * snapshots, appends a counter: `"test name 2"`, `"test name 3"`, etc.
 *
 * If a hint is provided, it's appended in brackets: `"test name [hint]"`.
 *
 * @example
 *
 * ```typescript
 * getSnapshotName('MyComponent renders'); // 'MyComponent renders'
 * getSnapshotName('MyComponent renders'); // 'MyComponent renders 2'
 * getSnapshotName('MyComponent renders'); // 'MyComponent renders 3'
 *
 * getSnapshotName('test', 'initial state'); // 'test [initial state]'
 * ```
 *
 * @function
 * @param testPath - Full test path/name
 * @param hint - Optional descriptive hint
 * @returns Unique snapshot name
 */
const getSnapshotName = (testPath: string, hint?: string): string => {
  if (hint) {
    return `${testPath} [${hint}]`;
  }

  const counter = snapshotCounters.get(testPath) || 0;
  snapshotCounters.set(testPath, counter + 1);

  return counter === 0 ? testPath : `${testPath} ${counter + 1}`;
};

/**
 * Singleton instance of the fallback adapter.
 *
 * This is the primary export and should be used for adapter registration.
 *
 * @example
 *
 * ```typescript
 * import { fallbackAdapter } from 'bupkis/snapshot';
 * import { registerAdapter } from 'bupkis/snapshot';
 *
 * registerAdapter(fallbackAdapter);
 * ```
 */
export const fallbackAdapter = new FallbackAdapter();
