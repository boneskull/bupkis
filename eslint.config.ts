import jsPlugin from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import eslintPluginJsonc from 'eslint-plugin-jsonc';
import nodePlugin from 'eslint-plugin-n';
import perfectionist from 'eslint-plugin-perfectionist';
import preferArrowFunctionsPlugin from 'eslint-plugin-prefer-arrow-functions';
import zodPlugin from 'eslint-plugin-zod';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import requireFunctionTagInArrowFunctions from './.config/eslint-rules/require-function-tag-in-arrow-functions.js';
import requireIntrinsicDestructuring from './.config/eslint-rules/require-intrinsic-destructuring.js';

export default defineConfig(
  jsPlugin.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  perfectionist.configs['recommended-natural'],
  {
    languageOptions: {
      parserOptions: {
        extraFileExtensions: ['.json5', '.jsonc'],
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.js', '**/.*.js'],
    plugins: {
      '@perfectionist': perfectionist,
      '@prefer-arrow-functions': preferArrowFunctionsPlugin,
      '@stylistic': stylistic,
      '@zod': zodPlugin,
    },
    rules: {
      '@perfectionist/sort-classes': ['error', { partitionByNewLine: true }],

      '@prefer-arrow-functions/prefer-arrow-functions': [
        'error',
        {
          allowObjectProperties: true,
          classPropertiesAllowed: true,
          disallowPrototype: true,
          returnStyle: 'implicit',
          singleReturnOnly: true,
        },
      ],

      '@stylistic/lines-around-comment': [
        'warn',
        {
          afterBlockComment: false, // conflicts with perfectionist if enabled
          allowArrayStart: true,
          allowBlockStart: true, // conflicts with prettier if disabled
          allowClassStart: true,
          allowInterfaceStart: true,
          allowObjectStart: true, // conflicts with prettier if disabled
          beforeBlockComment: false, // conflicts with perfectionist if enabled
        },
      ],
      '@stylistic/lines-between-class-members': ['error', 'always'],
      '@stylistic/semi': 'error',

      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          disallowTypeAnnotations: true,
          fixStyle: 'inline-type-imports',
          prefer: 'type-imports',
        },
      ],
      // and sometimes you gotta use any
      '@typescript-eslint/no-explicit-any': 'off',
      // this rule seems broken
      '@typescript-eslint/no-invalid-void-type': 'off',
      // unfortunately required when using Sets and Maps
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': [
        'error',
        {
          allowComparingNullableBooleansToFalse: true,
          allowComparingNullableBooleansToTrue: true,
        },
      ],
      // too many false positives
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
        },
      ],
      // these 6 bytes add up
      '@typescript-eslint/require-await': 'off',
      // I like my template expressions, tyvm
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/unified-signatures': [
        'error',
        {
          ignoreDifferentlyNamedParameters: true,
        },
      ],

      '@zod/array-style': ['error', { style: 'function' }],
      '@zod/consistent-import-source': ['error', { sources: ['zod'] }],
      '@zod/consistent-object-schema-type': [
        'error',
        { allow: ['object', 'looseObject', 'strictObject'] },
      ],
      '@zod/no-any-schema': 'off', // intentional for assertion library
      '@zod/no-empty-custom-schema': 'error',
      '@zod/no-number-schema-with-int': 'error',
      '@zod/no-optional-and-default-together': 'error',
      '@zod/no-throw-in-refine': 'error',
      '@zod/no-unknown-schema': 'off', // intentional for assertion library
      '@zod/prefer-enum-over-literal-union': 'error',
      '@zod/prefer-meta': 'error',
      '@zod/prefer-meta-last': 'error',
      '@zod/require-brand-type-parameter': 'error',
      '@zod/require-error-message': 'off', // too noisy
      '@zod/require-schema-suffix': 'off', // not our convention
      '@zod/schema-error-property-style': 'error',

      'arrow-body-style': ['error', 'as-needed'],
      curly: 'error',
      'func-style': ['error', 'expression'],
      'new-cap': ['error', { capIsNew: true, newIsCap: true }],
      'no-constructor-return': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-restricted-syntax': [
        'error',
        {
          message:
            '.readonly() is banned on Zod schemas because safeParse() will freeze values that pass through ZodReadonly schemas, which could cause unexpected mutations in our assertion library.',
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.property.name="readonly"]',
        },
      ],
      'no-self-compare': 'error',
      'object-shorthand': ['error', 'always'],
      'prefer-arrow-callback': 'error',
    },
  },
  {
    files: ['packages/**/src/**/*.ts'],
    plugins: {
      '@bupkis': {
        rules: {
          // @ts-expect-error - TODO: fix this
          'require-function-tag-in-arrow-functions':
            requireFunctionTagInArrowFunctions,
          // @ts-expect-error - TODO: fix this
          'require-intrinsic-destructuring': requireIntrinsicDestructuring,
        },
      },
    },
    rules: {
      '@bupkis/require-function-tag-in-arrow-functions': [
        'error',
        {
          requireForAnonymous: false,
          requireForNamed: true,
        },
      ],
    },
  },
  // bupkis-source-specific
  {
    files: ['packages/bupkis/src/**/*.ts'],
    rules: {
      '@bupkis/require-intrinsic-destructuring': [
        'error',
        {
          allowConsole: true,
          intrinsics: [
            'Array',
            'Object',
            'Number',
            'String',
            'Math',
            'Date',
            'JSON',
            'Symbol',
            'Reflect',
            'WeakMap',
            'WeakSet',
          ],
        },
      ],
    },
  },
  {
    files: ['packages/**/test/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    extends: [nodePlugin.configs['flat/recommended-module']],
    files: [
      '.config/**/*.js',
      '/*.js',
      '/.*.js',
      '/*.ts',
      'packages/*/scripts/**/*.ts',
      'packages/*/src/cli.ts',
    ],
    languageOptions: {
      globals: globals.node,
    },
    plugins: {
      n: nodePlugin,
    },
    rules: {
      'n/hashbang': [
        'error',
        { convertPath: { 'src/cli.ts': ['src/cli.ts', 'dist/cli.js'] } },
      ],
      'n/no-missing-import': [
        'error',
        {
          ignoreTypeImport: true,
        },
      ],
    },
    settings: {
      n: {
        allowModules: ['type-fest'],
      },
    },
  },
  {
    files: ['packages/**/scripts/*.ts'],
    rules: {
      'n/hashbang': 'off',
      'n/no-process-exit': 'off',
    },
  },
  {
    extends: [
      eslintPluginJsonc.configs['flat/prettier'],
      tseslint.configs.disableTypeChecked,
    ],
    files: ['**/tsconfig*.json', '**/*.json5', '**/*.jsonc'],
  },
  {
    ignores: [
      '.claude/**/*',
      'docs',
      '**/dist/**',
      'packages/**/dist',
      '**/coverage/**',
      '*.snapshot',
      '.zshy/**/*',
      'packages/**/.zshy/**/*',
      '.tmp/**/*',
      '.worktrees/**/*',
      'packages/**/test-d/**/*',
      'packages/**/test/fixtures/**/*',
      'packages/**/examples/**/*',
      '**/*.snap.cjs',
    ],
  },
);
