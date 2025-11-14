import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';

// https://astro.build/config
export default defineConfig({
  site: 'https://bupkis.zip',
  outDir: './docs',
  vite: {
    ssr: {
      noExternal: ['zod'],
    },
  },
  integrations: [
    starlightTypeDoc({
      entryPoints: [
        './src/index.ts',
        './src/schema.ts',
        './src/util.ts',
        './src/guards.ts',
      ],
      tsconfig: './.config/tsconfig.typedoc.json',
      output: 'api',
      sidebar: {
        label: 'API Reference',
        collapsed: false,
      },
      typeDoc: {
        router: 'kind-dir',
        plugin: ['typedoc-plugin-mdn-links'],
        excludeExternals: true,
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
              'https://github.com/microsoft/TypeScript/blob/3320dfdfcf17cdcdbfccb8040ea73cf110d94ba3/src/lib/es5.d.ts',
            'ProxyHandler.construct':
              'https://github.com/microsoft/TypeScript/blob/3320dfdfcf17cdcdbfccb8040ea73cf110d94ba3/src/lib/es2015.proxy.d.ts',
          },
          zod: {
            '*': 'https://zod.dev/',
          },
          'zod/v4': {
            '*': 'https://zod.dev/',
          },
        },
      },
    }),
    starlight({
      title: 'BUPKIS',
      description: 'Uncommonly extensible assertions for the beautiful people',
      favicon: '/favicon.svg',
      customCss: ['./src/styles/custom.css'],
      lastUpdated: true,
      logo: {
        src: './public/bupkis-logo-512.png',
      },
      social: [
        {
          label: 'GitHub',
          href: 'https://github.com/boneskull/bupkis',
          icon: 'github',
        },
      ],
      sidebar: [
        {
          label: 'Guide',
          items: [
            { label: 'Getting Started', link: '/guide/usage/' },
            { label: 'Testing', link: '/guide/testing/' },
            { label: 'Custom Assertions', link: '/guide/custom-assertion/' },
          ],
        },
        {
          label: 'Assertions',
          autogenerate: { directory: 'assertions' },
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' },
        },
        typeDocSidebarGroup,
        {
          label: 'About',
          autogenerate: { directory: 'about' },
        },
      ],
    }),
  ],
});
