export default {
  autoDetect: ['node:test'],
  env: {
    params: {
      env: 'DEBUG=bupkis*',
    },
    runner: 'node',
    type: 'node',
  },
  files: [
    'src/**',
    'test/**',
    '!test/*.test.ts',
    'package.json',
    '!**/*.cts',
    '!.tshy-build/**',
    { instrument: false, pattern: 'test/fixture/**' },
  ],
  preloadModules: ['tsx/esm'],
  runMode: 'onsave',
  tests: [
    'test/**/*.test.ts',
    '!test/cli.test.ts',
    '!.tshy-build/**',
    '!node_modules/**',
    '!dist/**',
  ],
};
