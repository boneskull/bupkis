/**
 * Node.js version utilities for snapshot testing.
 *
 * @packageDocumentation
 */

/**
 * Minimum Node.js major version required for snapshot testing with node:test.
 *
 * Node.js v22 is the first version with stable `assert.snapshot()` support in
 * the native test runner.
 */
export const MIN_NODE_MAJOR_VERSION = 22;

/**
 * Get the current Node.js major version.
 *
 * @function
 * @returns Major version number (e.g., 20, 22, 24)
 */
export const getNodeMajorVersion = (): number => {
  const parts = process.versions.node.split('.');
  return Number(parts[0]) || 0;
};

/**
 * Check if the current Node.js version supports snapshot testing with
 * node:test.
 *
 * @returns `true` if Node.js version >= {@link MIN_NODE_MAJOR_VERSION}
 */
export const supportsNodeTestSnapshots =
  getNodeMajorVersion() >= MIN_NODE_MAJOR_VERSION;

/**
 * Assert that the Node.js version supports snapshot testing.
 *
 * @function
 * @throws {Error} If Node.js version is less than {@link MIN_NODE_MAJOR_VERSION}
 */
export const assertNodeVersion = (): void => {
  const major = getNodeMajorVersion();
  if (major < MIN_NODE_MAJOR_VERSION) {
    throw new Error(
      `Snapshot testing with node:test requires Node.js v${MIN_NODE_MAJOR_VERSION} or later. ` +
        `Current version: v${process.versions.node}. ` +
        `Please upgrade Node.js or use a different snapshot adapter (e.g., pass an explicit snapshot name string instead of a test context).`,
    );
  }
};
