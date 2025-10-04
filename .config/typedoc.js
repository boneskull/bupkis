import { readFileSync } from 'node:fs';
import { OptionDefaults } from 'typedoc';

/**
 * @import {TypeDocOptions} from 'typedoc'
 */

const customFooterHtml = readFileSync(
  new URL('../site/media/footer.html', import.meta.url),
  'utf8',
);

/** @type {Partial<TypeDocOptions>} */
export default {
  blockTags: [
    ...OptionDefaults.blockTags,
    '@knipignore',
    '@bupkisAnchor',
    '@bupkisRedirect',
    '@bupkisAssertionCategory',
  ],
  categoryOrder: ['Assertions', 'Guides', 'Reference', 'API', 'About'],
  cname: 'bupkis.zip',
  customCss: '../site/media/bupkis-theme.css',
  customFooterHtml,
  darkHighlightTheme: 'red',
  entryPoints: [
    '../src/index.ts',
    '../src/schema.ts',
    '../src/util.ts',
    '../src/guards.ts',
  ],
  excludeInternal: true,
  excludePrivate: true,
  externalSymbolLinkMappings: {
    '@types/node': {
      'assert.AssertionError':
        'https://nodejs.org/api/assert.html#class-assertassertionerror',
      'assert.strictEqual':
        'https://nodejs.org/api/assert.html#assertstrictequalactual-expected-message',
    },
    'type-fest': {
      '*': 'https://github.com/sindresorhus/type-fest',
    },
    typescript: {
      PromiseLike:
        'https://github.com/microsoft/TypeScript/blob/3320dfdfcf17cdcdbfccb8040ea73cf110d94ba3/src/lib/es5.d.ts', // current of Sep 9 2025
      'ProxyHandler.construct':
        'https://github.com/microsoft/TypeScript/blob/3320dfdfcf17cdcdbfccb8040ea73cf110d94ba3/src/lib/es2015.proxy.d.ts', // current of Sep 9 2025
    },
    zod: {
      '*': 'https://zod.dev/',
    },
    'zod/v4': {
      '*': 'https://zod.dev/',
    },
  },
  favicon: '../site/media/favicon.svg',
  // @ts-expect-error from extras plugin
  footerLastModified: true,
  groupOrder: ['Core API'],
  kindSortOrder: [
    'Reference',
    'Project',
    'Module',
    'Namespace',
    'Function',
    'TypeAlias',
  ],
  lightHighlightTheme: 'rose-pine-dawn',
  markdownLinkExternal: true,
  name: 'BUPKIS',
  navigation: {
    includeCategories: true,
  },
  navigationLinks: {
    API: '/api',
    Assertions: '/assertions',
    GitHub: 'https://github.com/boneskull/bupkis',
    npm: 'https://www.npmjs.com/package/bupkis',
  },
  out: '../docs',
  plugin: [
    'typedoc-plugin-redirect',
    './typedoc-plugin-bupkis.js',
    'typedoc-plugin-mdn-links',
    'typedoc-plugin-zod',
    // 'typedoc-plugin-dt-links',
    'typedoc-plugin-extras',
  ],
  preserveWatchOutput: true,
  projectDocuments: ['../site/**/*.md'],
  redirects: {
    'api/': 'modules/bupkis.html',
    'assertions/': 'documents/All_Assertions.html',
    'changelog/': 'documents/Release_Notes.html',
    'custom-assertions/': 'documents/Creating_a_Custom_Assertion.html',
    'glossary/': 'documents/Glossary_of_Terms.html',
    'usage/': 'documents/Basic_Usage.html',
  },
  searchInComments: true,
  searchInDocuments: true,
  sort: ['kind', 'alphabetical'],
  tsconfig: './tsconfig.typedoc.json',
};
