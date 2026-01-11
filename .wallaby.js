/** @type {import('wallabyjs').IWallaby} */
export default {
  // @ts-expect-error missing type
  autoDetect: ['node:test'],
  env: {
    params: {
      env: 'DEBUG=bupkis*;WALLABY=1',
    },
    runner: 'node',
    type: 'node',
  },
  files: [
    'packages/bupkis/src/**/*.ts',
    'packages/bupkis/test/**/*.ts',
    '!packages/bupkis/test/**/*.test.ts',
    'packages/bupkis/package.json',
    '!**/*.cts',
    { instrument: false, pattern: 'packages/bupkis/test/fixture/**' },
    '!packages/bupkis/src/node_modules/bupkis/**',
    { instrument: false, pattern: 'packages/bupkis/test/**/*.test.ts.snapshot' },
  ],
  filesWithNoCoverageCalculated: ['.tmp/**/*.test.ts', 'packages/bupkis/test/**/*.ts'],
  preloadModules: ['tsx/esm'],
  runMode: 'onsave',
  tests: [
    '.tmp/**/*.test.ts',
    'packages/bupkis/test/**/*.test.ts',
    '!node_modules/**',
    '!**/dist/**',

    // snapshot tests, which wallaby struggles with
    '!packages/bupkis/test/assertion-error/**/*',
    '!packages/bupkis/test/integration/snapshot-integration.test.ts',
    '!packages/bupkis/test/snapshot/**/*.test.ts',
  ],
};
