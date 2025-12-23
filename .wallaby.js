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
    'src/**/*.ts',
    'test/**/*.ts',
    '!test/**/*.test.ts',
    'package.json',
    '!**/*.cts',
    { instrument: false, pattern: 'test/fixture/**' },
    '!src/node_modules/bupkis/**',
    { instrument: false, pattern: 'test/**/*.test.ts.snapshot' },
  ],
  filesWithNoCoverageCalculated: ['.tmp/**/*.test.ts', 'test/**/*.ts'],
  preloadModules: ['tsx/esm'],
  runMode: 'onsave',
  tests: [
    '.tmp/**/*.test.ts',
    'test/**/*.test.ts',
    '!node_modules/**',
    '!dist/**',

    // snapshot tests, which wallaby struggles with
    '!test/assertion-error/**/*',
    '!test/integration/snapshot-integration.test.ts',
    '!test/snapshot/**/*.test.ts',
  ],
};
