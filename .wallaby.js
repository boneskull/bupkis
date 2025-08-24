/** @type {import('wallabyjs').IWallaby} */
export default {
  // @ts-expect-error missing type
  autoDetect: ['node:test'],
  env: {
    params: {
      env: 'DEBUG=bupkis*',
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
  ],
  preloadModules: ['tsx/esm'],
  runMode: 'onsave',
  tests: [
    'test/**/*.test.ts',
    '!.tshy-build/**',
    '!node_modules/**',
    '!dist/**',
    '!src/node_modules/bupkis/**',
  ],
};
