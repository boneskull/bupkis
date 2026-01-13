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
    'packages/*/src/**/*.ts',
    'packages/*/package.json',
    'packages/bupkis/test/**/*.ts',
    '!packages/bupkis/test/**/*.test.ts',
    '!**/*.cts',
    { instrument: false, pattern: 'packages/bupkis/test/fixture/**' },
    {
      instrument: false,
      pattern: 'packages/bupkis/test/**/*.test.ts.snapshot',
    },
  ],
  filesWithNoCoverageCalculated: [
    '.tmp/**/*.test.ts',
    'packages/*/test/**/*.ts',
  ],
  preloadModules: ['tsx/esm'],
  runMode: 'onsave',
  tests: [
    '.tmp/**/*.test.ts',
    'packages/*/test/**/*.test.ts',
    '!node_modules/**',
    '!**/dist/**',

    // snapshot tests, which wallaby struggles with
    '!packages/bupkis/test/assertion-error/**/*',
    '!packages/bupkis/test/assertion/assertion-classification.test.ts',
    '!packages/bupkis/test/integration/snapshot-integration.test.ts',
    '!packages/bupkis/test/snapshot/**/*.test.ts',
  ],
};
