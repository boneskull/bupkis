import { readFileSync } from 'node:fs';
import { OptionDefaults } from 'typedoc';

/**
 * @import {TypeDocOptions} from "typedoc"
 */

const customFooterHtml = readFileSync(
  new URL('../site/media/footer.html', import.meta.url),
  'utf8',
);

/**
 * External symbol link mappings for documentation
 */
const externalSymbolLinkMappings = {
  '@types/node': {
    'assert.AssertionError':
      'https://nodejs.org/api/assert.html#class-assertassertionerror',
    'assert.strictEqual':
      'https://nodejs.org/api/assert.html#assertstrictequalactual-expected-message',
  },
  'fast-check': {
    '*': 'https://fast-check.dev/api-reference/',
  },
  'type-fest': {
    '*': 'https://github.com/sindresorhus/type-fest',
  },
  typescript: {
    PromiseLike:
      'https://github.com/microsoft/TypeScript/blob/3320dfdfcf17cdcdbfccb8040ea73cf110d94ba3/src/lib/es5.d.ts',
    'ProxyHandler.construct':
      'https://github.com/microsoft/TypeScript/blob/3320dfdfcf17cdcdbfccb8040ea73cf110d94ba3/src/lib/es2015.proxy.d.ts',
  },
  zod: {
    '*': 'https://zod.dev/',
  },
};

/** @type {Partial<TypeDocOptions>} */
export default {
  blockTags: [
    ...OptionDefaults.blockTags,
    '@knipignore',
    '@bupkisAnchor',
    '@bupkisRedirect',
    '@bupkisAssertionCategory',
  ],
  categoryOrder: [
    'Guides',
    'Assertions',
    'API',
    'Reference',
    'Plugins',
    'Migration Tools',
    'Testing Utilities',
    'About',
    '*',
  ],
  cname: 'bupkis.zip',
  customCss: '../site/media/bupkis-theme.css',
  customFooterHtml,
  darkHighlightTheme: 'red',
  entryPoints: [
    '../packages/bupkis/src/index.ts',
    '../packages/bupkis/src/schema.ts',
    '../packages/bupkis/src/util.ts',
    '../packages/bupkis/src/guards.ts',
    '../packages/property-testing/src/index.ts',
  ],
  excludeExternals: true,
  excludeInternal: true,
  excludePrivate: true,
  externalSymbolLinkMappings,
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
    'typedoc-plugin-dt-links',
    'typedoc-plugin-extras',
  ],
  preserveWatchOutput: true,
  projectDocuments: ['../site/**/*.md', '../packages/*/doc/readme.md'],
  readme: '../packages/bupkis/README.md',
  redirects: {
    'api/': 'modules/bupkis',
    'assertions/': 'documents/All_Assertions',
    'changelog/': 'documents/Release_Notes',
    'custom-assertions/': 'documents/Creating_a_Custom_Assertion',
    'glossary/': 'documents/Glossary_of_Terms',
    'usage/': 'documents/Basic_Usage',
  },
  router: 'kind-dir',
  searchInComments: true,
  searchInDocuments: true,
  sort: ['kind', 'alphabetical'],
  tsconfig: './tsconfig.typedoc.json',
};
