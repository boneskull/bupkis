import { OptionDefaults } from 'typedoc';

/** @type {Partial<import('typedoc').TypeDocOptions>} */
export default {
  blockTags: [...OptionDefaults.blockTags, '@knipignore', '@assertion'],
  cleanOutputDir: true,
  cname: 'bupkis.zip',
  customCss: './bupkis-theme.css',
  darkHighlightTheme: 'red',
  entryPoints: ['../src/index.ts'],
  excludeInternal: true,
  excludePrivate: true,
  externalSymbolLinkMappings: {
    '@types/node': {
      'assert.AssertionError':
        'https://nodejs.org/api/errors.html#class-assertionerror',
      'assert.strictEqual':
        'https://nodejs.org/api/assert.html#assertstrictequalactual-expected-message',
    },
    'type-fest': {
      Constructor:
        'https://github.com/sindresorhus/type-fest/blob/main/source/basic.d.ts',
    },
    zod: {
      ZodError: 'https://zod.dev/packages/core#errors',
      ZodPromise: 'https://zod.dev/packages/core#schemas',
      ZodType: 'https://zod.dev/packages/core#schemas',
    },
  },
  hostedBaseUrl: 'https://boneskull.github.io/bupkis',
  kindSortOrder: [
    'Reference',
    'Project',
    'Module',
    'Namespace',
    'Function',
    'TypeAlias',
  ],
  lightHighlightTheme: 'github-light-default',
  modifierTags: [
    ...OptionDefaults.modifierTags,
    '@subject',
    '@value',
    '@phrase',
  ],
  navigationLinks: {
    GitHub: 'https://github.com/boneskull/bupkis',
  },
  out: '../docs',
  plugin: [
    // 'typedoc-github-theme',
    'typedoc-plugin-mdn-links',
    'typedoc-plugin-zod',
  ],
  projectDocuments: ['../site/*.md', '../ROADMAP.md', '../CHANGELOG.md'],
  sort: ['kind'],
  tsconfig: './tsconfig.typedoc.json',
};
