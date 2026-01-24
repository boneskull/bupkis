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
    'Assertions',
    'Guides',
    'Reference',
    'API',
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
    '../packages/msw/src/index.ts',
  ],
  excludeExternals: true,
  excludeInternal: true,
  excludePrivate: true,
  externalSymbolLinkMappings,
  favicon: '../site/media/favicon.svg',
  // @ts-expect-error from extras plugin
  footerLastModified: true,
  groupOrder: ['Core API'],
  hostedBaseUrl: 'https://bupkis.zip',
  kindSortOrder: [
    'Reference',
    'Project',
    'Module',
    'Namespace',
    'Function',
    'TypeAlias',
  ],
  lightHighlightTheme: 'rose-pine-dawn',
  llmsTxtDeclarations: [
    {
      description: 'Full TypeScript API documentation',
      label: 'API Reference',
      ref: 'bupkis!',
    },
    {
      description: 'Main assertion function',
      label: 'expect()',
      ref: 'bupkis!expect',
    },
    {
      description: 'Async assertion function',
      label: 'expectAsync()',
      ref: 'bupkis!expectAsync',
    },
    {
      description: 'Create custom assertions',
      label: 'createAssertion()',
      ref: 'bupkis!createAssertion',
    },
    {
      description: 'Register custom assertions',
      label: 'use()',
      ref: 'bupkis!use',
    },
  ],
  // llms.txt configuration
  llmsTxtHeader: {
    description:
      "A TypeScript assertion library using natural language function calls instead of chainable methods. Write `expect(value, 'to be a string')` instead of `expect(value).toBeString()`.",
    features: [
      "Natural language phrases: `expect(user, 'to satisfy', { name: expect.it('to be a string') })`",
      "Automatic negation: `expect(42, 'not to be a string')`",
      "Concatenation: `expect(n, 'to be a number', 'and', 'to be greater than', 0)`",
      'Embeddable assertions: `expect.it()` for nested validation',
      "Custom assertions: `createAssertion(['to be even'], (n) => n % 2 === 0)`",
      'Uses Zod v4 for validation and type inference',
    ],
  },
  llmsTxtQuickReference: `// Type assertions
expect(value, 'to be a string');
expect(value, 'to be a number');
expect(value, 'to be an array');

// Equality
expect(actual, 'to equal', expected);
expect(obj, 'to deep equal', expected);
expect(obj, 'to satisfy', { name: 'Alice' });

// Negation
expect(42, 'not to be a string');

// Concatenation
expect(n, 'to be a number', 'and', 'to be greater than', 0);

// Embeddable assertions
expect(user, 'to satisfy', {
  name: expect.it('to be a string'),
  age: expect.it('to be greater than', 18)
});`,
  llmsTxtSections: {
    About: { displayName: 'Optional', order: 4 },
    Assertions: { displayName: 'Assertions', order: 2 },
    Guides: { displayName: 'Docs', order: 1 },
    Reference: { displayName: 'Reference', order: 3 },
  },
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
    'typedoc-plugin-llms-txt',
    'typedoc-plugin-redirect',
    './typedoc-plugin-bupkis.js',
    'typedoc-plugin-mdn-links',
    'typedoc-plugin-zod',
    'typedoc-plugin-dt-links',
    'typedoc-plugin-extras',
  ],
  preserveWatchOutput: true,
  projectDocuments: [
    '../site/release-notes/bupkis.md', // bupkis first in Release Notes
    '../site/release-notes/bupkis-*.md', // then @bupkis/* packages
    '../site/!(release-notes)/**/*.md', // other site docs
    '../packages/*/doc/readme.md',
  ],
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
  sort: [
    'documents-first',
    'kind',
    'instance-first',
    'alphabetical-ignoring-documents',
  ],
  tsconfig: './tsconfig.typedoc.json',
};
