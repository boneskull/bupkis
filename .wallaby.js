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
    '!.tshy-build/**',
    { instrument: false, pattern: 'test/fixture/**' },
    '!src/node_modules/bupkis/**',
    '!test/**/*.macro.ts',
    { instrument: false, pattern: 'test/**/*.test.ts.snapshot' },
  ],
  filesWithNoCoverageCalculated: ['.tmp/**/*.test.ts'],
  preloadModules: ['tsx/esm'],
  runMode: 'onsave',
  tests: [
    '.tmp/**/*.test.ts',
    'test/property/property-test.macro.ts',
    'test/**/*.test.ts',
    '!test/error/**/*',
    '!.tshy-build/**',
    '!node_modules/**',
    '!dist/**',
    // tshy-ism
    '!src/node_modules/bupkis/**',
  ],
};
